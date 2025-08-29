import { Entity } from '../Entity';
import { Component } from '../Component';
import { ComponentRegistry, ComponentType } from './ComponentStorage';
import { IBigIntLike, BigIntFactory } from '../Utils/BigIntCompatibility';
import { createLogger } from '../../Utils/Logger';
import { getComponentTypeName } from '../Decorators';
import { Core } from '../../Core';

import { ComponentPoolManager } from './ComponentPool';
import { ComponentIndexManager } from './ComponentIndex';
import { ArchetypeSystem, Archetype, ArchetypeQueryResult } from './ArchetypeSystem';
import { DirtyTrackingSystem, DirtyFlag } from './DirtyTrackingSystem';
import { QueryHandle, IQueryHandle, QueryCondition as QueryHandleCondition } from './QuerySystem/QueryHandle';
import { Matcher, BitMaskCondition } from '../Utils/Matcher';


/**
 * 实体查询结果接口
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
 * 实体索引结构
 */
interface EntityIndex {
    byMask: Map<string, Set<Entity>>;
    byComponentType: Map<ComponentType, Set<Entity>>;
    byTag: Map<number, Set<Entity>>;
    byName: Map<string, Set<Entity>>;
}

/**
 * 查询缓存条目
 */
interface QueryCacheEntry {
    entities: Entity[];
    timestamp: number;
    hitCount: number;
}

