import { Entity } from '../Entity';
import { Component } from '../Component';
import { ComponentType } from './ComponentStorage';
import { IdentifierPool } from '../Utils/IdentifierPool';
import { ComponentIndexManager, IndexType } from './ComponentIndex';
import { ArchetypeSystem } from './ArchetypeSystem';
import { DirtyTrackingSystem, DirtyFlag } from './DirtyTrackingSystem';
import { EventBus } from './EventBus';
import { ECSEventType } from '../CoreEvents';
import { IEntityEventData, IComponentEventData } from '../../Types';

/**
 * 实体查询构建器
 * 
 * 提供流式API来构建复杂的实体查询条件。支持组件过滤、标签过滤、状态过滤和自定义条件。
 * 
 * @example
 * ```typescript
 * const results = entityManager.query()
 *     .withAll(PositionComponent, HealthComponent)
 *     .without(VelocityComponent)
 *     .withTag(1)
 *     .active()
 *     .where(entity => entity.name.startsWith("Player"))
 *     .execute();
 * ```
 */
export class EntityQueryBuilder {
    /** 必须包含的组件类型 */
    private _allComponents: ComponentType[] = [];
    /** 至少包含一个的组件类型 */
    private _anyComponents: ComponentType[] = [];
    /** 不能包含的组件类型 */
    private _withoutComponents: ComponentType[] = [];
    /** 必须包含的标签 */
    private _withTags: number[] = [];
    /** 不能包含的标签 */
    private _withoutTags: number[] = [];
    /** 是否只查询激活状态的实体 */
    private _activeOnly: boolean = false;
    /** 是否只查询启用状态的实体 */
    private _enabledOnly: boolean = false;
    /** 自定义过滤条件 */
    private _customPredicates: Array<(entity: Entity) => boolean> = [];
    
    /**
     * 创建查询构建器实例
     * @param entityManager 实体管理器实例
     */
    constructor(private entityManager: EntityManager) {}
    
    /**
     * 添加必须包含的组件条件
     * 
     * 返回的实体必须包含所有指定的组件类型。
     * 
     * @param componentTypes 组件类型列表
     * @returns 查询构建器实例，支持链式调用
     */
    public withAll(...componentTypes: ComponentType[]): EntityQueryBuilder {
        this._allComponents.push(...componentTypes);
        return this;
    }
    
    /**
     * 添加至少包含一个的组件条件
     * 
     * 返回的实体必须至少包含其中一个指定的组件类型。
     * 
     * @param componentTypes 组件类型列表
     * @returns 查询构建器实例，支持链式调用
     */
    public withAny(...componentTypes: ComponentType[]): EntityQueryBuilder {
        this._anyComponents.push(...componentTypes);
        return this;
    }
    
    /**
     * 添加不能包含的组件条件
     * 
     * 返回的实体不能包含任何指定的组件类型。
     * 
     * @param componentTypes 组件类型列表
     * @returns 查询构建器实例，支持链式调用
     */
    public without(...componentTypes: ComponentType[]): EntityQueryBuilder {
        this._withoutComponents.push(...componentTypes);
        return this;
    }
    
    /**
     * 添加必须包含的标签条件
     * 
     * 返回的实体必须具有指定的标签。
     * 
     * @param tag 标签值
     * @returns 查询构建器实例，支持链式调用
     */
    public withTag(tag: number): EntityQueryBuilder {
        this._withTags.push(tag);
        return this;
    }
    
    /**
     * 添加不能包含的标签条件
     * 
     * 返回的实体不能具有指定的标签。
     * 
     * @param tag 标签值
     * @returns 查询构建器实例，支持链式调用
     */
    public withoutTag(tag: number): EntityQueryBuilder {
        this._withoutTags.push(tag);
        return this;
    }
    
    /**
     * 添加激活状态过滤条件
     * 
     * 返回的实体必须处于激活状态（active = true）。
     * 
     * @returns 查询构建器实例，支持链式调用
     */
    public active(): EntityQueryBuilder {
        this._activeOnly = true;
        return this;
    }
    
