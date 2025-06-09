import { 
    IEventBus, 
    IEventListenerConfig, 
    IEventStats,
    IEventData,
    IEntityEventData,
    IComponentEventData,
    ISystemEventData,
    ISceneEventData,
    IPerformanceEventData
} from '../../Types';
import { 
    TypeSafeEventSystem, 
    EventListenerConfig, 
    EventStats 
} from './EventSystem';
import { 
    ECSEventType, 
    EventPriority, 
    EVENT_TYPES,
    EventTypeValidator 
} from '../CoreEvents';

/**
 * 增强的事件总线实现
 * 基于TypeSafeEventSystem，提供类型安全的事件发布订阅机制
 */
export class EventBus implements IEventBus {
    private eventSystem: TypeSafeEventSystem;
    private eventIdCounter = 0;
    private isDebugMode = false;
    
    constructor(debugMode: boolean = false) {
        this.eventSystem = new TypeSafeEventSystem();
        this.isDebugMode = debugMode;
    }
    
    /**
     * 发射事件
     * @param eventType 事件类型
     * @param data 事件数据
     */
    public emit<T>(eventType: string, data: T): void {
        this.validateEventType(eventType);
        
        // 增强事件数据
        const enhancedData = this.enhanceEventData(eventType, data);
        
        if (this.isDebugMode) {
            console.log(`[EventBus] Emitting event: ${eventType}`, enhancedData);
        }
        
        this.eventSystem.emitSync(eventType, enhancedData);
    }
    
    /**
     * 异步发射事件
     * @param eventType 事件类型
     * @param data 事件数据
     */
    public async emitAsync<T>(eventType: string, data: T): Promise<void> {
        this.validateEventType(eventType);
        
        // 增强事件数据
        const enhancedData = this.enhanceEventData(eventType, data);
        
        if (this.isDebugMode) {
            console.log(`[EventBus] Emitting async event: ${eventType}`, enhancedData);
        }
        
        await this.eventSystem.emit(eventType, enhancedData);
    }
    
    /**
     * 监听事件
     * @param eventType 事件类型
     * @param handler 事件处理器
     * @param config 监听器配置
     * @returns 监听器ID
     */
    public on<T>(
        eventType: string, 
        handler: (data: T) => void, 
        config: IEventListenerConfig = {}
    ): string {
        this.validateEventType(eventType);
        
        const eventConfig: EventListenerConfig = {
            once: config.once || false,
            priority: config.priority || EventPriority.NORMAL,
            async: config.async || false,
            context: config.context
        };
        
        if (this.isDebugMode) {
            console.log(`[EventBus] Adding listener for: ${eventType}`, eventConfig);
        }
        
        return this.eventSystem.on(eventType, handler, eventConfig);
    }
    
    /**
     * 监听事件（一次性）
     * @param eventType 事件类型
     * @param handler 事件处理器
     * @param config 监听器配置
     * @returns 监听器ID
     */
    public once<T>(
        eventType: string, 
        handler: (data: T) => void, 
        config: IEventListenerConfig = {}
    ): string {
        return this.on(eventType, handler, { ...config, once: true });
    }
    
    /**
     * 异步监听事件
     * @param eventType 事件类型
     * @param handler 异步事件处理器
     * @param config 监听器配置
     * @returns 监听器ID
     */
    public onAsync<T>(
        eventType: string, 
        handler: (data: T) => Promise<void>, 
        config: IEventListenerConfig = {}
    ): string {
        return this.on(eventType, handler as any, { ...config, async: true });
    }
    
    /**
     * 移除事件监听器
     * @param eventType 事件类型
     * @param listenerId 监听器ID
     */
    public off(eventType: string, listenerId: string): boolean {
        if (this.isDebugMode) {
            console.log(`[EventBus] Removing listener: ${listenerId} for event: ${eventType}`);
        }
        
        return this.eventSystem.off(eventType, listenerId);
    }
    
    /**
     * 移除指定事件类型的所有监听器
     * @param eventType 事件类型
     */
    public offAll(eventType: string): void {
        if (this.isDebugMode) {
            console.log(`[EventBus] Removing all listeners for event: ${eventType}`);
        }
        
        this.eventSystem.offAll(eventType);
    }
    
    /**
     * 检查是否有指定事件的监听器
     * @param eventType 事件类型
     */
    public hasListeners(eventType: string): boolean {
        return this.eventSystem.hasListeners(eventType);
    }
    
