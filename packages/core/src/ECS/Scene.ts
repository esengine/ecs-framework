import { Entity } from './Entity';
import { EntityList } from './Utils/EntityList';
import { IdentifierPool } from './Utils/IdentifierPool';
import { EntitySystem } from './Systems/EntitySystem';
import { ComponentStorageManager, ComponentRegistry } from './Core/ComponentStorage';
import { QuerySystem } from './Core/QuerySystem';
import { TypeSafeEventSystem } from './Core/EventSystem';
import { EventBus } from './Core/EventBus';
import { ReferenceTracker } from './Core/ReferenceTracker';
import { IScene, ISceneConfig } from './IScene';
import { getComponentInstanceTypeName, getSystemInstanceTypeName, getSystemMetadata } from "./Decorators";
import { TypedQueryBuilder } from './Core/Query/TypedQuery';
import { SceneSerializer, SceneSerializationOptions, SceneDeserializationOptions } from './Serialization/SceneSerializer';
import { IncrementalSerializer, IncrementalSnapshot, IncrementalSerializationOptions } from './Serialization/IncrementalSerializer';
import { ComponentPoolManager } from './Core/ComponentPool';
import { PerformanceMonitor } from '../Utils/PerformanceMonitor';
import { ServiceContainer, type ServiceType } from '../Core/ServiceContainer';
import { createInstance, isInjectable, injectProperties } from '../Core/DI';
import { createLogger } from '../Utils/Logger';

/**
 * 游戏场景默认实现类
 *
 * 实现IScene接口，提供场景的基础功能。
 * 推荐使用组合而非继承的方式来构建自定义场景。
 */
export class Scene implements IScene {
    /**
     * 场景名称
     *
     * 用于标识和调试的友好名称。
     */
    public name: string = "";

    /**
     * 场景自定义数据
     *
     * 用于存储场景级别的配置和状态数据。
     */
    public readonly sceneData: Map<string, any> = new Map();

    /**
     * 场景中的实体集合
     *
     * 管理场景内所有实体的生命周期。
     */
    public readonly entities: EntityList;
    

    /**
     * 实体ID池
     * 
     * 用于分配和回收实体的唯一标识符。
     */
    public readonly identifierPool: IdentifierPool;

    /**
     * 组件存储管理器
     * 
     * 高性能的组件存储和查询系统。
     */
    public readonly componentStorageManager: ComponentStorageManager;

    /**
     * 查询系统
     * 
     * 基于位掩码的高性能实体查询系统。
     */
    public readonly querySystem: QuerySystem;

    /**
     * 事件系统
     *
     * 类型安全的事件系统。
     */
    public readonly eventSystem: TypeSafeEventSystem;

    /**
     * 引用追踪器
     *
     * 追踪Component中对Entity的引用，当Entity销毁时自动清理引用。
     */
    public readonly referenceTracker: ReferenceTracker;

    /**
     * 服务容器
     *
     * 场景级别的依赖注入容器，用于管理EntitySystem和其他服务的生命周期。
     * 每个Scene拥有独立的服务容器，实现场景间的隔离。
     */
    private readonly _services: ServiceContainer;

    /**
     * 日志记录器
     */
    private readonly logger: ReturnType<typeof createLogger>;

    /**
     * 性能监控器缓存
     *
     * 用于监控场景和系统的性能。从 ServiceContainer 获取。
     */
    private _performanceMonitor: PerformanceMonitor | null = null;

    /**
     * 场景是否已开始运行
     */
    private _didSceneBegin: boolean = false;

    /**
     * 系统列表缓存
     */
    private _cachedSystems: EntitySystem[] | null = null;

    /**
     * 系统顺序脏标记
     *
     * 当系统增删或 updateOrder 改变时标记为 true，下次访问 systems 时重新构建缓存
     */
    private _systemsOrderDirty: boolean = true;

