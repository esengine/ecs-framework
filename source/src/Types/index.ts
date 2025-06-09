/**
 * 框架核心类型定义
 */

/** 更新顺序比较器接口 */
export interface IUpdateOrderComparable {
    updateOrder: number;
}

/** 日志类型枚举 */
export enum LogType {
    Error = 0,
    Assert = 1,
    Warning = 2,
    Log = 3,
    Exception = 4
}

/** 组件变换类型枚举 */
export enum ComponentTransform {
    Position = 1,
    Scale = 2,
    Rotation = 4
}

/**
 * 组件接口
 * 
 * 定义组件的基本契约，所有组件都应该实现此接口
 */
export interface IComponent {
    /** 组件唯一标识符 */
    readonly id: number;
    /** 组件所属的实体ID */
    entityId?: string | number;
    /** 组件启用状态 */
    enabled: boolean;
    /** 更新顺序 */
    updateOrder: number;
    
    /** 组件添加到实体时的回调 */
    onAddedToEntity(): void;
    /** 组件从实体移除时的回调 */
    onRemovedFromEntity(): void;
    /** 组件启用时的回调 */
    onEnabled(): void;
    /** 组件禁用时的回调 */
    onDisabled(): void;
    /** 更新组件 */
    update(): void;
}

/**
 * 实体接口
 * 
 * 定义实体的基本契约，所有实体都应该实现此接口
 */
export interface IEntity {
    /** 实体唯一标识符 */
    readonly id: string | number;
    /** 实体名称 */
    name: string;
    /** 实体激活状态 */
    active: boolean;
    /** 实体启用状态 */
    enabled: boolean;
    /** 实体是否已销毁 */
    readonly isDestroyed: boolean;
    /** 更新顺序 */
    updateOrder: number;
    /** 实体标签 */
    tag: number;
    
    /** 添加组件 */
    addComponent<T extends IComponent>(component: T): T;
    /** 创建并添加组件 */
    createComponent<T extends IComponent>(componentType: ComponentType<T>, ...args: any[]): T;
    /** 获取组件 */
    getComponent<T extends IComponent>(type: ComponentType<T>): T | null;
    /** 获取或创建组件 */
    getOrCreateComponent<T extends IComponent>(type: ComponentType<T>, ...args: any[]): T;
    /** 移除组件 */
    removeComponent(component: IComponent): void;
    /** 通过类型移除组件 */
    removeComponentByType<T extends IComponent>(type: ComponentType<T>): T | null;
    /** 检查是否有组件 */
    hasComponent<T extends IComponent>(type: ComponentType<T>): boolean;
    /** 获取所有指定类型的组件 */
    getComponents<T extends IComponent>(type: ComponentType<T>): T[];
    
    /** 添加子实体 */
    addChild(child: IEntity): IEntity;
    /** 移除子实体 */
    removeChild(child: IEntity): boolean;
    /** 查找子实体 */
    findChild(name: string, recursive?: boolean): IEntity | null;
    
    /** 更新实体 */
    update(): void;
    /** 销毁实体 */
    destroy(): void;
}

/**
 * 实体基础接口（向后兼容）
 * 
 * 为现有的Entity类提供更灵活的类型定义
 */
export interface IEntityBase {
    /** 实体唯一标识符 */
    readonly id: string | number;
    /** 实体名称 */
    name: string;
    /** 实体激活状态 */
    active: boolean;
    /** 实体启用状态 */
    enabled: boolean;
    /** 实体是否已销毁 */
    readonly isDestroyed: boolean;
    /** 更新顺序 */
    updateOrder: number;
    /** 实体标签 */
    tag: number;
    
    /** 添加组件（泛型版本） */
    addComponent<T>(component: T): T;
    /** 获取组件（泛型版本） */
    getComponent<T>(type: ComponentClass<T>): T | null;
    /** 检查是否有组件（泛型版本） */
    hasComponent<T>(type: ComponentClass<T>): boolean;
    
    /** 添加子实体 */
    addChild(child: any): any;
    /** 移除子实体 */
    removeChild(child: any): boolean;
    /** 查找子实体 */
    findChild(name: string, recursive?: boolean): any;
    
    /** 更新实体 */
    update(): void;
    /** 销毁实体 */
    destroy(): void;
}

