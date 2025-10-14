import { Entity } from '../Entity';
import { Component } from '../Component';
import { ComponentRegistry, ComponentType } from './ComponentStorage';
import { BitMask64Utils, BitMask64Data } from '../Utils/BigIntCompatibility';
import { createLogger } from '../../Utils/Logger';
import { getComponentTypeName } from '../Decorators';
import { Archetype, ArchetypeSystem } from './ArchetypeSystem';
import { ComponentTypeManager } from "../Utils";
import { ReactiveQuery, ReactiveQueryConfig } from './ReactiveQuery';

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
 * 查询条件接口
 */
export interface QueryCondition {
    type: QueryConditionType;
    componentTypes: ComponentType[];
    mask: BitMask64Data;
}

/**
 * 实体查询结果接口
 */
export interface QueryResult {
    entities: readonly Entity[];
    count: number;
    /** 查询执行时间（毫秒） */
    executionTime: number;
    /** 是否来自缓存 */
    fromCache: boolean;
}

/**
 * 实体索引结构
 */
interface EntityIndex {
    byTag: Map<number, Set<Entity>>;
    byName: Map<string, Set<Entity>>;
}

/**
 * 查询缓存条目
 */
interface QueryCacheEntry {
    entities: readonly Entity[];
    timestamp: number;
    hitCount: number;
    version: number;
}

/**
 * 高性能实体查询系统
 * 
 * 提供快速的实体查询功能，支持按组件类型、标签、名称等多种方式查询实体。
 * 
 * @example
 * ```typescript
 * // 查询所有包含Position和Velocity组件的实体
 * const movingEntities = querySystem.queryAll(PositionComponent, VelocityComponent);
 * 
 * // 查询特定标签的实体
 * const playerEntities = querySystem.queryByTag(PLAYER_TAG);
 * ```
 */
export class QuerySystem {
    private _logger = createLogger('QuerySystem');
    private entities: Entity[] = [];
    private entityIndex: EntityIndex;

    private _version = 0;

    private queryCache = new Map<string, QueryCacheEntry>();
    private cacheMaxSize = 1000;
    private cacheTimeout = 5000;

    private componentMaskCache = new Map<string, BitMask64Data>();

    private archetypeSystem: ArchetypeSystem;

    private queryStats = {
        totalQueries: 0,
        cacheHits: 0,
        indexHits: 0,
        linearScans: 0,
        archetypeHits: 0,
        dirtyChecks: 0
    };

    private resultArrayPool: Entity[][] = [];
    private poolMaxSize = 50;

    constructor() {
        this.entityIndex = {
            byTag: new Map(),
            byName: new Map()
        };

        this.archetypeSystem = new ArchetypeSystem();
    }

    private acquireResultArray(): Entity[] {
        if (this.resultArrayPool.length > 0) {
            return this.resultArrayPool.pop()!;
        }
        return [];
    }

    private releaseResultArray(array: Entity[]): void {
        if (this.resultArrayPool.length < this.poolMaxSize) {
            array.length = 0;
            this.resultArrayPool.push(array);
        }
    }

    /**
     * 设置实体列表并重建索引
     *
     * 当实体集合发生大规模变化时调用此方法。
     * 系统将重新构建所有索引以确保查询性能。
     *
     * @param entities 新的实体列表
     */
    public setEntities(entities: Entity[]): void {
        this.entities = entities;
        this.clearQueryCache();
        this.clearReactiveQueries();
        this.rebuildIndexes();
    }

    /**
     * 添加单个实体到查询系统
     * 
     * 将新实体添加到查询系统中，并自动更新相关索引。
     * 为了提高批量添加性能，可以延迟缓存清理。
     * 
     * @param entity 要添加的实体
     * @param deferCacheClear 是否延迟缓存清理（用于批量操作）
     */
    public addEntity(entity: Entity, deferCacheClear: boolean = false): void {
        if (!this.entities.includes(entity)) {
            this.entities.push(entity);
            this.addEntityToIndexes(entity);

            this.archetypeSystem.addEntity(entity);

            // 通知响应式查询
            this.notifyReactiveQueriesEntityAdded(entity);

            // 只有在非延迟模式下才立即清理缓存
            if (!deferCacheClear) {
                this.clearQueryCache();
            }

            // 更新版本号
            this._version++;
        }
    }

