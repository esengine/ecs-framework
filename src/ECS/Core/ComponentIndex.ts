import { Entity } from '../Entity';
import { Component } from '../Component';
import { ComponentType } from './ComponentStorage';

/**
 * 组件索引类型
 */
export enum IndexType {
    /** 哈希索引 - 最快查找 */
    HASH = 'hash',
    /** 位图索引 - 内存高效 */
    BITMAP = 'bitmap',
    /** 排序索引 - 支持范围查询 */
    SORTED = 'sorted'
}

/**
 * 索引统计信息
 */
export interface IndexStats {
    /** 索引类型 */
    type: IndexType;
    /** 索引大小 */
    size: number;
    /** 内存使用量（字节） */
    memoryUsage: number;
    /** 查询次数 */
    queryCount: number;
    /** 平均查询时间（毫秒） */
    avgQueryTime: number;
    /** 最后更新时间 */
    lastUpdated: number;
}

/**
 * 组件索引接口
 */
export interface IComponentIndex {
    /** 索引类型 */
    readonly type: IndexType;
    /** 添加实体到索引 */
    addEntity(entity: Entity): void;
    /** 从索引中移除实体 */
    removeEntity(entity: Entity): void;
    /** 查询包含指定组件的实体 */
    query(componentType: ComponentType): Set<Entity>;
    /** 批量查询多个组件 */
    queryMultiple(componentTypes: ComponentType[], operation: 'AND' | 'OR'): Set<Entity>;
    /** 清空索引 */
    clear(): void;
    /** 获取索引统计信息 */
    getStats(): IndexStats;
}

/**
 * 哈希索引实现
 * 
 * 使用Map数据结构，提供O(1)的查找性能。
 * 适合大多数查询场景。
 */
export class HashComponentIndex implements IComponentIndex {
    public readonly type = IndexType.HASH;
    
    private _componentToEntities = new Map<ComponentType, Set<Entity>>();
    private _entityToComponents = new Map<Entity, Set<ComponentType>>();
    private _queryCount = 0;
    private _totalQueryTime = 0;
    private _lastUpdated = Date.now();
    
    public addEntity(entity: Entity): void {
        const components = entity.components;
        const componentTypes = new Set<ComponentType>();
        
        for (const component of components) {
            const componentType = component.constructor as ComponentType;
            componentTypes.add(componentType);
            
            let entities = this._componentToEntities.get(componentType);
            if (!entities) {
                entities = new Set();
                this._componentToEntities.set(componentType, entities);
            }
            entities.add(entity);
        }
        
        this._entityToComponents.set(entity, componentTypes);
        this._lastUpdated = Date.now();
    }
    
    public removeEntity(entity: Entity): void {
        const componentTypes = this._entityToComponents.get(entity);
        if (!componentTypes) return;
        
        for (const componentType of componentTypes) {
            const entities = this._componentToEntities.get(componentType);
            if (entities) {
                entities.delete(entity);
                if (entities.size === 0) {
                    this._componentToEntities.delete(componentType);
                }
            }
        }
        
        this._entityToComponents.delete(entity);
        this._lastUpdated = Date.now();
    }
    
    public query(componentType: ComponentType): Set<Entity> {
        const startTime = performance.now();
        const result = new Set(this._componentToEntities.get(componentType) || []);
        
        this._queryCount++;
        this._totalQueryTime += performance.now() - startTime;
        
        return result;
    }
    
    public queryMultiple(componentTypes: ComponentType[], operation: 'AND' | 'OR'): Set<Entity> {
        const startTime = performance.now();
        
        if (componentTypes.length === 0) {
            return new Set();
        }
        
        if (componentTypes.length === 1) {
            return this.query(componentTypes[0]);
        }
        
        let result: Set<Entity>;
        
        if (operation === 'AND') {
            let smallestSet: Set<Entity> | undefined;
            let smallestSize = Infinity;
            
            for (const componentType of componentTypes) {
                const entities = this._componentToEntities.get(componentType);
                if (!entities || entities.size === 0) {
                    this._queryCount++;
                    this._totalQueryTime += performance.now() - startTime;
                    return new Set();
                }
                if (entities.size < smallestSize) {
                    smallestSize = entities.size;
                    smallestSet = entities;
                }
            }
            
            result = new Set();
            if (smallestSet) {
                for (const entity of smallestSet) {
                    let hasAll = true;
                    for (const componentType of componentTypes) {
                        const entities = this._componentToEntities.get(componentType);
                        if (!entities || !entities.has(entity)) {
                            hasAll = false;
                            break;
                        }
                    }
                    if (hasAll) {
                        result.add(entity);
                    }
                }
            }
        } else {
            result = new Set();
            for (const componentType of componentTypes) {
                const entities = this._componentToEntities.get(componentType);
                if (entities) {
                    for (const entity of entities) {
                        result.add(entity);
                    }
                }
            }
        }
        
        this._queryCount++;
        this._totalQueryTime += performance.now() - startTime;
        
        return result;
    }
    