/**
 * 系统接口
 * 
 * 定义系统的基本契约，所有系统都应该实现此接口
 */
export interface ISystem {
    /** 系统名称 */
    readonly systemName: string;
    /** 系统处理的实体列表 */
    readonly entities: readonly IEntity[];
    /** 更新顺序/优先级 */
    updateOrder: number;
    /** 系统启用状态 */
    enabled: boolean;
    
    /** 系统初始化 */
    initialize(): void;
    /** 更新系统（主要处理阶段） */
    update(): void;
    /** 延迟更新系统 */
    lateUpdate?(): void;
    
    /** 当实体添加到系统时的回调 */
    onEntityAdded?(entity: IEntity): void;
    /** 当实体从系统移除时的回调 */
    onEntityRemoved?(entity: IEntity): void;
    /** 当实体组件发生变化时的回调 */
    onEntityChanged?(entity: IEntity): void;
}

/**
 * 系统基础接口（向后兼容）
 * 
 * 为现有的EntitySystem类提供更灵活的类型定义
 */
export interface ISystemBase {
    /** 系统名称 */
    readonly systemName: string;
    /** 系统处理的实体列表（泛型版本） */
    readonly entities: readonly any[];
    /** 更新顺序/优先级 */
    updateOrder: number;
    /** 系统启用状态 */
    enabled: boolean;
    
    /** 系统初始化 */
    initialize(): void;
    /** 更新系统（主要处理阶段） */
    update(): void;
    /** 延迟更新系统 */
    lateUpdate?(): void;
}

/**
 * 场景接口
 * 
 * 定义场景的基本契约
 */
export interface IScene {
    /** 场景名称 */
    name: string;
    /** 场景中的实体列表 */
    readonly entities: readonly IEntity[];
    /** 场景中的系统列表 */
    readonly systems: readonly ISystem[];
    
    /** 创建实体 */
    createEntity(name: string): IEntity;
    /** 添加实体到场景 */
    addEntity(entity: IEntity): void;
    /** 从场景移除实体 */
    removeEntity(entity: IEntity): void;
    /** 查找实体 */
    findEntity(name: string): IEntity | null;
    
    /** 添加系统到场景 */
    addSystem<T extends ISystem>(system: T): T;
    /** 从场景移除系统 */
    removeSystem(system: ISystem): void;
    /** 获取系统 */
    getSystem<T extends ISystem>(systemType: new (...args: any[]) => T): T | null;
    
    /** 更新场景 */
    update(): void;
}

/**
 * 组件类型定义
 * 
 * 用于类型安全的组件操作
 */
export type ComponentType<T extends IComponent = IComponent> = new (...args: any[]) => T;

/**
 * 原始组件类型（向后兼容）
 * 
 * 用于与现有Component类的兼容
 */
export type ComponentClass<T = any> = new (...args: any[]) => T;

/**
 * 实体查询匹配器接口
 * 
 * 用于查询符合特定条件的实体
 */
export interface IMatcher {
    /** 必须包含的组件类型 */
    all(...componentTypes: ComponentType[]): IMatcher;
    /** 至少包含其中一个组件类型 */
    any(...componentTypes: ComponentType[]): IMatcher;
    /** 不能包含的组件类型 */
    exclude(...componentTypes: ComponentType[]): IMatcher;
    /** 检查实体是否匹配 */
    isInterestedEntity(entity: IEntity): boolean;
}

/**
 * 性能监控接口
 */
export interface IPerformanceData {
    /** 执行时间（毫秒） */
    executionTime: number;
    /** 调用次数 */
    callCount: number;
    /** 平均执行时间 */
    averageTime: number;
    /** 最大执行时间 */
    maxTime: number;
    /** 最小执行时间 */
    minTime: number;
}

/**
 * 生命周期管理接口
 */
export interface ILifecycle {
    /** 初始化 */
    initialize?(): void;
    /** 启动 */
    start?(): void;
    /** 更新 */
    update?(): void;
    /** 延迟更新 */
    lateUpdate?(): void;
    /** 停止 */
    stop?(): void;
    /** 销毁 */
    destroy?(): void;
}

/**
 * 实体管理器接口
 * 
 * 提供统一的实体管理和查询机制，支持高效的实体操作
 */
