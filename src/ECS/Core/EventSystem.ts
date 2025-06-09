/**
 * 事件处理器函数类型
 */
export type EventHandler<T = any> = (event: T) => void;

/**
 * 异步事件处理器函数类型
 */
export type AsyncEventHandler<T = any> = (event: T) => Promise<void>;

/**
 * 事件监听器配置
 */
export interface EventListenerConfig {
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
 * 内部事件监听器
 */
interface InternalEventListener<T = any> {
    handler: EventHandler<T> | AsyncEventHandler<T>;
    config: EventListenerConfig;
    id: string;
}

/**
 * 事件统计信息
 */
export interface EventStats {
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
 * 事件批处理配置
 */
export interface EventBatchConfig {
    /** 批处理大小 */
    batchSize: number;
    /** 批处理延迟（毫秒） */
    delay: number;
    /** 是否启用批处理 */
    enabled: boolean;
}

/**
 * 类型安全的高性能事件系统
 * 支持同步/异步事件、优先级、批处理等功能
 */
export class TypeSafeEventSystem {
    private listeners = new Map<string, InternalEventListener[]>();
    private stats = new Map<string, EventStats>();
    private batchQueue = new Map<string, any[]>();
    private batchTimers = new Map<string, number>();
    private batchConfigs = new Map<string, EventBatchConfig>();
    private nextListenerId = 0;
    private isEnabled = true;
    private maxListeners = 100; // 每个事件类型的最大监听器数量

    /**
     * 添加事件监听器
     * @param eventType 事件类型
     * @param handler 事件处理器
     * @param config 监听器配置
     * @returns 监听器ID（用于移除）
     */
    public on<T>(
        eventType: string, 
        handler: EventHandler<T>, 
        config: EventListenerConfig = {}
    ): string {
        return this.addListener(eventType, handler, config);
    }

    /**
     * 添加一次性事件监听器
     * @param eventType 事件类型
     * @param handler 事件处理器
     * @param config 监听器配置
     * @returns 监听器ID
     */
    public once<T>(
        eventType: string, 
        handler: EventHandler<T>, 
        config: EventListenerConfig = {}
    ): string {
        return this.addListener(eventType, handler, { ...config, once: true });
    }

    /**
     * 添加异步事件监听器
     * @param eventType 事件类型
     * @param handler 异步事件处理器
     * @param config 监听器配置
     * @returns 监听器ID
     */
    public onAsync<T>(
        eventType: string, 
        handler: AsyncEventHandler<T>, 
        config: EventListenerConfig = {}
    ): string {
        return this.addListener(eventType, handler, { ...config, async: true });
    }

    /**
     * 移除事件监听器
     * @param eventType 事件类型
     * @param listenerId 监听器ID
     * @returns 是否成功移除
     */
    public off(eventType: string, listenerId: string): boolean {
        const listeners = this.listeners.get(eventType);
        if (!listeners) return false;

        const index = listeners.findIndex(l => l.id === listenerId);
        if (index === -1) return false;

        listeners.splice(index, 1);
        
        // 如果没有监听器了，清理相关数据
        if (listeners.length === 0) {
            this.listeners.delete(eventType);
            this.stats.delete(eventType);
        }

        return true;
    }

    /**
     * 移除指定事件类型的所有监听器
     * @param eventType 事件类型
     */
    public offAll(eventType: string): void {
        this.listeners.delete(eventType);
        this.stats.delete(eventType);
        this.clearBatch(eventType);
    }

    /**
     * 触发事件
     * @param eventType 事件类型
     * @param event 事件数据
     * @returns Promise（如果有异步监听器）
     */
    public async emit<T>(eventType: string, event: T): Promise<void> {
        if (!this.isEnabled) return;

        // 检查是否启用了批处理
        const batchConfig = this.batchConfigs.get(eventType);
        if (batchConfig?.enabled) {
            this.addToBatch(eventType, event);
            return;
        }

        await this.executeEvent(eventType, event);
    }

    /**
     * 同步触发事件（忽略异步监听器）
     * @param eventType 事件类型
     * @param event 事件数据
     */
    public emitSync<T>(eventType: string, event: T): void {
        if (!this.isEnabled) return;

        const listeners = this.listeners.get(eventType);
        if (!listeners || listeners.length === 0) return;

        const startTime = performance.now();
        const toRemove: string[] = [];

        // 按优先级排序
        const sortedListeners = this.sortListenersByPriority(listeners);

        for (const listener of sortedListeners) {
            if (listener.config.async) continue; // 跳过异步监听器

            try {
                if (listener.config.context) {
                    (listener.handler as EventHandler<T>).call(listener.config.context, event);
                } else {
                    (listener.handler as EventHandler<T>)(event);
                }

                if (listener.config.once) {
                    toRemove.push(listener.id);
                }
            } catch (error) {
                console.error(`Error in event handler for ${eventType}:`, error);
            }
        }

        // 移除一次性监听器
        this.removeListeners(eventType, toRemove);

        // 更新统计信息
        this.updateStats(eventType, performance.now() - startTime);
    }