    /**
     * 获取事件统计信息
     * @param eventType 事件类型（可选）
     */
    public getStats(eventType?: string): IEventStats | Map<string, IEventStats> {
        const stats = this.eventSystem.getStats(eventType);
        
        if (stats instanceof Map) {
            // 转换Map中的每个EventStats为IEventStats
            const result = new Map<string, IEventStats>();
            stats.forEach((stat, key) => {
                result.set(key, this.convertEventStats(stat));
            });
            return result;
        } else {
            return this.convertEventStats(stats);
        }
    }
    
    /**
     * 清空所有监听器
     */
    public clear(): void {
        if (this.isDebugMode) {
            console.log('[EventBus] Clearing all listeners');
        }
        
        this.eventSystem.clear();
    }
    
    /**
     * 启用或禁用事件系统
     * @param enabled 是否启用
     */
    public setEnabled(enabled: boolean): void {
        this.eventSystem.setEnabled(enabled);
    }
    
    /**
     * 设置调试模式
     * @param debug 是否启用调试
     */
    public setDebugMode(debug: boolean): void {
        this.isDebugMode = debug;
    }
    
    /**
     * 设置最大监听器数量
     * @param max 最大数量
     */
    public setMaxListeners(max: number): void {
        this.eventSystem.setMaxListeners(max);
    }
    
    /**
     * 获取监听器数量
     * @param eventType 事件类型
     */
    public getListenerCount(eventType: string): number {
        return this.eventSystem.getListenerCount(eventType);
    }
    
    /**
     * 设置事件批处理配置
     * @param eventType 事件类型
     * @param batchSize 批处理大小
     * @param delay 延迟时间（毫秒）
     */
    public setBatchConfig(eventType: string, batchSize: number, delay: number): void {
        this.eventSystem.setBatchConfig(eventType, {
            batchSize,
            delay,
            enabled: true
        });
    }
    
    /**
     * 刷新指定事件的批处理队列
     * @param eventType 事件类型
     */
    public flushBatch(eventType: string): void {
        this.eventSystem.flushBatch(eventType);
    }
    
    /**
     * 重置事件统计
     * @param eventType 事件类型（可选）
     */
    public resetStats(eventType?: string): void {
        this.eventSystem.resetStats(eventType);
    }
    
    // 便捷方法：发射预定义的ECS事件
    
    /**
     * 发射实体创建事件
     * @param entityData 实体事件数据
     */
    public emitEntityCreated(entityData: IEntityEventData): void {
        this.emit(ECSEventType.ENTITY_CREATED, entityData);
    }
    
    /**
     * 发射实体销毁事件
     * @param entityData 实体事件数据
     */
    public emitEntityDestroyed(entityData: IEntityEventData): void {
        this.emit(ECSEventType.ENTITY_DESTROYED, entityData);
    }
    
    /**
     * 发射组件添加事件
     * @param componentData 组件事件数据
     */
    public emitComponentAdded(componentData: IComponentEventData): void {
        this.emit(ECSEventType.COMPONENT_ADDED, componentData);
    }
    
    /**
     * 发射组件移除事件
     * @param componentData 组件事件数据
     */
    public emitComponentRemoved(componentData: IComponentEventData): void {
        this.emit(ECSEventType.COMPONENT_REMOVED, componentData);
    }
    
    /**
     * 发射系统添加事件
     * @param systemData 系统事件数据
     */
    public emitSystemAdded(systemData: ISystemEventData): void {
        this.emit(ECSEventType.SYSTEM_ADDED, systemData);
    }
    
    /**
     * 发射系统移除事件
     * @param systemData 系统事件数据
     */
    public emitSystemRemoved(systemData: ISystemEventData): void {
        this.emit(ECSEventType.SYSTEM_REMOVED, systemData);
    }
    
    /**
     * 发射场景变化事件
     * @param sceneData 场景事件数据
     */
    public emitSceneChanged(sceneData: ISceneEventData): void {
        this.emit(EVENT_TYPES.CORE.SCENE_CHANGED, sceneData);
    }
    
    /**
     * 发射性能警告事件
     * @param performanceData 性能事件数据
     */
    public emitPerformanceWarning(performanceData: IPerformanceEventData): void {
        this.emit(ECSEventType.PERFORMANCE_WARNING, performanceData);
    }
    
    // 便捷方法：监听预定义的ECS事件
    
    /**
     * 监听实体创建事件
     * @param handler 事件处理器
     * @param config 监听器配置
     */
    public onEntityCreated(
        handler: (data: IEntityEventData) => void, 
        config?: IEventListenerConfig
    ): string {
        return this.on(ECSEventType.ENTITY_CREATED, handler, config);
    }
    