export interface IEntityManager {
    /** 所有实体数量 */
    readonly entityCount: number;
    /** 激活的实体数量 */
    readonly activeEntityCount: number;
    
    /** 创建实体 */
    createEntity(name?: string): IEntity;
    /** 销毁实体 */
    destroyEntity(entity: IEntity | string | number): boolean;
    /** 批量销毁实体 */
    destroyEntities(entities: (IEntity | string | number)[]): number;
    /** 销毁所有实体 */
    destroyAllEntities(): number;
    
    /** 根据ID获取实体 */
    getEntity(id: string | number): IEntity | null;
    /** 根据名称获取实体 */
    getEntityByName(name: string): IEntity | null;
    /** 根据名称获取所有实体 */
    getEntitiesByName(name: string): IEntity[];
    /** 根据标签获取实体 */
    getEntitiesByTag(tag: number): IEntity[];
    /** 获取所有实体 */
    getAllEntities(): IEntity[];
    /** 获取所有激活的实体 */
    getActiveEntities(): IEntity[];
    
    /** 获取拥有指定组件的实体 */
    getEntitiesWithComponent<T extends IComponent>(componentType: ComponentType<T>): IEntity[];
    /** 获取拥有指定组件的实体及其组件 */
    getEntitiesWithComponentData<T extends IComponent>(componentType: ComponentType<T>): Array<{entity: IEntity, component: T}>;
    /** 获取拥有所有指定组件的实体 */
    getEntitiesWithComponents(...componentTypes: ComponentType[]): IEntity[];
    /** 获取拥有任一指定组件的实体 */
    getEntitiesWithAnyComponent(...componentTypes: ComponentType[]): IEntity[];
    /** 获取不包含指定组件的实体 */
    getEntitiesWithoutComponent<T extends IComponent>(componentType: ComponentType<T>): IEntity[];
    
    /** 对所有实体执行操作 */
    forEachEntity(action: (entity: IEntity) => void): void;
    /** 对符合条件的实体执行操作 */
    forEachEntityWhere(predicate: (entity: IEntity) => boolean, action: (entity: IEntity) => void): void;
    /** 对拥有指定组件的实体执行操作 */
    forEachEntityWithComponent<T extends IComponent>(
        componentType: ComponentType<T>, 
        action: (entity: IEntity, component: T) => void
    ): void;
    
    /** 查找第一个符合条件的实体 */
    findEntity(predicate: (entity: IEntity) => boolean): IEntity | null;
    /** 查找所有符合条件的实体 */
    findEntities(predicate: (entity: IEntity) => boolean): IEntity[];
    
    /** 获取统计信息 */
    getStatistics(): {
        totalEntities: number;
        activeEntities: number;
        destroyedEntities: number;
        entitiesByTag: Map<number, number>;
        componentsCount: Map<string, number>;
    };
    
    /** 清理已销毁的实体 */
    cleanup(): number;
    /** 压缩存储空间 */
    compact(): void;
}

/**
 * 实体查询构建器接口
 * 
 * 提供流式API构建复杂的实体查询条件
 */
export interface IEntityQueryBuilder {
    /** 必须包含所有指定组件 */
    withAll(...componentTypes: ComponentType[]): IEntityQueryBuilder;
    /** 必须包含任一指定组件 */
    withAny(...componentTypes: ComponentType[]): IEntityQueryBuilder;
    /** 必须不包含指定组件 */
    without(...componentTypes: ComponentType[]): IEntityQueryBuilder;
    /** 必须包含指定标签 */
    withTag(tag: number): IEntityQueryBuilder;
    /** 必须不包含指定标签 */
    withoutTag(tag: number): IEntityQueryBuilder;
    /** 必须处于激活状态 */
    active(): IEntityQueryBuilder;
    /** 必须处于启用状态 */
    enabled(): IEntityQueryBuilder;
    /** 自定义过滤条件 */
    where(predicate: (entity: IEntity) => boolean): IEntityQueryBuilder;
    
    /** 执行查询，返回所有匹配的实体 */
    execute(): IEntity[];
    /** 执行查询，返回第一个匹配的实体 */
    first(): IEntity | null;
    /** 执行查询，返回匹配实体的数量 */
    count(): number;
    /** 对查询结果执行操作 */
    forEach(action: (entity: IEntity) => void): void;
}

