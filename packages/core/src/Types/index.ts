/**
 * 框架核心类型定义
 */

import type { IWorldManagerConfig } from '../ECS';

// 导出TypeScript类型增强工具
export * from './TypeHelpers';
export * from './IUpdatable';

/**
 * 组件接口
 *
 * 定义组件的基本契约。
 * 在 ECS 架构中，组件应该是纯数据容器，不包含业务逻辑。
 */
export interface IComponent {
    /** 组件唯一标识符 */
    readonly id: number;
    /** 组件所属的实体ID */
    entityId: number | null;

    /** 组件添加到实体时的回调 */
    onAddedToEntity(): void;
    /** 组件从实体移除时的回调 */
    onRemovedFromEntity(): void;
    /** 组件反序列化后的回调 */
    onDeserialized(): void | Promise<void>;
}

/**
 * 系统基础接口
 *
 * 为现有的EntitySystem类提供类型定义
 */
export interface ISystemBase {
    /** 系统名称 */
    readonly systemName: string;
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
    /** 事件处理函数的 this 绑定对象 */
    thisArg?: object;
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
    metadata?: Record<string, unknown>;
}

/**
 * ECS调试配置接口
 */
export interface IECSDebugConfig {
    /** 是否启用调试 */
    enabled: boolean;
    /** WebSocket服务器URL */
    websocketUrl: string;
    /** 是否自动重连 */
    autoReconnect?: boolean;
    /** 数据更新间隔（毫秒）- 已弃用，使用debugFrameRate替代 */
    updateInterval?: number;
    /** 调试数据发送帧率 (60fps, 30fps, 15fps) */
    debugFrameRate?: 60 | 30 | 15;
    /** 数据通道配置 */
    channels: {
        entities: boolean;
        systems: boolean;
        performance: boolean;
        components: boolean;
        scenes: boolean;
    };
}

/**
 * Core配置接口
 */
export interface ICoreConfig {
    /** 是否启用调试模式 */
    debug?: boolean;
    /** 调试配置 */
    debugConfig?: IECSDebugConfig;
    /** WorldManager配置 */
    worldManagerConfig?: IWorldManagerConfig;
}

/**
 * ECS调试数据接口
 */
export interface IECSDebugData {
    /** 时间戳 */
    timestamp: number;
    /** 框架版本 */
    frameworkVersion?: string;
    /** 是否正在运行 */
    isRunning: boolean;
    /** 框架是否已加载 */
    frameworkLoaded: boolean;
    /** 当前场景名称 */
    currentScene: string;
    /** 实体数据 */
    entities?: IEntityDebugData;
    /** 系统数据 */
    systems?: ISystemDebugData;
    /** 性能数据 */
    performance?: IPerformanceDebugData;
    /** 组件数据 */
    components?: IComponentDebugData;
    /** 场景数据 */
    scenes?: ISceneDebugData;
}

/**
 * 实体层次结构节点接口
 */
export interface IEntityHierarchyNode {
    id: number;
    name: string;
    active: boolean;
    enabled: boolean;
    activeInHierarchy: boolean;
    componentCount: number;
    componentTypes: string[];
    parentId: number | null;
    children: IEntityHierarchyNode[];
    depth: number;
    tag: number;
    updateOrder: number;
}

/**
 * 实体调试数据接口
 */