    /**
     * 添加启用状态过滤条件
     * 
     * 返回的实体必须处于启用状态（enabled = true）。
     * 
     * @returns 查询构建器实例，支持链式调用
     */
    public enabled(): EntityQueryBuilder {
        this._enabledOnly = true;
        return this;
    }
    
    /**
     * 添加自定义过滤条件
     * 
     * 允许用户定义复杂的过滤逻辑。
     * 
     * @param predicate 自定义过滤函数，接收实体作为参数，返回布尔值
     * @returns 查询构建器实例，支持链式调用
     * 
     * @example
     * ```typescript
     * .where(entity => entity.name.startsWith("Player"))
     * .where(entity => entity.components.length > 5)
     * ```
     */
    public where(predicate: (entity: Entity) => boolean): EntityQueryBuilder {
        this._customPredicates.push(predicate);
        return this;
    }
    
    /**
     * 执行查询并返回所有匹配的实体
     * 
     * @returns 符合所有查询条件的实体数组
     */
    public execute(): Entity[] {
        let candidates: Entity[] = [];
        
        if (this._allComponents.length > 0) {
            const indexResult = this.entityManager.queryWithComponentIndex(this._allComponents, 'AND');
            candidates = Array.from(indexResult);
        } else if (this._anyComponents.length > 0) {
            const indexResult = this.entityManager.queryWithComponentIndex(this._anyComponents, 'OR');
            candidates = Array.from(indexResult);
        } else {
            candidates = this.entityManager.getAllEntities();
        }
        
        return candidates.filter(entity => this.matchesEntity(entity));
    }
    
    /**
     * 执行查询并返回第一个匹配的实体
     * 
     * @returns 第一个符合查询条件的实体，如果没有找到则返回null
     */
    public first(): Entity | null {
        const entities = this.entityManager.getAllEntities();
        return entities.find(entity => this.matchesEntity(entity)) || null;
    }
    
    /**
     * 执行查询并返回匹配实体的数量
     * 
     * @returns 符合查询条件的实体数量
     */
    public count(): number {
        const entities = this.entityManager.getAllEntities();
        return entities.filter(entity => this.matchesEntity(entity)).length;
    }
    
    /**
     * 对所有匹配的实体执行指定操作
     * 
     * @param action 要执行的操作函数，接收匹配的实体作为参数
     */
    public forEach(action: (entity: Entity) => void): void {
        const entities = this.entityManager.getAllEntities();
        entities.forEach(entity => {
            if (this.matchesEntity(entity)) {
                action(entity);
            }
        });
    }
    
    /**
     * 检查实体是否匹配所有查询条件
     * 
     * 按优先级顺序检查各种过滤条件，一旦发现不匹配立即返回false。
     * 
     * @param entity 要检查的实体
     * @returns 实体是否匹配所有查询条件
     */
    private matchesEntity(entity: Entity): boolean {
        // 检查激活状态
        if (this._activeOnly && !entity.active) {
            return false;
        }
        
        // 检查启用状态
        if (this._enabledOnly && !entity.enabled) {
            return false;
        }
        
        // 检查必须包含的组件
        if (this._allComponents.length > 0) {
            for (const componentType of this._allComponents) {
                if (!entity.hasComponent(componentType)) {
                    return false;
                }
            }
        }
        
        // 检查至少包含一个的组件
        if (this._anyComponents.length > 0) {
            let hasAny = false;
            for (const componentType of this._anyComponents) {
                if (entity.hasComponent(componentType)) {
                    hasAny = true;
                    break;
                }
            }
            if (!hasAny) {
                return false;
            }
        }
        
        // 检查不能包含的组件
        if (this._withoutComponents.length > 0) {
            for (const componentType of this._withoutComponents) {
                if (entity.hasComponent(componentType)) {
                    return false;
                }
            }
        }
        
        // 检查必须包含的标签
        if (this._withTags.length > 0) {
            if (!this._withTags.includes(entity.tag)) {
                return false;
            }
        }
        
        // 检查不能包含的标签
        if (this._withoutTags.length > 0) {
            if (this._withoutTags.includes(entity.tag)) {
                return false;
            }
        }
        
        // 检查自定义条件
        if (this._customPredicates.length > 0) {
            for (const predicate of this._customPredicates) {
                if (!predicate(entity)) {
                    return false;
                }
            }
        }
        
        return true;
    }
}