    /**
     * 批量添加实体
     * 
     * 高效地批量添加多个实体，减少缓存清理次数。
     * 使用Set来避免O(n)的重复检查。
     * 
     * @param entities 要添加的实体列表
     */
    public addEntities(entities: Entity[]): void {
        if (entities.length === 0) return;

        // 使用Set来快速检查重复
        const existingIds = new Set(this.entities.map(e => e.id));
        let addedCount = 0;

        for (const entity of entities) {
            if (!existingIds.has(entity.id)) {
                this.entities.push(entity);
                this.addEntityToIndexes(entity);

                // 更新索引管理器
                this.archetypeSystem.addEntity(entity);

                existingIds.add(entity.id);
                addedCount++;
            }
        }

        // 只在有实体被添加时才清理缓存
        if (addedCount > 0) {
            this.clearQueryCache();
        }
    }

    /**
     * 批量添加实体（无重复检查版本）
     * 
     * 假设所有实体都是新的，跳过重复检查以获得最大性能。
     * 仅在确保没有重复实体时使用。
     * 
     * @param entities 要添加的实体列表
     */
    public addEntitiesUnchecked(entities: Entity[]): void {
        if (entities.length === 0) return;

        // 避免调用栈溢出，分批添加
        for (const entity of entities) {
            this.entities.push(entity);
        }

        // 批量更新索引
        for (const entity of entities) {
            this.addEntityToIndexes(entity);

            // 更新索引管理器
            this.archetypeSystem.addEntity(entity);
        }

        // 清理缓存
        this.clearQueryCache();
    }

    /**
     * 从查询系统移除实体
     *
     * 从查询系统中移除指定实体，并清理相关索引。
     *
     * @param entity 要移除的实体
     */
    public removeEntity(entity: Entity): void {
        const index = this.entities.indexOf(entity);
        if (index !== -1) {
            const componentTypes: ComponentType[] = [];
            for (const component of entity.components) {
                componentTypes.push(component.constructor as ComponentType);
            }

            this.entities.splice(index, 1);
            this.removeEntityFromIndexes(entity);

            this.archetypeSystem.removeEntity(entity);

            if (componentTypes.length > 0) {
                this.notifyReactiveQueriesEntityRemoved(entity, componentTypes);
            } else {
                this.notifyReactiveQueriesEntityRemovedFallback(entity);
            }

            this.clearQueryCache();

            this._version++;
        }
    }

    /**
     * 更新实体在查询系统中的索引
     *
     * 当实体的组件组合发生变化时调用此方法，高效地更新实体在查询系统中的索引。
     *
     * @param entity 要更新的实体
     */
    public updateEntity(entity: Entity): void {
        // 检查实体是否在查询系统中
        if (!this.entities.includes(entity)) {
            // 如果实体不在系统中，直接添加
            this.addEntity(entity);
            return;
        }

        // 先从索引中移除实体的旧状态
        this.removeEntityFromIndexes(entity);

        // 更新ArchetypeSystem中的实体状态
        this.archetypeSystem.updateEntity(entity);
        // 重新添加实体到索引（基于新的组件状态）
        this.addEntityToIndexes(entity);

        // 通知响应式查询
        this.notifyReactiveQueriesEntityChanged(entity);

        // 清理查询缓存，因为实体组件状态已改变
        this.clearQueryCache();

        // 更新版本号以使缓存失效
        this._version++;
    }

    /**
     * 将实体添加到各种索引中
     */
    private addEntityToIndexes(entity: Entity): void {
        // 标签索引
        const tag = entity.tag;
        if (tag !== undefined) {
            const tagSet = this.entityIndex.byTag.get(tag) || this.createAndSetTagIndex(tag);
            tagSet.add(entity);
        }

        // 名称索引
        const name = entity.name;
        if (name) {
            const nameSet = this.entityIndex.byName.get(name) || this.createAndSetNameIndex(name);
            nameSet.add(entity);
        }
    }


    private createAndSetTagIndex(tag: number): Set<Entity> {
        const set = new Set<Entity>();
        this.entityIndex.byTag.set(tag, set);
        return set;
    }

    private createAndSetNameIndex(name: string): Set<Entity> {
        const set = new Set<Entity>();
        this.entityIndex.byName.set(name, set);
        return set;
    }

    /**
     * 从各种索引中移除实体
     */
    private removeEntityFromIndexes(entity: Entity): void {
        // 从标签索引移除
        if (entity.tag !== undefined) {
            const tagSet = this.entityIndex.byTag.get(entity.tag);
            if (tagSet) {
                tagSet.delete(entity);
                if (tagSet.size === 0) {
                    this.entityIndex.byTag.delete(entity.tag);
                }
            }
        }

        // 从名称索引移除
        if (entity.name) {
            const nameSet = this.entityIndex.byName.get(entity.name);
            if (nameSet) {
                nameSet.delete(entity);
                if (nameSet.size === 0) {
                    this.entityIndex.byName.delete(entity.name);
                }
            }
        }
    }

