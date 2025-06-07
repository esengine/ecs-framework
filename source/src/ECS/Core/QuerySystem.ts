import { Entity } from '../Entity';
import { Component } from '../Component';
import { ComponentRegistry, ComponentType } from './ComponentStorage';

/**
 * 查询条件类型
 */
export enum QueryConditionType {
    /** 必须包含所有指定组件 */
    ALL = 'all',
    /** 必须包含任意一个指定组件 */
    ANY = 'any',
    /** 不能包含任何指定组件 */
    NONE = 'none'
}

/**
 * 查询条件
 */
export interface QueryCondition {
    type: QueryConditionType;
    componentTypes: ComponentType[];
    mask: bigint;
}

/**
 * 组件元组类型
 */
export type ComponentTuple<T extends readonly ComponentType[]> = {
    [K in keyof T]: T[K] extends ComponentType<infer C> ? C : never;
};

/**
 * 类型安全的查询结果
 */
export interface TypedQueryResult<T extends readonly ComponentType[]> {
    entities: Entity[];
    components: ComponentTuple<T>[];
    count: number;
    executionTime: number;
    fromCache: boolean;
}

/**
 * 实体和组件的配对结果
 */
export interface EntityComponentPair<T extends readonly ComponentType[]> {
    entity: Entity;
    components: ComponentTuple<T>;
}

/**
 * 实体查询结果
 */
export interface QueryResult {
    entities: Entity[];
    count: number;
    /** 查询执行时间（毫秒） */
    executionTime: number;
    /** 是否来自缓存 */
    fromCache: boolean;
}

/**
 * 查询缓存项
 */
interface QueryCacheItem {
    entities: Entity[];
    lastUpdate: number;
    hitCount: number;
}

/**
 * 实体索引项
 */
interface EntityIndex {
    byMask: Map<bigint, Set<Entity>>;
    byComponentType: Map<ComponentType, Set<Entity>>;
    byTag: Map<number, Set<Entity>>;
    byName: Map<string, Set<Entity>>;
}

/**
 * 查询性能统计
 */
interface QueryPerformanceStats {
    totalQueries: number;
    averageExecutionTime: number;
    cacheHitRate: number;
    indexHitRate: number;
    slowQueries: Array<{
        query: string;
        executionTime: number;
        timestamp: number;
    }>;
}

/**
 * 高性能实体查询系统
 * 使用位掩码进行快速组件匹配，支持多级索引和智能缓存
 */
export class QuerySystem {
    private entities: Entity[] = [];
    private queryCache = new Map<string, QueryCacheItem>();
    private cacheTimeout = 1000; // 缓存超时时间（毫秒）
    private maxCacheSize = 100; // 最大缓存数量
    private cacheHits = 0;
    private cacheMisses = 0;
    
    // 多级索引系统
    private entityIndex: EntityIndex = {
        byMask: new Map(),
        byComponentType: new Map(),
        byTag: new Map(),
        byName: new Map()
    };
    
    // 性能统计
    private performanceStats: QueryPerformanceStats = {
        totalQueries: 0,
        averageExecutionTime: 0,
        cacheHitRate: 0,
        indexHitRate: 0,
        slowQueries: []
    };
    
    // 索引更新标志
    private indexDirty = true;
    private lastIndexUpdate = 0;
    private indexUpdateThreshold = 100; // 毫秒
    
    // 批量操作缓冲区
    private pendingEntityAdds: Entity[] = [];
    private pendingEntityRemoves: Entity[] = [];
    private batchUpdateScheduled = false;

    /**
     * 设置实体列表
     * @param entities 实体数组
     */
    public setEntities(entities: Entity[]): void {
        this.entities = entities;
        this.invalidateIndexes();
        this.clearCache();
    }

    /**
     * 添加实体
     * @param entity 实体
     */
    public addEntity(entity: Entity): void {
        this.pendingEntityAdds.push(entity);
        this.scheduleBatchUpdate();
    }

    /**
     * 批量添加实体
     * @param entities 实体数组
     */
    public addEntities(entities: Entity[]): void {
        this.pendingEntityAdds.push(...entities);
        this.scheduleBatchUpdate();
    }

    /**
     * 移除实体
     * @param entity 实体
     */
    public removeEntity(entity: Entity): void {
        this.pendingEntityRemoves.push(entity);
        this.scheduleBatchUpdate();
    }

    /**
     * 批量移除实体
     * @param entities 实体数组
     */
    public removeEntities(entities: Entity[]): void {
        this.pendingEntityRemoves.push(...entities);
        this.scheduleBatchUpdate();
    }

    /**
     * 调度批量更新
     */
    private scheduleBatchUpdate(): void {
        if (!this.batchUpdateScheduled) {
            this.batchUpdateScheduled = true;
            // 使用微任务确保在当前执行栈完成后立即执行
            Promise.resolve().then(() => this.processBatchUpdates());
        }
    }

    /**
     * 处理批量更新
     */
    private processBatchUpdates(): void {
        this.batchUpdateScheduled = false;
        
        // 处理添加
        if (this.pendingEntityAdds.length > 0) {
            this.entities.push(...this.pendingEntityAdds);
            
            // 更新索引
            for (const entity of this.pendingEntityAdds) {
                this.addEntityToIndexes(entity);
            }
            
            this.pendingEntityAdds.length = 0;
        }
        
        // 处理移除
        if (this.pendingEntityRemoves.length > 0) {
            const removeSet = new Set(this.pendingEntityRemoves);
            
            // 从实体列表中移除
            this.entities = this.entities.filter(entity => !removeSet.has(entity));
            
            // 从索引中移除
            for (const entity of this.pendingEntityRemoves) {
                this.removeEntityFromIndexes(entity);
            }
            
            this.pendingEntityRemoves.length = 0;
        }
        
        // 清空缓存
        this.clearCache();
    }