/**
 * 高性能实体查询系统
 * 
 * 提供快速的实体查询功能，支持按组件类型、标签、名称等多种方式查询实体。
 * 系统采用多级索引和智能缓存机制，确保在大量实体场景下的查询性能。
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
    private indexDirty = true;
    
    // 版本号，用于缓存失效
    private _version = 0;

    // 查询缓存系统
    private queryCache = new Map<string, QueryCacheEntry>();
    private cacheMaxSize = 1000;
    private cacheTimeout = 5000; // 5秒缓存过期

    // 优化组件
    private componentPoolManager: ComponentPoolManager;

    // 新增性能优化系统
    private componentIndexManager: ComponentIndexManager;
    private archetypeSystem: ArchetypeSystem;
    private dirtyTrackingSystem: DirtyTrackingSystem;

    // 性能统计
    private queryStats = {
        totalQueries: 0,
        cacheHits: 0,
        indexHits: 0,
        linearScans: 0,
        archetypeHits: 0,
        dirtyChecks: 0
    };

    // QueryHandle管理
    private queryHandles: Map<string, QueryHandle> = new Map();
    private handleCounter = 0;

    // 实体ID映射，用于高效的ID集合运算
    private entityIdMap: Map<number, Entity> = new Map();

    constructor() {
        this.entityIndex = {
            byMask: new Map(),
            byComponentType: new Map(),
            byTag: new Map(),
            byName: new Map()
        };

        // 初始化优化组件
        this.componentPoolManager = ComponentPoolManager.getInstance();
        // 初始化新的性能优化系统
        this.componentIndexManager = new ComponentIndexManager();
        this.archetypeSystem = new ArchetypeSystem();
        this.dirtyTrackingSystem = new DirtyTrackingSystem();
    }

    /**
     * 根据配置对实体列表进行排序
     * 如果启用了确定性排序，按ID排序；否则保持原顺序
     */
    private sortEntitiesIfNeeded(entities: Entity[]): void {
        if (Core.deterministicSortingEnabled) {
            entities.sort((a, b) => a.id - b.id);
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
            this.entityIdMap.set(entity.id, entity);
            this.addEntityToIndexes(entity);

            this.componentIndexManager.addEntity(entity);
            this.archetypeSystem.addEntity(entity);
            this.dirtyTrackingSystem.markDirty(entity, DirtyFlag.COMPONENT_ADDED);


            // 只有在非延迟模式下才立即清理缓存
            if (!deferCacheClear) {
                this.clearQueryCache();
                this.updateQueryHandles();
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
                this.entityIdMap.set(entity.id, entity);
                this.addEntityToIndexes(entity);
                existingIds.add(entity.id);
                addedCount++;
            }
        }

        // 只在有实体被添加时才清理缓存
        if (addedCount > 0) {
            this.clearQueryCache();
            this.updateQueryHandles();
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
            this.entityIdMap.set(entity.id, entity);
        }

        // 批量更新索引
        for (const entity of entities) {
            this.addEntityToIndexes(entity);
        }

        // 清理缓存
        this.clearQueryCache();
        this.updateQueryHandles();
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
            this.entities.splice(index, 1);
            this.entityIdMap.delete(entity.id);
            this.removeEntityFromIndexes(entity);

            this.componentIndexManager.removeEntity(entity);
            this.archetypeSystem.removeEntity(entity);
            this.dirtyTrackingSystem.markDirty(entity, DirtyFlag.COMPONENT_REMOVED);

            this.clearQueryCache();
            this.updateQueryHandles();
            
            // 更新版本号
            this._version++;
        }
    }

    /**
     * 将实体添加到各种索引中（优化版本）
     */
    private addEntityToIndexes(entity: Entity): void {
        const mask = entity.componentMask;

        // 组件掩码索引 - 优化Map操作
        const maskKey = mask.toString();
        let maskSet = this.entityIndex.byMask.get(maskKey);
        if (!maskSet) {
            maskSet = new Set();
            this.entityIndex.byMask.set(maskKey, maskSet);
        }
        maskSet.add(entity);

        // 组件类型索引 - 批量处理
        const components = entity.components;
        for (let i = 0; i < components.length; i++) {
            const componentType = components[i].constructor as ComponentType;
            let typeSet = this.entityIndex.byComponentType.get(componentType);
            if (!typeSet) {
                typeSet = new Set();
                this.entityIndex.byComponentType.set(componentType, typeSet);
            }
            typeSet.add(entity);
        }

        // 标签索引 - 只在有标签时处理
        const tag = entity.tag;
        if (tag !== undefined) {
            let tagSet = this.entityIndex.byTag.get(tag);
            if (!tagSet) {
                tagSet = new Set();
                this.entityIndex.byTag.set(tag, tagSet);
            }
            tagSet.add(entity);
        }

        // 名称索引 - 只在有名称时处理
        const name = entity.name;
        if (name) {
            let nameSet = this.entityIndex.byName.get(name);
            if (!nameSet) {
                nameSet = new Set();
                this.entityIndex.byName.set(name, nameSet);
            }
            nameSet.add(entity);
        }
    }

    /**
     * 从各种索引中移除实体
     */
    private removeEntityFromIndexes(entity: Entity): void {
        const mask = entity.componentMask;

        // 从组件掩码索引移除
        const maskKey = mask.toString();
        const maskSet = this.entityIndex.byMask.get(maskKey);
        if (maskSet) {
            maskSet.delete(entity);
            if (maskSet.size === 0) {
                this.entityIndex.byMask.delete(maskKey);
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
        this.entityIndex.byMask.clear();
        this.entityIndex.byComponentType.clear();
        this.entityIndex.byTag.clear();
        this.entityIndex.byName.clear();
        this.entityIdMap.clear();
        
        // 清理ArchetypeSystem和ComponentIndexManager
        this.archetypeSystem.clear();
        this.componentIndexManager.clear();

        for (const entity of this.entities) {
            this.entityIdMap.set(entity.id, entity);
            this.addEntityToIndexes(entity);
            this.componentIndexManager.addEntity(entity);
            this.archetypeSystem.addEntity(entity);
        }

        this.indexDirty = false;
    }

    /**
     * 查询包含所有指定组件的实体
     * 
     * 返回同时包含所有指定组件类型的实体列表。
     * 系统会自动选择最高效的查询策略，包括索引查找和缓存机制。
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

        // 生成缓存键
        const cacheKey = `all:${componentTypes.map(t => getComponentTypeName(t)).sort().join(',')}`;

        // 检查缓存
        const cached = this.getFromCache(cacheKey);
        if (cached) {
            this.queryStats.cacheHits++;
            // 缓存的实体也要排序以确保确定性
            const sortedCached = [...cached];
            this.sortEntitiesIfNeeded(sortedCached);
            return {
                entities: sortedCached,
                count: sortedCached.length,
                executionTime: performance.now() - startTime,
                fromCache: true
            };
        }

        let entities: Entity[] = [];

        const archetypeResult = this.archetypeSystem.queryArchetypes(componentTypes, 'AND');
        if (archetypeResult.archetypes.length > 0) {
            this.queryStats.archetypeHits++;
            for (const archetype of archetypeResult.archetypes) {
                entities.push(...archetype.entities);
            }
        } else {
            try {
                if (componentTypes.length === 1) {
                    this.queryStats.indexHits++;
                    const indexResult = this.componentIndexManager.query(componentTypes[0]);
                    entities = Array.from(indexResult);
                } else {
                    const indexResult = this.componentIndexManager.queryMultiple(componentTypes, 'AND');
                    entities = Array.from(indexResult);
                }
            } catch (error) {
                entities = [];
            }
        }

        // 确保实体按ID排序，保证遍历的确定性
        this.sortEntitiesIfNeeded(entities);
        
        this.addToCache(cacheKey, entities);

        return {
            entities,
            count: entities.length,
            executionTime: performance.now() - startTime,
            fromCache: false
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
        // 找到最小的组件集合作为起点
        let smallestSet: Set<Entity> | null = null;
        let smallestSize = Infinity;

        for (const componentType of componentTypes) {
            const set = this.entityIndex.byComponentType.get(componentType);
            if (!set || set.size === 0) {
                return []; // 如果任何组件没有实体，直接返回空结果
            }
            if (set.size < smallestSize) {
                smallestSize = set.size;
                smallestSet = set;
            }
        }

        if (!smallestSet) {
            return []; // 如果没有找到任何组件集合，返回空结果
        }

        // 从最小集合开始，逐步过滤
        const mask = this.createComponentMask(componentTypes);
        const result: Entity[] = [];

        for (const entity of smallestSet) {
            if (entity.componentMask.and(mask).equals(mask)) {
                result.push(entity);
            }
        }

        return result;
    }



    /**
     * 查询包含任意指定组件的实体
     * 
     * 返回包含任意一个指定组件类型的实体列表。
     * 使用集合合并算法确保高效的查询性能。
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

        const cacheKey = `any:${componentTypes.map(t => getComponentTypeName(t)).sort().join(',')}`;

        // 检查缓存
        const cached = this.getFromCache(cacheKey);
        if (cached) {
            this.queryStats.cacheHits++;
            // 缓存的实体也要排序以确保确定性
            const sortedCached = [...cached];
            this.sortEntitiesIfNeeded(sortedCached);
            return {
                entities: sortedCached,
                count: sortedCached.length,
                executionTime: performance.now() - startTime,
                fromCache: true
            };
        }

        const archetypeResult = this.archetypeSystem.queryArchetypes(componentTypes, 'OR');
        let entities: Entity[];

        if (archetypeResult.archetypes.length > 0) {
            this.queryStats.archetypeHits++;
            entities = [];
            for (const archetype of archetypeResult.archetypes) {
                entities.push(...archetype.entities);
            }
        } else {
            const indexResult = this.componentIndexManager.queryMultiple(componentTypes, 'OR');
            entities = Array.from(indexResult);
        }
        
        // 确保实体按ID排序，保证遍历的确定性
        this.sortEntitiesIfNeeded(entities);
        
        this.addToCache(cacheKey, entities);

        return {
            entities,
            count: entities.length,
            executionTime: performance.now() - startTime,
            fromCache: false
        };
    }

    /**
     * 查询不包含任何指定组件的实体
     * 
     * 返回不包含任何指定组件类型的实体列表。
     * 适用于排除特定类型实体的查询场景。
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

        const cacheKey = `none:${componentTypes.map(t => getComponentTypeName(t)).sort().join(',')}`;

        // 检查缓存
        const cached = this.getFromCache(cacheKey);
        if (cached) {
            this.queryStats.cacheHits++;
            // 缓存的实体也要排序以确保确定性
            const sortedCached = [...cached];
            this.sortEntitiesIfNeeded(sortedCached);
            return {
                entities: sortedCached,
                count: sortedCached.length,
                executionTime: performance.now() - startTime,
                fromCache: true
            };
        }

        const mask = this.createComponentMask(componentTypes);
        const entities = this.entities.filter(entity =>
            entity.componentMask.and(mask).isZero()
        );

        // 确保实体按ID排序，保证遍历的确定性
        this.sortEntitiesIfNeeded(entities);
        
        this.addToCache(cacheKey, entities);

        return {
            entities,
            count: entities.length,
            executionTime: performance.now() - startTime,
            fromCache: false
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
            // 缓存的实体也要排序以确保确定性
            const sortedCached = [...cached];
            this.sortEntitiesIfNeeded(sortedCached);
            return {
                entities: sortedCached,
                count: sortedCached.length,
                executionTime: performance.now() - startTime,
                fromCache: true
            };
        }

        // 使用索引查询
        this.queryStats.indexHits++;
        const entities = Array.from(this.entityIndex.byTag.get(tag) || []);

        // 缓存结果
        // 确保实体按ID排序，保证遍历的确定性
        this.sortEntitiesIfNeeded(entities);
        
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
            // 缓存的实体也要排序以确保确定性
            const sortedCached = [...cached];
            this.sortEntitiesIfNeeded(sortedCached);
            return {
                entities: sortedCached,
                count: sortedCached.length,
                executionTime: performance.now() - startTime,
                fromCache: true
            };
        }

        // 使用索引查询
        this.queryStats.indexHits++;
        const entities = Array.from(this.entityIndex.byName.get(name) || []);

        // 缓存结果
        // 确保实体按ID排序，保证遍历的确定性
        this.sortEntitiesIfNeeded(entities);
        
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

        const cacheKey = `component:${getComponentTypeName(componentType)}`;

        // 检查缓存
        const cached = this.getFromCache(cacheKey);
        if (cached) {
            this.queryStats.cacheHits++;
            // 缓存的实体也要排序以确保确定性
            const sortedCached = [...cached];
            this.sortEntitiesIfNeeded(sortedCached);
            return {
                entities: sortedCached,
                count: sortedCached.length,
                executionTime: performance.now() - startTime,
                fromCache: true
            };
        }

        // 使用索引查询
        this.queryStats.indexHits++;
        const entities = Array.from(this.entityIndex.byComponentType.get(componentType) || []);

        // 缓存结果
        // 确保实体按ID排序，保证遍历的确定性
        this.sortEntitiesIfNeeded(entities);
        
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
    private getFromCache(cacheKey: string): Entity[] | null {
        const entry = this.queryCache.get(cacheKey);
        if (!entry) return null;

        // 检查缓存是否过期
        if (Date.now() - entry.timestamp > this.cacheTimeout) {
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
            entities: [...entities], // 复制数组避免引用问题
            timestamp: Date.now(),
            hitCount: 0
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
            const entries = Array.from(this.queryCache.entries());
            entries.sort((a, b) => a[1].hitCount - b[1].hitCount);

            const toRemove = Math.floor(this.cacheMaxSize * 0.2); // 移除20%
            for (let i = 0; i < toRemove && i < entries.length; i++) {
                this.queryCache.delete(entries[i][0]);
            }
        }
    }

    /**
     * 清除所有查询缓存
     */
    private clearQueryCache(): void {
        this.queryCache.clear();
    }

    /**
     * 公共方法：清理查询缓存
     * 
     * 用于外部调用清理缓存，通常在批量操作后使用。
     */
    public clearCache(): void {
        this.clearQueryCache();
    }

    /**
     * 批量更新实体组件
     * 
     * 对大量实体进行批量组件更新操作。
     * 
     * @param updates 更新操作列表，包含实体ID和新的组件掩码
     * 
     * @example
     * ```typescript
     * // 批量更新实体的组件配置
     * const updates = [
     *     { entityId: 1, componentMask: BigInt(0b1011) },
     *     { entityId: 2, componentMask: BigInt(0b1101) }
     * ];
     * querySystem.batchUpdateComponents(updates);
     * ```
     */
    public batchUpdateComponents(updates: Array<{ entityId: number, componentMask: bigint }>): void {
        // 批量处理更新，先从索引中移除，再重新添加
        const entitiesToUpdate: Entity[] = [];
        
        for (const update of updates) {
            const entity = this.entities.find(e => e.id === update.entityId);
            if (entity) {
                // 先从所有索引中移除
                this.removeEntityFromIndexes(entity);
                entitiesToUpdate.push(entity);
            }
        }
        
        // 重新添加到索引中（此时实体的组件掩码已经更新）
        for (const entity of entitiesToUpdate) {
            this.addEntityToIndexes(entity);
        }
        
        // 标记脏实体进行处理
        for (const entity of entitiesToUpdate) {
            this.dirtyTrackingSystem.markDirty(entity, DirtyFlag.COMPONENT_MODIFIED, []);
        }
        
        // 批量更新后清除缓存
        this.clearQueryCache();
        this.updateQueryHandles();
    }



    /**
     * 创建组件掩码
     * 
     * 根据组件类型列表生成对应的位掩码。
     * 使用位掩码优化器进行缓存和预计算。
     * 
     * @param componentTypes 组件类型列表
     * @returns 生成的位掩码
     */
    private createComponentMask(componentTypes: ComponentType[]): IBigIntLike {
        let mask = BigIntFactory.zero();
        let hasValidComponents = false;
        
        for (const type of componentTypes) {
            try {
                const bitMask = ComponentRegistry.getBitMask(type);
                mask = mask.or(bitMask);
                hasValidComponents = true;
            } catch (error) {
                this._logger.warn(`组件类型 ${getComponentTypeName(type)} 未注册，跳过`);
            }
        }
        
        // 如果没有有效的组件类型，返回一个不可能匹配的掩码
        if (!hasValidComponents) {
            return BigIntFactory.create(-1); // 所有位都是1，不可能与任何实体匹配
        }
        
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
     * 返回按ID排序的实体列表，确保遍历顺序的确定性
     */
    public getAllEntities(): Entity[] {
        const entities = [...this.entities];
        this.sortEntitiesIfNeeded(entities);
        return entities;
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
            maskIndexSize: number;
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
            componentIndex: any;
            archetypeSystem: any;
            dirtyTracking: any;
        };
        cacheStats: {
            size: number;
            hitRate: string;
        };
    } {
        return {
            entityCount: this.entities.length,
            indexStats: {
                maskIndexSize: this.entityIndex.byMask.size,
                componentIndexSize: this.entityIndex.byComponentType.size,
                tagIndexSize: this.entityIndex.byTag.size,
                nameIndexSize: this.entityIndex.byName.size
            },
            queryStats: {
                ...this.queryStats,
                cacheHitRate: this.queryStats.totalQueries > 0 ?
                    (this.queryStats.cacheHits / this.queryStats.totalQueries * 100).toFixed(2) + '%' : '0%'
            },
            optimizationStats: {
                componentIndex: this.componentIndexManager.getStats(),
                archetypeSystem: this.archetypeSystem.getAllArchetypes().map(a => ({
                    id: a.id,
                    componentTypes: a.componentTypes.map(t => getComponentTypeName(t)),
                    entityCount: a.entities.length
                })),
                dirtyTracking: this.dirtyTrackingSystem.getStats()
            },
            cacheStats: {
                size: this.queryCache.size,
                hitRate: this.queryStats.totalQueries > 0 ?
                    (this.queryStats.cacheHits / this.queryStats.totalQueries * 100).toFixed(2) + '%' : '0%'
            }
        };
    }


    /**
     * 配置脏标记系统
     * 
     * @param batchSize 批处理大小
     * @param maxProcessingTime 最大处理时间
     */
    public configureDirtyTracking(batchSize: number, maxProcessingTime: number): void {
        this.dirtyTrackingSystem.configureBatchProcessing(batchSize, maxProcessingTime);
    }

    /**
     * 开始新的帧
     */
    public beginFrame(): void {
        this.dirtyTrackingSystem.beginFrame();
    }

    /**
     * 结束当前帧
     */
    public endFrame(): void {
        this.dirtyTrackingSystem.endFrame();
    }

    /**
     * 标记实体组件已修改（用于脏标记追踪）
     * 
     * @param entity 修改的实体
     * @param componentTypes 修改的组件类型
     */
    public markEntityDirty(entity: Entity, componentTypes: ComponentType[]): void {
        this.queryStats.dirtyChecks++;
        this.dirtyTrackingSystem.markDirty(entity, DirtyFlag.COMPONENT_MODIFIED, componentTypes);
        this.clearQueryCache();
        this.updateQueryHandles();
    }

    /**
     * 获取实体所属的原型信息
     * 
     * @param entity 要查询的实体
     */
    public getEntityArchetype(entity: Entity): Archetype | undefined {
        return this.archetypeSystem.getEntityArchetype(entity);
    }

    /**
     * 通过ID集合批量获取实体
     * 
     * @param ids 实体ID集合
     * @returns 对应的实体数组
     */
    public getEntitiesByIds(ids: Set<number> | number[]): Entity[] {
        const result: Entity[] = [];
        const idSet = ids instanceof Set ? ids : new Set(ids);
        
        for (const id of idSet) {
            const entity = this.entityIdMap.get(id);
            if (entity) {
                result.push(entity);
            }
        }

        // 根据配置决定是否对实体进行确定性排序
        if (Core.deterministicSortingEnabled) {
            result.sort((a, b) => a.id - b.id);
        }

        return result;
    }

    /**
     * 将实体数组转换为ID集合
     */
    private entitiesToIdSet(entities: Entity[]): Set<number> {
        return new Set(entities.map(e => e.id));
    }

    /**
     * 计算两个ID集合的交集
     */
    private intersectIdSets(set1: Set<number>, set2: Set<number>): Set<number> {
        const result = new Set<number>();
        const [smaller, larger] = set1.size <= set2.size ? [set1, set2] : [set2, set1];
        
        for (const id of smaller) {
            if (larger.has(id)) {
                result.add(id);
            }
        }
        
        return result;
    }

    /**
     * 计算两个ID集合的并集
     */
    private unionIdSets(set1: Set<number>, set2: Set<number>): Set<number> {
        const result = new Set(set1);
        for (const id of set2) {
            result.add(id);
        }
        return result;
    }

    /**
     * 计算ID集合的差集 (set1 - set2)
     */
    private subtractIdSets(set1: Set<number>, set2: Set<number>): Set<number> {
        const result = new Set<number>();
        for (const id of set1) {
            if (!set2.has(id)) {
                result.add(id);
            }
        }
        return result;
    }

    /**
     * 创建查询句柄，支持订阅式实体查询
     * 
     * @param condition 查询条件
     * @returns 查询句柄
     */
    public createQueryHandle(condition: QueryHandleCondition): IQueryHandle {
        const initialEntities = this.executeQuery(condition);
        const handle = new QueryHandle(condition, initialEntities);
        
        this.queryHandles.set(handle.id, handle);
        return handle;
    }

    /**
     * 从Matcher创建优化的查询句柄
     * 
     * 直接使用Matcher的预编译位掩码条件创建查询句柄，
     * 避免EntitySystem的条件转换逻辑。
     * 
     * @param matcher Matcher实例
     * @returns 查询句柄
     */
    public createQueryHandleFromMatcher(matcher: Matcher): IQueryHandle {
        const bitCondition = matcher.getBitMaskCondition();
        const initialEntities = this.executeBitMaskQuery(bitCondition);
        
        // 直接使用Matcher的原始条件创建handle，同时存储Matcher用于位掩码优化
        const condition = matcher.getCondition();
        const handle = new QueryHandle(condition, initialEntities, matcher);
        
        this.queryHandles.set(handle.id, handle);
        return handle;
    }

    /**
     * 销毁查询句柄
     * 
     * @param handle 要销毁的查询句柄
     */
    public destroyQueryHandle(handle: IQueryHandle): void {
        this.queryHandles.delete(handle.id);
        handle.destroy();
    }

    /**
     * 执行查询条件，返回匹配的实体
     */
    private executeQuery(condition: QueryHandleCondition): Entity[] {
        let entities: Entity[] = [];

        if (condition.all && condition.all.length > 0) {
            entities = this.queryAll(...condition.all).entities;
        } else if (condition.any && condition.any.length > 0) {
            entities = this.queryAny(...condition.any).entities;
        } else if (condition.none && condition.none.length > 0) {
            entities = this.queryNone(...condition.none).entities;
        } else if (condition.tag !== undefined) {
            entities = this.queryByTag(condition.tag).entities;
        } else if (condition.name !== undefined) {
            entities = this.queryByName(condition.name).entities;
        } else if (condition.component !== undefined) {
            entities = this.queryByComponent(condition.component).entities;
        } else {
            entities = this.getAllEntities();
        }

        // 如果有多个条件，需要组合查询
        if (this.hasMultipleConditions(condition)) {
            entities = this.executeComplexQuery(condition);
        }

        return entities;
    }

    /**
     * 检查是否有多个查询条件
     */
    private hasMultipleConditions(condition: QueryHandleCondition): boolean {
        const conditionCount =
            (condition.all && condition.all.length > 0 ? 1 : 0) +
            (condition.any && condition.any.length > 0 ? 1 : 0) +
            (condition.none && condition.none.length > 0 ? 1 : 0) +
            (condition.tag !== undefined ? 1 : 0) +
            (condition.name !== undefined ? 1 : 0) +
            (condition.component !== undefined ? 1 : 0);

        return conditionCount > 1;
    }

    /**
     * 执行复合查询条件（终极优化版 - 使用位运算和原型索引）
     */
    private executeComplexQuery(condition: QueryHandleCondition): Entity[] {
        // 尝试使用位运算优化
        const bitMaskResult = this.tryBitMaskQuery(condition);
        if (bitMaskResult !== null) {
            return bitMaskResult;
        }

        // 回退到ID集合运算
        return this.executeComplexQueryWithIdSets(condition);
    }

    /**
     * 尝试使用位运算进行查询优化
     */
    /**
     * 执行预编译的位掩码查询
     * @param bitCondition 预编译的位掩码条件
     * @returns 匹配的实体列表
     */
    public executeBitMaskQuery(bitCondition: BitMaskCondition): Entity[] {
        // 如果有非组件条件，回退到传统查询
        if (bitCondition.hasNonComponentConditions && bitCondition.fallbackCondition) {
            return this.executeQuery(bitCondition.fallbackCondition);
        }

        // 纯位掩码查询
        return this.executePureBitMaskQuery(bitCondition);
    }

    /**
     * 执行纯位掩码查询（仅组件条件）
     * @param bitCondition 位掩码条件
     * @returns 匹配的实体列表
     */
    private executePureBitMaskQuery(bitCondition: BitMaskCondition): Entity[] {
        const results: Entity[] = [];

        for (const entity of this.entities) {
            if (this.entityMatchesBitMask(entity, bitCondition)) {
                results.push(entity);
            }
        }

        return results;
    }

    /**
     * 检查实体是否匹配位掩码条件
     * @param entity 实体
     * @param bitCondition 位掩码条件
     * @returns 是否匹配
     */
    private entityMatchesBitMask(entity: Entity, bitCondition: BitMaskCondition): boolean {
        const entityMask = entity.componentMask;

        // 检查all条件：实体必须包含所有指定的组件
        if (!bitCondition.allMask.isZero()) {
            const hasAll = entityMask.and(bitCondition.allMask).equals(bitCondition.allMask);
            if (!hasAll) return false;
        }

        // 检查none条件：实体不能包含任何指定的组件
        if (!bitCondition.noneMask.isZero()) {
            const hasNone = entityMask.and(bitCondition.noneMask).isZero();
            if (!hasNone) return false;
        }

        // 检查any条件：实体必须至少包含其中一个组件
        if (bitCondition.anyMasks.length > 0) {
            let hasAny = false;
            for (const anyMask of bitCondition.anyMasks) {
                if (!entityMask.and(anyMask).isZero()) {
                    hasAny = true;
                    break;
                }
            }
            if (!hasAny) return false;
        }

        return true;
    }

    private tryBitMaskQuery(condition: QueryHandleCondition): Entity[] | null {
        // 只有纯组件查询才能使用位运算优化
        if (condition.tag !== undefined || condition.name !== undefined || condition.component !== undefined) {
            return null; // 有标签或名称查询，无法用位运算优化
        }

        try {
            // 构建查询位掩码
            let requiredMask = BigIntFactory.zero();
            let excludedMask = BigIntFactory.zero();
            let anyMask = BigIntFactory.zero();

            // 处理all条件
            if (condition.all && condition.all.length > 0) {
                for (const componentType of condition.all) {
                    const bitMask = ComponentRegistry.getBitMask(componentType);
                    requiredMask = requiredMask.or(bitMask);
                }
            }

            // 处理none条件
            if (condition.none && condition.none.length > 0) {
                for (const componentType of condition.none) {
                    const bitMask = ComponentRegistry.getBitMask(componentType);
                    excludedMask = excludedMask.or(bitMask);
                }
            }

            // 处理any条件
            if (condition.any && condition.any.length > 0) {
                for (const componentType of condition.any) {
                    const bitMask = ComponentRegistry.getBitMask(componentType);
                    anyMask = anyMask.or(bitMask);
                }
            }

            // 使用位运算直接过滤实体
            const matchingEntities: Entity[] = [];
            for (const entity of this.entities) {
                const entityMask = entity.componentMask;

                // 检查required条件：实体必须包含所有required组件
                if (!requiredMask.isZero() && !entityMask.and(requiredMask).equals(requiredMask)) {
                    continue;
                }

                // 检查excluded条件：实体不能包含任何excluded组件
                if (!excludedMask.isZero() && !entityMask.and(excludedMask).isZero()) {
                    continue;
                }

                // 检查any条件：实体必须包含至少一个any组件
                if (!anyMask.isZero() && entityMask.and(anyMask).isZero()) {
                    continue;
                }

                matchingEntities.push(entity);
            }

            // 根据配置决定是否对实体进行确定性排序
            if (Core.deterministicSortingEnabled) {
                matchingEntities.sort((a, b) => a.id - b.id);
            }

            return matchingEntities;

        } catch (error) {
            // 位运算失败，回退到ID集合方式
            return null;
        }
    }

    /**
     * 使用ID集合运算执行复合查询（回退方案）
     */
    private executeComplexQueryWithIdSets(condition: QueryHandleCondition): Entity[] {
        let resultIds: Set<number> | null = null;

        // 应用标签条件作为基础集合
        if (condition.tag !== undefined) {
            const tagResult = this.queryByTag(condition.tag);
            resultIds = this.entitiesToIdSet(tagResult.entities);
        }

        // 应用名称条件
        if (condition.name !== undefined) {
            const nameResult = this.queryByName(condition.name);
            const nameIds = this.entitiesToIdSet(nameResult.entities);

            if (resultIds) {
                resultIds = this.intersectIdSets(resultIds, nameIds);
            } else {
                resultIds = nameIds;
            }
        }

        // 应用单组件条件
        if (condition.component !== undefined) {
            const componentResult = this.queryByComponent(condition.component);
            const componentIds = this.entitiesToIdSet(componentResult.entities);

            if (resultIds) {
                resultIds = this.intersectIdSets(resultIds, componentIds);
            } else {
                resultIds = componentIds;
            }
        }

        // 应用all条件
        if (condition.all && condition.all.length > 0) {
            const allResult = this.queryAll(...condition.all);
            const allIds = this.entitiesToIdSet(allResult.entities);

            if (resultIds) {
                resultIds = this.intersectIdSets(resultIds, allIds);
            } else {
                resultIds = allIds;
            }
        }

        // 应用any条件（交集）
        if (condition.any && condition.any.length > 0) {
            const anyResult = this.queryAny(...condition.any);
            const anyIds = this.entitiesToIdSet(anyResult.entities);

            if (resultIds) {
                resultIds = this.intersectIdSets(resultIds, anyIds);
            } else {
                resultIds = anyIds;
            }
        }

        // 应用none条件（排除）
        if (condition.none && condition.none.length > 0) {
            if (!resultIds) {
                // 如果没有前置条件，从所有实体开始
                resultIds = this.entitiesToIdSet(this.getAllEntities());
            }

            const noneResult = this.queryAny(...condition.none);
            const noneIds = this.entitiesToIdSet(noneResult.entities);

            resultIds = this.subtractIdSets(resultIds, noneIds);
        }

        // 通过ID集合批量映射回实体
        return resultIds ? this.getEntitiesByIds(resultIds) : [];
    }

    /**
     * 更新所有查询句柄（在实体变更时调用）
     */
    private updateQueryHandles(): void {
        for (const handle of this.queryHandles.values()) {
            let newEntities: Entity[];
            
            // 优先使用位掩码查询（如果有Matcher的话）
            if (handle.matcher) {
                const bitCondition = handle.matcher.getBitMaskCondition();
                newEntities = this.executeBitMaskQuery(bitCondition);
            } else {
                // 回退到传统查询
                newEntities = this.executeQuery(handle.condition);
            }
            
            handle.updateEntities(newEntities);
        }
    }
}

 