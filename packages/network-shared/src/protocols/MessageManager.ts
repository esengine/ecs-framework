/**
 * 消息管理器
 * 负责消息ID生成、时间戳管理和消息验证
 */
import { createLogger } from '@esengine/ecs-framework';
import { INetworkMessage, MessageType } from '../types/NetworkTypes';

/**
 * 消息ID生成器类型
 */
export enum MessageIdGeneratorType {
    UUID = 'uuid',
    SNOWFLAKE = 'snowflake',
    SEQUENTIAL = 'sequential',
    TIMESTAMP = 'timestamp'
}

/**
 * 消息创建选项
 */
export interface MessageCreateOptions {
    reliable?: boolean;
    priority?: number;
    timestamp?: number;
}

/**
 * 消息管理器配置
 */
export interface MessageManagerConfig {
    idGenerator: MessageIdGeneratorType;
    enableTimestampValidation: boolean;
    maxTimestampDrift: number;      // 最大时间戳偏移（毫秒）
    enableMessageDeduplication: boolean;
    deduplicationWindowMs: number;   // 去重窗口时间
    enableMessageOrdering: boolean;
    orderingWindowMs: number;        // 排序窗口时间
    maxPendingMessages: number;      // 最大待处理消息数
}

/**
 * 消息验证结果
 */
export interface MessageValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}

/**
 * 消息统计信息
 */
export interface MessageStats {
    totalGenerated: number;
    totalValidated: number;
    validMessages: number;
    invalidMessages: number;
    duplicateMessages: number;
    outOfOrderMessages: number;
    timestampErrors: number;
}

/**
 * Snowflake ID生成器
 */
class SnowflakeIdGenerator {
    private static readonly EPOCH = 1640995200000; // 2022-01-01 00:00:00 UTC
    private static readonly WORKER_ID_BITS = 5;
    private static readonly DATACENTER_ID_BITS = 5;
    private static readonly SEQUENCE_BITS = 12;
    
    private readonly workerId: number;
    private readonly datacenterId: number;
    private sequence = 0;
    private lastTimestamp = -1;

    constructor(workerId: number = 1, datacenterId: number = 1) {
        this.workerId = workerId & ((1 << SnowflakeIdGenerator.WORKER_ID_BITS) - 1);
        this.datacenterId = datacenterId & ((1 << SnowflakeIdGenerator.DATACENTER_ID_BITS) - 1);
    }

    generate(): string {
        let timestamp = Date.now();

        if (timestamp < this.lastTimestamp) {
            throw new Error('时钟回拨，无法生成ID');
        }

        if (timestamp === this.lastTimestamp) {
            this.sequence = (this.sequence + 1) & ((1 << SnowflakeIdGenerator.SEQUENCE_BITS) - 1);
            if (this.sequence === 0) {
                // 等待下一毫秒
                while (timestamp <= this.lastTimestamp) {
                    timestamp = Date.now();
                }
            }
        } else {
            this.sequence = 0;
        }

        this.lastTimestamp = timestamp;

        const id = ((timestamp - SnowflakeIdGenerator.EPOCH) << 22) |
                   (this.datacenterId << 17) |
                   (this.workerId << 12) |
                   this.sequence;

        return id.toString();
    }
}

/**
 * 消息管理器
 */
export class MessageManager {
    private logger = createLogger('MessageManager');
    private config: MessageManagerConfig;
    private stats: MessageStats;
    
    // ID生成器
    private sequentialId = 0;
    private snowflakeGenerator: SnowflakeIdGenerator;
    
    // 消息去重和排序
    private recentMessageIds: Set<string> = new Set();
    private pendingMessages: Map<string, INetworkMessage> = new Map();
    private messageSequence: Map<string, number> = new Map();
    
    // 清理定时器
    private cleanupTimer?: NodeJS.Timeout;

    /**
     * 构造函数
     */
    constructor(config: Partial<MessageManagerConfig> = {}) {
        this.config = {
            idGenerator: MessageIdGeneratorType.UUID,
            enableTimestampValidation: true,
            maxTimestampDrift: 60000,        // 1分钟
            enableMessageDeduplication: true,
            deduplicationWindowMs: 300000,   // 5分钟
            enableMessageOrdering: false,
            orderingWindowMs: 10000,         // 10秒
            maxPendingMessages: 1000,
            ...config
        };

        this.stats = {
            totalGenerated: 0,
            totalValidated: 0,
            validMessages: 0,
            invalidMessages: 0,
            duplicateMessages: 0,
            outOfOrderMessages: 0,
            timestampErrors: 0
        };

        this.snowflakeGenerator = new SnowflakeIdGenerator();
        this.startCleanupTimer();
    }