    /**
     * 强制立即处理所有待处理的更新
     */
    public flushUpdates(): void {
        if (this.batchUpdateScheduled) {
            this.processBatchUpdates();
        }
    }

    /**
     * 无效化所有索引
     */
    private invalidateIndexes(): void {
        this.indexDirty = true;
        this.entityIndex.byMask.clear();
        this.entityIndex.byComponentType.clear();
        this.entityIndex.byTag.clear();
        this.entityIndex.byName.clear();
    }

    /**
     * 将实体添加到索引
     * @param entity 实体
     */
    private addEntityToIndexes(entity: Entity): void {
        // 按位掩码索引
        const mask = entity.componentMask;
        if (!this.entityIndex.byMask.has(mask)) {
            this.entityIndex.byMask.set(mask, new Set());
        }
        this.entityIndex.byMask.get(mask)!.add(entity);

        // 按组件类型索引
        for (const component of entity.components) {
            const componentType = component.constructor as ComponentType;
            if (!this.entityIndex.byComponentType.has(componentType)) {
                this.entityIndex.byComponentType.set(componentType, new Set());
            }
            this.entityIndex.byComponentType.get(componentType)!.add(entity);
        }

        // 按标签索引
        const tag = entity.tag;
        if (!this.entityIndex.byTag.has(tag)) {
            this.entityIndex.byTag.set(tag, new Set());
        }
        this.entityIndex.byTag.get(tag)!.add(entity);

        // 按名称索引
        const name = entity.name;
        if (!this.entityIndex.byName.has(name)) {
            this.entityIndex.byName.set(name, new Set());
        }
        this.entityIndex.byName.get(name)!.add(entity);
    }

    /**
     * 从索引中移除实体
     * @param entity 实体
     */
    private removeEntityFromIndexes(entity: Entity): void {
        // 从位掩码索引移除
        const mask = entity.componentMask;
        const maskSet = this.entityIndex.byMask.get(mask);
        if (maskSet) {
            maskSet.delete(entity);
            if (maskSet.size === 0) {
                this.entityIndex.byMask.delete(mask);
            }
        }

        // 从组件类型索引移除
        for (const component of entity.components) {
            const componentType = component.constructor as ComponentType;
            const typeSet = this.entityIndex.byComponentType.get(componentType);
            if (typeSet) {
                typeSet.delete(entity);
                if (typeSet.size === 0) {
                    this.entityIndex.byComponentType.delete(componentType);
                }
            }
        }

        // 从标签索引移除
        const tagSet = this.entityIndex.byTag.get(entity.tag);
        if (tagSet) {
            tagSet.delete(entity);
            if (tagSet.size === 0) {
                this.entityIndex.byTag.delete(entity.tag);
            }
        }

        // 从名称索引移除
        const nameSet = this.entityIndex.byName.get(entity.name);
        if (nameSet) {
            nameSet.delete(entity);
            if (nameSet.size === 0) {
                this.entityIndex.byName.delete(entity.name);
            }
        }
    }

    /**
     * 重建所有索引
     */
    private rebuildIndexes(): void {
        if (!this.indexDirty) return;

        this.invalidateIndexes();
        
        for (const entity of this.entities) {
            this.addEntityToIndexes(entity);
        }
        
        this.indexDirty = false;
        this.lastIndexUpdate = Date.now();
    }

    /**
     * 确保索引是最新的
     */
    private ensureIndexesUpdated(): void {
        const now = Date.now();
        if (this.indexDirty || (now - this.lastIndexUpdate) > this.indexUpdateThreshold) {
            this.rebuildIndexes();
        }
    }

    /**
     * 查询包含所有指定组件的实体
     * @param componentTypes 组件类型数组
     * @returns 查询结果
     */
    public queryAll(...componentTypes: ComponentType[]): QueryResult {
        return this.query({
            type: QueryConditionType.ALL,
            componentTypes,
            mask: this.createMask(componentTypes)
        });
    }

    /**
     * 查询包含任意指定组件的实体
     * @param componentTypes 组件类型数组
     * @returns 查询结果
     */
    public queryAny(...componentTypes: ComponentType[]): QueryResult {
        return this.query({
            type: QueryConditionType.ANY,
            componentTypes,
            mask: this.createMask(componentTypes)
        });
    }

    /**
     * 查询不包含任何指定组件的实体
     * @param componentTypes 组件类型数组
     * @returns 查询结果
     */
    public queryNone(...componentTypes: ComponentType[]): QueryResult {
        return this.query({
            type: QueryConditionType.NONE,
            componentTypes,
            mask: this.createMask(componentTypes)
        });
    }

    /**
     * 复合查询：同时满足多个条件
     * @param conditions 查询条件数组
     * @returns 查询结果
     */
    public queryComplex(...conditions: QueryCondition[]): QueryResult {
        const startTime = performance.now();
        
        // 生成复合查询的缓存键
        const cacheKey = this.generateComplexCacheKey(conditions);
        
        // 检查缓存
        const cached = this.getCachedResult(cacheKey);
        if (cached) {
            return {
                entities: cached.entities,
                count: cached.entities.length,
                executionTime: performance.now() - startTime,
                fromCache: true
            };
        }

        // 执行查询
        let result = this.entities.slice(); // 从所有实体开始

        for (const condition of conditions) {
            result = this.filterEntitiesByCondition(result, condition);
        }

        const executionTime = performance.now() - startTime;

        // 缓存结果
        this.cacheResult(cacheKey, result);

        return {
            entities: result,
            count: result.length,
            executionTime,
            fromCache: false
        };
    }

    /**
     * 流式查询构建器
     * @returns 查询构建器实例
     */
    public createQuery(): QueryBuilder {
        return new QueryBuilder(this);
    }

