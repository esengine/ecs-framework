/**
 * 消息队列管理器
 * 提供消息排队、优先级处理和可靠传输保证
 */
import { createLogger, ITimer } from '@esengine/ecs-framework';
import { INetworkMessage, MessageType } from '@esengine/network-shared';
import { NetworkTimerManager } from '../utils';

/**
 * 消息优先级
 */
export enum MessagePriority {
    Low = 1,
    Normal = 5,
    High = 8,
    Critical = 10
}

/**
 * 队列消息包装器
 */
export interface QueuedMessage {
    id: string;
    message: INetworkMessage;
    priority: MessagePriority;
    timestamp: number;
    retryCount: number;
    maxRetries: number;
    reliable: boolean;
    timeoutMs?: number;
    callback?: (success: boolean, error?: Error) => void;
}

/**
 * 消息队列配置
 */
export interface MessageQueueConfig {
    maxQueueSize: number;
    maxRetries: number;
    retryDelay: number;
    processingInterval: number;
    enablePriority: boolean;
    enableReliableDelivery: boolean;
    defaultTimeout: number;
}

/**
 * 队列统计信息
 */
export interface QueueStats {
    totalQueued: number;
    totalProcessed: number;
    totalFailed: number;
    currentSize: number;
    averageProcessingTime: number;
    messagesByPriority: Record<MessagePriority, number>;
    reliableMessages: number;
    expiredMessages: number;
}

/**
 * 消息队列事件接口
 */
export interface MessageQueueEvents {
    messageQueued: (message: QueuedMessage) => void;
    messageProcessed: (message: QueuedMessage, success: boolean) => void;
    messageFailed: (message: QueuedMessage, error: Error) => void;
    messageExpired: (message: QueuedMessage) => void;
    queueFull: (droppedMessage: QueuedMessage) => void;
}

/**
 * 消息队列管理器
 */
export class MessageQueue {
    private logger = createLogger('MessageQueue');
    private config: MessageQueueConfig;
    private stats: QueueStats;

    // 队列存储
    private primaryQueue: QueuedMessage[] = [];
    private priorityQueues: Map<MessagePriority, QueuedMessage[]> = new Map();
    private retryQueue: QueuedMessage[] = [];
    private processingMap: Map<string, QueuedMessage> = new Map();

    // 定时器
    private processingTimer?: ITimer;
    private retryTimer?: ITimer;
    private cleanupTimer?: ITimer;

    // 事件处理器
    private eventHandlers: Partial<MessageQueueEvents> = {};

    // 发送回调
    private sendCallback?: (message: INetworkMessage) => Promise<boolean>;

    // 性能统计
    private processingTimes: number[] = [];

    /**
     * 构造函数
     */
    constructor(config: Partial<MessageQueueConfig> = {}) {
        this.config = {
            maxQueueSize: 1000,
            maxRetries: 3,
            retryDelay: 1000,
            processingInterval: 100,
            enablePriority: true,
            enableReliableDelivery: true,
            defaultTimeout: 30000,
            ...config
        };

        this.stats = {
            totalQueued: 0,
            totalProcessed: 0,
            totalFailed: 0,
            currentSize: 0,
            averageProcessingTime: 0,
            messagesByPriority: {
                [MessagePriority.Low]: 0,
                [MessagePriority.Normal]: 0,
                [MessagePriority.High]: 0,
                [MessagePriority.Critical]: 0
            },
            reliableMessages: 0,
            expiredMessages: 0
        };

        // 初始化优先级队列
        if (this.config.enablePriority) {
            this.priorityQueues.set(MessagePriority.Critical, []);
            this.priorityQueues.set(MessagePriority.High, []);
            this.priorityQueues.set(MessagePriority.Normal, []);
            this.priorityQueues.set(MessagePriority.Low, []);
        }
    }