/**
 * 实体管理器
 * 
 * 提供统一的实体管理和查询机制，支持高效的实体操作。
 * 包括实体的创建、销毁、查询和索引管理功能。
 * 
 * @example
 * ```typescript
 * const entityManager = new EntityManager();
 * 
 * // 创建实体
 * const player = entityManager.createEntity("Player");
 * 
 * // 查询实体
 * const playerEntity = entityManager.getEntityByName("Player");
 * 
 * // 复杂查询
 * const results = entityManager.query()
 *     .withAll(HealthComponent, PositionComponent)
 *     .active()
 *     .execute();
 * ```
 */
export class EntityManager {
    /** 主要实体存储，使用ID作为键 */
    private _entities: Map<number, Entity> = new Map();
    /** 按名称索引的实体映射 */
    private _entitiesByName: Map<string, Entity[]> = new Map();
    /** 按标签索引的实体映射 */
    private _entitiesByTag: Map<number, Entity[]> = new Map();
    /** 实体ID分配器 */
    private _identifierPool: IdentifierPool;
    /** 已销毁实体的ID集合 */
    private _destroyedEntities: Set<number> = new Set();
    
    /** 性能优化系统 */
    private _componentIndexManager: ComponentIndexManager;
    private _archetypeSystem: ArchetypeSystem;
    private _dirtyTrackingSystem: DirtyTrackingSystem;
    /** 事件总线 */
    private _eventBus: EventBus;
    
    /**
     * 创建实体管理器实例
     * 
     * 初始化内部数据结构和ID分配器。
     */
    constructor() {
        this._identifierPool = new IdentifierPool();
        
        // 初始化性能优化系统
        this._componentIndexManager = new ComponentIndexManager(IndexType.HASH);
        this._archetypeSystem = new ArchetypeSystem();
        this._dirtyTrackingSystem = new DirtyTrackingSystem();
        this._eventBus = new EventBus(false);
        
        // 设置Entity的静态事件总线引用
        Entity.eventBus = this._eventBus;
    }
    
    /**
     * 获取实体总数
     * 
     * @returns 当前管理的实体总数量
     */
    public get entityCount(): number {
        return this._entities.size;
    }
    
    /**
     * 获取激活状态的实体数量
     * 
     * 只计算同时满足激活状态且未被销毁的实体。
     * 
     * @returns 激活状态的实体数量
     */
    public get activeEntityCount(): number {
        let count = 0;
        for (const entity of this._entities.values()) {
            if (entity.active && !entity.isDestroyed) {
                count++;
            }
        }
        return count;
    }
    
    /**
     * 创建新实体
     * 
     * 分配唯一ID并将实体添加到管理系统中，同时更新相关索引。
     * 
     * @param name 实体名称，如果未指定则使用时间戳生成默认名称
     * @returns 创建的实体实例
     * 
     * @example
     * ```typescript
     * const player = entityManager.createEntity("Player");
     * const enemy = entityManager.createEntity(); // 使用默认名称
     * ```
     */
    public createEntity(name: string = `Entity_${Date.now()}`): Entity {
        const id = this._identifierPool.checkOut();
        const entity = new Entity(name, id);
        
        this._entities.set(id, entity);
        this.updateNameIndex(entity, true);
        this.updateTagIndex(entity, true);
        
        this._componentIndexManager.addEntity(entity);
        this._archetypeSystem.addEntity(entity);
        this._dirtyTrackingSystem.markDirty(entity, DirtyFlag.COMPONENT_ADDED);
        
        // 发射实体创建事件
        this._eventBus.emitEntityCreated({
            timestamp: Date.now(),
            source: 'EntityManager',
            entityId: entity.id,
            entityName: entity.name,
            entityTag: entity.tag?.toString()
        });
        
        return entity;
    }
    
