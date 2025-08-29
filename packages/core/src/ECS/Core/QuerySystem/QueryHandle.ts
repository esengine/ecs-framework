import { Entity } from '../../Entity';
import { ComponentType } from '../ComponentStorage';
import { Core } from '../../../Core';
import type { IBitMaskQueryable, BitMaskCondition } from '../../Utils/Matcher';

/**
 * 实体变更事件类型
 */
export interface EntityChangeEvent {
    /** 变更的实体 */
    entity: Entity;
    /** 变更类型 */
    type: 'added' | 'removed';
}

/**
 * 查询句柄接口
 * 
 * 提供订阅式的实体查询机制，避免每帧全量查询和对比。
 * 内部维护匹配的实体集合，并提供增量变更事件。
 */
export interface IQueryHandle {
    /** 当前匹配的实体列表（只读） */
    readonly entities: readonly Entity[];
    
    /** 查询句柄的唯一ID */
    readonly id: string;
    
    /** 是否已销毁 */
    readonly destroyed: boolean;
    
    /** 查询条件 */
    readonly condition: QueryCondition;
    
    /** 原始Matcher，用于位掩码查询优化 */
    readonly matcher?: IBitMaskQueryable;
    
    /**
     * 订阅实体变更事件
     * @param callback 变更事件回调
     * @returns 取消订阅的函数
     */
    subscribe(callback: (event: EntityChangeEvent) => void): () => void;
    
    /**
     * 更新实体列表（内部使用）
     * @param newEntities 新的实体列表
     */
    updateEntities(newEntities: Entity[]): void;
    
    /**
     * 取消所有订阅并销毁句柄
     */
    destroy(): void;
}

/**
 * 查询条件接口
 */
export interface QueryCondition {
    all?: ComponentType[];
    any?: ComponentType[];
    none?: ComponentType[];
    tag?: number;
    name?: string;
    component?: ComponentType;
}

/**
 * 查询句柄实现
 */
export class QueryHandle implements IQueryHandle {
    private _entities: Entity[] = [];
    private _entitySet: Set<Entity> = new Set();
    private _id: string;
    private _destroyed: boolean = false;
    private _subscribers: Set<(event: EntityChangeEvent) => void> = new Set();
    private _condition: QueryCondition;
    private _matcher?: IBitMaskQueryable;

    constructor(condition: QueryCondition, initialEntities: Entity[] = [], matcher?: IBitMaskQueryable) {
        this._id = this.generateId();
        this._condition = { ...condition };
        this._matcher = matcher;
        this.setEntities(initialEntities);
    }

    public get entities(): readonly Entity[] {
        return this._entities;
    }

    public get id(): string {
        return this._id;
    }

    public get destroyed(): boolean {
        return this._destroyed;
    }

    public get condition(): QueryCondition {
        return { ...this._condition };
    }

    public get matcher(): IBitMaskQueryable | undefined {
        return this._matcher;
    }

    /**
     * 订阅实体变更事件
     */
    public subscribe(callback: (event: EntityChangeEvent) => void): () => void {
        if (this._destroyed) {
            throw new Error('Cannot subscribe to destroyed query handle');
        }

        this._subscribers.add(callback);
        
        return () => {
            this._subscribers.delete(callback);
        };
    }

    /**
     * 销毁查询句柄
     */
    public destroy(): void {
        if (this._destroyed) return;
        
        this._destroyed = true;
        this._subscribers.clear();
        this._entities = [];
        this._entitySet.clear();
    }

    /**
     * 更新实体列表（内部使用）
     * @param newEntities 新的实体列表
     */
    public updateEntities(newEntities: Entity[]): void {
        if (this._destroyed) return;

        const newEntitySet = new Set(newEntities);
        const oldEntitySet = this._entitySet;

        // 检测新增的实体
        const addedEntities: Entity[] = [];
        for (const entity of newEntities) {
            if (!oldEntitySet.has(entity)) {
                this._entitySet.add(entity);
                addedEntities.push(entity);
                this.notifySubscribers({ entity, type: 'added' });
            }
        }

        // 检测移除的实体
        const removedEntities: Entity[] = [];
        for (const entity of oldEntitySet) {
            if (!newEntitySet.has(entity)) {
                removedEntities.push(entity);
                this._entitySet.delete(entity);
                this.notifySubscribers({ entity, type: 'removed' });
            }
        }

        // 如果有变更，重建实体数组并排序
        if (addedEntities.length > 0 || removedEntities.length > 0) {
            this._entities = Array.from(this._entitySet);
            this.sortEntitiesIfNeeded();
        }
    }

    /**
     * 设置实体列表（内部使用，用于初始化）
     */
    private setEntities(entities: Entity[]): void {
        this._entities = [...entities];
        this._entitySet = new Set(entities);
        this.sortEntitiesIfNeeded();
    }

    /**
     * 根据配置进行确定性排序
     */
    private sortEntitiesIfNeeded(): void {
        if (Core.deterministicSortingEnabled) {
            this._entities.sort((a, b) => a.id - b.id);
        }
    }

    /**
     * 通知订阅者
     */
    private notifySubscribers(event: EntityChangeEvent): void {
        for (const callback of this._subscribers) {
            try {
                callback(event);
            } catch (error) {
                console.error('Error in query handle subscriber:', error);
            }
        }
    }

    /**
     * 生成唯一ID
     */
    private generateId(): string {
        return Math.random().toString(36).substring(2, 11);
    }
}