    /**
     * 设置事件批处理配置
     * @param eventType 事件类型
     * @param config 批处理配置
     */
    public setBatchConfig(eventType: string, config: EventBatchConfig): void {
        this.batchConfigs.set(eventType, config);
    }

    /**
     * 立即处理指定事件类型的批处理队列
     * @param eventType 事件类型
     */
    public flushBatch(eventType: string): void {
        const batch = this.batchQueue.get(eventType);
        if (!batch || batch.length === 0) return;

        // 清除定时器
        const timer = this.batchTimers.get(eventType);
        if (timer) {
            clearTimeout(timer);
            this.batchTimers.delete(eventType);
        }

        // 处理批处理事件
        this.processBatch(eventType, batch);
        
        // 清空队列
        this.batchQueue.delete(eventType);
    }

    /**
     * 获取事件统计信息
     * @param eventType 事件类型（可选）
     * @returns 统计信息
     */
    public getStats(eventType?: string): EventStats | Map<string, EventStats> {
        if (eventType) {
            return this.stats.get(eventType) || this.createEmptyStats(eventType);
        }
        return new Map(this.stats);
    }

    /**
     * 重置统计信息
     * @param eventType 事件类型（可选，不指定则重置所有）
     */
    public resetStats(eventType?: string): void {
        if (eventType) {
            this.stats.delete(eventType);
        } else {
            this.stats.clear();
        }
    }

    /**
     * 启用/禁用事件系统
     * @param enabled 是否启用
     */
    public setEnabled(enabled: boolean): void {
        this.isEnabled = enabled;
    }

    /**
     * 检查是否有指定事件类型的监听器
     * @param eventType 事件类型
     * @returns 是否有监听器
     */
    public hasListeners(eventType: string): boolean {
        const listeners = this.listeners.get(eventType);
        return listeners ? listeners.length > 0 : false;
    }

    /**
     * 获取指定事件类型的监听器数量
     * @param eventType 事件类型
     * @returns 监听器数量
     */
    public getListenerCount(eventType: string): number {
        const listeners = this.listeners.get(eventType);
        return listeners ? listeners.length : 0;
    }

    /**
     * 清空所有事件监听器和数据
     */
    public clear(): void {
        this.listeners.clear();
        this.stats.clear();
        this.clearAllBatches();
    }

    /**
     * 设置每个事件类型的最大监听器数量
     * @param max 最大数量
     */
    public setMaxListeners(max: number): void {
        this.maxListeners = max;
    }

    /**
     * 添加监听器的内部实现
     * @param eventType 事件类型
     * @param handler 事件处理器
     * @param config 配置
     * @returns 监听器ID
     */
    private addListener<T>(
        eventType: string, 
        handler: EventHandler<T> | AsyncEventHandler<T>, 
        config: EventListenerConfig
    ): string {
        let listeners = this.listeners.get(eventType);
        
        if (!listeners) {
            listeners = [];
            this.listeners.set(eventType, listeners);
        }

        // 检查监听器数量限制
        if (listeners.length >= this.maxListeners) {
            console.warn(`Maximum listeners (${this.maxListeners}) exceeded for event type: ${eventType}`);
            return '';
        }

        const listenerId = `listener_${this.nextListenerId++}`;
        const listener: InternalEventListener<T> = {
            handler,
            config: {
                priority: 0,
                ...config
            },
            id: listenerId
        };

        listeners.push(listener);

        // 初始化统计信息
        if (!this.stats.has(eventType)) {
            this.stats.set(eventType, this.createEmptyStats(eventType));
        }

        return listenerId;
    }

    /**
     * 执行事件的内部实现
     * @param eventType 事件类型
     * @param event 事件数据
     */
    private async executeEvent<T>(eventType: string, event: T): Promise<void> {
        const listeners = this.listeners.get(eventType);
        if (!listeners || listeners.length === 0) return;

        const startTime = performance.now();
        const toRemove: string[] = [];

        // 按优先级排序
        const sortedListeners = this.sortListenersByPriority(listeners);

        // 分离同步和异步监听器
        const syncListeners = sortedListeners.filter(l => !l.config.async);
        const asyncListeners = sortedListeners.filter(l => l.config.async);

        // 执行同步监听器
        for (const listener of syncListeners) {
            try {
                if (listener.config.context) {
                    (listener.handler as EventHandler<T>).call(listener.config.context, event);
                } else {
                    (listener.handler as EventHandler<T>)(event);
                }

                if (listener.config.once) {
                    toRemove.push(listener.id);
                }
            } catch (error) {
                console.error(`Error in sync event handler for ${eventType}:`, error);
            }
        }

        // 执行异步监听器
        const asyncPromises = asyncListeners.map(async (listener) => {
            try {
                if (listener.config.context) {
                    await (listener.handler as AsyncEventHandler<T>).call(listener.config.context, event);
                } else {
                    await (listener.handler as AsyncEventHandler<T>)(event);
                }

                if (listener.config.once) {
                    toRemove.push(listener.id);
                }
            } catch (error) {
                console.error(`Error in async event handler for ${eventType}:`, error);
            }
        });

        // 等待所有异步监听器完成
        await Promise.all(asyncPromises);

        // 移除一次性监听器
        this.removeListeners(eventType, toRemove);

        // 更新统计信息
        this.updateStats(eventType, performance.now() - startTime);
    }