    /**
     * 销毁实体
     * 
     * 支持通过实体对象、名称或ID来销毁实体。
     * 会清理所有相关索引并回收ID。
     * 
     * @param entityOrId 要销毁的实体，可以是实体对象、名称字符串或ID数字
     * @returns 是否成功销毁实体
     * 
     * @example
     * ```typescript
     * // 通过实体对象销毁
     * entityManager.destroyEntity(player);
     * 
     * // 通过名称销毁
     * entityManager.destroyEntity("Enemy_1");
     * 
     * // 通过ID销毁
     * entityManager.destroyEntity(123);
     * ```
     */
    public destroyEntity(entityOrId: Entity | string | number): boolean {
        let entity: Entity | null = null;
        
        if (typeof entityOrId === 'string') {
            entity = this.getEntityByName(entityOrId);
        } else if (typeof entityOrId === 'number') {
            entity = this._entities.get(entityOrId) || null;
        } else {
            entity = this._entities.get(entityOrId.id) || null;
        }
        
        if (!entity) {
            return false;
        }
        
        this._destroyedEntities.add(entity.id);
        this.updateNameIndex(entity, false);
        this.updateTagIndex(entity, false);
        
        this._componentIndexManager.removeEntity(entity);
        this._archetypeSystem.removeEntity(entity);
        this._dirtyTrackingSystem.markDirty(entity, DirtyFlag.COMPONENT_REMOVED);
        
        // 发射实体销毁事件
        this._eventBus.emitEntityDestroyed({
            timestamp: Date.now(),
            source: 'EntityManager',
            entityId: entity.id,
            entityName: entity.name,
            entityTag: entity.tag?.toString()
        });
        
        entity.destroy();
        this._entities.delete(entity.id);
        this._identifierPool.checkIn(entity.id);
        
        return true;
    }
    
    /**
     * 获取所有实体
     * 
     * 返回当前管理的所有实体的副本数组。
     * 
     * @returns 所有实体的数组
     */
    public getAllEntities(): Entity[] {
        return Array.from(this._entities.values());
    }
    
    /**
     * 根据ID获取实体
     * 
     * 支持字符串和数字类型的ID。
     * 
     * @param id 实体ID，可以是字符串或数字
     * @returns 对应的实体，如果不存在则返回null
     */
    public getEntity(id: string | number): Entity | null {
        const numId = typeof id === 'string' ? parseInt(id) : id;
        return this._entities.get(numId) || null;
    }
    
    /**
     * 根据名称获取实体
     * 
     * 如果存在多个同名实体，返回第一个找到的实体。
     * 
     * @param name 实体名称
     * @returns 匹配的实体，如果不存在则返回null
     */
    public getEntityByName(name: string): Entity | null {
        const entities = this._entitiesByName.get(name);
        return entities && entities.length > 0 ? entities[0] : null;
    }
    
    /**
     * 根据标签获取实体列表
     * 
     * 返回所有具有指定标签的实体。
     * 
     * @param tag 标签值
     * @returns 具有指定标签的实体数组
     */
    public getEntitiesByTag(tag: number): Entity[] {
        return [...(this._entitiesByTag.get(tag) || [])];
    }
    
    /**
     * 获取包含指定组件的所有实体
     * 
     * 遍历所有实体，查找包含指定组件类型的实体。
     * 
     * @param componentType 组件类型
     * @returns 包含指定组件的实体数组
     * 
     * @example
     * ```typescript
     * const entitiesWithHealth = entityManager.getEntitiesWithComponent(HealthComponent);
     * ```
     */
    public getEntitiesWithComponent<T extends Component>(componentType: ComponentType<T>): Entity[] {
        const indexResult = this._componentIndexManager.query(componentType);
        return Array.from(indexResult);
    }
    
