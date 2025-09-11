import { Entity } from '../Entity';
import { Component } from '../Component';
import { ComponentRegistry, ComponentType } from './ComponentStorage';
import { BitMask64Utils, BitMask64Data } from '../Utils/BigIntCompatibility';
import { createLogger } from '../../Utils/Logger';
import { getComponentTypeName } from '../Decorators';

import { ComponentPoolManager } from './ComponentPool';
import { ComponentIndexManager } from './ComponentIndex';
import { ArchetypeSystem, Archetype, ArchetypeQueryResult } from './ArchetypeSystem';
import { DirtyTrackingSystem, DirtyFlag } from './DirtyTrackingSystem';

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
 * 主要特性：
 * - 支持单组件和多组件查询
 * - 自动索引管理和缓存优化
 * - WebAssembly计算加速（如果可用）
 * - 详细的性能统计信息
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
     * 设置实体列表并重建索引
     * 
     * 当实体集合发生大规模变化时调用此方法。
     * 系统将重新构建所有索引以确保查询性能。
     * 
     * @param entities - 新的实体列表
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
     * @param entity - 要添加的实体
     * @param deferCacheClear - 是否延迟缓存清理（用于批量操作）
     */
    public addEntity(entity: Entity, deferCacheClear: boolean = false): void {
        if (!this.entities.includes(entity)) {
            this.entities.push(entity);
            this.addEntityToIndexes(entity);

            this.componentIndexManager.addEntity(entity);
            this.archetypeSystem.addEntity(entity);
            this.dirtyTrackingSystem.markDirty(entity, DirtyFlag.COMPONENT_ADDED);


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
     * @param entities - 要添加的实体列表
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
     * @param entities - 要添加的实体列表
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
        }

        // 清理缓存
        this.clearQueryCache();
    }

    /**
     * 从查询系统移除实体
     * 
     * 从查询系统中移除指定实体，并清理相关索引。
     * 
     * @param entity - 要移除的实体
     */
    public removeEntity(entity: Entity): void {
        const index = this.entities.indexOf(entity);
        if (index !== -1) {
            this.entities.splice(index, 1);
            this.removeEntityFromIndexes(entity);

            this.componentIndexManager.removeEntity(entity);
            this.archetypeSystem.removeEntity(entity);
            this.dirtyTrackingSystem.markDirty(entity, DirtyFlag.COMPONENT_REMOVED);

            this.clearQueryCache();
            
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
        
        // 清理ArchetypeSystem和ComponentIndexManager
        this.archetypeSystem.clear();
        this.componentIndexManager.clear();

        for (const entity of this.entities) {
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
     * @param componentTypes - 要查询的组件类型列表
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
            return {
                entities: cached,
                count: cached.length,
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
     * @param componentTypes - 组件类型列表
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
            if (BitMask64Utils.hasAll(entity.componentMask, mask)) {
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
     * @param componentTypes - 要查询的组件类型列表
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
            return {
                entities: cached,
                count: cached.length,
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
     * @param componentTypes - 要排除的组件类型列表
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
            return {
                entities: cached,
                count: cached.length,
                executionTime: performance.now() - startTime,
                fromCache: true
            };
        }

        const mask = this.createComponentMask(componentTypes);
        const entities = this.entities.filter(entity =>
            BitMask64Utils.hasNone(entity.componentMask, mask)
        );

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
     * @param tag - 要查询的标签值
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
     * @param name - 要查询的实体名称
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
     * @param componentType - 要查询的组件类型
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
            return {
                entities: cached,
                count: cached.length,
                executionTime: performance.now() - startTime,
                fromCache: true
            };
        }

        // 使用索引查询
        this.queryStats.indexHits++;
        const entities = Array.from(this.entityIndex.byComponentType.get(componentType) || []);

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
     * @param updates - 更新操作列表，包含实体ID和新的组件掩码
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
    }



    /**
     * 创建组件掩码
     * 
     * 根据组件类型列表生成对应的位掩码。
     * 使用位掩码优化器进行缓存和预计算。
     * 
     * @param componentTypes - 组件类型列表
     * @returns 生成的位掩码
     */
    private createComponentMask(componentTypes: ComponentType[]): BitMask64Data {
        let mask = BitMask64Utils.clone(BitMask64Utils.ZERO);
        let hasValidComponents = false;
        
        for (const type of componentTypes) {
            try {
                const bitMask = ComponentRegistry.getBitMask(type);
                BitMask64Utils.orInPlace(mask, bitMask);
                hasValidComponents = true;
            } catch (error) {
                this._logger.warn(`组件类型 ${getComponentTypeName(type)} 未注册，跳过`);
            }
        }
        
        // 如果没有有效的组件类型，返回一个不可能匹配的掩码
        if (!hasValidComponents) {
            return { lo: 0xFFFFFFFF, hi: 0xFFFFFFFF }; // 所有位都是1，不可能与任何实体匹配
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
     */
    public getAllEntities(): Entity[] {
        return [...this.entities];
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
     * @param batchSize - 批处理大小
     * @param maxProcessingTime - 最大处理时间
     */
    public configureDirtyTracking(batchSize: number, maxProcessingTime: number): void {
        this.dirtyTrackingSystem.configureBatchProcessing(batchSize, maxProcessingTime);
    }

    /**
     * 手动触发性能优化
     */
    public optimizePerformance(): void {
        this.dirtyTrackingSystem.processDirtyEntities();
        this.cleanupCache();

        const stats = this.componentIndexManager.getStats();
        // 基于SparseSet的索引已自动优化，无需手动切换索引类型
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
     * @param entity - 修改的实体
     * @param componentTypes - 修改的组件类型
     */
    public markEntityDirty(entity: Entity, componentTypes: ComponentType[]): void {
        this.queryStats.dirtyChecks++;
        this.dirtyTrackingSystem.markDirty(entity, DirtyFlag.COMPONENT_MODIFIED, componentTypes);
        this.clearQueryCache();
    }

    /**
     * 获取实体所属的原型信息
     * 
     * @param entity - 要查询的实体
     */
    public getEntityArchetype(entity: Entity): Archetype | undefined {
        return this.archetypeSystem.getEntityArchetype(entity);
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
     * @param componentTypes - 必须包含的组件类型
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
     * @param componentTypes - 必须包含其中任意一个的组件类型
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
     * @param componentTypes - 不能包含的组件类型
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