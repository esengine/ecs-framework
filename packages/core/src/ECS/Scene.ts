import { Entity } from './Entity';
import { Component } from './Component';
import { EntityList } from './Utils/EntityList';
import { EntityProcessorList } from './Utils/EntityProcessorList';
import { IdentifierPool } from './Utils/IdentifierPool';
import { EntitySystem } from './Systems/EntitySystem';
import { ComponentStorageManager } from './Core/ComponentStorage';
import { QuerySystem } from './Core/QuerySystem';
import { TypeSafeEventSystem } from './Core/EventSystem';
import { EventBus } from './Core/EventBus';
import { IScene, ISceneConfig } from './IScene';
import { getComponentInstanceTypeName, getSystemInstanceTypeName } from './Decorators';
import { CommandBuffer } from './Core/CommandBuffer';
import { SceneCommandBufferContext } from './Core/CommandBuffer/SceneCommandBufferContext';
import { SnapshotManager, SnapshotManagerOptions } from './Core/Snapshot';

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
     * 副作用抑制标志
     * 
     * 当为true时，抑制事件派发、日志输出等副作用，用于回放/恢复期间。
     */
    public suspendEffects: boolean = false;
    public phase: 'Pre' | 'Sim' | 'Post' | 'Idle' = 'Idle';

    /**
     * 场景变更版本号
     * 
     * 每当场景状态发生变化时递增，用于高效的变更检测。
     * 替代昂贵的全局哈希计算，提供O(1)的变更检测性能。
     */
    private _version: number = 0;

    /**
     * 实体相关变更版本号
     * 
     * 跟踪实体创建、销毁等操作。
     */
    private _entityVersion: number = 0;

    /**
     * 组件相关变更版本号
     * 
     * 跟踪组件添加、移除、修改等操作。
     */
    private _componentVersion: number = 0;

    /**
     * 场景中的实体集合
     * 
     * 管理场景内所有实体的生命周期。
     */
    public readonly entities: EntityList;
    
    /**
     * 实体系统处理器集合
     * 
     * 管理场景内所有实体系统的执行。
     */
    public readonly entityProcessors: EntityProcessorList;

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
     * 命令缓冲器
     * 
     * 用于延迟和批处理结构性变更操作。
     */
    public readonly commandBuffer: CommandBuffer;

    /**
     * 快照管理器
     * 
     * 用于世界状态的捕获和恢复。
     */
    public readonly snapshotManager: SnapshotManager;
    
    /**
     * 场景是否已开始运行
     */
    private _didSceneBegin: boolean = false;

    /**
     * 获取系统列表（兼容性属性）
     */
    public get systems(): EntitySystem[] {
        return this.entityProcessors.processors;
    }


    /**
     * 创建场景实例
     */
    constructor(config?: ISceneConfig) {
        this.entities = new EntityList(this);
        this.entityProcessors = new EntityProcessorList();
        this.identifierPool = new IdentifierPool();
        this.componentStorageManager = new ComponentStorageManager();
        this.querySystem = new QuerySystem();
        this.eventSystem = new TypeSafeEventSystem();
        this.commandBuffer = new CommandBuffer(new SceneCommandBufferContext(this));
        
        const snapshotOptions: SnapshotManagerOptions = {
            windowFrames: config?.snapshot?.windowFrames ?? 60,
            enableAutoSnapshot: config?.snapshot?.enableAutoSnapshot ?? false,
            autoSnapshotInterval: config?.snapshot?.autoSnapshotInterval ?? 10
        };
        this.snapshotManager = new SnapshotManager(this, snapshotOptions);

        // 应用配置
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
     * 初始化场景
     * 
     * 在场景创建时调用，子类可以重写此方法来设置初始实体和组件。
     */
    public initialize(): void {
    }

    /**
     * 获取场景的当前版本号
     * 
     * 这是一个复合版本标识符，包含场景的所有变更信息。
     */
    public get version(): number {
        return this._version;
    }

    /**
     * 获取实体版本号
     */
    public get entityVersion(): number {
        return this._entityVersion;
    }

    /**
     * 获取组件版本号
     */
    public get componentVersion(): number {
        return this._componentVersion;
    }

    /**
     * 获取版本号字符串表示
     * 
     * 格式: "场景版本.实体版本.组件版本"
     * 用于调试和日志输出。
     */
    public getVersionString(): string {
        return `${this._version}.${this._entityVersion}.${this._componentVersion}`;
    }

    /**
     * 标记实体变更
     * 
     * 在实体创建、销毁等操作时调用。
     */
    public markEntityChanged(): void {
        this._entityVersion++;
        this._version++;
    }

    /**
     * 标记组件变更
     * 
     * 在组件添加、移除、修改等操作时调用。
     */
    public markComponentChanged(): void {
        this._componentVersion++;
        this._version++;
    }

    /**
     * 标记场景变更
     * 
     * 在场景级别的操作时调用。
     */
    public markSceneChanged(): void {
        this._version++;
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
        // 启动实体处理器
        if (this.entityProcessors != null)
            this.entityProcessors.begin();

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

        // 结束实体处理器
        if (this.entityProcessors)
            this.entityProcessors.end();

        // 调用卸载方法
        this.unload();
    }

    /**
     * 更新场景，更新实体组件、实体处理器等
     */
    public update() {
        this.phase = 'Pre';
        
        // 更新实体列表
        this.entities.updateLists();

        this.phase = 'Sim';
        
        // 更新实体处理器
        if (this.entityProcessors != null)
            this.entityProcessors.update();

        // 更新实体组
        this.entities.update();

        // 更新实体处理器的后处理方法
        if (this.entityProcessors != null)
            this.entityProcessors.lateUpdate();

        this.phase = 'Post';
        
        // 应用命令缓冲器的结构性变更
        this.commandBuffer.apply();

        // 更新快照管理器（处理自动快照等）
        this.snapshotManager.update();
        
        this.phase = 'Idle';
    }

    /**
     * 固定步长更新场景
     * 用于物理计算、网络同步等需要确定性更新的逻辑
     */
    public fixedUpdate() {
        this.phase = 'Sim';
        
        // 固定步长更新实体处理器
        if (this.entityProcessors != null) {
            for (const processor of this.entityProcessors.processors) {
                processor.fixedUpdate();
            }
        }

        this.phase = 'Post';

        // 在固定更新后也应用命令缓冲器
        this.commandBuffer.apply();
        
        this.phase = 'Idle';
    }

    /**
     * 将实体添加到此场景，并返回它
     * @param name 实体名称
     */
    public createEntity(name: string) {
        let entity = new Entity(name, this.identifierPool.checkOut());
        
        this.eventSystem.emitSync('entity:created', { entityName: name, entity, scene: this });
        
        // 标记实体变更
        this.markEntityChanged();
        
        return this.addEntity(entity);
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
        
        // 触发实体添加事件
        this.eventSystem.emitSync('entity:added', { entity, scene: this });
        
        // 标记实体变更 (仅在不是从createEntity调用时标记，避免重复)
        if (!entity.id) {
            this.markEntityChanged();
        }
        
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
     * 高性能批量创建实体并添加组件
     * 
     * @param count 要创建的实体数量
     * @param componentFactory 组件工厂函数，返回要添加到每个实体的组件数组
     * @param options 批量创建选项
     * @returns 创建的实体列表
     */
    public createEntitiesWithComponents<T extends Component>(
        count: number,
        componentFactory: (entityIndex: number) => T[],
        options: {
            namePrefix?: string;
            suppressLifecycle?: boolean;
            suppressEvents?: boolean;
            batchSize?: number;
        } = {}
    ): Entity[] {
        const namePrefix = options.namePrefix || "Entity";
        const batchSize = options.batchSize || Math.min(count, 100); // 默认批次大小
        const entities: Entity[] = [];
        
        // 暂时抑制副作用以提高性能
        const wasEffectsSuspended = this.suspendEffects;
        if (!options.suppressLifecycle && !options.suppressEvents) {
            this.suspendEffects = true;
        }
        
        try {
            // 分批处理以避免内存压力
            for (let batch = 0; batch < Math.ceil(count / batchSize); batch++) {
                const batchStart = batch * batchSize;
                const batchEnd = Math.min(batchStart + batchSize, count);
                const batchEntities: Entity[] = [];
                
                // 批次内创建实体
                for (let i = batchStart; i < batchEnd; i++) {
                    const entity = new Entity(`${namePrefix}_${i}`, this.identifierPool.checkOut());
                    entity.scene = this;
                    batchEntities.push(entity);
                    entities.push(entity);
                    
                    // 为实体添加组件（使用高性能批量方法）
                    const components = componentFactory(i);
                    if (components.length > 0) {
                        entity.addComponentsBatch(components, {
                            suppressLifecycle: options.suppressLifecycle,
                            suppressEvents: options.suppressEvents,
                            suppressQueryUpdate: true // 延迟到批次结束
                        });
                    }
                }
                
                // 批次内批量添加到实体系统
                for (const entity of batchEntities) {
                    this.entities.add(entity);
                }
                
                // 批量更新查询系统
                this.querySystem.addEntitiesUnchecked(batchEntities);
            }
            
            // 恢复副作用状态
            this.suspendEffects = wasEffectsSuspended;
            
            // 如果未抑制生命周期，批量调用
            if (!options.suppressLifecycle && wasEffectsSuspended !== true) {
                for (const entity of entities) {
                    for (const component of entity.components) {
                        component.onAddedToEntity();
                    }
                }
            }
            
            // 批量事件通知
            if (!options.suppressEvents) {
                this.eventSystem.emitSync('entities:batch_created_with_components', {
                    entities,
                    scene: this,
                    count,
                    totalComponents: entities.reduce((sum, e) => sum + e.components.length, 0)
                });
            }
            
            return entities;
            
        } catch (error) {
            // 出错时恢复副作用状态
            this.suspendEffects = wasEffectsSuspended;
            throw error;
        }
    }


    /**
     * 从场景中删除所有实体
     */
    public destroyAllEntities() {
        this.entities.removeAllEntities();
        
        // 清理查询系统中的实体引用和缓存
        this.querySystem.setEntities([]);
        
        // 标记实体变更
        this.markEntityChanged();
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
     * 在场景中添加一个EntitySystem处理器
     * @param processor 处理器
     */
    public addEntityProcessor(processor: EntitySystem) {
        if (this.entityProcessors.processors.includes(processor)) {
            return processor;
        }
        
        processor.scene = this;
        this.entityProcessors.add(processor);
        processor.initialize();
        processor.setUpdateOrder(this.entityProcessors.count - 1);
        return processor;
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
    public removeEntityProcessor(processor: EntitySystem) {
        this.entityProcessors.remove(processor);
        processor.reset();
        processor.scene = null;
    }

    /**
     * 获取指定类型的EntitySystem处理器
     * @param type 处理器类型
     */
    public getEntityProcessor<T extends EntitySystem>(type: new (...args: unknown[]) => T): T | null {
        return this.entityProcessors.getProcessor(type);
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
            processorCount: this.entityProcessors.count,
            componentStorageStats: this.componentStorageManager.getAllStats()
        };
    }

    /**
     * 压缩组件存储（清理碎片）
     */
    public compactComponentStorage(): void {
        this.componentStorageManager.compactAll();
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
        return {
            name: this.name || this.constructor.name,
            entityCount: this.entities.count,
            processorCount: this.entityProcessors.count,
            isRunning: this._didSceneBegin,
            entities: this.entities.buffer.map(entity => ({
                name: entity.name,
                id: entity.id,
                componentCount: entity.components.length,
                componentTypes: entity.components.map(c => getComponentInstanceTypeName(c))
            })),
            processors: this.entityProcessors.processors.map(processor => ({
                name: getSystemInstanceTypeName(processor),
                updateOrder: processor.updateOrder,
                entityCount: (processor as any)._entities?.length || 0
            })),
            componentStats: this.componentStorageManager.getAllStats()
        };
    }
}