    /**
     * 重建所有索引
     *
     * 清空并重新构建所有查询索引。
     * 通常在大量实体变更后调用以确保索引一致性。
     */
    private rebuildIndexes(): void {
        this.entityIndex.byTag.clear();
        this.entityIndex.byName.clear();

        // 清理ArchetypeSystem和ComponentIndexManager
        this.archetypeSystem.clear();

        for (const entity of this.entities) {
            this.addEntityToIndexes(entity);
            this.archetypeSystem.addEntity(entity);
        }
    }

    /**
     * 查询包含所有指定组件的实体
     *
     * 返回同时包含所有指定组件类型的实体列表。
     * 内部使用响应式查询作为智能缓存,自动跟踪实体变化,性能更优。
     *
     * @param componentTypes 要查询的组件类型列表
     * @returns 查询结果，包含匹配的实体和性能信息
     *
     * @example
     * ```typescript
     * // 查询同时具有位置和速度组件的实体
     * const result = querySystem.queryAll(PositionComponent, VelocityComponent);
     * logger.info(`找到 ${result.count} 个移动实体`);
     * ```
     */
    public queryAll(...componentTypes: ComponentType[]): QueryResult {
        const startTime = performance.now();
        this.queryStats.totalQueries++;

        // 使用内部响应式查询作为智能缓存
        const reactiveQuery = this.getOrCreateReactiveQuery(QueryConditionType.ALL, componentTypes);

        // 从响应式查询获取结果(永远是最新的)
        const entities = reactiveQuery.getEntities();

        // 统计为缓存命中(响应式查询本质上是永不过期的智能缓存)
        this.queryStats.cacheHits++;

        return {
            entities,
            count: entities.length,
            executionTime: performance.now() - startTime,
            fromCache: true
        };
    }

    /**
     * 多组件查询算法
     * 
     * 针对多组件查询场景的高效算法实现。
     * 通过选择最小的组件集合作为起点，减少需要检查的实体数量。
     * 
     * @param componentTypes 组件类型列表
     * @returns 匹配的实体列表
     */
    private queryMultipleComponents(componentTypes: ComponentType[]): Entity[] {
        const archetypeResult = this.archetypeSystem.queryArchetypes(componentTypes, 'AND');
        const result: Entity[] = [];

        for (const archetype of archetypeResult.archetypes) {
            for (const entity of archetype.entities) {
                result.push(entity);
            }
        }

        return result;
    }



    /**
     * 查询包含任意指定组件的实体
     *
     * 返回包含任意一个指定组件类型的实体列表。
     * 内部使用响应式查询作为智能缓存,自动跟踪实体变化,性能更优。
     *
     * @param componentTypes 要查询的组件类型列表
     * @returns 查询结果，包含匹配的实体和性能信息
     *
     * @example
     * ```typescript
     * // 查询具有武器或护甲组件的实体
     * const result = querySystem.queryAny(WeaponComponent, ArmorComponent);
     * logger.info(`找到 ${result.count} 个装备实体`);
     * ```
     */
    public queryAny(...componentTypes: ComponentType[]): QueryResult {
        const startTime = performance.now();
        this.queryStats.totalQueries++;

        // 使用内部响应式查询作为智能缓存
        const reactiveQuery = this.getOrCreateReactiveQuery(QueryConditionType.ANY, componentTypes);

        // 从响应式查询获取结果(永远是最新的)
        const entities = reactiveQuery.getEntities();

        // 统计为缓存命中(响应式查询本质上是永不过期的智能缓存)
        this.queryStats.cacheHits++;

        return {
            entities,
            count: entities.length,
            executionTime: performance.now() - startTime,
            fromCache: true
        };
    }

    /**
     * 查询不包含任何指定组件的实体
     *
     * 返回不包含任何指定组件类型的实体列表。
     * 内部使用响应式查询作为智能缓存,自动跟踪实体变化,性能更优。
     *
     * @param componentTypes 要排除的组件类型列表
     * @returns 查询结果，包含匹配的实体和性能信息
     *
     * @example
     * ```typescript
     * // 查询不具有AI和玩家控制组件的实体（如静态物体）
     * const result = querySystem.queryNone(AIComponent, PlayerControlComponent);
     * logger.info(`找到 ${result.count} 个静态实体`);
     * ```
     */
    public queryNone(...componentTypes: ComponentType[]): QueryResult {
        const startTime = performance.now();
        this.queryStats.totalQueries++;

        // 使用内部响应式查询作为智能缓存
        const reactiveQuery = this.getOrCreateReactiveQuery(QueryConditionType.NONE, componentTypes);

        // 从响应式查询获取结果(永远是最新的)
        const entities = reactiveQuery.getEntities();

        // 统计为缓存命中(响应式查询本质上是永不过期的智能缓存)
        this.queryStats.cacheHits++;

        return {
            entities,
            count: entities.length,
            executionTime: performance.now() - startTime,
            fromCache: true
        };
    }