    /**
     * 获取场景中所有已注册的EntitySystem
     *
     * 按updateOrder排序。使用缓存机制，仅在系统变化时重新排序。
     *
     * @returns 系统列表
     */
    public get systems(): EntitySystem[] {
        if (!this._systemsOrderDirty && this._cachedSystems) {
            return this._cachedSystems;
        }

        // 重新构建系统列表
        const services = this._services.getAll();
        const systems: EntitySystem[] = [];

        for (const service of services) {
            if (service instanceof EntitySystem) {
                systems.push(service);
            }
        }

        // 按updateOrder排序
        systems.sort((a, b) => a.updateOrder - b.updateOrder);

        // 缓存结果
        this._cachedSystems = systems;
        this._systemsOrderDirty = false;

        return systems;
    }

    /**
     * 通过类型获取System实例
     *
     * @param systemType System类型
     * @returns System实例，如果未找到则返回null
     *
     * @example
     * ```typescript
     * const physics = scene.getSystem(PhysicsSystem);
     * if (physics) {
     *     physics.doSomething();
     * }
     * ```
     */
    public getSystem<T extends EntitySystem>(systemType: ServiceType<T>): T | null {
        return this._services.tryResolve(systemType) as T | null;
    }

    /**
     * 标记系统顺序为脏
     *
     * 当系统列表或顺序发生变化时调用，使缓存失效
     */
    public markSystemsOrderDirty(): void {
        this._systemsOrderDirty = true;
    }

    /**
     * 获取场景的服务容器
     *
     * 用于注册和解析场景级别的服务（如EntitySystem）。
     *
     * @example
     * ```typescript
     * // 注册服务
     * scene.services.registerSingleton(PhysicsSystem);
     *
     * // 解析服务
     * const physics = scene.services.resolve(PhysicsSystem);
     * ```
     */
    public get services(): ServiceContainer {
        return this._services;
    }

    /**
     * 创建场景实例
     */
    constructor(config?: ISceneConfig) {
        this.entities = new EntityList(this);
        this.identifierPool = new IdentifierPool();
        this.componentStorageManager = new ComponentStorageManager();
        this.querySystem = new QuerySystem();
        this.eventSystem = new TypeSafeEventSystem();
        this.referenceTracker = new ReferenceTracker();
        this._services = new ServiceContainer();
        this.logger = createLogger('Scene');

        if (config?.name) {
            this.name = config.name;
        }

        if (!Entity.eventBus) {
            Entity.eventBus = new EventBus(false);
        }

        if (Entity.eventBus) {
            Entity.eventBus.onComponentAdded((data: unknown) => {
                this.eventSystem.emitSync('component:added', data);
            });
        }
    }

    /**
     * 获取性能监控器
     *
     * 从 ServiceContainer 获取，如果未注册则创建默认实例（向后兼容）
     */
    private get performanceMonitor(): PerformanceMonitor {
        if (!this._performanceMonitor) {
            this._performanceMonitor = this._services.tryResolve(PerformanceMonitor)
                ?? new PerformanceMonitor();
        }
        return this._performanceMonitor;
    }

    /**
     * 初始化场景
     * 
     * 在场景创建时调用，子类可以重写此方法来设置初始实体和组件。
     */
    public initialize(): void {
    }

    /**
     * 场景开始运行时的回调
     * 
     * 在场景开始运行时调用，可以在此方法中执行场景启动逻辑。
     */
    public onStart(): void {
    }

    /**
     * 场景卸载时的回调
     * 
     * 在场景被销毁时调用，可以在此方法中执行清理工作。
     */
    public unload(): void {
    }

    /**
     * 开始场景，启动实体处理器等
     *
     * 这个方法会启动场景。它将启动实体处理器等，并调用onStart方法。
     */
    public begin() {
        // 标记场景已开始运行并调用onStart方法
        this._didSceneBegin = true;
        this.onStart();
    }

