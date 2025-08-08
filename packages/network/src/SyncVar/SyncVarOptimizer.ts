import { SyncVarUpdateMessage, SyncVarFieldUpdate } from '../Messaging/MessageTypes';
import { createLogger } from '@esengine/ecs-framework';

/**
 * SyncVar优化配置
 */
export interface SyncVarOptimizationConfig {
    /** 是否启用消息合并 */
    enableMessageMerging: boolean;
    /** 最大合并时间窗口（毫秒） */
    mergeTimeWindow: number;
    /** 是否启用Delta压缩 */
    enableDeltaCompression: boolean;
    /** 是否启用批量发送 */
    enableBatchSending: boolean;
    /** 批量大小限制 */
    batchSizeLimit: number;
    /** 是否启用优先级队列 */
    enablePriorityQueue: boolean;
    /** 是否启用距离剔除 */
    enableDistanceCulling: boolean;
    /** 距离剔除半径 */
    cullingDistance: number;
    /** 是否启用频率限制 */
    enableRateLimit: boolean;
    /** 每秒最大消息数 */
    maxMessagesPerSecond: number;
}

/**
 * 消息合并器
 */
export class SyncVarMessageMerger {
    private _pendingMessages: Map<string, SyncVarUpdateMessage[]> = new Map();
    private _mergeTimers: Map<string, NodeJS.Timeout> = new Map();
    private _config: SyncVarOptimizationConfig;
    
    constructor(config: SyncVarOptimizationConfig) {
        this._config = config;
    }
    
    /**
     * 添加消息到合并队列
     * 
     * @param message - SyncVar更新消息
     * @param onMerged - 合并完成回调
     */
    public addMessage(
        message: SyncVarUpdateMessage, 
        onMerged: (mergedMessage: SyncVarUpdateMessage) => void
    ): void {
        if (!this._config.enableMessageMerging) {
            onMerged(message);
            return;
        }
        
        const key = `${message.networkId}_${message.componentType}`;
        
        // 获取或创建消息列表
        let messages = this._pendingMessages.get(key);
        if (!messages) {
            messages = [];
            this._pendingMessages.set(key, messages);
        }
        
        // 添加消息到列表
        messages.push(message);
        
        // 清除现有计时器
        const existingTimer = this._mergeTimers.get(key);
        if (existingTimer) {
            clearTimeout(existingTimer);
        }
        
        // 设置新的合并计时器
        const timer = setTimeout(() => {
            this.mergeAndSend(key, onMerged);
        }, this._config.mergeTimeWindow);
        
        this._mergeTimers.set(key, timer);
    }
    
    /**
     * 合并并发送消息
     */
    private mergeAndSend(
        key: string, 
        onMerged: (mergedMessage: SyncVarUpdateMessage) => void
    ): void {
        const messages = this._pendingMessages.get(key);
        if (!messages || messages.length === 0) {
            return;
        }
        
        // 清理
        this._pendingMessages.delete(key);
        this._mergeTimers.delete(key);
        
        if (messages.length === 1) {
            // 只有一个消息，直接发送
            onMerged(messages[0]);
            return;
        }
        
        // 合并多个消息
        const mergedMessage = this.mergeMessages(messages);
        onMerged(mergedMessage);
    }
    
    /**
     * 合并多个消息为单个消息
     */
    private mergeMessages(messages: SyncVarUpdateMessage[]): SyncVarUpdateMessage {
        if (messages.length === 1) {
            return messages[0];
        }
        
        const firstMessage = messages[0];
        const fieldUpdateMap = new Map<number, SyncVarFieldUpdate>();
        
        // 合并字段更新（后面的覆盖前面的）
        for (const message of messages) {
            for (const fieldUpdate of message.fieldUpdates) {
                fieldUpdateMap.set(fieldUpdate.fieldNumber, fieldUpdate);
            }
        }
        
        // 创建合并后的消息
        const mergedFieldUpdates = Array.from(fieldUpdateMap.values());
        const lastMessage = messages[messages.length - 1];
        
        return new SyncVarUpdateMessage(
            firstMessage.networkId,
            firstMessage.componentType,
            mergedFieldUpdates,
            false, // 合并的消息总是增量同步
            firstMessage.senderId,
            lastMessage.syncSequence // 使用最新的序列号
        );
    }
    
    /**
     * 强制刷新所有待合并的消息
     */
    public flush(onMerged: (mergedMessage: SyncVarUpdateMessage) => void): void {
        for (const key of this._pendingMessages.keys()) {
            this.mergeAndSend(key, onMerged);
        }
    }
    
