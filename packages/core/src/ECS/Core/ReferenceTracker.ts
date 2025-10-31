import { Component } from '../Component';
import type { Entity } from '../Entity';
import type { IScene } from '../IScene';

/**
 * WeakRef 接口定义
 *
 * 用于 ES2020 环境下的类型定义
 */
interface IWeakRef<T extends object> {
    deref(): T | undefined;
}

/**
 * WeakRef Polyfill for ES2020 compatibility
 *
 * 为了兼容 Cocos Creator、Laya、微信小游戏等目标平台（仅支持 ES2020），
 * 提供 WeakRef 的 Polyfill 实现。
 *
 * - 现代浏览器：自动使用原生 WeakRef (自动 GC)
 * - 旧环境：使用 Polyfill (无自动 GC，但 Scene 销毁时会手动清理)
 */
class WeakRefPolyfill<T extends object> implements IWeakRef<T> {
    private _target: T;

    constructor(target: T) {
        this._target = target;
    }

    deref(): T | undefined {
        return this._target;
    }
}

/**
 * WeakRef 构造函数类型
 */
interface IWeakRefConstructor {
    new <T extends object>(target: T): IWeakRef<T>;
}

/**
 * 包含 WeakRef 的全局对象类型
 */
interface GlobalWithWeakRef {
    WeakRef?: IWeakRefConstructor;
}

/**
 * WeakRef 实现
 *
 * 优先使用原生 WeakRef，不支持时降级到 Polyfill
 */
const WeakRefImpl: IWeakRefConstructor = (
    (typeof globalThis !== 'undefined' && (globalThis as GlobalWithWeakRef).WeakRef) ||
    (typeof global !== 'undefined' && (global as unknown as GlobalWithWeakRef).WeakRef) ||
    (typeof window !== 'undefined' && (window as unknown as GlobalWithWeakRef).WeakRef) ||
    WeakRefPolyfill
) as IWeakRefConstructor;

/**
 * Entity引用记录
 */
export interface EntityRefRecord {
    component: IWeakRef<Component>;
    propertyKey: string;
}

/**
 * 全局EntityID到Scene的映射
 *
 * 使用全局Map记录每个Entity ID对应的Scene，用于装饰器通过Component.entityId查找Scene。
 */
const globalEntitySceneMap = new Map<number, IWeakRef<IScene>>();

/**
 * 通过Entity ID获取Scene
 *
 * @param entityId Entity ID
 * @returns Scene实例，如果不存在则返回null
 */
export function getSceneByEntityId(entityId: number): IScene | null {
    const sceneRef = globalEntitySceneMap.get(entityId);
    return sceneRef?.deref() || null;
}

/**
 * Entity引用追踪器
 *
 * 追踪Component中对Entity的引用，当Entity被销毁时自动清理所有引用。
 *
 * @example
 * ```typescript
 * const tracker = new ReferenceTracker();
 * tracker.registerReference(targetEntity, component, 'parent');
 * targetEntity.destroy(); // 自动将 component.parent 设为 null
 * ```
 */
export class ReferenceTracker {
    /**
     * Entity ID -> 引用该Entity的所有组件记录
     */
    private _references: Map<number, Set<EntityRefRecord>> = new Map();

    /**
     * 注册Entity引用
     *
     * @param entity 被引用的Entity
     * @param component 持有引用的Component
     * @param propertyKey Component中存储引用的属性名
     */
    public registerReference(entity: Entity, component: Component, propertyKey: string): void {
        const entityId = entity.id;

        let records = this._references.get(entityId);
        if (!records) {
            records = new Set();
            this._references.set(entityId, records);
        }

        const existingRecord = this._findRecord(records, component, propertyKey);
        if (existingRecord) {
            return;
        }

        records.add({
            component: new WeakRefImpl(component),
            propertyKey
        });
    }

    /**
     * 注销Entity引用
     *
     * @param entity 被引用的Entity
     * @param component 持有引用的Component
     * @param propertyKey Component中存储引用的属性名
     */
    public unregisterReference(entity: Entity, component: Component, propertyKey: string): void {
        const entityId = entity.id;
        const records = this._references.get(entityId);

        if (!records) {
            return;
        }

        const record = this._findRecord(records, component, propertyKey);
        if (record) {
            records.delete(record);

            if (records.size === 0) {
                this._references.delete(entityId);
            }
        }
    }