/**
 * 事件总线接口
 * 提供类型安全的事件发布订阅机制
 */
export interface IEventBus {
    /**
     * 发射事件
     * @param eventType 事件类型
     * @param data 事件数据
     */
    emit<T>(eventType: string, data: T): void;
    
    /**
     * 异步发射事件
     * @param eventType 事件类型
     * @param data 事件数据
     */
    emitAsync<T>(eventType: string, data: T): Promise<void>;
    
    /**
     * 监听事件
     * @param eventType 事件类型
     * @param handler 事件处理器
     * @param config 监听器配置
     * @returns 监听器ID
     */
    on<T>(eventType: string, handler: (data: T) => void, config?: IEventListenerConfig): string;
    
    /**
     * 监听事件（一次性）
     * @param eventType 事件类型
     * @param handler 事件处理器
     * @param config 监听器配置
     * @returns 监听器ID
     */
    once<T>(eventType: string, handler: (data: T) => void, config?: IEventListenerConfig): string;
    
    /**
     * 异步监听事件
     * @param eventType 事件类型
     * @param handler 异步事件处理器
     * @param config 监听器配置
     * @returns 监听器ID
     */
    onAsync<T>(eventType: string, handler: (data: T) => Promise<void>, config?: IEventListenerConfig): string;
    
    /**
     * 移除事件监听器
     * @param eventType 事件类型
     * @param listenerId 监听器ID
     */
    off(eventType: string, listenerId: string): boolean;
    
    /**
     * 移除指定事件类型的所有监听器
     * @param eventType 事件类型
     */
    offAll(eventType: string): void;
    
    /**
     * 检查是否有指定事件的监听器
     * @param eventType 事件类型
     */
    hasListeners(eventType: string): boolean;
    
    /**
     * 获取事件统计信息
     * @param eventType 事件类型（可选）
     */
    getStats(eventType?: string): IEventStats | Map<string, IEventStats>;
    
    /**
     * 清空所有监听器
     */
    clear(): void;
}

/**
 * 事件监听器配置接口
 */
export interface IEventListenerConfig {
    /** 是否只执行一次 */
    once?: boolean;
    /** 优先级（数字越大优先级越高） */
    priority?: number;
    /** 是否异步执行 */
    async?: boolean;
    /** 执行上下文 */
    context?: any;
}

/**
 * 事件统计信息接口
 */
export interface IEventStats {
    /** 事件类型 */
    eventType: string;
    /** 监听器数量 */
    listenerCount: number;
    /** 触发次数 */
    triggerCount: number;
    /** 总执行时间（毫秒） */
    totalExecutionTime: number;
    /** 平均执行时间（毫秒） */
    averageExecutionTime: number;
    /** 最后触发时间 */
    lastTriggerTime: number;
}

/**
 * 事件数据基类接口
 */
export interface IEventData {
    /** 事件时间戳 */
    timestamp: number;
    /** 事件来源 */
    source?: string;
    /** 事件ID */
    eventId?: string;
}

/**
 * 实体事件数据接口
 */
export interface IEntityEventData extends IEventData {
    /** 实体ID */
    entityId: number;
    /** 实体名称 */
    entityName?: string;
    /** 实体标签 */
    entityTag?: string;
}

/**
 * 组件事件数据接口
 */
export interface IComponentEventData extends IEntityEventData {
    /** 组件类型名称 */
    componentType: string;
    /** 组件实例 */
    component?: IComponent;
}

/**
 * 系统事件数据接口
 */
export interface ISystemEventData extends IEventData {
    /** 系统名称 */
    systemName: string;
    /** 系统类型 */
    systemType: string;
}

/**
 * 场景事件数据接口
 */
export interface ISceneEventData extends IEventData {
    /** 场景名称 */
    sceneName: string;
    /** 前一个场景名称 */
    previousSceneName?: string;
}

/**
 * 性能事件数据接口
 */
export interface IPerformanceEventData extends IEventData {
    /** 操作类型 */
    operation: string;
    /** 执行时间（毫秒） */
    executionTime: number;
    /** 内存使用量 */
    memoryUsage?: number;
    /** 额外数据 */
    metadata?: Record<string, any>;
} 