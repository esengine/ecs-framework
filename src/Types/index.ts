/**
 * 框架核心类型定义
 */

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
 * 系统基础接口
 * 
 * 为现有的EntitySystem类提供类型定义
 */
export interface ISystemBase {
    /** 系统名称 */
    readonly systemName: string;
    /** 系统处理的实体列表 */
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
 * 组件类型定义
 * 
 * 用于类型安全的组件操作
 */
export type ComponentType<T extends IComponent = IComponent> = new (...args: any[]) => T;

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