    /**
     * 根据标签查询实体
     * @param tag 标签
     * @returns 查询结果
     */
    public queryByTag(tag: number): QueryResult {
        const startTime = performance.now();
        this.ensureIndexesUpdated();
        
        const entities = Array.from(this.entityIndex.byTag.get(tag) || []);
        const executionTime = performance.now() - startTime;
        
        this.updatePerformanceStats(executionTime, true);
        
        return {
            entities,
            count: entities.length,
            executionTime,
            fromCache: false
        };
    }

    /**
     * 根据名称查询实体
     * @param name 名称
     * @returns 查询结果
     */
    public queryByName(name: string): QueryResult {
        const startTime = performance.now();
        this.ensureIndexesUpdated();
        
        const entities = Array.from(this.entityIndex.byName.get(name) || []);
        const executionTime = performance.now() - startTime;
        
        this.updatePerformanceStats(executionTime, true);
        
        return {
            entities,
            count: entities.length,
            executionTime,
            fromCache: false
        };
    }

    /**
     * 根据单个组件类型快速查询
     * @param componentType 组件类型
     * @returns 查询结果
     */
    public queryByComponent<T extends Component>(componentType: ComponentType<T>): QueryResult {
        const startTime = performance.now();
        this.ensureIndexesUpdated();
        
        const entities = Array.from(this.entityIndex.byComponentType.get(componentType) || []);
        const executionTime = performance.now() - startTime;
        
        this.updatePerformanceStats(executionTime, true);
        
        return {
            entities,
            count: entities.length,
            executionTime,
            fromCache: false
        };
    }

    /**
     * 类型安全的查询所有指定组件的实体
     * @param componentTypes 组件类型数组
     * @returns 类型安全的查询结果
     */
    public queryAllTyped<T extends readonly ComponentType[]>(...componentTypes: T): TypedQueryResult<T> {
        const startTime = performance.now();
        this.ensureIndexesUpdated();
        
        const condition: QueryCondition = {
            type: QueryConditionType.ALL,
            componentTypes: [...componentTypes],
            mask: this.createMask([...componentTypes])
        };
        
        const entities = this.queryWithIndexOptimization(condition) || 
                        this.filterEntitiesByCondition(this.entities, condition);
        
        // 提取组件
        const components: ComponentTuple<T>[] = [];
        for (const entity of entities) {
            const entityComponents: any[] = [];
            let hasAllComponents = true;
            
            for (const type of componentTypes) {
                const component = entity.getComponent(type);
                if (component === null) {
                    hasAllComponents = false;
                    break;
                }
                entityComponents.push(component);
            }
            
            if (hasAllComponents) {
                components.push(entityComponents as ComponentTuple<T>);
            }
        }
        
        const executionTime = performance.now() - startTime;
        this.updatePerformanceStats(executionTime, false);
        
        return {
            entities,
            components,
            count: entities.length,
            executionTime,
            fromCache: false
        };
    }

    /**
     * 查询具有特定组件组合的实体并返回组件实例
     * @param componentTypes 组件类型数组
     * @returns 实体和对应组件的映射
     */
    public queryWithComponents<T extends readonly ComponentType[]>(
        ...componentTypes: T
    ): EntityComponentPair<T>[] {
        const result = this.queryAllTyped(...componentTypes);
        
        return result.entities.map((entity, index) => ({
            entity,
            components: result.components[index]
        }));
    }

    /**
     * 迭代查询结果，为每个匹配的实体执行回调
     * @param componentTypes 组件类型数组
     * @param callback 回调函数
     */
    public forEachWithComponents<T extends readonly ComponentType[]>(
        componentTypes: T,
        callback: (entity: Entity, components: ComponentTuple<T>) => void
    ): void {
        const result = this.queryAllTyped(...componentTypes);
        
        for (let i = 0; i < result.entities.length; i++) {
            callback(result.entities[i], result.components[i]);
        }
    }

    /**
     * 查询单个组件类型的实体，返回类型安全的结果
     * @param componentType 组件类型
     * @returns 实体和组件的配对数组
     */
    public queryComponentTyped<T extends Component>(
        componentType: ComponentType<T>
    ): Array<{ entity: Entity; component: T }> {
        const startTime = performance.now();
        this.ensureIndexesUpdated();
        
        const entities = Array.from(this.entityIndex.byComponentType.get(componentType) || []);
        const result: Array<{ entity: Entity; component: T }> = [];
        
        for (const entity of entities) {
            const component = entity.getComponent(componentType);
            if (component) {
                result.push({ entity, component });
            }
        }
        
        const executionTime = performance.now() - startTime;
        this.updatePerformanceStats(executionTime, true);
        
        return result;
    }

    /**
     * 查询两个组件类型的实体，返回类型安全的结果
     * @param componentType1 第一个组件类型
     * @param componentType2 第二个组件类型
     * @returns 实体和组件的配对数组
     */
    public queryTwoComponents<T1 extends Component, T2 extends Component>(
        componentType1: ComponentType<T1>,
        componentType2: ComponentType<T2>
    ): Array<{ entity: Entity; component1: T1; component2: T2 }> {
        const result = this.queryAllTyped(componentType1, componentType2);
        
        return result.entities.map((entity, index) => ({
            entity,
            component1: result.components[index][0] as T1,
            component2: result.components[index][1] as T2
        }));
    }

    /**
     * 查询三个组件类型的实体，返回类型安全的结果
     * @param componentType1 第一个组件类型
     * @param componentType2 第二个组件类型
     * @param componentType3 第三个组件类型
     * @returns 实体和组件的配对数组
     */
    public queryThreeComponents<T1 extends Component, T2 extends Component, T3 extends Component>(
        componentType1: ComponentType<T1>,
        componentType2: ComponentType<T2>,
        componentType3: ComponentType<T3>
    ): Array<{ entity: Entity; component1: T1; component2: T2; component3: T3 }> {
        const result = this.queryAllTyped(componentType1, componentType2, componentType3);
        
        return result.entities.map((entity, index) => ({
            entity,
            component1: result.components[index][0] as T1,
            component2: result.components[index][1] as T2,
            component3: result.components[index][2] as T3
        }));
    }