    public clear(): void {
        this._componentToEntities.clear();
        this._entityToComponents.clear();
        this._lastUpdated = Date.now();
    }
    
    public getStats(): IndexStats {
        let memoryUsage = 0;
        
        memoryUsage += this._componentToEntities.size * 64;
        memoryUsage += this._entityToComponents.size * 64;
        
        for (const entities of this._componentToEntities.values()) {
            memoryUsage += entities.size * 8;
        }
        
        for (const components of this._entityToComponents.values()) {
            memoryUsage += components.size * 8;
        }
        
        return {
            type: this.type,
            size: this._componentToEntities.size,
            memoryUsage,
            queryCount: this._queryCount,
            avgQueryTime: this._queryCount > 0 ? this._totalQueryTime / this._queryCount : 0,
            lastUpdated: this._lastUpdated
        };
    }
}

/**
 * 位图索引实现
 * 
 * 使用位操作进行快速集合运算，内存效率高。
 * 适合有限组件类型和大量实体的场景。
 */
export class BitmapComponentIndex implements IComponentIndex {
    public readonly type = IndexType.BITMAP;
    
    private _componentTypeToBit = new Map<ComponentType, number>();
    private _entityToBitmap = new Map<Entity, number>();
    private _bitToEntities = new Map<number, Set<Entity>>();
    private _nextBit = 0;
    private _queryCount = 0;
    private _totalQueryTime = 0;
    private _lastUpdated = Date.now();
    
    public addEntity(entity: Entity): void {
        let bitmap = 0;
        
        for (const component of entity.components) {
            const componentType = component.constructor as ComponentType;
            let bit = this._componentTypeToBit.get(componentType);
            
            if (bit === undefined) {
                bit = this._nextBit++;
                this._componentTypeToBit.set(componentType, bit);
            }
            
            bitmap |= (1 << bit);
            
            let entities = this._bitToEntities.get(1 << bit);
            if (!entities) {
                entities = new Set();
                this._bitToEntities.set(1 << bit, entities);
            }
            entities.add(entity);
        }
        
        this._entityToBitmap.set(entity, bitmap);
        this._lastUpdated = Date.now();
    }
    
    public removeEntity(entity: Entity): void {
        const bitmap = this._entityToBitmap.get(entity);
        if (bitmap === undefined) return;
        
        // 从所有相关的位集合中移除实体
        for (const [bitMask, entities] of this._bitToEntities) {
            if ((bitmap & bitMask) !== 0) {
                entities.delete(entity);
                if (entities.size === 0) {
                    this._bitToEntities.delete(bitMask);
                }
            }
        }
        
        this._entityToBitmap.delete(entity);
        this._lastUpdated = Date.now();
    }
    
    public query(componentType: ComponentType): Set<Entity> {
        const startTime = performance.now();
        
        const bit = this._componentTypeToBit.get(componentType);
        if (bit === undefined) {
            this._queryCount++;
            this._totalQueryTime += performance.now() - startTime;
            return new Set();
        }
        
        const result = new Set(this._bitToEntities.get(1 << bit) || []);
        
        this._queryCount++;
        this._totalQueryTime += performance.now() - startTime;
        
        return result;
    }
    
    public queryMultiple(componentTypes: ComponentType[], operation: 'AND' | 'OR'): Set<Entity> {
        const startTime = performance.now();
        
        if (componentTypes.length === 0) {
            return new Set();
        }
        
        let targetBitmap = 0;
        const validBits: number[] = [];
        
        for (const componentType of componentTypes) {
            const bit = this._componentTypeToBit.get(componentType);
            if (bit !== undefined) {
                targetBitmap |= (1 << bit);
                validBits.push(1 << bit);
            }
        }
        
        const result = new Set<Entity>();
        
        if (operation === 'AND') {
            for (const [entity, entityBitmap] of this._entityToBitmap) {
                if ((entityBitmap & targetBitmap) === targetBitmap) {
                    result.add(entity);
                }
            }
        } else {
            for (const bitMask of validBits) {
                const entities = this._bitToEntities.get(bitMask);
                if (entities) {
                    for (const entity of entities) {
                        result.add(entity);
                    }
                }
            }
        }
        
        this._queryCount++;
        this._totalQueryTime += performance.now() - startTime;
        
        return result;
    }
    