    /**
     * 按优先级排序监听器
     * @param listeners 监听器数组
     * @returns 排序后的监听器数组
     */
    private sortListenersByPriority<T>(listeners: InternalEventListener<T>[]): InternalEventListener<T>[] {
        return listeners.slice().sort((a, b) => (b.config.priority || 0) - (a.config.priority || 0));
    }

    /**
     * 移除指定的监听器
     * @param eventType 事件类型
     * @param listenerIds 要移除的监听器ID数组
     */
    private removeListeners(eventType: string, listenerIds: string[]): void {
        if (listenerIds.length === 0) return;

        const listeners = this.listeners.get(eventType);
        if (!listeners) return;

        for (const id of listenerIds) {
            const index = listeners.findIndex(l => l.id === id);
            if (index !== -1) {
                listeners.splice(index, 1);
            }
        }

        // 如果没有监听器了，清理相关数据
        if (listeners.length === 0) {
            this.listeners.delete(eventType);
            this.stats.delete(eventType);
        }
    }

    /**
     * 添加事件到批处理队列
     * @param eventType 事件类型
     * @param event 事件数据
     */
    private addToBatch<T>(eventType: string, event: T): void {
        let batch = this.batchQueue.get(eventType);
        if (!batch) {
            batch = [];
            this.batchQueue.set(eventType, batch);
        }

        batch.push(event);

        const config = this.batchConfigs.get(eventType)!;
        
        // 如果达到批处理大小，立即处理
        if (batch.length >= config.batchSize) {
            this.flushBatch(eventType);
            return;
        }

        // 设置延迟处理定时器
        if (!this.batchTimers.has(eventType)) {
            const timer = setTimeout(() => {
                this.flushBatch(eventType);
            }, config.delay);
            
            this.batchTimers.set(eventType, timer as any);
        }
    }

    /**
     * 处理批处理事件
     * @param eventType 事件类型
     * @param batch 批处理事件数组
     */
    private async processBatch<T>(eventType: string, batch: T[]): Promise<void> {
        // 创建批处理事件对象
        const batchEvent = {
            type: eventType,
            events: batch,
            count: batch.length,
            timestamp: Date.now()
        };

        // 触发批处理事件
        await this.executeEvent(`${eventType}:batch`, batchEvent);
    }

    /**
     * 清除指定事件类型的批处理
     * @param eventType 事件类型
     */
    private clearBatch(eventType: string): void {
        this.batchQueue.delete(eventType);
        
        const timer = this.batchTimers.get(eventType);
        if (timer) {
            clearTimeout(timer);
            this.batchTimers.delete(eventType);
        }
    }

    /**
     * 清除所有批处理
     */
    private clearAllBatches(): void {
        this.batchQueue.clear();
        
        for (const timer of this.batchTimers.values()) {
            clearTimeout(timer);
        }
        this.batchTimers.clear();
        this.batchConfigs.clear();
    }

    /**
     * 更新事件统计信息
     * @param eventType 事件类型
     * @param executionTime 执行时间
     */
    private updateStats(eventType: string, executionTime: number): void {
        let stats = this.stats.get(eventType);
        if (!stats) {
            stats = this.createEmptyStats(eventType);
            this.stats.set(eventType, stats);
        }

        stats.triggerCount++;
        stats.totalExecutionTime += executionTime;
        stats.averageExecutionTime = stats.totalExecutionTime / stats.triggerCount;
        stats.lastTriggerTime = Date.now();
        stats.listenerCount = this.getListenerCount(eventType);
    }

    /**
     * 创建空的统计信息
     * @param eventType 事件类型
     * @returns 空的统计信息
     */
    private createEmptyStats(eventType: string): EventStats {
        return {
            eventType,
            listenerCount: 0,
            triggerCount: 0,
            totalExecutionTime: 0,
            averageExecutionTime: 0,
            lastTriggerTime: 0
        };
    }
}

/**
 * 全局事件系统实例
 */
export const GlobalEventSystem = new TypeSafeEventSystem();

/**
 * 事件装饰器 - 用于自动注册事件监听器
 * @param eventType 事件类型
 * @param config 监听器配置
 */
export function EventListener(eventType: string, config: EventListenerConfig = {}) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;
        
        // 在类实例化时自动注册监听器
        const initMethod = target.constructor.prototype.initEventListeners || function() {};
        target.constructor.prototype.initEventListeners = function() {
            initMethod.call(this);
            GlobalEventSystem.on(eventType, originalMethod.bind(this), config);
        };
    };
}

/**
 * 异步事件装饰器
 * @param eventType 事件类型
 * @param config 监听器配置
 */
export function AsyncEventListener(eventType: string, config: EventListenerConfig = {}) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;
        
        const initMethod = target.constructor.prototype.initEventListeners || function() {};
        target.constructor.prototype.initEventListeners = function() {
            initMethod.call(this);
            GlobalEventSystem.onAsync(eventType, originalMethod.bind(this), config);
        };
    };
} 