    /**
     * 按标签查询实体
     * 
     * 返回具有指定标签的所有实体。
     * 标签查询使用专用索引，具有很高的查询性能。
     * 
     * @param tag 要查询的标签值
     * @returns 查询结果，包含匹配的实体和性能信息
     * 
     * @example
     * ```typescript
     * // 查询所有玩家实体
     * const players = querySystem.queryByTag(PLAYER_TAG);
     * ```
     */
    public queryByTag(tag: number): QueryResult {
        const startTime = performance.now();
        this.queryStats.totalQueries++;

        const cacheKey = `tag:${tag}`;

        // 检查缓存
        const cached = this.getFromCache(cacheKey);
        if (cached) {
            this.queryStats.cacheHits++;
            return {
                entities: cached,
                count: cached.length,
                executionTime: performance.now() - startTime,
                fromCache: true
            };
        }

        // 使用索引查询
        this.queryStats.indexHits++;
        const entities = Array.from(this.entityIndex.byTag.get(tag) || []);

        // 缓存结果
        this.addToCache(cacheKey, entities);

        return {
            entities,
            count: entities.length,
            executionTime: performance.now() - startTime,
            fromCache: false
        };
    }

    /**
     * 按名称查询实体
     * 
     * 返回具有指定名称的所有实体。
     * 名称查询使用专用索引，适用于查找特定的命名实体。
     * 
     * @param name 要查询的实体名称
     * @returns 查询结果，包含匹配的实体和性能信息
     * 
     * @example
     * ```typescript
     * // 查找名为"Player"的实体
     * const player = querySystem.queryByName("Player");
     * ```
     */
    public queryByName(name: string): QueryResult {
        const startTime = performance.now();
        this.queryStats.totalQueries++;

        const cacheKey = `name:${name}`;

        // 检查缓存
        const cached = this.getFromCache(cacheKey);
        if (cached) {
            this.queryStats.cacheHits++;
            return {
                entities: cached,
                count: cached.length,
                executionTime: performance.now() - startTime,
                fromCache: true
            };
        }

        // 使用索引查询
        this.queryStats.indexHits++;
        const entities = Array.from(this.entityIndex.byName.get(name) || []);

        // 缓存结果
        this.addToCache(cacheKey, entities);

        return {
            entities,
            count: entities.length,
            executionTime: performance.now() - startTime,
            fromCache: false
        };
    }

    /**
     * 按单个组件类型查询实体
     * 
     * 返回包含指定组件类型的所有实体。
     * 这是最基础的查询方法，具有最高的查询性能。
     * 
     * @param componentType 要查询的组件类型
     * @returns 查询结果，包含匹配的实体和性能信息
     * 
     * @example
     * ```typescript
     * // 查询所有具有位置组件的实体
     * const entitiesWithPosition = querySystem.queryByComponent(PositionComponent);
     * ```
     */
    public queryByComponent<T extends Component>(componentType: ComponentType<T>): QueryResult {
        const startTime = performance.now();
        this.queryStats.totalQueries++;

        const cacheKey = this.generateCacheKey('component', [componentType]);

        // 检查缓存
        const cached = this.getFromCache(cacheKey);
        if (cached) {
            this.queryStats.cacheHits++;
            return {
                entities: cached,
                count: cached.length,
                executionTime: performance.now() - startTime,
                fromCache: true
            };
        }

        this.queryStats.indexHits++;
        const entities = this.archetypeSystem.getEntitiesByComponent(componentType);

        // 缓存结果
        this.addToCache(cacheKey, entities);

        return {
            entities,
            count: entities.length,
            executionTime: performance.now() - startTime,
            fromCache: false
        };
    }

    /**
     * 从缓存获取查询结果
     */
    private getFromCache(cacheKey: string): readonly Entity[] | null {
        const entry = this.queryCache.get(cacheKey);
        if (!entry) return null;

        // 检查缓存是否过期或版本过期
        if (Date.now() - entry.timestamp > this.cacheTimeout || entry.version !== this._version) {
            this.queryCache.delete(cacheKey);
            return null;
        }

        entry.hitCount++;
        return entry.entities;
    }

    /**
     * 添加查询结果到缓存
     */
    private addToCache(cacheKey: string, entities: Entity[]): void {
        // 如果缓存已满，清理最少使用的条目
        if (this.queryCache.size >= this.cacheMaxSize) {
            this.cleanupCache();
        }

        this.queryCache.set(cacheKey, {
            entities: entities, // 直接使用引用，通过版本号控制失效
            timestamp: Date.now(),
            hitCount: 0,
            version: this._version
        });
    }

