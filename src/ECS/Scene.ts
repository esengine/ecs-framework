import { Entity } from './Entity';
import { EntityList } from './Utils/EntityList';
import { EntityProcessorList } from './Utils/EntityProcessorList';
import { IdentifierPool } from './Utils/IdentifierPool';
import { EntitySystem } from './Systems/EntitySystem';
import { ComponentStorageManager } from './Core/ComponentStorage';
import { QuerySystem } from './Core/QuerySystem';
import { TypeSafeEventSystem, GlobalEventSystem } from './Core/EventSystem';
import type { IScene } from '../Types';

/**
 * 游戏场景类
 * 
 * 管理游戏场景中的所有实体和系统，提供场景生命周期管理。
 * 场景是游戏世界的容器，负责协调实体和系统的运行。
 * 
 * @example
 * ```typescript
 * class GameScene extends Scene {
 *     public initialize(): void {
 *         // 创建游戏实体
 *         const player = this.createEntity("Player");
 *         
 *         // 添加系统
 *         this.addEntityProcessor(new MovementSystem());
 *     }
 * }
 * ```
 */
export class Scene {
    /**
     * 场景名称
     * 
     * 用于标识和调试的友好名称。
     */
    public name: string = "";

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
     * @param enableWasmAcceleration 是否启用WebAssembly加速，默认为true
     */
    constructor(enableWasmAcceleration: boolean = true) {
        this.entities = new EntityList(this);
        this.entityProcessors = new EntityProcessorList();
        this.identifierPool = new IdentifierPool();
        this.componentStorageManager = new ComponentStorageManager();
        this.querySystem = new QuerySystem();
        this.eventSystem = new TypeSafeEventSystem();

        this.initialize();
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
        // 更新实体列表
        this.entities.updateLists();

        // 更新实体处理器
        if (this.entityProcessors != null)
            this.entityProcessors.update();

        // 更新实体组
        this.entities.update();

        // 更新实体处理器的后处理方法
        if (this.entityProcessors != null)
            this.entityProcessors.lateUpdate();
    }

    /**
     * 将实体添加到此场景，并返回它
     * @param name 实体名称
     */
    public createEntity(name: string) {
        let entity = new Entity(name, this.identifierPool.checkOut());
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
     * 批量创建实体
     * @param count 要创建的实体数量
     * @param namePrefix 实体名称前缀
     * @returns 创建的实体列表
     */
    public createEntitiesOld(count: number, namePrefix: string = "Entity"): Entity[] {
        const entities: Entity[] = [];
        
        // 批量创建实体，延迟缓存清理
        for (let i = 0; i < count; i++) {
            const entity = new Entity(`${namePrefix}_${i}`, this.identifierPool.checkOut());
            entities.push(entity);
            this.addEntity(entity, true); // 延迟缓存清理
        }
        
        // 最后统一清理缓存
        this.querySystem.clearCache();
        
        return entities;
    }

    /**
     * 从场景中删除所有实体
     */
    public destroyAllEntities() {
        for (let i = 0; i < this.entities.count; i++) {
            this.entities.buffer[i].destroy();
        }
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
        processor.scene = this;
        this.entityProcessors.add(processor);

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
    }

    /**
     * 获取指定类型的EntitySystem处理器
     * @param type 处理器类型
     */
    public getEntityProcessor<T extends EntitySystem>(type: new (...args: any[]) => T): T | null {
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
            name: this.constructor.name,
            entityCount: this.entities.count,
            processorCount: this.entityProcessors.count,
            isRunning: this._didSceneBegin,
            entities: this.entities.buffer.map(entity => ({
                name: entity.name,
                id: entity.id,
                componentCount: entity.components.length,
                componentTypes: entity.components.map(c => c.constructor.name)
            })),
            processors: this.entityProcessors.processors.map(processor => ({
                name: processor.constructor.name,
                updateOrder: processor.updateOrder,
                entityCount: (processor as any)._entities?.length || 0
            })),
            componentStats: this.componentStorageManager.getAllStats()
        };
    }
}