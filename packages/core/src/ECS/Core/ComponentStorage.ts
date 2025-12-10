import { Component } from '../Component';
import { BitMask64Utils, BitMask64Data } from '../Utils/BigIntCompatibility';
import { SoAStorage, SupportedTypedArray } from './SoAStorage';
import { createLogger } from '../../Utils/Logger';
import { getComponentTypeName, ComponentType } from '../Decorators';
import { ComponentRegistry } from './ComponentStorage/ComponentRegistry';

// 导出核心类型
export { ComponentRegistry };
export type { ComponentType };


/**
 * 高性能组件存储器
 */
export class ComponentStorage<T extends Component> {
    private dense: T[] = [];
    private entityIds: number[] = [];
    private entityToIndex = new Map<number, number>();
    private componentType: ComponentType<T>;

    constructor(componentType: ComponentType<T>) {
        this.componentType = componentType;
    }

    /**
     * 添加组件
     * @param entityId 实体ID
     * @param component 组件实例
     */
    public addComponent(entityId: number, component: T): void {
        // 检查实体是否已有此组件
        if (this.entityToIndex.has(entityId)) {
            throw new Error(`Entity ${entityId} already has component ${getComponentTypeName(this.componentType)}`);
        }

        // 末尾插入到致密数组
        const index = this.dense.length;
        this.dense.push(component);
        this.entityIds.push(entityId);
        this.entityToIndex.set(entityId, index);
    }

    /**
     * 获取组件
     * @param entityId 实体ID
     * @returns 组件实例或null
     */
    public getComponent(entityId: number): T | null {
        const index = this.entityToIndex.get(entityId);
        return index !== undefined ? this.dense[index]! : null;
    }

    /**
     * 检查实体是否有此组件
     * @param entityId 实体ID
     * @returns 是否有组件
     */
    public hasComponent(entityId: number): boolean {
        return this.entityToIndex.has(entityId);
    }

    /**
     * 移除组件
     * @param entityId 实体ID
     * @returns 被移除的组件或null
     */
    public removeComponent(entityId: number): T | null {
        const index = this.entityToIndex.get(entityId);
        if (index === undefined) {
            return null;
        }

        const component = this.dense[index]!;
        const lastIndex = this.dense.length - 1;

        if (index !== lastIndex) {
            // 将末尾元素交换到要删除的位置
            const lastComponent = this.dense[lastIndex]!;
            const lastEntityId = this.entityIds[lastIndex]!;

            this.dense[index] = lastComponent;
            this.entityIds[index] = lastEntityId;

            // 更新被交换元素的映射
            this.entityToIndex.set(lastEntityId, index);
        }

        // 移除末尾元素
        this.dense.pop();
        this.entityIds.pop();
        this.entityToIndex.delete(entityId);

        return component;
    }

    /**
     * 高效遍历所有组件
     * @param callback 回调函数
     */
    public forEach(callback: (component: T, entityId: number, index: number) => void): void {
        for (let i = 0; i < this.dense.length; i++) {
            callback(this.dense[i]!, this.entityIds[i]!, i);
        }
    }

    /**
     * 获取所有组件
     * @returns 组件数组
     */
    public getDenseArray(): { components: T[]; entityIds: number[] } {
        return {
            components: [...this.dense],
            entityIds: [...this.entityIds]
        };
    }

    /**
     * 清空所有组件
     */
    public clear(): void {
        this.dense.length = 0;
        this.entityIds.length = 0;
        this.entityToIndex.clear();
    }

    /**
     * 获取组件数量
     */
    public get size(): number {
        return this.dense.length;
    }

    /**
     * 获取组件类型
     */
    public get type(): ComponentType<T> {
        return this.componentType;
    }


    /**
     * 获取存储统计信息
     */
    public getStats(): {
        totalSlots: number;
        usedSlots: number;
        freeSlots: number;
        fragmentation: number;
        } {
        const totalSlots = this.dense.length;
        const usedSlots = this.dense.length;
        const freeSlots = 0; // 永远无空洞
        const fragmentation = 0; // 永远无碎片

        return {
            totalSlots,
            usedSlots,
            freeSlots,
            fragmentation
        };
    }
}

/**
 * 组件存储管理器
 * 管理所有组件类型的存储器
 */
export class ComponentStorageManager {
    private static readonly _logger = createLogger('ComponentStorage');
    private storages = new Map<Function, ComponentStorage<Component> | SoAStorage<Component>>();

    /**
     * 检查组件类型是否启用SoA存储
     * @param componentType 组件类型
     * @returns 是否为SoA存储
     */
    public isSoAStorage<T extends Component>(componentType: ComponentType<T>): boolean {
        const storage = this.storages.get(componentType);
        return storage instanceof SoAStorage;
    }

    /**
     * 获取SoA存储器（类型安全）
     * @param componentType 组件类型
     * @returns SoA存储器或null
     */
    public getSoAStorage<T extends Component>(componentType: ComponentType<T>): SoAStorage<T> | null {
        const storage = this.getStorage(componentType);
        return storage instanceof SoAStorage ? storage : null;
    }

    /**
     * 直接获取SoA字段数组（类型安全）
     * @param componentType 组件类型
     * @param fieldName 字段名
     * @returns TypedArray或null
     */
    public getFieldArray<T extends Component>(
        componentType: ComponentType<T>,
        fieldName: string
    ): SupportedTypedArray | null {
        const soaStorage = this.getSoAStorage(componentType);
        return soaStorage ? soaStorage.getFieldArray(fieldName) : null;
    }