    /**
     * 结束场景，清除实体、实体处理器等
     *
     * 这个方法会结束场景。它将移除所有实体，结束实体处理器等，并调用unload方法。
     */
    public end() {
        // 标记场景已结束运行
        this._didSceneBegin = false;

        // 移除所有实体
        this.entities.removeAllEntities();

        // 清理查询系统中的实体引用和缓存
        this.querySystem.setEntities([]);

        // 清空组件存储
        this.componentStorageManager.clear();

        // 清空服务容器（会调用所有服务的dispose方法，包括所有EntitySystem）
        this._services.clear();

        // 清空系统缓存
        this._cachedSystems = null;
        this._systemsOrderDirty = true;

        // 调用卸载方法
        this.unload();
    }

    /**
     * 更新场景
     */
    public update() {
        ComponentPoolManager.getInstance().update();

        this.entities.updateLists();

        // 更新所有EntitySystem
        const systems = this.systems;
        for (const system of systems) {
            if (system.enabled) {
                try {
                    system.update();
                } catch (error) {
                    this.logger.error(`Error in system ${system.constructor.name}.update():`, error);
                }
            }
        }

        // LateUpdate
        for (const system of systems) {
            if (system.enabled) {
                try {
                    system.lateUpdate();
                } catch (error) {
                    this.logger.error(`Error in system ${system.constructor.name}.lateUpdate():`, error);
                }
            }
        }
    }

    /**
     * 将实体添加到此场景，并返回它
     * @param name 实体名称
     */
    public createEntity(name: string) {
        let entity = new Entity(name, this.identifierPool.checkOut());
        
        this.eventSystem.emitSync('entity:created', { entityName: name, entity, scene: this });
        
        return this.addEntity(entity);
    }

    /**
     * 清除所有EntitySystem的实体缓存
     * 当实体或组件发生变化时调用
     */
    public clearSystemEntityCaches(): void {
        for (const system of this.systems) {
            system.clearEntityCache();
        }
    }

    /**
     * 在场景的实体列表中添加一个实体
     * @param entity 要添加的实体
     * @param deferCacheClear 是否延迟缓存清理（用于批量操作）
     */
    public addEntity(entity: Entity, deferCacheClear: boolean = false) {
        this.entities.add(entity);
        entity.scene = this;

        // 将实体添加到查询系统（可延迟缓存清理）
        this.querySystem.addEntity(entity, deferCacheClear);

        // 清除系统缓存以确保系统能及时发现新实体
        if (!deferCacheClear) {
            this.clearSystemEntityCaches();
        }

        // 触发实体添加事件
        this.eventSystem.emitSync('entity:added', { entity, scene: this });

        return entity;
    }

    /**
     * 批量创建实体（高性能版本）
     * @param count 要创建的实体数量
     * @param namePrefix 实体名称前缀
     * @returns 创建的实体列表
     */
    public createEntities(count: number, namePrefix: string = "Entity"): Entity[] {
        const entities: Entity[] = [];
        
        // 批量创建实体对象，不立即添加到系统
        for (let i = 0; i < count; i++) {
            const entity = new Entity(`${namePrefix}_${i}`, this.identifierPool.checkOut());
            entity.scene = this;
            entities.push(entity);
        }
        
        // 批量添加到实体列表
        for (const entity of entities) {
            this.entities.add(entity);
        }
        
        // 批量添加到查询系统（无重复检查，性能最优）
        this.querySystem.addEntitiesUnchecked(entities);
        
        // 批量触发事件（可选，减少事件开销）
        this.eventSystem.emitSync('entities:batch_added', { entities, scene: this, count });
        
        return entities;
    }


    /**
     * 批量销毁实体
     */
    public destroyEntities(entities: Entity[]): void {
        if (entities.length === 0) return;

        for (const entity of entities) {
            entity._isDestroyed = true;
        }

        for (const entity of entities) {
            entity.removeAllComponents();
        }

        for (const entity of entities) {
            this.entities.remove(entity);
            this.querySystem.removeEntity(entity);
        }

        this.querySystem.clearCache();
        this.clearSystemEntityCaches();
    }