    /**
     * 清理缓存
     */
    private cleanupCache(): void {
        // 移除过期的缓存条目
        const now = Date.now();
        for (const [key, entry] of this.queryCache.entries()) {
            if (now - entry.timestamp > this.cacheTimeout) {
                this.queryCache.delete(key);
            }
        }

        // 如果还是太满，移除最少使用的条目
        if (this.queryCache.size >= this.cacheMaxSize) {
            let minHitCount = Infinity;
            let oldestKey = '';
            let oldestTimestamp = Infinity;

            // 单次遍历找到最少使用或最旧的条目
            for (const [key, entry] of this.queryCache.entries()) {
                if (entry.hitCount < minHitCount ||
                    (entry.hitCount === minHitCount && entry.timestamp < oldestTimestamp)) {
                    minHitCount = entry.hitCount;
                    oldestKey = key;
                    oldestTimestamp = entry.timestamp;
                }
            }

            if (oldestKey) {
                this.queryCache.delete(oldestKey);
            }
        }
    }

    /**
     * 清除所有查询缓存
     */
    private clearQueryCache(): void {
        this.queryCache.clear();
        this.componentMaskCache.clear();
    }

    /**
     * 清除所有响应式查询
     *
     * 销毁所有响应式查询实例并清理索引
     * 通常在setEntities时调用以确保缓存一致性
     */
    private clearReactiveQueries(): void {
        for (const query of this._reactiveQueries.values()) {
            query.dispose();
        }
        this._reactiveQueries.clear();
        this._reactiveQueriesByComponent.clear();
    }

    /**
     * 高效的缓存键生成
     */
    private generateCacheKey(prefix: string, componentTypes: ComponentType[]): string {
        // 快速路径：单组件查询
        if (componentTypes.length === 1) {
            const name = getComponentTypeName(componentTypes[0]);
            return `${prefix}:${name}`;
        }

        // 多组件查询：使用排序后的类型名称创建键
        const sortKey = componentTypes.map(t => {
            const name = getComponentTypeName(t);
            return name;
        }).sort().join(',');

        const fullKey = `${prefix}:${sortKey}`;

        return fullKey;
    }

    /**
     * 清理查询缓存
     *
     * 用于外部调用清理缓存，通常在批量操作后使用。
     * 注意:此方法也会清理响应式查询缓存
     */
    public clearCache(): void {
        this.clearQueryCache();
        this.clearReactiveQueries();
    }

    /**
     * 创建响应式查询
     *
     * 响应式查询会自动跟踪实体/组件的变化,并通过事件通知订阅者。
     * 适合需要实时响应实体变化的场景(如UI更新、AI系统等)。
     *
     * @param componentTypes 查询的组件类型列表
     * @param config 可选的查询配置
     * @returns 响应式查询实例
     *
     * @example
     * ```typescript
     * const query = querySystem.createReactiveQuery([Position, Velocity], {
     *     enableBatchMode: true,
     *     batchDelay: 16
     * });
     *
     * query.subscribe((change) => {
     *     if (change.type === ReactiveQueryChangeType.ADDED) {
     *         console.log('新实体:', change.entity);
     *     }
     * });
     * ```
     */
    public createReactiveQuery(
        componentTypes: ComponentType[],
        config?: ReactiveQueryConfig
    ): ReactiveQuery {
        if (!componentTypes || componentTypes.length === 0) {
            throw new Error('组件类型列表不能为空');
        }

        const mask = this.createComponentMask(componentTypes);
        const condition: QueryCondition = {
            type: QueryConditionType.ALL,
            componentTypes,
            mask
        };

        const query = new ReactiveQuery(condition, config);

        const initialEntities = this.executeTraditionalQuery(
            QueryConditionType.ALL,
            componentTypes
        );
        query.initializeWith(initialEntities);

        const cacheKey = this.generateCacheKey('all', componentTypes);
        this._reactiveQueries.set(cacheKey, query);

        for (const type of componentTypes) {
            let queries = this._reactiveQueriesByComponent.get(type);
            if (!queries) {
                queries = new Set();
                this._reactiveQueriesByComponent.set(type, queries);
            }
            queries.add(query);
        }

        return query;
    }