    /**
     * 执行单个条件查询
     * @param condition 查询条件
     * @returns 查询结果
     */
    private query(condition: QueryCondition): QueryResult {
        const startTime = performance.now();
        
        // 确保索引是最新的
        this.ensureIndexesUpdated();
        
        // 生成缓存键
        const cacheKey = this.generateCacheKey(condition);
        
        // 检查缓存
        const cached = this.getCachedResult(cacheKey);
        if (cached) {
            this.updatePerformanceStats(performance.now() - startTime, false);
            return {
                entities: cached.entities,
                count: cached.entities.length,
                executionTime: performance.now() - startTime,
                fromCache: true
            };
        }

        // 尝试使用索引优化查询
        let result = this.queryWithIndexOptimization(condition);
        
        // 如果索引优化失败，回退到传统查询
        if (!result) {
            result = this.filterEntitiesByCondition(this.entities, condition);
        }

        const executionTime = performance.now() - startTime;
        
        // 缓存结果
        this.cacheResult(cacheKey, result);
        
        // 更新性能统计
        this.updatePerformanceStats(executionTime, false);
        
        return {
            entities: result,
            count: result.length,
            executionTime,
            fromCache: false
        };
    }

    /**
     * 使用索引优化查询
     * @param condition 查询条件
     * @returns 查询结果或null（如果无法优化）
     */
    private queryWithIndexOptimization(condition: QueryCondition): Entity[] | null {
        // 对于单组件查询，直接使用组件索引
        if (condition.componentTypes.length === 1 && condition.type === QueryConditionType.ALL) {
            const componentType = condition.componentTypes[0];
            const entities = this.entityIndex.byComponentType.get(componentType);
            return entities ? Array.from(entities) : [];
        }

        // 对于多组件ALL查询，找到最小的组件集合作为起点
        if (condition.type === QueryConditionType.ALL && condition.componentTypes.length > 1) {
            let smallestSet: Set<Entity> | null = null;
            let smallestSize = Infinity;

            for (const componentType of condition.componentTypes) {
                const entities = this.entityIndex.byComponentType.get(componentType);
                if (!entities) return []; // 如果任何组件都没有实体，结果为空
                
                if (entities.size < smallestSize) {
                    smallestSize = entities.size;
                    smallestSet = entities;
                }
            }

            if (!smallestSet) return [];

            // 从最小集合开始，检查每个实体是否包含所有其他组件
            const result: Entity[] = [];
            for (const entity of smallestSet) {
                if (this.matchesCondition(entity, condition)) {
                    result.push(entity);
                }
            }
            return result;
        }

        // 对于ANY查询，合并所有相关组件的实体集合
        if (condition.type === QueryConditionType.ANY) {
            const entitySet = new Set<Entity>();
            for (const componentType of condition.componentTypes) {
                const entities = this.entityIndex.byComponentType.get(componentType);
                if (entities) {
                    for (const entity of entities) {
                        entitySet.add(entity);
                    }
                }
            }
            return Array.from(entitySet);
        }

        // 对于NONE查询，从所有实体中排除包含指定组件的实体
        if (condition.type === QueryConditionType.NONE) {
            const excludeSet = new Set<Entity>();
            for (const componentType of condition.componentTypes) {
                const entities = this.entityIndex.byComponentType.get(componentType);
                if (entities) {
                    for (const entity of entities) {
                        excludeSet.add(entity);
                    }
                }
            }
            return this.entities.filter(entity => !excludeSet.has(entity));
        }

        return null; // 无法优化
    }

    /**
     * 更新性能统计
     * @param executionTime 执行时间
     * @param fromIndex 是否来自索引
     */
    private updatePerformanceStats(executionTime: number, fromIndex: boolean): void {
        this.performanceStats.totalQueries++;
        
        // 更新平均执行时间
        const totalTime = this.performanceStats.averageExecutionTime * (this.performanceStats.totalQueries - 1) + executionTime;
        this.performanceStats.averageExecutionTime = totalTime / this.performanceStats.totalQueries;
        
        // 更新缓存命中率
        this.performanceStats.cacheHitRate = this.cacheHits / (this.cacheHits + this.cacheMisses);
        
        // 更新索引命中率
        if (fromIndex) {
            this.performanceStats.indexHitRate = (this.performanceStats.indexHitRate * (this.performanceStats.totalQueries - 1) + 1) / this.performanceStats.totalQueries;
        } else {
            this.performanceStats.indexHitRate = (this.performanceStats.indexHitRate * (this.performanceStats.totalQueries - 1)) / this.performanceStats.totalQueries;
        }
        
        // 记录慢查询
        if (executionTime > 10) { // 超过10ms的查询被认为是慢查询
            this.performanceStats.slowQueries.push({
                query: `执行时间: ${executionTime.toFixed(2)}ms`,
                executionTime,
                timestamp: Date.now()
            });
            
            // 只保留最近的50个慢查询
            if (this.performanceStats.slowQueries.length > 50) {
                this.performanceStats.slowQueries.shift();
            }
        }
    }

    /**
     * 根据条件过滤实体
     * @param entities 实体数组
     * @param condition 查询条件
     * @returns 过滤后的实体数组
     */
    private filterEntitiesByCondition(entities: Entity[], condition: QueryCondition): Entity[] {
        const result: Entity[] = [];

        for (const entity of entities) {
            if (this.matchesCondition(entity, condition)) {
                result.push(entity);
            }
        }

        return result;
    }