    /**
     * 清理所有待合并的消息
     */
    public clear(): void {
        // 清除所有计时器
        for (const timer of this._mergeTimers.values()) {
            clearTimeout(timer);
        }
        
        this._pendingMessages.clear();
        this._mergeTimers.clear();
    }
}

/**
 * 频率限制器
 */
export class SyncVarRateLimiter {
    private _messageCount: Map<string, number> = new Map();
    private _resetTimers: Map<string, NodeJS.Timeout> = new Map();
    private _config: SyncVarOptimizationConfig;
    
    constructor(config: SyncVarOptimizationConfig) {
        this._config = config;
    }
    
    /**
     * 检查是否允许发送消息
     * 
     * @param networkId - 网络对象ID
     * @returns 是否允许发送
     */
    public canSend(networkId: string): boolean {
        if (!this._config.enableRateLimit) {
            return true;
        }
        
        const currentCount = this._messageCount.get(networkId) || 0;
        
        if (currentCount >= this._config.maxMessagesPerSecond) {
            return false;
        }
        
        // 增加计数
        this._messageCount.set(networkId, currentCount + 1);
        
        // 如果这是第一个消息，设置重置计时器
        if (currentCount === 0) {
            const timer = setTimeout(() => {
                this._messageCount.delete(networkId);
                this._resetTimers.delete(networkId);
            }, 1000);
            
            this._resetTimers.set(networkId, timer);
        }
        
        return true;
    }
    
    /**
     * 重置指定对象的频率限制
     */
    public reset(networkId: string): void {
        this._messageCount.delete(networkId);
        
        const timer = this._resetTimers.get(networkId);
        if (timer) {
            clearTimeout(timer);
            this._resetTimers.delete(networkId);
        }
    }
    
    /**
     * 清理所有频率限制
     */
    public clear(): void {
        for (const timer of this._resetTimers.values()) {
            clearTimeout(timer);
        }
        
        this._messageCount.clear();
        this._resetTimers.clear();
    }
}

/**
 * 距离剔除器
 */
export class SyncVarDistanceCuller {
    private _config: SyncVarOptimizationConfig;
    private _positionCache: Map<string, { x: number; y: number; z?: number }> = new Map();
    
    constructor(config: SyncVarOptimizationConfig) {
        this._config = config;
    }
    
    /**
     * 更新对象位置
     * 
     * @param networkId - 网络对象ID
     * @param position - 位置坐标
     */
    public updatePosition(networkId: string, position: { x: number; y: number; z?: number }): void {
        this._positionCache.set(networkId, { ...position });
    }
    
    /**
     * 检查是否应该向指定观察者发送消息
     * 
     * @param targetId - 目标对象ID
     * @param observerId - 观察者ID
     * @returns 是否应该发送
     */
    public shouldSendTo(targetId: string, observerId: string): boolean {
        if (!this._config.enableDistanceCulling) {
            return true;
        }
        
        const targetPos = this._positionCache.get(targetId);
        const observerPos = this._positionCache.get(observerId);
        
        if (!targetPos || !observerPos) {
            // 位置信息不完整，默认发送
            return true;
        }
        
        const distance = this.calculateDistance(targetPos, observerPos);
        return distance <= this._config.cullingDistance;
    }
    
    /**
     * 获取在指定范围内的观察者列表
     * 
     * @param targetId - 目标对象ID
     * @param observerIds - 观察者ID列表
     * @returns 在范围内的观察者ID列表
     */
    public getObserversInRange(targetId: string, observerIds: string[]): string[] {
        if (!this._config.enableDistanceCulling) {
            return observerIds;
        }
        
        return observerIds.filter(observerId => this.shouldSendTo(targetId, observerId));
    }
    
    /**
     * 计算两点之间的距离
     */
    private calculateDistance(
        pos1: { x: number; y: number; z?: number }, 
        pos2: { x: number; y: number; z?: number }
    ): number {
        const dx = pos1.x - pos2.x;
        const dy = pos1.y - pos2.y;
        const dz = (pos1.z || 0) - (pos2.z || 0);
        
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
    
    /**
     * 清理位置缓存
     */
    public clear(): void {
        this._positionCache.clear();
    }
    
    /**
     * 移除指定对象的位置信息
     */
    public remove(networkId: string): void {
        this._positionCache.delete(networkId);
    }
}

/**
 * SyncVar性能优化器
 */
export class SyncVarOptimizer {
    private static readonly logger = createLogger('SyncVarOptimizer');
    private _config: SyncVarOptimizationConfig;
    private _messageMerger: SyncVarMessageMerger;
    private _rateLimiter: SyncVarRateLimiter;
    private _distanceCuller: SyncVarDistanceCuller;
    