    /**
     * 启动队列处理
     */
    start(sendCallback: (message: INetworkMessage) => Promise<boolean>): void {
        this.sendCallback = sendCallback;

        this.processingTimer = NetworkTimerManager.schedule(
            this.config.processingInterval / 1000,
            true, // 重复执行
            this,
            () => this.processQueue()
        );

        if (this.config.maxRetries > 0) {
            this.retryTimer = NetworkTimerManager.schedule(
                this.config.retryDelay / 1000,
                true, // 重复执行
                this,
                () => this.processRetryQueue()
            );
        }

        this.cleanupTimer = NetworkTimerManager.schedule(
            10, // 10秒
            true, // 重复执行
            this,
            () => this.cleanupExpiredMessages()
        );

        this.logger.info('消息队列已启动');
    }

    /**
     * 停止队列处理
     */
    stop(): void {
        if (this.processingTimer) {
            this.processingTimer.stop();
            this.processingTimer = undefined;
        }

        if (this.retryTimer) {
            this.retryTimer.stop();
            this.retryTimer = undefined;
        }

        if (this.cleanupTimer) {
            this.cleanupTimer.stop();
            this.cleanupTimer = undefined;
        }

        this.logger.info('消息队列已停止');
    }

    /**
     * 将消息加入队列
     */
    enqueue(
        message: INetworkMessage,
        options: {
            priority?: MessagePriority;
            reliable?: boolean;
            timeout?: number;
            maxRetries?: number;
            callback?: (success: boolean, error?: Error) => void;
        } = {}
    ): boolean {
        // 检查队列大小限制
        if (this.getTotalSize() >= this.config.maxQueueSize) {
            const droppedMessage = this.createQueuedMessage(message, options);
            this.eventHandlers.queueFull?.(droppedMessage);
            this.logger.warn('队列已满，丢弃消息:', message.type);
            return false;
        }

        const queuedMessage = this.createQueuedMessage(message, options);

        // 根据配置选择队列策略
        if (this.config.enablePriority) {
            this.enqueueToPriorityQueue(queuedMessage);
        } else {
            this.primaryQueue.push(queuedMessage);
        }

        this.updateQueueStats(queuedMessage);

        this.eventHandlers.messageQueued?.(queuedMessage);

        return true;
    }

    /**
     * 清空队列
     */
    clear(): number {
        const count = this.getTotalSize();

        this.primaryQueue.length = 0;
        this.retryQueue.length = 0;
        this.processingMap.clear();

        for (const queue of this.priorityQueues.values()) {
            queue.length = 0;
        }

        this.stats.currentSize = 0;

        this.logger.info(`已清空队列，清理了 ${count} 条消息`);
        return count;
    }

    /**
     * 获取队列统计信息
     */
    getStats(): QueueStats {
        this.updateCurrentStats();
        return { ...this.stats };
    }

    /**
     * 重置统计信息
     */
    resetStats(): void {
        this.stats = {
            totalQueued: 0,
            totalProcessed: 0,
            totalFailed: 0,
            currentSize: this.getTotalSize(),
            averageProcessingTime: 0,
            messagesByPriority: {
                [MessagePriority.Low]: 0,
                [MessagePriority.Normal]: 0,
                [MessagePriority.High]: 0,
                [MessagePriority.Critical]: 0
            },
            reliableMessages: 0,
            expiredMessages: 0
        };

        this.processingTimes.length = 0;
    }

    /**
     * 设置事件处理器
     */
    on<K extends keyof MessageQueueEvents>(event: K, handler: MessageQueueEvents[K]): void {
        this.eventHandlers[event] = handler;
    }

    /**
     * 移除事件处理器
     */
    off<K extends keyof MessageQueueEvents>(event: K): void {
        delete this.eventHandlers[event];
    }

    /**
     * 更新配置
     */
    updateConfig(newConfig: Partial<MessageQueueConfig>): void {
        Object.assign(this.config, newConfig);
        this.logger.info('消息队列配置已更新:', newConfig);
    }

    /**
     * 获取队列中的消息数量
     */
    size(): number {
        return this.getTotalSize();
    }

    /**
     * 检查队列是否为空
     */
    isEmpty(): boolean {
        return this.getTotalSize() === 0;
    }

    /**
     * 检查队列是否已满
     */
    isFull(): boolean {
        return this.getTotalSize() >= this.config.maxQueueSize;
    }