    /**
     * 检查实体是否匹配条件
     * @param entity 实体
     * @param condition 查询条件
     * @returns 是否匹配
     */
    private matchesCondition(entity: Entity, condition: QueryCondition): boolean {
        const entityMask = entity.componentMask;

        switch (condition.type) {
            case QueryConditionType.ALL:
                // 实体必须包含所有指定组件
                return (entityMask & condition.mask) === condition.mask;
            
            case QueryConditionType.ANY:
                // 实体必须包含至少一个指定组件
                return (entityMask & condition.mask) !== BigInt(0);
            
            case QueryConditionType.NONE:
                // 实体不能包含任何指定组件
                return (entityMask & condition.mask) === BigInt(0);
            
            default:
                return false;
        }
    }

    /**
     * 创建组件类型的位掩码
     * @param componentTypes 组件类型数组
     * @returns 位掩码
     */
    private createMask(componentTypes: ComponentType[]): bigint {
        let mask = BigInt(0);
        
        for (const componentType of componentTypes) {
            if (ComponentRegistry.isRegistered(componentType)) {
                mask |= ComponentRegistry.getBitMask(componentType);
            }
        }
        
        return mask;
    }

    /**
     * 生成缓存键
     * @param condition 查询条件
     * @returns 缓存键
     */
    private generateCacheKey(condition: QueryCondition): string {
        const typeNames = condition.componentTypes.map(t => t.name).sort().join(',');
        return `${condition.type}:${typeNames}`;
    }

    /**
     * 生成复合查询的缓存键
     * @param conditions 查询条件数组
     * @returns 缓存键
     */
    private generateComplexCacheKey(conditions: QueryCondition[]): string {
        const conditionKeys = conditions.map(c => this.generateCacheKey(c));
        return `complex:${conditionKeys.join('|')}`;
    }

    /**
     * 获取缓存结果
     * @param cacheKey 缓存键
     * @returns 缓存项或null
     */
    private getCachedResult(cacheKey: string): QueryCacheItem | null {
        const cached = this.queryCache.get(cacheKey);
        
        if (cached) {
            const now = Date.now();
            if (now - cached.lastUpdate < this.cacheTimeout) {
                cached.hitCount++;
                this.cacheHits++;
                return cached;
            } else {
                // 缓存过期，删除
                this.queryCache.delete(cacheKey);
            }
        }
        
        this.cacheMisses++;
        return null;
    }

    /**
     * 缓存查询结果
     * @param cacheKey 缓存键
     * @param entities 实体数组
     */
    private cacheResult(cacheKey: string, entities: Entity[]): void {
        // 如果缓存已满，删除最少使用的项
        if (this.queryCache.size >= this.maxCacheSize) {
            this.evictLeastUsedCache();
        }

        this.queryCache.set(cacheKey, {
            entities: entities.slice(), // 创建副本
            lastUpdate: Date.now(),
            hitCount: 0
        });
    }

    /**
     * 清空查询缓存
     */
    public clearCache(): void {
        this.queryCache.clear();
    }

    /**
     * 删除最少使用的缓存项
     */
    private evictLeastUsedCache(): void {
        let leastUsedKey = '';
        let minHitCount = Number.MAX_VALUE;

        for (const [key, item] of this.queryCache.entries()) {
            if (item.hitCount < minHitCount) {
                minHitCount = item.hitCount;
                leastUsedKey = key;
            }
        }

        if (leastUsedKey) {
            this.queryCache.delete(leastUsedKey);
        }
    }

    /**
     * 获取详细的查询统计信息
     */
    public getStats(): {
        entityCount: number;
        cacheSize: number;
        cacheHits: number;
        cacheMisses: number;
        hitRate: number;
        maxCacheSize: number;
        indexStats: {
            maskIndexSize: number;
            componentIndexSize: number;
            tagIndexSize: number;
            nameIndexSize: number;
        };
        performanceStats: QueryPerformanceStats;
    } {
        const totalQueries = this.cacheHits + this.cacheMisses;
        const hitRate = totalQueries > 0 ? this.cacheHits / totalQueries : 0;

        return {
            entityCount: this.entities.length,
            cacheSize: this.queryCache.size,
            cacheHits: this.cacheHits,
            cacheMisses: this.cacheMisses,
            hitRate,
            maxCacheSize: this.maxCacheSize,
            indexStats: {
                maskIndexSize: this.entityIndex.byMask.size,
                componentIndexSize: this.entityIndex.byComponentType.size,
                tagIndexSize: this.entityIndex.byTag.size,
                nameIndexSize: this.entityIndex.byName.size
            },
            performanceStats: { ...this.performanceStats }
        };
    }

    /**
     * 获取性能报告
     */
    public getPerformanceReport(): string {
        const stats = this.getStats();
        let report = '=== 查询系统性能报告 ===\n';
        
        report += `实体数量: ${stats.entityCount}\n`;
        report += `总查询次数: ${stats.performanceStats.totalQueries}\n`;
        report += `平均执行时间: ${stats.performanceStats.averageExecutionTime.toFixed(2)}ms\n`;
        report += `缓存命中率: ${(stats.performanceStats.cacheHitRate * 100).toFixed(1)}%\n`;
        report += `索引命中率: ${(stats.performanceStats.indexHitRate * 100).toFixed(1)}%\n`;
        
        report += '\n=== 索引统计 ===\n';
        report += `位掩码索引: ${stats.indexStats.maskIndexSize} 项\n`;
        report += `组件类型索引: ${stats.indexStats.componentIndexSize} 项\n`;
        report += `标签索引: ${stats.indexStats.tagIndexSize} 项\n`;
        report += `名称索引: ${stats.indexStats.nameIndexSize} 项\n`;
        
        if (stats.performanceStats.slowQueries.length > 0) {
            report += '\n=== 慢查询记录 ===\n';
            stats.performanceStats.slowQueries.slice(-10).forEach((query, index) => {
                const time = new Date(query.timestamp).toLocaleTimeString();
                report += `${index + 1}. ${query.query} (${time})\n`;
            });
        }
        
        return report;
    }