    /**
     * 生成消息ID
     */
    generateMessageId(): string {
        this.stats.totalGenerated++;

        switch (this.config.idGenerator) {
            case MessageIdGeneratorType.UUID:
                return this.generateUUID();
            case MessageIdGeneratorType.SNOWFLAKE:
                return this.snowflakeGenerator.generate();
            case MessageIdGeneratorType.SEQUENTIAL:
                return (++this.sequentialId).toString();
            case MessageIdGeneratorType.TIMESTAMP:
                return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            default:
                return this.generateUUID();
        }
    }

    /**
     * 创建网络消息
     */
    createMessage<T extends INetworkMessage>(
        type: MessageType,
        data: any,
        senderId: string,
        options: MessageCreateOptions = {}
    ): T {
        const message: INetworkMessage = {
            type,
            messageId: this.generateMessageId(),
            timestamp: options.timestamp || Date.now(),
            senderId,
            data,
            reliable: options.reliable,
            priority: options.priority
        };

        return message as T;
    }

    /**
     * 验证消息
     */
    validateMessage(message: INetworkMessage, senderId?: string): MessageValidationResult {
        this.stats.totalValidated++;
        
        const errors: string[] = [];
        const warnings: string[] = [];

        // 基础字段验证
        if (!message.messageId) {
            errors.push('消息ID不能为空');
        }

        if (!message.type) {
            errors.push('消息类型不能为空');
        } else if (!Object.values(MessageType).includes(message.type)) {
            errors.push(`无效的消息类型: ${message.type}`);
        }

        if (!message.timestamp) {
            errors.push('时间戳不能为空');
        }

        if (!message.senderId) {
            errors.push('发送者ID不能为空');
        }

        // 发送者验证
        if (senderId && message.senderId !== senderId) {
            errors.push('消息发送者ID不匹配');
        }

        // 时间戳验证
        if (this.config.enableTimestampValidation && message.timestamp) {
            const now = Date.now();
            const drift = Math.abs(now - message.timestamp);
            
            if (drift > this.config.maxTimestampDrift) {
                errors.push(`时间戳偏移过大: ${drift}ms > ${this.config.maxTimestampDrift}ms`);
                this.stats.timestampErrors++;
            }
            
            if (message.timestamp > now + 10000) { // 未来10秒以上
                warnings.push('消息时间戳来自未来');
            }
        }

        // 消息去重验证
        if (this.config.enableMessageDeduplication) {
            if (this.recentMessageIds.has(message.messageId)) {
                errors.push('重复的消息ID');
                this.stats.duplicateMessages++;
            } else {
                this.recentMessageIds.add(message.messageId);
            }
        }

        const isValid = errors.length === 0;
        
        if (isValid) {
            this.stats.validMessages++;
        } else {
            this.stats.invalidMessages++;
        }

        return {
            isValid,
            errors,
            warnings
        };
    }

    /**
     * 处理消息排序
     */
    processMessageOrdering(message: INetworkMessage): INetworkMessage[] {
        if (!this.config.enableMessageOrdering) {
            return [message];
        }

        const senderId = message.senderId;
        const currentSequence = this.messageSequence.get(senderId) || 0;
        
        // 检查消息是否按顺序到达
        const messageTimestamp = message.timestamp;
        const expectedSequence = currentSequence + 1;
        
        // 简单的时间戳排序逻辑
        if (messageTimestamp >= expectedSequence) {
            // 消息按顺序到达
            this.messageSequence.set(senderId, messageTimestamp);
            return this.flushPendingMessages(senderId).concat([message]);
        } else {
            // 消息乱序，暂存
            this.pendingMessages.set(message.messageId, message);
            this.stats.outOfOrderMessages++;
            
            // 检查是否超出最大待处理数量
            if (this.pendingMessages.size > this.config.maxPendingMessages) {
                this.logger.warn('待处理消息数量过多，清理旧消息');
                this.cleanupOldPendingMessages();
            }
            
            return [];
        }
    }

    /**
     * 获取统计信息
     */
    getStats(): MessageStats {
        return { ...this.stats };
    }

    /**
     * 重置统计信息
     */
    resetStats(): void {
        this.stats = {
            totalGenerated: 0,
            totalValidated: 0,
            validMessages: 0,
            invalidMessages: 0,
            duplicateMessages: 0,
            outOfOrderMessages: 0,
            timestampErrors: 0
        };
    }