    /**
     * 直接获取SoA字段数组（类型安全，带字段名检查）
     * @param componentType 组件类型
     * @param fieldName 字段名（类型检查）
     * @returns TypedArray或null
     */
    public getTypedFieldArray<T extends Component, K extends keyof T>(
        componentType: ComponentType<T>,
        fieldName: K
    ): SupportedTypedArray | null {
        const soaStorage = this.getSoAStorage(componentType);
        return soaStorage ? soaStorage.getTypedFieldArray(fieldName) : null;
    }

    /**
     * 获取SoA存储的活跃索引
     * @param componentType 组件类型
     * @returns 活跃索引数组或空数组
     */
    public getActiveIndices<T extends Component>(componentType: ComponentType<T>): number[] {
        const soaStorage = this.getSoAStorage(componentType);
        return soaStorage ? soaStorage.getActiveIndices() : [];
    }

    /**
     * 获取实体在SoA存储中的索引
     * @param componentType 组件类型
     * @param entityId 实体ID
     * @returns 存储索引或undefined
     */
    public getEntityIndex<T extends Component>(componentType: ComponentType<T>, entityId: number): number | undefined {
        const soaStorage = this.getSoAStorage(componentType);
        return soaStorage ? soaStorage.getEntityIndex(entityId) : undefined;
    }

    /**
     * 根据索引获取实体ID
     * @param componentType 组件类型
     * @param index 存储索引
     * @returns 实体ID或undefined
     */
    public getEntityIdByIndex<T extends Component>(componentType: ComponentType<T>, index: number): number | undefined {
        const soaStorage = this.getSoAStorage(componentType);
        return soaStorage ? soaStorage.getEntityIdByIndex(index) : undefined;
    }

    /**
     * 获取或创建组件存储器（默认原始存储）
     * @param componentType 组件类型
     * @returns 组件存储器
     */
    public getStorage<T extends Component>(componentType: ComponentType<T>): ComponentStorage<T> | SoAStorage<T> {
        let storage = this.storages.get(componentType);

        if (!storage) {
            // 检查是否启用SoA优化
            const enableSoA = (componentType as unknown as { __enableSoA?: boolean }).__enableSoA;

            if (enableSoA) {
                // 使用SoA优化存储
                storage = new SoAStorage(componentType);
                ComponentStorageManager._logger.info(`为 ${getComponentTypeName(componentType)} 启用SoA优化（适用于大规模批量操作）`);
            } else {
                // 默认使用原始存储
                storage = new ComponentStorage(componentType);
            }

            this.storages.set(componentType, storage);
        }

        return storage as ComponentStorage<T> | SoAStorage<T>;
    }

    /**
     * 添加组件
     * @param entityId 实体ID
     * @param component 组件实例
     */
    public addComponent<T extends Component>(entityId: number, component: T): void {
        const componentType = component.constructor as ComponentType<T>;
        const storage = this.getStorage(componentType);
        storage.addComponent(entityId, component);
    }

    /**
     * 获取组件
     * @param entityId 实体ID
     * @param componentType 组件类型
     * @returns 组件实例或null
     */
    public getComponent<T extends Component>(entityId: number, componentType: ComponentType<T>): T | null {
        const storage = this.storages.get(componentType);
        return storage ? (storage as ComponentStorage<T> | SoAStorage<T>).getComponent(entityId) : null;
    }

    /**
     * 检查实体是否有组件
     * @param entityId 实体ID
     * @param componentType 组件类型
     * @returns 是否有组件
     */
    public hasComponent<T extends Component>(entityId: number, componentType: ComponentType<T>): boolean {
        const storage = this.storages.get(componentType);
        return storage ? storage.hasComponent(entityId) : false;
    }

    /**
     * 移除组件
     * @param entityId 实体ID
     * @param componentType 组件类型
     * @returns 被移除的组件或null
     */
    public removeComponent<T extends Component>(entityId: number, componentType: ComponentType<T>): T | null {
        const storage = this.storages.get(componentType);
        return storage ? (storage as ComponentStorage<T> | SoAStorage<T>).removeComponent(entityId) : null;
    }

    /**
     * 移除实体的所有组件
     * @param entityId 实体ID
     */
    public removeAllComponents(entityId: number): void {
        for (const storage of this.storages.values()) {
            storage.removeComponent(entityId);
        }
    }

    /**
     * 获取实体的组件位掩码
     * @param entityId 实体ID
     * @returns 组件位掩码
     */
    public getComponentMask(entityId: number): BitMask64Data {
        const mask = BitMask64Utils.clone(BitMask64Utils.ZERO);

        for (const [componentType, storage] of this.storages.entries()) {
            if (storage.hasComponent(entityId)) {
                const componentMask = ComponentRegistry.getBitMask(componentType as ComponentType);
                BitMask64Utils.orInPlace(mask, componentMask);
            }
        }

        return mask;
    }


    /**
     * 获取所有存储器的统计信息
     */
    public getAllStats(): Map<string, { totalSlots: number; usedSlots: number; freeSlots: number; fragmentation: number }> {
        const stats = new Map<string, { totalSlots: number; usedSlots: number; freeSlots: number; fragmentation: number }>();

        for (const [componentType, storage] of this.storages.entries()) {
            const typeName = getComponentTypeName(componentType as ComponentType);
            stats.set(typeName, storage.getStats());
        }

        return stats;
    }

    /**
     * 清空所有存储器
     */
    public clear(): void {
        for (const storage of this.storages.values()) {
            storage.clear();
        }
        this.storages.clear();
    }
}