export interface IEntityDebugData {
    /** 总实体数 */
    totalEntities: number;
    /** 激活实体数 */
    activeEntities: number;
    /** 待添加实体数 */
    pendingAdd: number;
    /** 待移除实体数 */
    pendingRemove: number;
    /** 按Archetype分组的实体分布 */
    entitiesPerArchetype: Array<{
        signature: string;
        count: number;
        memory: number;
    }>;
    /** 组件数量最多的前几个实体 */
    topEntitiesByComponents: Array<{
        id: string;
        name: string;
        componentCount: number;
        memory: number;
    }>;
    /** 实体详情列表 */
    entityDetails?: Array<{
        id: string | number;
        name?: string;
        tag?: string;
        enabled: boolean;
        componentCount: number;
        components: string[];
    }>;
    /** 实体层次结构（根实体） */
    entityHierarchy?: Array<{
        id: number;
        name: string;
        active: boolean;
        enabled: boolean;
        activeInHierarchy: boolean;
        componentCount: number;
        componentTypes: string[];
        parentId: number | null;
        children: IEntityHierarchyNode[];
        depth: number;
        tag: number;
        updateOrder: number;
    }>;
    /** 实体详细信息映射 */
    entityDetailsMap?: Record<number, {
        id: number;
        name: string;
        active: boolean;
        enabled: boolean;
        activeInHierarchy: boolean;
        destroyed: boolean;
        tag: number;
        updateOrder: number;
        componentMask: string;
        parentId: number | null;
        parentName: string | null;
        childCount: number;
        childIds: number[];
        depth: number;
        components: Array<{
            typeName: string;
            properties: Record<string, unknown>;
        }>;
        componentCount: number;
        componentTypes: string[];
    }>;
}

/**
 * 系统调试数据接口
 */
export interface ISystemDebugData {
    /** 总系统数 */
    totalSystems: number;
    /** 系统信息列表 */
    systemsInfo: Array<{
        name: string;
        type: string;
        entityCount: number;
        executionTime?: number;
        averageExecutionTime?: number;
        minExecutionTime?: number;
        maxExecutionTime?: number;
        executionTimeHistory?: number[];
        memoryUsage?: number;
        updateOrder: number;
        enabled: boolean;
        lastUpdateTime?: number;
    }>;
}

/**
 * 性能调试数据接口
 */
export interface IPerformanceDebugData {
    /** ECS框架执行时间（毫秒） */
    frameTime: number;
    /** 引擎总帧时间（毫秒） */
    engineFrameTime?: number;
    /** ECS占总帧时间百分比 */
    ecsPercentage?: number;
    /** 内存使用量（MB） */
    memoryUsage: number;
    /** FPS */
    fps: number;
    /** 平均ECS执行时间（毫秒） */
    averageFrameTime: number;
    /** 最小ECS执行时间（毫秒） */
    minFrameTime: number;
    /** 最大ECS执行时间（毫秒） */
    maxFrameTime: number;
    /** ECS执行时间历史记录 */
    frameTimeHistory: number[];
    /** 系统性能详情 */
    systemPerformance: Array<{
        systemName: string;
        averageTime: number;
        maxTime: number;
        minTime: number;
        samples: number;
        percentage?: number; // 系统占ECS总时间的百分比
    }>;
    /** 系统占比分析数据 */
    systemBreakdown?: Array<{
        systemName: string;
        executionTime: number;
        percentage: number;
    }>;
    /** 内存分配详情 */
    memoryDetails?: {
        entities: number;
        components: number;
        systems: number;
        pooled: number;
        totalMemory: number;
        usedMemory: number;
        freeMemory: number;
        gcCollections: number;
    };
}

/**
 * 组件调试数据接口
 */
export interface IComponentDebugData {
    /** 组件类型数 */
    componentTypes: number;
    /** 组件实例总数 */
    componentInstances: number;
    /** 组件分布统计 */
    componentStats: Array<{
        typeName: string;
        instanceCount: number;
        memoryPerInstance: number;
        totalMemory: number;
        poolSize: number;
        poolUtilization: number;
        averagePerEntity?: number;
    }>;
}

/**
 * 场景调试数据接口
 */
export interface ISceneDebugData {
    /** 当前场景名称 */
    currentSceneName: string;
    /** 场景是否已初始化 */
    isInitialized: boolean;
    /** 场景运行时间（秒） */
    sceneRunTime: number;
    /** 场景实体数 */
    sceneEntityCount: number;
    /** 场景系统数 */
    sceneSystemCount: number;
    /** 场景启动时间 */
    sceneUptime: number;
}