    /**
     * 优化索引配置
     */
    public optimizeIndexes(): void {
        // 根据查询模式优化索引更新频率
        if (this.performanceStats.totalQueries > 1000) {
            // 高频查询场景，降低索引更新阈值
            this.indexUpdateThreshold = 50;
        } else {
            // 低频查询场景，提高索引更新阈值
            this.indexUpdateThreshold = 200;
        }
        
        // 根据缓存命中率调整缓存大小
        if (this.performanceStats.cacheHitRate < 0.5 && this.maxCacheSize < 200) {
            this.maxCacheSize = Math.min(200, this.maxCacheSize * 1.5);
        } else if (this.performanceStats.cacheHitRate > 0.9 && this.maxCacheSize > 50) {
            this.maxCacheSize = Math.max(50, this.maxCacheSize * 0.8);
        }
    }

    /**
     * 批量查询多个条件
     * @param queries 查询条件数组
     * @returns 查询结果数组
     */
    public batchQuery(queries: QueryCondition[]): QueryResult[] {
        const startTime = performance.now();
        this.ensureIndexesUpdated();
        
        const results: QueryResult[] = [];
        
        for (const query of queries) {
            const result = this.query(query);
            results.push(result);
        }
        
        const totalTime = performance.now() - startTime;
        console.log(`批量查询 ${queries.length} 个条件，总耗时: ${totalTime.toFixed(2)}ms`);
        
        return results;
    }

    /**
     * 设置缓存配置
     * @param maxSize 最大缓存大小
     * @param timeout 缓存超时时间（毫秒）
     */
    public setCacheConfig(maxSize: number, timeout: number): void {
        this.maxCacheSize = maxSize;
        this.cacheTimeout = timeout;
    }

    /**
     * 重置统计信息
     */
    public resetStats(): void {
        this.cacheHits = 0;
        this.cacheMisses = 0;
        this.performanceStats = {
            totalQueries: 0,
            averageExecutionTime: 0,
            cacheHitRate: 0,
            indexHitRate: 0,
            slowQueries: []
        };
    }

    /**
     * 预热查询缓存
     * @param commonQueries 常用查询条件数组
     */
    public warmUpCache(commonQueries: QueryCondition[]): void {
        console.log('开始预热查询缓存...');
        const startTime = performance.now();
        
        for (const condition of commonQueries) {
            this.query(condition);
        }
        
        const endTime = performance.now();
        console.log(`缓存预热完成，耗时: ${(endTime - startTime).toFixed(2)}ms`);
    }

    /**
     * 获取实体变更监听器
     * @param condition 查询条件
     * @param callback 变更回调
     * @returns 取消监听的函数
     */
    public watchQuery(
        condition: QueryCondition,
        callback: (entities: Entity[], changeType: 'added' | 'removed' | 'updated') => void
    ): () => void {
        let lastResult = this.query(condition).entities;
        
        const checkChanges = () => {
            const currentResult = this.query(condition).entities;
            
            // 检查新增的实体
            const added = currentResult.filter(entity => !lastResult.includes(entity));
            if (added.length > 0) {
                callback(added, 'added');
            }
            
            // 检查移除的实体
            const removed = lastResult.filter(entity => !currentResult.includes(entity));
            if (removed.length > 0) {
                callback(removed, 'removed');
            }
            
            lastResult = currentResult;
        };
        
        // 使用定时器定期检查变更（实际项目中可能需要更高效的实现）
        const intervalId = setInterval(checkChanges, 100);
        
        return () => {
            clearInterval(intervalId);
        };
    }

    /**
     * 获取查询结果的快照
     * @param condition 查询条件
     * @returns 查询快照
     */
    public createSnapshot(condition: QueryCondition): {
        entities: Entity[];
        timestamp: number;
        condition: QueryCondition;
    } {
        const result = this.query(condition);
        return {
            entities: [...result.entities], // 创建副本
            timestamp: Date.now(),
            condition: { ...condition }
        };
    }

    /**
     * 比较两个查询快照
     * @param snapshot1 第一个快照
     * @param snapshot2 第二个快照
     * @returns 比较结果
     */
    public compareSnapshots(
        snapshot1: ReturnType<QuerySystem['createSnapshot']>,
        snapshot2: ReturnType<QuerySystem['createSnapshot']>
    ): {
        added: Entity[];
        removed: Entity[];
        unchanged: Entity[];
    } {
        const set1 = new Set(snapshot1.entities);
        const set2 = new Set(snapshot2.entities);
        
        const added = snapshot2.entities.filter(entity => !set1.has(entity));
        const removed = snapshot1.entities.filter(entity => !set2.has(entity));
        const unchanged = snapshot1.entities.filter(entity => set2.has(entity));
        
        return { added, removed, unchanged };
    }

    /**
     * 执行并行查询
     * @param conditions 查询条件数组
     * @returns Promise<查询结果数组>
     */
    public async parallelQuery(conditions: QueryCondition[]): Promise<QueryResult[]> {
        const promises = conditions.map(condition => 
            Promise.resolve(this.query(condition))
        );
        
        return Promise.all(promises);
    }