    // 统计信息
    private _stats = {
        messagesProcessed: 0,
        messagesBlocked: 0,
        messagesMerged: 0,
        bytesSaved: 0
    };
    
    constructor(config?: Partial<SyncVarOptimizationConfig>) {
        // 默认配置
        this._config = {
            enableMessageMerging: true,
            mergeTimeWindow: 16, // 1帧时间
            enableDeltaCompression: true,
            enableBatchSending: true,
            batchSizeLimit: 10,
            enablePriorityQueue: true,
            enableDistanceCulling: false,
            cullingDistance: 100,
            enableRateLimit: true,
            maxMessagesPerSecond: 60,
            ...config
        };
        
        this._messageMerger = new SyncVarMessageMerger(this._config);
        this._rateLimiter = new SyncVarRateLimiter(this._config);
        this._distanceCuller = new SyncVarDistanceCuller(this._config);
    }
    
    /**
     * 处理SyncVar消息优化
     * 
     * @param message - 原始消息
     * @param targetObservers - 目标观察者列表
     * @param onOptimized - 优化完成回调
     */
    public optimizeMessage(
        message: SyncVarUpdateMessage,
        targetObservers: string[] = [],
        onOptimized: (optimizedMessages: SyncVarUpdateMessage[], observers: string[]) => void
    ): void {
        this._stats.messagesProcessed++;
        
        // 频率限制检查
        if (!this._rateLimiter.canSend(message.networkId)) {
            this._stats.messagesBlocked++;
            SyncVarOptimizer.logger.debug(` 消息被频率限制阻止: ${message.networkId}`);
            return;
        }
        
        // 距离剔除
        const validObservers = this._distanceCuller.getObserversInRange(message.networkId, targetObservers);
        
        if (validObservers.length === 0 && targetObservers.length > 0) {
            this._stats.messagesBlocked++;
            SyncVarOptimizer.logger.debug(` 消息被距离剔除阻止: ${message.networkId}`);
            return;
        }
        
        // 消息合并
        this._messageMerger.addMessage(message, (mergedMessage) => {
            if (mergedMessage !== message) {
                this._stats.messagesMerged++;
                SyncVarOptimizer.logger.debug(` 消息已合并: ${message.networkId}`);
            }
            
            onOptimized([mergedMessage], validObservers);
        });
    }
    
    /**
     * 更新对象位置（用于距离剔除）
     */
    public updateObjectPosition(networkId: string, position: { x: number; y: number; z?: number }): void {
        this._distanceCuller.updatePosition(networkId, position);
    }
    
    /**
     * 配置优化器
     */
    public configure(config: Partial<SyncVarOptimizationConfig>): void {
        this._config = { ...this._config, ...config };
        SyncVarOptimizer.logger.info(' 配置已更新:', this._config);
    }
    
    /**
     * 强制刷新所有待处理的消息
     */
    public flush(onOptimized?: (optimizedMessages: SyncVarUpdateMessage[], observers: string[]) => void): void {
        this._messageMerger.flush((mergedMessage) => {
            if (onOptimized) {
                onOptimized([mergedMessage], []);
            }
        });
    }
    
    /**
     * 重置指定对象的优化状态
     */
    public resetObject(networkId: string): void {
        this._rateLimiter.reset(networkId);
        this._distanceCuller.remove(networkId);
    }
    
    /**
     * 获取优化统计信息
     */
    public getStats(): typeof SyncVarOptimizer.prototype._stats & {
        config: SyncVarOptimizationConfig;
        optimizationRatio: number;
    } {
        const optimizationRatio = this._stats.messagesProcessed > 0 
            ? (this._stats.messagesBlocked + this._stats.messagesMerged) / this._stats.messagesProcessed 
            : 0;
            
        return {
            ...this._stats,
            config: { ...this._config },
            optimizationRatio
        };
    }
    
    /**
     * 重置统计信息
     */
    public resetStats(): void {
        this._stats = {
            messagesProcessed: 0,
            messagesBlocked: 0,
            messagesMerged: 0,
            bytesSaved: 0
        };
    }
    
    /**
     * 清理优化器
     */
    public cleanup(): void {
        this._messageMerger.clear();
        this._rateLimiter.clear();
        this._distanceCuller.clear();
        this.resetStats();
    }
}