    public clear(): void {
        this._componentTypeToBit.clear();
        this._entityToBitmap.clear();
        this._bitToEntities.clear();
        this._nextBit = 0;
        this._lastUpdated = Date.now();
    }
    
    public getStats(): IndexStats {
        let memoryUsage = 0;
        
        memoryUsage += this._componentTypeToBit.size * 12;
        memoryUsage += this._entityToBitmap.size * 12;
        memoryUsage += this._bitToEntities.size * 64;
        
        for (const entities of this._bitToEntities.values()) {
            memoryUsage += entities.size * 8;
        }
        
        return {
            type: this.type,
            size: this._componentTypeToBit.size,
            memoryUsage,
            queryCount: this._queryCount,
            avgQueryTime: this._queryCount > 0 ? this._totalQueryTime / this._queryCount : 0,
            lastUpdated: this._lastUpdated
        };
    }
}

/**
 * 智能组件索引管理器
 * 
 * 根据使用模式自动选择最优的索引策略。
 * 支持动态切换索引类型以获得最佳性能。
 */
export class ComponentIndexManager {
    private _activeIndex: IComponentIndex;
    private _indexHistory: Map<IndexType, IndexStats> = new Map();
    private _autoOptimize = true;
    private _optimizationThreshold = 1000;
    
    constructor(initialType: IndexType = IndexType.HASH) {
        this._activeIndex = this.createIndex(initialType);
    }
    
    /**
     * 添加实体到索引
     */
    public addEntity(entity: Entity): void {
        this._activeIndex.addEntity(entity);
        this.checkOptimization();
    }
    
    /**
     * 从索引中移除实体
     */
    public removeEntity(entity: Entity): void {
        this._activeIndex.removeEntity(entity);
    }
    
    /**
     * 查询包含指定组件的实体
     */
    public query(componentType: ComponentType): Set<Entity> {
        return this._activeIndex.query(componentType);
    }
    
    /**
     * 批量查询多个组件
     */
    public queryMultiple(componentTypes: ComponentType[], operation: 'AND' | 'OR'): Set<Entity> {
        return this._activeIndex.queryMultiple(componentTypes, operation);
    }
    
    /**
     * 手动切换索引类型
     */
    public switchIndexType(type: IndexType): void {
        if (type === this._activeIndex.type) return;
        
        this._indexHistory.set(this._activeIndex.type, this._activeIndex.getStats());
        
        const oldIndex = this._activeIndex;
        this._activeIndex = this.createIndex(type);
        
        oldIndex.clear();
    }
    
    /**
     * 启用/禁用自动优化
     */
    public setAutoOptimize(enabled: boolean): void {
        this._autoOptimize = enabled;
    }
    
    /**
     * 获取当前索引统计信息
     */
    public getStats(): IndexStats {
        return this._activeIndex.getStats();
    }
    
    /**
     * 获取所有索引类型的历史统计信息
     */
    public getAllStats(): Map<IndexType, IndexStats> {
        const current = this._activeIndex.getStats();
        return new Map([
            ...this._indexHistory,
            [current.type, current]
        ]);
    }
    
    /**
     * 清空索引
     */
    public clear(): void {
        this._activeIndex.clear();
    }
    
    /**
     * 创建指定类型的索引
     */
    private createIndex(type: IndexType): IComponentIndex {
        switch (type) {
            case IndexType.HASH:
                return new HashComponentIndex();
            case IndexType.BITMAP:
                return new BitmapComponentIndex();
            case IndexType.SORTED:
                return new HashComponentIndex();
            default:
                return new HashComponentIndex();
        }
    }
    
    /**
     * 检查是否需要优化索引
     */
    private checkOptimization(): void {
        if (!this._autoOptimize) return;
        
        const stats = this._activeIndex.getStats();
        if (stats.queryCount < this._optimizationThreshold) return;
        

        if (stats.avgQueryTime > 1.0 && stats.type !== IndexType.HASH) {
            this.switchIndexType(IndexType.HASH);
        } else if (stats.memoryUsage > 10 * 1024 * 1024 && stats.type !== IndexType.BITMAP) {
            this.switchIndexType(IndexType.BITMAP);
        }
    }
} 