    /**
     * 获取查询建议
     * @param entities 实体数组
     * @returns 查询优化建议
     */
    public getQuerySuggestions(entities: Entity[]): string[] {
        const suggestions: string[] = [];
        
        // 分析组件使用频率
        const componentFrequency = new Map<ComponentType, number>();
        for (const entity of entities) {
            for (const component of entity.components) {
                const type = component.constructor as ComponentType;
                componentFrequency.set(type, (componentFrequency.get(type) || 0) + 1);
            }
        }
        
        // 建议基于高频组件的查询
        const sortedComponents = Array.from(componentFrequency.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
        
        for (const [componentType, count] of sortedComponents) {
            suggestions.push(`考虑为组件 ${componentType.name} 创建专门的查询（使用频率: ${count}）`);
        }
        
        // 建议缓存配置
        if (this.performanceStats.cacheHitRate < 0.5) {
            suggestions.push('缓存命中率较低，考虑增加缓存大小或调整缓存策略');
        }
        
        // 建议索引优化
        if (this.performanceStats.indexHitRate < 0.7) {
            suggestions.push('索引命中率较低，考虑重建索引或优化查询条件');
        }
        
        return suggestions;
    }

    /**
     * 导出查询统计数据
     * @returns 统计数据的JSON字符串
     */
    public exportStats(): string {
        const stats = this.getStats();
        return JSON.stringify(stats, null, 2);
    }

    /**
     * 导入查询统计数据
     * @param statsJson 统计数据的JSON字符串
     */
    public importStats(statsJson: string): void {
        try {
            const stats = JSON.parse(statsJson);
            this.cacheHits = stats.cacheHits || 0;
            this.cacheMisses = stats.cacheMisses || 0;
            this.performanceStats = stats.performanceStats || this.performanceStats;
        } catch (error) {
            console.error('导入统计数据失败:', error);
        }
    }
}

/**
 * 流式查询构建器
 * 提供链式调用的查询API
 */
export class QueryBuilder {
    private conditions: QueryCondition[] = [];
    private querySystem: QuerySystem;

    constructor(querySystem: QuerySystem) {
        this.querySystem = querySystem;
    }

    /**
     * 添加"包含所有"条件
     * @param componentTypes 组件类型
     * @returns 查询构建器
     */
    public withAll(...componentTypes: ComponentType[]): QueryBuilder {
        this.conditions.push({
            type: QueryConditionType.ALL,
            componentTypes,
            mask: this.createMask(componentTypes)
        });
        return this;
    }

    /**
     * 添加"包含任意"条件
     * @param componentTypes 组件类型
     * @returns 查询构建器
     */
    public withAny(...componentTypes: ComponentType[]): QueryBuilder {
        this.conditions.push({
            type: QueryConditionType.ANY,
            componentTypes,
            mask: this.createMask(componentTypes)
        });
        return this;
    }

    /**
     * 添加"不包含"条件
     * @param componentTypes 组件类型
     * @returns 查询构建器
     */
    public without(...componentTypes: ComponentType[]): QueryBuilder {
        this.conditions.push({
            type: QueryConditionType.NONE,
            componentTypes,
            mask: this.createMask(componentTypes)
        });
        return this;
    }

    /**
     * 执行查询
     * @returns 查询结果
     */
    public execute(): QueryResult {
        let result: QueryResult;

        if (this.conditions.length === 0) {
            // 如果没有组件条件，但有其他过滤条件
            if (this.tagFilter !== undefined) {
                result = this.querySystem.queryByTag(this.tagFilter);
            } else if (this.nameFilter !== undefined) {
                result = this.querySystem.queryByName(this.nameFilter);
            } else {
                return {
                    entities: [],
                    count: 0,
                    executionTime: 0,
                    fromCache: false
                };
            }
        } else if (this.conditions.length === 1) {
            // 单条件查询，使用优化路径
            const condition = this.conditions[0];
            switch (condition.type) {
                case QueryConditionType.ALL:
                    result = this.querySystem.queryAll(...condition.componentTypes);
                    break;
                case QueryConditionType.ANY:
                    result = this.querySystem.queryAny(...condition.componentTypes);
                    break;
                case QueryConditionType.NONE:
                    result = this.querySystem.queryNone(...condition.componentTypes);
                    break;
                default:
                    return {
                        entities: [],
                        count: 0,
                        executionTime: 0,
                        fromCache: false
                    };
            }
        } else {
            // 多条件查询
            result = this.querySystem.queryComplex(...this.conditions);
        }

        // 应用额外的过滤条件
        let entities = result.entities;

        // 标签过滤
        if (this.tagFilter !== undefined) {
            entities = entities.filter(entity => entity.tag === this.tagFilter);
        }

        // 名称过滤
        if (this.nameFilter !== undefined) {
            entities = entities.filter(entity => entity.name === this.nameFilter);
        }

        // 排序
        if (this.sortFunction) {
            entities = [...entities].sort(this.sortFunction);
        }

        // 偏移
        if (this.offsetCount !== undefined && this.offsetCount > 0) {
            entities = entities.slice(this.offsetCount);
        }

        // 限制
        if (this.limitCount !== undefined && this.limitCount > 0) {
            entities = entities.slice(0, this.limitCount);
        }

        return {
            entities,
            count: entities.length,
            executionTime: result.executionTime,
            fromCache: result.fromCache
        };
    }

    /**
     * 获取第一个匹配的实体
     * @returns 实体或null
     */
    public first(): Entity | null {
        const result = this.execute();
        return result.entities.length > 0 ? result.entities[0] : null;
    }

    /**
     * 检查是否有匹配的实体
     * @returns 是否有匹配
     */
    public any(): boolean {
        const result = this.execute();
        return result.count > 0;
    }

    /**
     * 获取匹配实体的数量
     * @returns 实体数量
     */
    public count(): number {
        const result = this.execute();
        return result.count;
    }

    /**
     * 对每个匹配的实体执行操作
     * @param callback 回调函数
     */
    public forEach(callback: (entity: Entity, index: number) => void): void {
        const result = this.execute();
        result.entities.forEach(callback);
    }

    /**
     * 转换为数组
     * @returns 实体数组
     */
    public toArray(): Entity[] {
        const result = this.execute();
        return result.entities;
    }

