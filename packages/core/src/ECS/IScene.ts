import { Entity } from './Entity';
import { EntityList } from './Utils/EntityList';
import { IdentifierPool } from './Utils/IdentifierPool';
import { EntitySystem } from './Systems/EntitySystem';
import { ComponentStorageManager } from './Core/ComponentStorage';
import { QuerySystem } from './Core/QuerySystem';
import { TypeSafeEventSystem } from './Core/EventSystem';

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

    /**
     * 性能监控器实例（可选）
     *
     * 如果不提供，Scene会自动从Core.services获取全局PerformanceMonitor。
     * 提供此参数可以实现场景级别的独立性能监控。
     */
    performanceMonitor?: any;
}