    /**
     * 销毁响应式查询
     *
     * 清理查询占用的资源,包括监听器和实体引用。
     * 销毁后的查询不应再被使用。
     *
     * @param query 要销毁的响应式查询
     *
     * @example
     * ```typescript
     * const query = querySystem.createReactiveQuery([Position, Velocity]);
     * // ... 使用查询
     * querySystem.destroyReactiveQuery(query);
     * ```
     */
    public destroyReactiveQuery(query: ReactiveQuery): void {
        if (!query) {
            return;
        }

        const cacheKey = query.id;
        this._reactiveQueries.delete(cacheKey);

        for (const type of query.condition.componentTypes) {
            const queries = this._reactiveQueriesByComponent.get(type);
            if (queries) {
                queries.delete(query);
                if (queries.size === 0) {
                    this._reactiveQueriesByComponent.delete(type);
                }
            }
        }

        query.dispose();
    }

    /**
     * 创建组件掩码
     *
     * 根据组件类型列表生成对应的位掩码。
     * 使用缓存避免重复计算。
     * 注意:必须使用ComponentRegistry来确保与Entity.componentMask使用相同的bitIndex
     *
     * @param componentTypes 组件类型列表
     * @returns 生成的位掩码
     */
    private createComponentMask(componentTypes: ComponentType[]): BitMask64Data {
        // 生成缓存键
        const cacheKey = componentTypes.map(t => {
            return getComponentTypeName(t);
        }).sort().join(',');

        // 检查缓存
        const cached = this.componentMaskCache.get(cacheKey);
        if (cached) {
            return cached;
        }

        // 使用ComponentRegistry而不是ComponentTypeManager,确保bitIndex一致
        let mask = BitMask64Utils.clone(BitMask64Utils.ZERO);
        for (const type of componentTypes) {
            // 确保组件已注册
            if (!ComponentRegistry.isRegistered(type)) {
                ComponentRegistry.register(type);
            }
            const bitMask = ComponentRegistry.getBitMask(type);
            BitMask64Utils.orInPlace(mask, bitMask);
        }

        // 缓存结果
        this.componentMaskCache.set(cacheKey, mask);
        return mask;
    }

    /**
     * 获取当前版本号（用于缓存失效）
     */
    public get version(): number {
        return this._version;
    }
    
    /**
     * 获取所有实体
     */
    public getAllEntities(): readonly Entity[] {
        return this.entities;
    }
    
    /**
     * 获取系统统计信息
     * 
     * 返回查询系统的详细统计信息，包括实体数量、索引状态、
     * 查询性能统计等，用于性能监控和调试。
     * 
     * @returns 系统统计信息对象
     */
    public getStats(): {
        entityCount: number;
        indexStats: {
            componentIndexSize: number;
            tagIndexSize: number;
            nameIndexSize: number;
        };
        queryStats: {
            totalQueries: number;
            cacheHits: number;
            indexHits: number;
            linearScans: number;
            archetypeHits: number;
            dirtyChecks: number;
            cacheHitRate: string;
        };
        optimizationStats: {
            archetypeSystem: any;
        };
        cacheStats: {
            size: number;
            hitRate: string;
        };
    } {
        return {
            entityCount: this.entities.length,
            indexStats: {
                componentIndexSize: this.archetypeSystem.getAllArchetypes().length,
                tagIndexSize: this.entityIndex.byTag.size,
                nameIndexSize: this.entityIndex.byName.size
            },
            queryStats: {
                ...this.queryStats,
                cacheHitRate: this.queryStats.totalQueries > 0 ?
                    (this.queryStats.cacheHits / this.queryStats.totalQueries * 100).toFixed(2) + '%' : '0%'
            },
            optimizationStats: {
                archetypeSystem: this.archetypeSystem.getAllArchetypes().map(a => ({
                    id: a.id,
                    componentTypes: a.componentTypes.map(t => getComponentTypeName(t)),
                    entityCount: a.entities.size
                }))
            },
            cacheStats: {
                size: this._reactiveQueries.size,
                hitRate: this.queryStats.totalQueries > 0 ?
                    (this.queryStats.cacheHits / this.queryStats.totalQueries * 100).toFixed(2) + '%' : '0%'
            }
        };
    }

    /**
     * 获取实体所属的原型信息
     *
     * @param entity 要查询的实体
     */
    public getEntityArchetype(entity: Entity): Archetype | undefined {
        return this.archetypeSystem.getEntityArchetype(entity);
    }

    // ============================================================
    // 响应式查询支持(内部智能缓存)
    // ============================================================

    /**
     * 响应式查询集合(内部使用,作为智能缓存)
     * 传统查询API(queryAll/queryAny/queryNone)内部自动使用响应式查询优化性能
     */
    private _reactiveQueries: Map<string, ReactiveQuery> = new Map();

    /**
     * 按组件类型索引的响应式查询
     * 用于快速定位哪些查询关心某个组件类型
     */
    private _reactiveQueriesByComponent: Map<ComponentType, Set<ReactiveQuery>> = new Map();