    /**
     * 从场景中删除所有实体
     */
    public destroyAllEntities() {
        this.entities.removeAllEntities();

        this.querySystem.setEntities([]);
    }

    /**
     * 搜索并返回第一个具有名称的实体
     * @param name 实体名称
     */
    public findEntity(name: string): Entity | null {
        return this.entities.findEntity(name);
    }

    /**
     * 根据ID查找实体
     * @param id 实体ID
     */
    public findEntityById(id: number): Entity | null {
        return this.entities.findEntityById(id);
    }

    /**
     * 根据标签查找实体
     * @param tag 实体标签
     */
    public findEntitiesByTag(tag: number): Entity[] {
        const result: Entity[] = [];
        for (const entity of this.entities.buffer) {
            if (entity.tag === tag) {
                result.push(entity);
            }
        }
        return result;
    }

    /**
     * 根据名称查找实体（别名方法）
     * @param name 实体名称
     */
    public getEntityByName(name: string): Entity | null {
        return this.findEntity(name);
    }

    /**
     * 根据标签查找实体（别名方法）
     * @param tag 实体标签
     */
    public getEntitiesByTag(tag: number): Entity[] {
        return this.findEntitiesByTag(tag);
    }

    /**
     * 查询拥有所有指定组件的实体
     *
     * @param componentTypes - 组件类型数组
     * @returns 查询结果
     *
     * @example
     * ```typescript
     * const result = scene.queryAll(Position, Velocity);
     * for (const entity of result.entities) {
     *     const pos = entity.getComponent(Position);
     *     const vel = entity.getComponent(Velocity);
     * }
     * ```
     */
    public queryAll(...componentTypes: any[]): { entities: readonly Entity[] } {
        return this.querySystem.queryAll(...componentTypes);
    }

    /**
     * 查询拥有任意一个指定组件的实体
     *
     * @param componentTypes - 组件类型数组
     * @returns 查询结果
     */
    public queryAny(...componentTypes: any[]): { entities: readonly Entity[] } {
        return this.querySystem.queryAny(...componentTypes);
    }

    /**
     * 查询不包含指定组件的实体
     *
     * @param componentTypes - 组件类型数组
     * @returns 查询结果
     */
    public queryNone(...componentTypes: any[]): { entities: readonly Entity[] } {
        return this.querySystem.queryNone(...componentTypes);
    }

    /**
     * 创建类型安全的查询构建器
     *
     * @returns 查询构建器，支持链式调用
     *
     * @example
     * ```typescript
     * // 使用查询构建器
     * const matcher = scene.query()
     *     .withAll(Position, Velocity)
     *     .withNone(Disabled)
     *     .buildMatcher();
     *
     * // 在System中使用
     * class MovementSystem extends EntitySystem {
     *     constructor() {
     *         super(matcher);
     *     }
     * }
     * ```
     */
    public query(): TypedQueryBuilder {
        return new TypedQueryBuilder();
    }