    /**
     * 清理所有指向指定Entity的引用
     *
     * 将所有引用该Entity的Component属性设为null。
     *
     * @param entityId 被销毁的Entity ID
     */
    public clearReferencesTo(entityId: number): void {
        const records = this._references.get(entityId);

        if (!records) {
            return;
        }

        const validRecords: EntityRefRecord[] = [];

        for (const record of records) {
            const component = record.component.deref();

            if (component) {
                validRecords.push(record);
            }
        }

        for (const record of validRecords) {
            const component = record.component.deref();
            if (component) {
                // 使用 any 进行动态属性访问，因为无法静态验证所有可能的组件属性
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (component as any)[record.propertyKey] = null;
            }
        }

        this._references.delete(entityId);
    }

    /**
     * 清理Component的所有引用注册
     *
     * 当Component被移除时调用，清理该Component注册的所有引用。
     *
     * @param component 被移除的Component
     */
    public clearComponentReferences(component: Component): void {
        for (const [entityId, records] of this._references.entries()) {
            const toDelete: EntityRefRecord[] = [];

            for (const record of records) {
                const comp = record.component.deref();
                if (!comp || comp === component) {
                    toDelete.push(record);
                }
            }

            for (const record of toDelete) {
                records.delete(record);
            }

            if (records.size === 0) {
                this._references.delete(entityId);
            }
        }
    }

    /**
     * 获取指向指定Entity的所有引用记录
     *
     * @param entityId Entity ID
     * @returns 引用记录数组（仅包含有效引用）
     */
    public getReferencesTo(entityId: number): EntityRefRecord[] {
        const records = this._references.get(entityId);
        if (!records) {
            return [];
        }

        const validRecords: EntityRefRecord[] = [];

        for (const record of records) {
            const component = record.component.deref();
            if (component) {
                validRecords.push(record);
            }
        }

        return validRecords;
    }

    /**
     * 清理所有失效的WeakRef引用
     *
     * 遍历所有记录，移除已被GC回收的Component引用。
     */
    public cleanup(): void {
        const entitiesToDelete: number[] = [];

        for (const [entityId, records] of this._references.entries()) {
            const toDelete: EntityRefRecord[] = [];

            for (const record of records) {
                if (!record.component.deref()) {
                    toDelete.push(record);
                }
            }

            for (const record of toDelete) {
                records.delete(record);
            }

            if (records.size === 0) {
                entitiesToDelete.push(entityId);
            }
        }

        for (const entityId of entitiesToDelete) {
            this._references.delete(entityId);
        }
    }

    /**
     * 注册Entity到Scene的映射
     *
     * @param entityId Entity ID
     * @param scene Scene实例
     */
    public registerEntityScene(entityId: number, scene: IScene): void {
        globalEntitySceneMap.set(entityId, new WeakRefImpl(scene));
    }

    /**
     * 注销Entity到Scene的映射
     *
     * @param entityId Entity ID
     */
    public unregisterEntityScene(entityId: number): void {
        globalEntitySceneMap.delete(entityId);
    }

    /**
     * 获取调试信息
     */
    public getDebugInfo(): object {
        const info: Record<string, unknown> = {};

        for (const [entityId, records] of this._references.entries()) {
            const validRecords = [];
            for (const record of records) {
                const component = record.component.deref();
                if (component) {
                    validRecords.push({
                        componentId: component.id,
                        propertyKey: record.propertyKey
                    });
                }
            }

            if (validRecords.length > 0) {
                info[`entity_${entityId}`] = validRecords;
            }
        }

        return info;
    }

    /**
     * 查找指定的引用记录
     */
    private _findRecord(
        records: Set<EntityRefRecord>,
        component: Component,
        propertyKey: string
    ): EntityRefRecord | undefined {
        for (const record of records) {
            const comp = record.component.deref();
            if (comp === component && record.propertyKey === propertyKey) {
                return record;
            }
        }
        return undefined;
    }
}
