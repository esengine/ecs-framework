import { Entity } from './Entity';
import { EntityList } from './Utils/EntityList';
import { IdentifierPool } from './Utils/IdentifierPool';
import { EntitySystem } from './Systems/EntitySystem';
import { ComponentStorageManager } from './Core/ComponentStorage';
import { QuerySystem } from './Core/QuerySystem';
import { TypeSafeEventSystem } from './Core/EventSystem';
import type { ReferenceTracker } from './Core/ReferenceTracker';
import type { ServiceContainer, ServiceType } from '../Core/ServiceContainer';
import type { TypedQueryBuilder } from './Core/Query/TypedQuery';
import type { SceneSerializationOptions, SceneDeserializationOptions } from './Serialization/SceneSerializer';
import type { IncrementalSnapshot, IncrementalSerializationOptions } from './Serialization/IncrementalSerializer';

/**
 * 场景接口定义
 *
 * 定义场景应该实现的核心功能和属性，使用接口而非继承提供更灵活的实现方式。
 */
export interface IScene {
    /**
     * 场景名称
     */
    name: string;

    /**
     * 场景自定义数据
     *
     * 用于存储场景级别的配置和状态数据，例如：
     * - 天气状态
     * - 时间设置
     * - 游戏难度
     * - 音频配置
     * - 关卡检查点
     *
     * @example
     * ```typescript
     * scene.sceneData.set('weather', 'rainy');
     * scene.sceneData.set('timeOfDay', 14.5);
     * scene.sceneData.set('checkpoint', { x: 100, y: 200 });
     * ```
     */
    readonly sceneData: Map<string, any>;

    /**
     * 场景中的实体集合
     */
    readonly entities: EntityList;

    /**
     * 标识符池
     */
    readonly identifierPool: IdentifierPool;

    /**
     * 组件存储管理器
     */
    readonly componentStorageManager: ComponentStorageManager;

    /**
     * 查询系统
     */
    readonly querySystem: QuerySystem;

    /**
     * 事件系统
     */
    readonly eventSystem: TypeSafeEventSystem;

    /**
     * 引用追踪器
     */
    readonly referenceTracker: ReferenceTracker;

    /**
     * 服务容器
     *
     * 场景级别的依赖注入容器，用于管理服务的生命周期。
     */
    readonly services: ServiceContainer;

    /**
     * 获取系统列表
     */
    readonly systems: EntitySystem[];

    /**
     * 初始化场景
     */
    initialize(): void;

    /**
     * 场景开始运行时的回调
     */
    onStart(): void;

    /**
     * 场景卸载时的回调
     */
    unload(): void;

    /**
     * 开始场景
     */
    begin(): void;

    /**
     * 结束场景
     */
    end(): void;

    /**
     * 更新场景
     */
    update(): void;

    /**
     * 创建实体
     */
    createEntity(name: string): Entity;

    /**
     * 清除所有EntitySystem的实体缓存
     */
    clearSystemEntityCaches(): void;

    /**
     * 添加实体
     */
    addEntity(entity: Entity, deferCacheClear?: boolean): Entity;

    /**
     * 批量创建实体
     */
    createEntities(count: number, namePrefix?: string): Entity[];

    /**
     * 销毁所有实体
     */
    destroyAllEntities(): void;

    /**
     * 查找实体
     */
    findEntity(name: string): Entity | null;

    /**
     * 根据标签查找实体
     */
    findEntitiesByTag(tag: number): Entity[];

    /**
     * 添加实体处理器
     */
    addEntityProcessor(processor: EntitySystem): EntitySystem;

    /**
     * 移除实体处理器
     */
    removeEntityProcessor(processor: EntitySystem): void;

    /**
     * 获取实体处理器
     */
    getEntityProcessor<T extends EntitySystem>(type: new (...args: any[]) => T): T | null;

    /**
     * 根据ID查找实体
     */
    findEntityById(id: number): Entity | null;

    /**
     * 根据名称查找实体
     */
    getEntityByName(name: string): Entity | null;

    /**
     * 根据标签查找实体
     */
    getEntitiesByTag(tag: number): Entity[];

    /**
     * 批量销毁实体
     */
    destroyEntities(entities: Entity[]): void;

    /**
     * 查询拥有所有指定组件的实体
     */
    queryAll(...componentTypes: any[]): { entities: readonly Entity[] };

    /**
     * 查询拥有任意一个指定组件的实体
     */
    queryAny(...componentTypes: any[]): { entities: readonly Entity[] };

    /**
     * 查询不包含指定组件的实体
     */
    queryNone(...componentTypes: any[]): { entities: readonly Entity[] };

    /**
     * 创建类型安全的查询构建器
     */
    query(): TypedQueryBuilder;

    /**
     * 通过类型获取System实例
     */
    getSystem<T extends EntitySystem>(systemType: ServiceType<T>): T | null;

    /**
     * 批量注册EntitySystem到场景
     */
    registerSystems(systemTypes: Array<ServiceType<EntitySystem>>): EntitySystem[];

    /**
     * 添加系统到场景
     */
    addSystem(system: EntitySystem): EntitySystem;

    /**
     * 从场景中删除系统
     */
    removeSystem(system: EntitySystem): void;

    /**
     * 获取场景统计信息
     */
    getStats(): {
        entityCount: number;
        processorCount: number;
        componentStorageStats: Map<string, any>;
    };

    /**
     * 获取场景的调试信息
     */
    getDebugInfo(): {
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
    };

    /**
     * 序列化场景
     */
    serialize(options?: SceneSerializationOptions): string | Uint8Array;

    /**
     * 反序列化场景
     */
    deserialize(saveData: string | Uint8Array, options?: SceneDeserializationOptions): void;

    /**
     * 创建增量序列化的基础快照
     */
    createIncrementalSnapshot(options?: IncrementalSerializationOptions): void;

    /**
     * 增量序列化场景
     */
    serializeIncremental(options?: IncrementalSerializationOptions): IncrementalSnapshot;

    /**
     * 应用增量变更到场景
     */
    applyIncremental(
        incremental: IncrementalSnapshot | string | Uint8Array,
        componentRegistry?: Map<string, any>
    ): void;

    /**
     * 更新增量快照基准
     */
    updateIncrementalSnapshot(options?: IncrementalSerializationOptions): void;

    /**
     * 清除增量快照
     */
    clearIncrementalSnapshot(): void;

    /**
     * 检查是否有增量快照
     */
    hasIncrementalSnapshot(): boolean;
}

/**
 * 场景工厂接口
 */
export interface ISceneFactory<T extends IScene> {
    /**
     * 创建场景实例
     */
    createScene(): T;
}

/**
 * 场景配置接口
 */
export interface ISceneConfig {
    /**
     * 场景名称
     */
    name?: string;
}