    /**
     * 更新配置
     */
    updateConfig(newConfig: Partial<MessageManagerConfig>): void {
        const oldConfig = { ...this.config };
        Object.assign(this.config, newConfig);
        
        // 如果去重配置改变，清理相关数据
        if (!this.config.enableMessageDeduplication && oldConfig.enableMessageDeduplication) {
            this.recentMessageIds.clear();
        }
        
        // 如果排序配置改变，清理相关数据
        if (!this.config.enableMessageOrdering && oldConfig.enableMessageOrdering) {
            this.pendingMessages.clear();
            this.messageSequence.clear();
        }
        
        this.logger.info('消息管理器配置已更新:', newConfig);
    }

    /**
     * 销毁管理器
     */
    destroy(): void {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
            this.cleanupTimer = undefined;
        }
        
        this.recentMessageIds.clear();
        this.pendingMessages.clear();
        this.messageSequence.clear();
    }

    /**
     * 生成UUID
     */
    private generateUUID(): string {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    /**
     * 刷新待处理消息
     */
    private flushPendingMessages(senderId: string): INetworkMessage[] {
        const flushedMessages: INetworkMessage[] = [];
        const messagesToRemove: string[] = [];
        
        for (const [messageId, message] of this.pendingMessages) {
            if (message.senderId === senderId) {
                flushedMessages.push(message);
                messagesToRemove.push(messageId);
            }
        }
        
        // 移除已处理的消息
        messagesToRemove.forEach(id => this.pendingMessages.delete(id));
        
        // 按时间戳排序
        flushedMessages.sort((a, b) => a.timestamp - b.timestamp);
        
        return flushedMessages;
    }

    /**
     * 清理过期的待处理消息
     */
    private cleanupOldPendingMessages(): void {
        const now = Date.now();
        const messagesToRemove: string[] = [];
        
        for (const [messageId, message] of this.pendingMessages) {
            if (now - message.timestamp > this.config.orderingWindowMs) {
                messagesToRemove.push(messageId);
            }
        }
        
        messagesToRemove.forEach(id => this.pendingMessages.delete(id));
        
        if (messagesToRemove.length > 0) {
            this.logger.debug(`清理了 ${messagesToRemove.length} 个过期的待处理消息`);
        }
    }

    /**
     * 启动清理定时器
     */
    private startCleanupTimer(): void {
        this.cleanupTimer = setInterval(() => {
            this.performCleanup();
        }, 60000); // 每分钟清理一次
    }

    /**
     * 执行清理操作
     */
    private performCleanup(): void {
        const now = Date.now();
        
        // 清理过期的消息ID（用于去重）
        if (this.config.enableMessageDeduplication) {
            // 由于Set没有时间戳，我们定期清理所有ID
            // 这是一个简化实现，实际项目中可以使用更复杂的数据结构
            if (this.recentMessageIds.size > 10000) {
                this.recentMessageIds.clear();
                this.logger.debug('清理了过期的消息ID缓存');
            }
        }
        
        // 清理过期的待处理消息
        if (this.config.enableMessageOrdering) {
            this.cleanupOldPendingMessages();
        }
    }

    /**
     * 获取消息处理报告
     */
    getProcessingReport() {
        const totalProcessed = this.stats.validMessages + this.stats.invalidMessages;
        const validRate = totalProcessed > 0 ? (this.stats.validMessages / totalProcessed) * 100 : 0;
        const duplicateRate = totalProcessed > 0 ? (this.stats.duplicateMessages / totalProcessed) * 100 : 0;
        
        return {
            stats: this.getStats(),
            validationRate: validRate,
            duplicateRate: duplicateRate,
            pendingMessagesCount: this.pendingMessages.size,
            cachedMessageIdsCount: this.recentMessageIds.size,
            recommendation: this.generateRecommendation(validRate, duplicateRate)
        };
    }

    /**
     * 生成优化建议
     */
    private generateRecommendation(validRate: number, duplicateRate: number): string {
        if (validRate < 90) {
            return '消息验证失败率较高，建议检查消息格式和发送逻辑';
        } else if (duplicateRate > 5) {
            return '重复消息较多，建议检查客户端重发逻辑或调整去重窗口';
        } else if (this.pendingMessages.size > this.config.maxPendingMessages * 0.8) {
            return '待处理消息过多，建议优化网络或调整排序窗口';
        } else {
            return '消息处理正常';
        }
    }

    /**
     * 批量验证消息
     */
    validateMessageBatch(messages: INetworkMessage[], senderId?: string): MessageValidationResult[] {
        return messages.map(message => this.validateMessage(message, senderId));
    }

    /**
     * 获取消息年龄（毫秒）
     */
    getMessageAge(message: INetworkMessage): number {
        return Date.now() - message.timestamp;
    }

    /**
     * 检查消息是否过期
     */
    isMessageExpired(message: INetworkMessage, maxAge: number = 300000): boolean {
        return this.getMessageAge(message) > maxAge;
    }
}