    /**
     * 在场景中添加一个EntitySystem处理器
     *
     * 支持两种使用方式：
     * 1. 传入类型（推荐）：自动使用DI创建实例，支持@Injectable和@Inject装饰器
     * 2. 传入实例：直接使用提供的实例
     *
     * @param systemTypeOrInstance 系统类型或系统实例
     * @returns 添加的处理器实例
     *
     * @example
     * ```typescript
     * // 方式1：传入类型，自动DI（推荐）
     * @Injectable()
     * class PhysicsSystem extends EntitySystem {
     *     constructor(@Inject(CollisionSystem) private collision: CollisionSystem) {
     *         super(Matcher.empty().all(Transform));
     *     }
     * }
     * scene.addEntityProcessor(PhysicsSystem);
     *
     * // 方式2：传入实例
     * const system = new MySystem();
     * scene.addEntityProcessor(system);
     * ```
     */
    public addEntityProcessor<T extends EntitySystem>(
        systemTypeOrInstance: ServiceType<T> | T
    ): T {
        let system: T;
        let constructor: any;

        if (typeof systemTypeOrInstance === 'function') {
            constructor = systemTypeOrInstance;

            if (this._services.isRegistered(constructor)) {
                const existingSystem = this._services.resolve(constructor) as T;
                this.logger.debug(`System ${constructor.name} already registered, returning existing instance`);
                return existingSystem;
            }

            if (isInjectable(constructor)) {
                system = createInstance(constructor, this._services) as T;
            } else {
                system = new (constructor as any)() as T;
            }
        } else {
            system = systemTypeOrInstance;
            constructor = system.constructor;

            if (this._services.isRegistered(constructor)) {
                const existingSystem = this._services.resolve(constructor);
                if (existingSystem === system) {
                    this.logger.debug(`System ${constructor.name} instance already registered, returning it`);
                    return system;
                } else {
                    this.logger.warn(
                        `Attempting to register a different instance of ${constructor.name}, ` +
                        `but type is already registered. Returning existing instance.`
                    );
                    return existingSystem as T;
                }
            }
        }

        system.scene = this;

        system.setPerformanceMonitor(this.performanceMonitor);

        const metadata = getSystemMetadata(constructor);
        if (metadata?.updateOrder !== undefined) {
            system.setUpdateOrder(metadata.updateOrder);
        }
        if (metadata?.enabled !== undefined) {
            system.enabled = metadata.enabled;
        }

        this._services.registerInstance(constructor, system);

        // 标记系统列表已变化
        this.markSystemsOrderDirty();

        injectProperties(system, this._services);

        system.initialize();

        this.logger.debug(`System ${constructor.name} registered and initialized`);

        return system;
    }

    /**
     * 批量注册EntitySystem到场景（使用DI）
     *
     * 自动按照依赖顺序注册多个System。
     * 所有System必须使用@Injectable装饰器标记。
     *
     * @param systemTypes System类型数组
     * @returns 注册的System实例数组
     *
     * @example
     * ```typescript
     * @Injectable()
     * @ECSSystem('Collision', { updateOrder: 5 })
     * class CollisionSystem extends EntitySystem implements IService {
     *     constructor() { super(Matcher.empty().all(Collider)); }
     *     dispose() {}
     * }
     *
     * @Injectable()
     * @ECSSystem('Physics', { updateOrder: 10 })
     * class PhysicsSystem extends EntitySystem implements IService {
     *     constructor(@Inject(CollisionSystem) private collision: CollisionSystem) {
     *         super(Matcher.empty().all(Transform, RigidBody));
     *     }
     *     dispose() {}
     * }
     *
     * // 批量注册（自动解析依赖顺序）
     * scene.registerSystems([
     *     CollisionSystem,
     *     PhysicsSystem,  // 自动注入CollisionSystem
     *     RenderSystem
     * ]);
     * ```
     */
    public registerSystems(systemTypes: Array<ServiceType<EntitySystem>>): EntitySystem[] {
        const registeredSystems: EntitySystem[] = [];

        for (const systemType of systemTypes) {
            const system = this.addEntityProcessor(systemType);
            registeredSystems.push(system);
        }

        return registeredSystems;
    }

    /**
     * 添加系统到场景（addEntityProcessor的别名）
     * @param system 系统
     */
    public addSystem(system: EntitySystem) {
        return this.addEntityProcessor(system);
    }

    /**
     * 从场景中删除EntitySystem处理器
     * @param processor 要删除的处理器
     */
    public removeEntityProcessor(processor: EntitySystem): void {
        const constructor = processor.constructor as any;

        // 从ServiceContainer移除
        this._services.unregister(constructor);

        // 标记系统列表已变化
        this.markSystemsOrderDirty();

        // 重置System状态
        processor.reset();
    }

    /**
     * 从场景中删除系统（removeEntityProcessor的别名）
     * @param system 系统
     */
    public removeSystem(system: EntitySystem) {
        this.removeEntityProcessor(system);
    }