    /**
     * 获取或创建内部响应式查询(作为智能缓存)
     *
     * @param queryType 查询类型
     * @param componentTypes 组件类型列表
     * @returns 响应式查询实例
     */
    private getOrCreateReactiveQuery(
        queryType: QueryConditionType,
        componentTypes: ComponentType[]
    ): ReactiveQuery {
        // 生成缓存键(与传统缓存键格式一致)
        const cacheKey = this.generateCacheKey(queryType, componentTypes);

        // 检查是否已存在响应式查询
        let reactiveQuery = this._reactiveQueries.get(cacheKey);

        if (!reactiveQuery) {
            // 创建查询条件
            const mask = this.createComponentMask(componentTypes);
            const condition: QueryCondition = {
                type: queryType,
                componentTypes,
                mask
            };

            // 创建响应式查询(禁用批量模式,保持实时性)
            reactiveQuery = new ReactiveQuery(condition, {
                enableBatchMode: false,
                debug: false
            });

            // 初始化查询结果(使用传统方式获取初始数据)
            const initialEntities = this.executeTraditionalQuery(queryType, componentTypes);
            reactiveQuery.initializeWith(initialEntities);

            // 注册响应式查询
            this._reactiveQueries.set(cacheKey, reactiveQuery);

            // 为每个组件类型注册索引
            for (const type of componentTypes) {
                let queries = this._reactiveQueriesByComponent.get(type);
                if (!queries) {
                    queries = new Set();
                    this._reactiveQueriesByComponent.set(type, queries);
                }
                queries.add(reactiveQuery);
            }

            this._logger.debug(`创建内部响应式查询缓存: ${cacheKey}`);
        }

        return reactiveQuery;
    }

    /**
     * 执行传统查询(内部使用,用于响应式查询初始化)
     *
     * @param queryType 查询类型
     * @param componentTypes 组件类型列表
     * @returns 匹配的实体列表
     */
    private executeTraditionalQuery(
        queryType: QueryConditionType,
        componentTypes: ComponentType[]
    ): Entity[] {
        switch (queryType) {
            case QueryConditionType.ALL: {
                const archetypeResult = this.archetypeSystem.queryArchetypes(componentTypes, 'AND');
                const entities: Entity[] = [];
                for (const archetype of archetypeResult.archetypes) {
                    for (const entity of archetype.entities) {
                        entities.push(entity);
                    }
                }
                return entities;
            }
            case QueryConditionType.ANY: {
                const archetypeResult = this.archetypeSystem.queryArchetypes(componentTypes, 'OR');
                const entities: Entity[] = [];
                for (const archetype of archetypeResult.archetypes) {
                    for (const entity of archetype.entities) {
                        entities.push(entity);
                    }
                }
                return entities;
            }
            case QueryConditionType.NONE: {
                const mask = this.createComponentMask(componentTypes);
                return this.entities.filter(entity =>
                    BitMask64Utils.hasNone(entity.componentMask, mask)
                );
            }
            default:
                return [];
        }
    }

    /**
     * 通知所有响应式查询实体已添加
     *
     * 使用组件类型索引,只通知关心该实体组件的查询
     *
     * @param entity 添加的实体
     */
    private notifyReactiveQueriesEntityAdded(entity: Entity): void {
        if (this._reactiveQueries.size === 0) return;

        const notified = new Set<ReactiveQuery>();

        for (const component of entity.components) {
            const componentType = component.constructor as ComponentType;
            const queries = this._reactiveQueriesByComponent.get(componentType);

            if (queries) {
                for (const query of queries) {
                    if (!notified.has(query)) {
                        query.notifyEntityAdded(entity);
                        notified.add(query);
                    }
                }
            }
        }
    }

    /**
     * 通知响应式查询实体已移除
     *
     * 使用组件类型索引,只通知关心该实体组件的查询
     *
     * @param entity 移除的实体
     * @param componentTypes 实体移除前的组件类型列表
     */
    private notifyReactiveQueriesEntityRemoved(entity: Entity, componentTypes: ComponentType[]): void {
        if (this._reactiveQueries.size === 0) return;

        const notified = new Set<ReactiveQuery>();

        for (const componentType of componentTypes) {
            const queries = this._reactiveQueriesByComponent.get(componentType);
            if (queries) {
                for (const query of queries) {
                    if (!notified.has(query)) {
                        query.notifyEntityRemoved(entity);
                        notified.add(query);
                    }
                }
            }
        }
    }

    /**
     * 通知响应式查询实体已移除(后备方案)
     *
     * 当实体已经清空组件时使用,通知所有查询
     *
     * @param entity 移除的实体
     */
    private notifyReactiveQueriesEntityRemovedFallback(entity: Entity): void {
        if (this._reactiveQueries.size === 0) return;

        for (const query of this._reactiveQueries.values()) {
            query.notifyEntityRemoved(entity);
        }
    }