    /**
     * 创建组件类型的位掩码
     * @param componentTypes 组件类型数组
     * @returns 位掩码
     */
    private createMask(componentTypes: ComponentType[]): bigint {
        let mask = BigInt(0);
        
        for (const componentType of componentTypes) {
            if (ComponentRegistry.isRegistered(componentType)) {
                mask |= ComponentRegistry.getBitMask(componentType);
            }
        }
        
        return mask;
    }

    /**
     * 重置查询条件
     * @returns 查询构建器
     */
    public reset(): QueryBuilder {
        this.conditions.length = 0;
        this.tagFilter = undefined;
        this.nameFilter = undefined;
        this.limitCount = undefined;
        this.offsetCount = undefined;
        this.sortFunction = undefined;
        return this;
    }

    // 过滤条件
    private tagFilter?: number;
    private nameFilter?: string;
    private limitCount?: number;
    private offsetCount?: number;
    private sortFunction?: (a: Entity, b: Entity) => number;

    /**
     * 添加标签过滤条件
     * @param tag 标签
     * @returns 查询构建器实例
     */
    public withTag(tag: number): QueryBuilder {
        this.tagFilter = tag;
        return this;
    }

    /**
     * 添加名称过滤条件
     * @param name 名称
     * @returns 查询构建器实例
     */
    public withName(name: string): QueryBuilder {
        this.nameFilter = name;
        return this;
    }

    /**
     * 限制结果数量
     * @param limit 最大结果数量
     * @returns 查询构建器实例
     */
    public limit(limit: number): QueryBuilder {
        this.limitCount = limit;
        return this;
    }

    /**
     * 跳过指定数量的结果
     * @param offset 跳过的数量
     * @returns 查询构建器实例
     */
    public offset(offset: number): QueryBuilder {
        this.offsetCount = offset;
        return this;
    }

    /**
     * 对结果进行排序
     * @param compareFn 比较函数
     * @returns 查询构建器实例
     */
    public orderBy(compareFn: (a: Entity, b: Entity) => number): QueryBuilder {
        this.sortFunction = compareFn;
        return this;
    }

    /**
     * 按更新顺序排序
     * @returns 查询构建器实例
     */
    public orderByUpdateOrder(): QueryBuilder {
        return this.orderBy((a, b) => a.updateOrder - b.updateOrder);
    }

    /**
     * 按ID排序
     * @returns 查询构建器实例
     */
    public orderById(): QueryBuilder {
        return this.orderBy((a, b) => a.id - b.id);
    }

    /**
     * 按名称排序
     * @returns 查询构建器实例
     */
    public orderByName(): QueryBuilder {
        return this.orderBy((a, b) => a.name.localeCompare(b.name));
    }

    /**
     * 克隆查询构建器
     * @returns 新的查询构建器
     */
    public clone(): QueryBuilder {
        const newBuilder = new QueryBuilder(this.querySystem);
        newBuilder.conditions = this.conditions.map(c => ({ ...c }));
        newBuilder.tagFilter = this.tagFilter;
        newBuilder.nameFilter = this.nameFilter;
        newBuilder.limitCount = this.limitCount;
        newBuilder.offsetCount = this.offsetCount;
        newBuilder.sortFunction = this.sortFunction;
        return newBuilder;
    }

    /**
     * 添加自定义过滤器
     * @param predicate 过滤谓词
     * @returns 查询构建器实例
     */
    public filter(predicate: (entity: Entity) => boolean): QueryBuilder {
        const originalExecute = this.execute.bind(this);
        this.execute = () => {
            const result = originalExecute();
            const filteredEntities = result.entities.filter(predicate);
            return {
                ...result,
                entities: filteredEntities,
                count: filteredEntities.length
            };
        };
        return this;
    }

    /**
     * 映射查询结果
     * @param mapper 映射函数
     * @returns 映射后的结果数组
     */
    public map<T>(mapper: (entity: Entity) => T): T[] {
        const result = this.execute();
        return result.entities.map(mapper);
    }

    /**
     * 查找第一个满足条件的实体
     * @param predicate 查找谓词
     * @returns 实体或null
     */
    public find(predicate?: (entity: Entity) => boolean): Entity | null {
        const result = this.execute();
        if (predicate) {
            return result.entities.find(predicate) || null;
        }
        return result.entities[0] || null;
    }

    /**
     * 检查是否所有实体都满足条件
     * @param predicate 检查谓词
     * @returns 是否所有实体都满足条件
     */
    public every(predicate: (entity: Entity) => boolean): boolean {
        const result = this.execute();
        return result.entities.every(predicate);
    }

    /**
     * 检查是否有实体满足条件
     * @param predicate 检查谓词
     * @returns 是否有实体满足条件
     */
    public some(predicate: (entity: Entity) => boolean): boolean {
        const result = this.execute();
        return result.entities.some(predicate);
    }

    /**
     * 获取查询的调试信息
     * @returns 调试信息字符串
     */
    public getDebugInfo(): string {
        let info = '=== 查询构建器调试信息 ===\n';
        
        if (this.conditions.length > 0) {
            info += '组件条件:\n';
            this.conditions.forEach((condition, index) => {
                const typeNames = condition.componentTypes.map(t => t.name).join(', ');
                info += `  ${index + 1}. ${condition.type}: [${typeNames}]\n`;
            });
        }
        
        if (this.tagFilter !== undefined) {
            info += `标签过滤: ${this.tagFilter}\n`;
        }
        
        if (this.nameFilter !== undefined) {
            info += `名称过滤: ${this.nameFilter}\n`;
        }
        
        if (this.limitCount !== undefined) {
            info += `限制数量: ${this.limitCount}\n`;
        }
        
        if (this.offsetCount !== undefined) {
            info += `偏移量: ${this.offsetCount}\n`;
        }
        
        if (this.sortFunction) {
            info += '已设置排序函数\n';
        }
        
        return info;
    }
} 