    /**
     * 获取指定类型的EntitySystem处理器
     *
     * @deprecated 推荐使用依赖注入代替此方法。使用 `scene.services.resolve(SystemType)` 或在System构造函数中使用 `@Inject(SystemType)` 装饰器。
     *
     * @param type 处理器类型
     * @returns 处理器实例，如果未找到则返回null
     *
     * @example
     * ```typescript
     * @Injectable()
     * class MySystem extends EntitySystem {
     *     constructor(@Inject(PhysicsSystem) private physics: PhysicsSystem) {
     *         super();
     *     }
     * }
     * ```
     */
    public getEntityProcessor<T extends EntitySystem>(type: new (...args: unknown[]) => T): T | null {
        return this._services.tryResolve(type as any) as T | null;
    }

    /**
     * 获取场景统计信息
     */
    public getStats(): {
        entityCount: number;
        processorCount: number;
        componentStorageStats: Map<string, any>;
    } {
        return {
            entityCount: this.entities.count,
            processorCount: this.systems.length,
            componentStorageStats: this.componentStorageManager.getAllStats()
        };
    }


    /**
     * 获取场景的调试信息
     */
    public getDebugInfo(): {
        name: string;
        entityCount: number;
        processorCount: number;
        isRunning: boolean;
        entities: Array<{
            name: string;
            id: number;
            componentCount: number;
            componentTypes: string[];
        }>;
        processors: Array<{
            name: string;
            updateOrder: number;
            entityCount: number;
        }>;
        componentStats: Map<string, any>;
    } {
        const systems = this.systems;
        return {
            name: this.name || this.constructor.name,
            entityCount: this.entities.count,
            processorCount: systems.length,
            isRunning: this._didSceneBegin,
            entities: this.entities.buffer.map(entity => ({
                name: entity.name,
                id: entity.id,
                componentCount: entity.components.length,
                componentTypes: entity.components.map(c => getComponentInstanceTypeName(c))
            })),
            processors: systems.map(processor => ({
                name: getSystemInstanceTypeName(processor),
                updateOrder: processor.updateOrder,
                entityCount: (processor as any)._entities?.length || 0
            })),
            componentStats: this.componentStorageManager.getAllStats()
        };
    }

    /**
     * 序列化场景
     *
     * 将场景及其所有实体、组件序列化为JSON字符串或二进制Uint8Array
     *
     * @param options 序列化选项
     * @returns 序列化后的数据（JSON字符串或二进制Uint8Array）
     *
     * @example
     * ```typescript
     * // JSON格式
     * const jsonData = scene.serialize({
     *     format: 'json',
     *     pretty: true
     * });
     *
     * // 二进制格式（更小、更快）
     * const binaryData = scene.serialize({
     *     format: 'binary'
     * });
     * ```
     */
    public serialize(options?: SceneSerializationOptions): string | Uint8Array {
        return SceneSerializer.serialize(this, options);
    }

    /**
     * 反序列化场景
     *
     * 从序列化数据恢复场景状态
     *
     * @param saveData 序列化的数据（JSON字符串或二进制Uint8Array）
     * @param options 反序列化选项
     *
     * @example
     * ```typescript
     * // 从JSON恢复（自动从ComponentRegistry获取组件类型）
     * scene.deserialize(jsonData, {
     *     strategy: 'replace'
     * });
     *
     * // 从二进制恢复
     * scene.deserialize(binaryData, {
     *     strategy: 'replace'
     * });
     * ```
     */
    public deserialize(saveData: string | Uint8Array, options?: SceneDeserializationOptions): void {
        SceneSerializer.deserialize(this, saveData, options);
    }

    // ==================== 增量序列化 API ====================

    /** 增量序列化的基础快照 */
    private _incrementalBaseSnapshot?: any;