    /**
     * 通知响应式查询实体已变化
     *
     * 使用混合策略:
     * 1. 首先通知关心实体当前组件的查询
     * 2. 然后通知所有其他查询(包括那些可能因为组件移除而不再匹配的查询)
     *
     * @param entity 变化的实体
     */
    private notifyReactiveQueriesEntityChanged(entity: Entity): void {
        if (this._reactiveQueries.size === 0) {
            return;
        }

        const notified = new Set<ReactiveQuery>();

        for (const component of entity.components) {
            const componentType = component.constructor as ComponentType;
            const queries = this._reactiveQueriesByComponent.get(componentType);
            if (queries) {
                for (const query of queries) {
                    if (!notified.has(query)) {
                        query.notifyEntityChanged(entity);
                        notified.add(query);
                    }
                }
            }
        }

        for (const query of this._reactiveQueries.values()) {
            if (!notified.has(query)) {
                query.notifyEntityChanged(entity);
            }
        }
    }
}

/**
 * 查询构建器
 * 
 * 提供链式API来构建复杂的实体查询条件。
 * 支持组合多种查询条件，创建灵活的查询表达式。
 * 
 * @example
 * ```typescript
 * const result = new QueryBuilder(querySystem)
 *     .withAll(PositionComponent, VelocityComponent)
 *     .without(DeadComponent)
 *     .execute();
 * ```
 */
export class QueryBuilder {
    private _logger = createLogger('QueryBuilder');
    private conditions: QueryCondition[] = [];
    private querySystem: QuerySystem;

    constructor(querySystem: QuerySystem) {
        this.querySystem = querySystem;
    }

    /**
     * 添加"必须包含所有组件"条件
     * 
     * @param componentTypes 必须包含的组件类型
     * @returns 查询构建器实例，支持链式调用
     */
    public withAll(...componentTypes: ComponentType[]): QueryBuilder {
        this.conditions.push({
            type: QueryConditionType.ALL,
            componentTypes,
            mask: this.createComponentMask(componentTypes)
        });
        return this;
    }

    /**
     * 添加"必须包含任意组件"条件
     * 
     * @param componentTypes 必须包含其中任意一个的组件类型
     * @returns 查询构建器实例，支持链式调用
     */
    public withAny(...componentTypes: ComponentType[]): QueryBuilder {
        this.conditions.push({
            type: QueryConditionType.ANY,
            componentTypes,
            mask: this.createComponentMask(componentTypes)
        });
        return this;
    }

    /**
     * 添加"不能包含任何组件"条件
     * 
     * @param componentTypes 不能包含的组件类型
     * @returns 查询构建器实例，支持链式调用
     */
    public without(...componentTypes: ComponentType[]): QueryBuilder {
        this.conditions.push({
            type: QueryConditionType.NONE,
            componentTypes,
            mask: this.createComponentMask(componentTypes)
        });
        return this;
    }

    /**
     * 执行查询并返回结果
     * 
     * 根据已添加的查询条件执行实体查询。
     * 
     * @returns 查询结果，包含匹配的实体和性能信息
     */
    public execute(): QueryResult {
        const startTime = performance.now();

        // 简化实现：目前只支持单一条件
        if (this.conditions.length === 1) {
            const condition = this.conditions[0];
            switch (condition.type) {
                case QueryConditionType.ALL:
                    return this.querySystem.queryAll(...condition.componentTypes);
                case QueryConditionType.ANY:
                    return this.querySystem.queryAny(...condition.componentTypes);
                case QueryConditionType.NONE:
                    return this.querySystem.queryNone(...condition.componentTypes);
            }
        }

        // 多条件查询的复杂实现留待后续扩展
        return {
            entities: [],
            count: 0,
            executionTime: performance.now() - startTime,
            fromCache: false
        };
    }

    /**
     * 创建组件掩码
     */
    private createComponentMask(componentTypes: ComponentType[]): BitMask64Data {
        let mask = BitMask64Utils.clone(BitMask64Utils.ZERO);
        for (const type of componentTypes) {
            try {
                const bitMask = ComponentRegistry.getBitMask(type);
                BitMask64Utils.orInPlace(mask, bitMask);
            } catch (error) {
                this._logger.warn(`组件类型 ${getComponentTypeName(type)} 未注册，跳过`);
            }
        }
        return mask;
    }

    /**
     * 重置查询构建器
     * 
     * 清除所有已添加的查询条件，重新开始构建查询。
     * 
     * @returns 查询构建器实例，支持链式调用
     */
    public reset(): QueryBuilder {
        this.conditions = [];
        return this;
    }
} 