    /**
     * 创建查询构建器
     * 
     * 返回一个新的查询构建器实例，用于构建复杂的实体查询。
     * 
     * @returns 新的查询构建器实例
     * 
     * @example
     * ```typescript
     * const results = entityManager.query()
     *     .withAll(PositionComponent, HealthComponent)
     *     .without(VelocityComponent)
     *     .active()
     *     .execute();
     * ```
     */
    public query(): EntityQueryBuilder {
        return new EntityQueryBuilder(this);
    }

    /**
     * 使用组件索引进行多组件查询
     * 
     * @param componentTypes 组件类型数组
     * @param operation 查询操作：'AND' 或 'OR'
     * @returns 匹配的实体集合
     */
    public queryWithComponentIndex(componentTypes: ComponentType[], operation: 'AND' | 'OR'): Set<Entity> {
        return this._componentIndexManager.queryMultiple(componentTypes, operation);
    }
    
    /**
     * 标记实体组件已修改
     * 
     * @param entity 修改的实体
     * @param componentTypes 修改的组件类型
     */
    public markEntityDirty(entity: Entity, componentTypes: ComponentType[]): void {
        this._dirtyTrackingSystem.markDirty(entity, DirtyFlag.COMPONENT_MODIFIED, componentTypes);
    }
    
    /**
     * 获取性能优化统计信息
     */
    public getOptimizationStats(): any {
        return {
            componentIndex: this._componentIndexManager.getStats(),
            archetypeSystem: this._archetypeSystem.getAllArchetypes().map(a => ({
                id: a.id,
                componentTypes: a.componentTypes.map(t => t.name),
                entityCount: a.entities.length
            })),
            dirtyTracking: this._dirtyTrackingSystem.getStats()
        };
    }
    
    /**
     * 获取事件总线实例
     * 
     * 允许外部代码监听和发射ECS相关事件。
     * 
     * @returns 事件总线实例
     */
    public get eventBus(): EventBus {
        return this._eventBus;
    }
    
    /**
     * 更新名称索引
     * 
     * 维护按名称查找实体的索引结构。支持添加和移除操作。
     * 
     * @param entity 要更新索引的实体
     * @param isAdd true表示添加到索引，false表示从索引中移除
     */
    private updateNameIndex(entity: Entity, isAdd: boolean): void {
        if (!entity.name) {
            return;
        }
        
        if (isAdd) {
            let entities = this._entitiesByName.get(entity.name);
            if (!entities) {
                entities = [];
                this._entitiesByName.set(entity.name, entities);
            }
            entities.push(entity);
        } else {
            const entities = this._entitiesByName.get(entity.name);
            if (entities) {
                const index = entities.indexOf(entity);
                if (index !== -1) {
                    entities.splice(index, 1);
                    if (entities.length === 0) {
                        this._entitiesByName.delete(entity.name);
                    }
                }
            }
        }
    }
    
    /**
     * 更新标签索引
     * 
     * 维护按标签查找实体的索引结构。支持添加和移除操作。
     * 
     * @param entity 要更新索引的实体
     * @param isAdd true表示添加到索引，false表示从索引中移除
     */
    private updateTagIndex(entity: Entity, isAdd: boolean): void {
        if (isAdd) {
            let entities = this._entitiesByTag.get(entity.tag);
            if (!entities) {
                entities = [];
                this._entitiesByTag.set(entity.tag, entities);
            }
            entities.push(entity);
        } else {
            const entities = this._entitiesByTag.get(entity.tag);
            if (entities) {
                const index = entities.indexOf(entity);
                if (index !== -1) {
                    entities.splice(index, 1);
                    if (entities.length === 0) {
                        this._entitiesByTag.delete(entity.tag);
                    }
                }
            }
        }
    }
}