    /**
     * 创建增量序列化的基础快照
     *
     * 在需要进行增量序列化前，先调用此方法创建基础快照
     *
     * @param options 序列化选项
     *
     * @example
     * ```typescript
     * // 创建基础快照
     * scene.createIncrementalSnapshot();
     *
     * // 进行一些修改...
     * entity.addComponent(new PositionComponent(100, 200));
     *
     * // 计算增量变更
     * const incremental = scene.serializeIncremental();
     * ```
     */
    public createIncrementalSnapshot(options?: IncrementalSerializationOptions): void {
        this._incrementalBaseSnapshot = IncrementalSerializer.createSnapshot(this, options);
    }

    /**
     * 增量序列化场景
     *
     * 只序列化相对于基础快照的变更部分
     *
     * @param options 序列化选项
     * @returns 增量快照对象
     *
     * @example
     * ```typescript
     * // 创建基础快照
     * scene.createIncrementalSnapshot();
     *
     * // 修改场景
     * const entity = scene.createEntity('NewEntity');
     * entity.addComponent(new PositionComponent(50, 100));
     *
     * // 获取增量变更
     * const incremental = scene.serializeIncremental();
     * console.log(`变更数量: ${incremental.entityChanges.length}`);
     *
     * // 序列化为JSON
     * const json = IncrementalSerializer.serializeIncremental(incremental);
     * ```
     */
    public serializeIncremental(options?: IncrementalSerializationOptions): IncrementalSnapshot {
        if (!this._incrementalBaseSnapshot) {
            throw new Error('必须先调用 createIncrementalSnapshot() 创建基础快照');
        }

        return IncrementalSerializer.computeIncremental(
            this,
            this._incrementalBaseSnapshot,
            options
        );
    }

    /**
     * 应用增量变更到场景
     *
     * @param incremental 增量快照数据（IncrementalSnapshot对象、JSON字符串或二进制Uint8Array）
     * @param componentRegistry 组件类型注册表（可选，默认使用全局注册表）
     *
     * @example
     * ```typescript
     * // 应用增量变更对象
     * scene.applyIncremental(incrementalSnapshot);
     *
     * // 从JSON字符串应用
     * const jsonData = IncrementalSerializer.serializeIncremental(snapshot, { format: 'json' });
     * scene.applyIncremental(jsonData);
     *
     * // 从二进制Uint8Array应用
     * const binaryData = IncrementalSerializer.serializeIncremental(snapshot, { format: 'binary' });
     * scene.applyIncremental(binaryData);
     * ```
     */
    public applyIncremental(
        incremental: IncrementalSnapshot | string | Uint8Array,
        componentRegistry?: Map<string, any>
    ): void {
        const isSerializedData = typeof incremental === 'string' ||
            incremental instanceof Uint8Array;

        const snapshot = isSerializedData
            ? IncrementalSerializer.deserializeIncremental(incremental as string | Uint8Array)
            : incremental as IncrementalSnapshot;

        const registry = componentRegistry || ComponentRegistry.getAllComponentNames() as Map<string, any>;

        IncrementalSerializer.applyIncremental(this, snapshot, registry);
    }

    /**
     * 更新增量快照基准
     *
     * 将当前场景状态设为新的增量序列化基准
     *
     * @param options 序列化选项
     *
     * @example
     * ```typescript
     * // 创建初始快照
     * scene.createIncrementalSnapshot();
     *
     * // 进行一些修改并序列化
     * const incremental1 = scene.serializeIncremental();
     *
     * // 更新基准，之后的增量将基于当前状态
     * scene.updateIncrementalSnapshot();
     *
     * // 继续修改
     * const incremental2 = scene.serializeIncremental();
     * ```
     */
    public updateIncrementalSnapshot(options?: IncrementalSerializationOptions): void {
        this.createIncrementalSnapshot(options);
    }

    /**
     * 清除增量快照
     *
     * 释放快照占用的内存
     */
    public clearIncrementalSnapshot(): void {
        this._incrementalBaseSnapshot = undefined;
    }

    /**
     * 检查是否有增量快照
     *
     * @returns 如果已创建增量快照返回true
     */
    public hasIncrementalSnapshot(): boolean {
        return this._incrementalBaseSnapshot !== undefined;
    }
}