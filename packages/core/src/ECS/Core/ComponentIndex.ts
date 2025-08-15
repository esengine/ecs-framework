import { Entity } from '../Entity';
import { ComponentType } from './ComponentStorage';
import { ComponentSparseSet } from '../Utils/ComponentSparseSet';


/**
 * 索引统计信息
 */
export interface IndexStats {
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
 * 通用组件索引实现
 * 
 * 基于Sparse Set算法：
 * - O(1)的实体添加、删除、查找
 * - 高效的位运算查询
 * - 内存紧凑的存储结构
 * - 缓存友好的遍历性能
 */
export class ComponentIndex implements IComponentIndex {
    
    /**
     * 组件稀疏集合
     * 
     * 核心存储结构，处理所有实体和组件的索引操作。
     */
    private _sparseSet: ComponentSparseSet;
    
    // 性能统计
    private _queryCount = 0;
    private _totalQueryTime = 0;
    private _lastUpdated = Date.now();
    
    constructor() {
        this._sparseSet = new ComponentSparseSet();
    }
    
    public addEntity(entity: Entity): void {
        this._sparseSet.addEntity(entity);
        this._lastUpdated = Date.now();
    }
    
    public removeEntity(entity: Entity): void {
        this._sparseSet.removeEntity(entity);
        this._lastUpdated = Date.now();
    }
    
    public query(componentType: ComponentType): Set<Entity> {
        const startTime = performance.now();
        const result = this._sparseSet.queryByComponent(componentType);
        
        this._queryCount++;
        this._totalQueryTime += performance.now() - startTime;
        
        return result;
    }
    
    public queryMultiple(componentTypes: ComponentType[], operation: 'AND' | 'OR'): Set<Entity> {
        const startTime = performance.now();
        
        let result: Set<Entity>;
        
        if (componentTypes.length === 0) {
            result = new Set();
        } else if (componentTypes.length === 1) {
            result = this.query(componentTypes[0]);
        } else if (operation === 'AND') {
            result = this._sparseSet.queryMultipleAnd(componentTypes);
        } else {
            result = this._sparseSet.queryMultipleOr(componentTypes);
        }
        
        this._queryCount++;
        this._totalQueryTime += performance.now() - startTime;
        
        return result;
    }
    
    
    public clear(): void {
        this._sparseSet.clear();
        this._lastUpdated = Date.now();
    }
    
    public getStats(): IndexStats {
        const memoryStats = this._sparseSet.getMemoryStats();
        
        return {
            size: this._sparseSet.size,
            memoryUsage: memoryStats.totalMemory,
            queryCount: this._queryCount,
            avgQueryTime: this._queryCount > 0 ? this._totalQueryTime / this._queryCount : 0,
            lastUpdated: this._lastUpdated
        };
    }
}


/**
 * 组件索引管理器
 * 
 * 使用统一的组件索引实现，自动优化查询性能。
 */
export class ComponentIndexManager {
    private _index: ComponentIndex;
    
    constructor() {
        this._index = new ComponentIndex();
    }
    
    /**
     * 添加实体到索引
     */
    public addEntity(entity: Entity): void {
        this._index.addEntity(entity);
    }
    
    /**
     * 从索引中移除实体
     */
    public removeEntity(entity: Entity): void {
        this._index.removeEntity(entity);
    }
    
    /**
     * 查询包含指定组件的实体
     */
    public query(componentType: ComponentType): Set<Entity> {
        return this._index.query(componentType);
    }
    
    /**
     * 批量查询多个组件
     */
    public queryMultiple(componentTypes: ComponentType[], operation: 'AND' | 'OR'): Set<Entity> {
        return this._index.queryMultiple(componentTypes, operation);
    }
    
    /**
     * 获取索引统计信息
     */
    public getStats(): IndexStats {
        return this._index.getStats();
    }
    
    /**
     * 清空索引
     */
    public clear(): void {
        this._index.clear();
    }
} 