    /**
     * 监听组件添加事件
     * @param handler 事件处理器
     * @param config 监听器配置
     */
    public onComponentAdded(
        handler: (data: IComponentEventData) => void, 
        config?: IEventListenerConfig
    ): string {
        return this.on(ECSEventType.COMPONENT_ADDED, handler, config);
    }
    
    /**
     * 监听系统错误事件
     * @param handler 事件处理器
     * @param config 监听器配置
     */
    public onSystemError(
        handler: (data: ISystemEventData) => void, 
        config?: IEventListenerConfig
    ): string {
        return this.on(ECSEventType.SYSTEM_ERROR, handler, config);
    }
    
    /**
     * 监听性能警告事件
     * @param handler 事件处理器
     * @param config 监听器配置
     */
    public onPerformanceWarning(
        handler: (data: IPerformanceEventData) => void, 
        config?: IEventListenerConfig
    ): string {
        return this.on(ECSEventType.PERFORMANCE_WARNING, handler, config);
    }
    
    // 私有方法
    
    /**
     * 验证事件类型
     * @param eventType 事件类型
     */
    private validateEventType(eventType: string): void {
        if (!EventTypeValidator.isValid(eventType)) {
            if (this.isDebugMode) {
                console.warn(`[EventBus] Unknown event type: ${eventType}`);
            }
            // 在调试模式下添加自定义事件类型
            if (this.isDebugMode) {
                EventTypeValidator.addCustomType(eventType);
            }
        }
    }
    
    /**
     * 增强事件数据
     * @param eventType 事件类型
     * @param data 原始数据
     */
    private enhanceEventData<T>(eventType: string, data: T): T & IEventData {
        const enhanced = data as T & IEventData;
        
        // 如果数据还没有基础事件属性，添加它们
        if (!enhanced.timestamp) {
            enhanced.timestamp = Date.now();
        }
        if (!enhanced.eventId) {
            enhanced.eventId = `${eventType}_${++this.eventIdCounter}`;
        }
        if (!enhanced.source) {
            enhanced.source = 'EventBus';
        }
        
        return enhanced;
    }
    
    /**
     * 转换EventStats为IEventStats
     * @param stats EventStats实例
     */
    private convertEventStats(stats: EventStats): IEventStats {
        return {
            eventType: stats.eventType,
            listenerCount: stats.listenerCount,
            triggerCount: stats.triggerCount,
            totalExecutionTime: stats.totalExecutionTime,
            averageExecutionTime: stats.averageExecutionTime,
            lastTriggerTime: stats.lastTriggerTime
        };
    }
}

/**
 * 全局事件总线实例
 * 提供全局访问的事件总线
 */
export class GlobalEventBus {
    private static instance: EventBus;
    
    /**
     * 获取全局事件总线实例
     * @param debugMode 是否启用调试模式
     */
    public static getInstance(debugMode: boolean = false): EventBus {
        if (!this.instance) {
            this.instance = new EventBus(debugMode);
        }
        return this.instance;
    }
    
    /**
     * 重置全局事件总线实例
     * @param debugMode 是否启用调试模式
     */
    public static reset(debugMode: boolean = false): EventBus {
        if (this.instance) {
            this.instance.clear();
        }
        this.instance = new EventBus(debugMode);
        return this.instance;
    }
}

/**
 * 事件装饰器工厂
 * 用于自动注册事件监听器
 */
export function EventHandler(eventType: string, config: IEventListenerConfig = {}) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;
        
        // 在类实例化时自动注册监听器
        const initMethod = target.constructor.prototype.initEventListeners || function() {};
        target.constructor.prototype.initEventListeners = function() {
            initMethod.call(this);
            const eventBus = GlobalEventBus.getInstance();
            eventBus.on(eventType, originalMethod.bind(this), config);
        };
        
        return descriptor;
    };
}

/**
 * 异步事件装饰器工厂
 * 用于自动注册异步事件监听器
 */
export function AsyncEventHandler(eventType: string, config: IEventListenerConfig = {}) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;
        
        const initMethod = target.constructor.prototype.initEventListeners || function() {};
        target.constructor.prototype.initEventListeners = function() {
            initMethod.call(this);
            const eventBus = GlobalEventBus.getInstance();
            eventBus.onAsync(eventType, originalMethod.bind(this), config);
        };
        
        return descriptor;
    };
} 