    /**
     * 创建队列消息
     */
    private createQueuedMessage(
        message: INetworkMessage,
        options: any
    ): QueuedMessage {
        const priority = options.priority || this.getMessagePriority(message);
        const reliable = options.reliable ?? this.isReliableMessage(message);

        return {
            id: `${message.messageId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            message,
            priority,
            timestamp: Date.now(),
            retryCount: 0,
            maxRetries: options.maxRetries ?? this.config.maxRetries,
            reliable,
            timeoutMs: options.timeout ?? this.config.defaultTimeout,
            callback: options.callback
        };
    }

    /**
     * 将消息加入优先级队列
     */
    private enqueueToPriorityQueue(message: QueuedMessage): void {
        const queue = this.priorityQueues.get(message.priority);
        if (queue) {
            queue.push(message);
        } else {
            this.primaryQueue.push(message);
        }
    }

    /**
     * 从队列中取出下一条消息
     */
    private dequeue(): QueuedMessage | undefined {
        if (this.config.enablePriority) {
            // 按优先级顺序处理
            for (const priority of [MessagePriority.Critical, MessagePriority.High, MessagePriority.Normal, MessagePriority.Low]) {
                const queue = this.priorityQueues.get(priority);
                if (queue && queue.length > 0) {
                    return queue.shift();
                }
            }
        }

        return this.primaryQueue.shift();
    }

    /**
     * 处理队列
     */
    private async processQueue(): Promise<void> {
        if (!this.sendCallback || this.getTotalSize() === 0) {
            return;
        }

        const message = this.dequeue();
        if (!message) {
            return;
        }

        // 检查消息是否过期
        if (this.isMessageExpired(message)) {
            this.handleExpiredMessage(message);
            return;
        }

        const startTime = Date.now();

        try {
            // 将消息标记为处理中
            this.processingMap.set(message.id, message);

            const success = await this.sendCallback(message.message);

            const processingTime = Date.now() - startTime;
            this.updateProcessingTime(processingTime);

            if (success) {
                this.handleSuccessfulMessage(message);
            } else {
                this.handleFailedMessage(message, new Error('发送失败'));
            }

        } catch (error) {
            this.handleFailedMessage(message, error as Error);
        } finally {
            this.processingMap.delete(message.id);
        }
    }

    /**
     * 处理重试队列
     */
    private async processRetryQueue(): Promise<void> {
        if (this.retryQueue.length === 0 || !this.sendCallback) {
            return;
        }

        const message = this.retryQueue.shift();
        if (!message) {
            return;
        }

        // 检查是否可以重试
        if (message.retryCount >= message.maxRetries) {
            this.handleFailedMessage(message, new Error('达到最大重试次数'));
            return;
        }

        // 检查消息是否过期
        if (this.isMessageExpired(message)) {
            this.handleExpiredMessage(message);
            return;
        }

        message.retryCount++;

        try {
            const success = await this.sendCallback(message.message);

            if (success) {
                this.handleSuccessfulMessage(message);
            } else {
                // 重新加入重试队列
                this.retryQueue.push(message);
            }

        } catch (error) {
            // 重新加入重试队列
            this.retryQueue.push(message);
        }
    }

    /**
     * 处理成功的消息
     */
    private handleSuccessfulMessage(message: QueuedMessage): void {
        this.stats.totalProcessed++;

        if (message.callback) {
            try {
                message.callback(true);
            } catch (error) {
                this.logger.error('消息回调执行失败:', error);
            }
        }

        this.eventHandlers.messageProcessed?.(message, true);
    }

    /**
     * 处理失败的消息
     */
    private handleFailedMessage(message: QueuedMessage, error: Error): void {
        // 如果是可靠消息且未达到最大重试次数，加入重试队列
        if (message.reliable && message.retryCount < message.maxRetries) {
            this.retryQueue.push(message);
        } else {
            this.stats.totalFailed++;

            if (message.callback) {
                try {
                    message.callback(false, error);
                } catch (callbackError) {
                    this.logger.error('消息回调执行失败:', callbackError);
                }
            }

            this.eventHandlers.messageFailed?.(message, error);
        }

        this.eventHandlers.messageProcessed?.(message, false);
    }

    /**
     * 处理过期消息
     */
    private handleExpiredMessage(message: QueuedMessage): void {
        this.stats.expiredMessages++;

        if (message.callback) {
            try {
                message.callback(false, new Error('消息已过期'));
            } catch (error) {
                this.logger.error('消息回调执行失败:', error);
            }
        }

        this.eventHandlers.messageExpired?.(message);
    }

    /**
     * 清理过期消息
     */
    private cleanupExpiredMessages(): void {
        const now = Date.now();
        let cleanedCount = 0;

        // 清理主队列
        this.primaryQueue = this.primaryQueue.filter((msg) => {
            if (this.isMessageExpired(msg)) {
                this.handleExpiredMessage(msg);
                cleanedCount++;
                return false;
            }
            return true;
        });

        // 清理优先级队列
        for (const [priority, queue] of this.priorityQueues) {
            this.priorityQueues.set(priority, queue.filter((msg) => {
                if (this.isMessageExpired(msg)) {
                    this.handleExpiredMessage(msg);
                    cleanedCount++;
                    return false;
                }
                return true;
            }));
        }

        // 清理重试队列
        this.retryQueue = this.retryQueue.filter((msg) => {
            if (this.isMessageExpired(msg)) {
                this.handleExpiredMessage(msg);
                cleanedCount++;
                return false;
            }
            return true;
        });

        if (cleanedCount > 0) {
            this.logger.debug(`清理了 ${cleanedCount} 条过期消息`);
        }
    }

    /**
     * 检查消息是否过期
     */
    private isMessageExpired(message: QueuedMessage): boolean {
        if (!message.timeoutMs) {
            return false;
        }

        return Date.now() - message.timestamp > message.timeoutMs;
    }

    /**
     * 获取消息的默认优先级
     */
    private getMessagePriority(message: INetworkMessage): MessagePriority {
        switch (message.type) {
            case MessageType.HEARTBEAT:
                return MessagePriority.Low;
            case MessageType.CONNECT:
            case MessageType.DISCONNECT:
                return MessagePriority.High;
            case MessageType.ERROR:
                return MessagePriority.Critical;
            default:
                return MessagePriority.Normal;
        }
    }

    /**
     * 检查消息是否需要可靠传输
     */
    private isReliableMessage(message: INetworkMessage): boolean {
        if (!this.config.enableReliableDelivery) {
            return false;
        }

        // 某些消息类型默认需要可靠传输
        const reliableTypes = [
            MessageType.CONNECT,
            MessageType.RPC_CALL,
            MessageType.ENTITY_CREATE,
            MessageType.ENTITY_DESTROY
        ];

        return reliableTypes.includes(message.type) || message.reliable === true;
    }

    /**
     * 获取总队列大小
     */
    private getTotalSize(): number {
        let size = this.primaryQueue.length + this.retryQueue.length + this.processingMap.size;

        for (const queue of this.priorityQueues.values()) {
            size += queue.length;
        }

        return size;
    }

    /**
     * 更新队列统计
     */
    private updateQueueStats(message: QueuedMessage): void {
        this.stats.totalQueued++;
        this.stats.currentSize = this.getTotalSize();
        this.stats.messagesByPriority[message.priority]++;

        if (message.reliable) {
            this.stats.reliableMessages++;
        }
    }

    /**
     * 更新当前统计
     */
    private updateCurrentStats(): void {
        this.stats.currentSize = this.getTotalSize();
    }

    /**
     * 更新处理时间统计
     */
    private updateProcessingTime(time: number): void {
        this.processingTimes.push(time);

        // 保持最近1000个样本
        if (this.processingTimes.length > 1000) {
            this.processingTimes.shift();
        }

        // 计算平均处理时间
        this.stats.averageProcessingTime =
            this.processingTimes.reduce((sum, t) => sum + t, 0) / this.processingTimes.length;
    }

    /**
     * 获取队列详细状态
     */
    getDetailedStatus() {
        return {
            stats: this.getStats(),
            config: this.config,
            queueSizes: {
                primary: this.primaryQueue.length,
                retry: this.retryQueue.length,
                processing: this.processingMap.size,
                priorities: Object.fromEntries(
                    Array.from(this.priorityQueues.entries()).map(([priority, queue]) => [priority, queue.length])
                )
            },
            isRunning: !!this.processingTimer,
            processingTimes: [...this.processingTimes]
        };
    }
}
