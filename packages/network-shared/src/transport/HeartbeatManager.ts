/**
 * 心跳管理器
 * 负责管理网络连接的心跳检测，包括延迟测算和连接健康检测
 */
import { createLogger } from '@esengine/ecs-framework';
import { MessageType } from '../types/NetworkTypes';

/**
 * 心跳配置
 */
export interface HeartbeatConfig {
    interval: number;          // 心跳间隔（毫秒）
    timeout: number;           // 心跳超时（毫秒）
    maxMissedHeartbeats: number; // 最大丢失心跳数
    enableLatencyMeasurement: boolean; // 是否启用延迟测量
}

/**
 * 心跳状态
 */
export interface HeartbeatStatus {
    isHealthy: boolean;
    lastHeartbeat: number;
    latency?: number;
    missedHeartbeats: number;
    averageLatency?: number;
    packetLoss?: number;
}

/**
 * 心跳事件接口
 */
export interface HeartbeatEvents {
    heartbeatSent: (timestamp: number) => void;
    heartbeatReceived: (latency: number) => void;
    heartbeatTimeout: (missedCount: number) => void;
    healthStatusChanged: (isHealthy: boolean) => void;
}

/**
 * 心跳消息接口
 */
export interface HeartbeatMessage {
    type: MessageType.HEARTBEAT;
    clientTime: number;
    serverTime?: number;
    sequence?: number;
}

/**
 * 心跳管理器
 */
export class HeartbeatManager {
    private logger = createLogger('HeartbeatManager');
    private config: HeartbeatConfig;
    private status: HeartbeatStatus;
    private eventHandlers: Partial<HeartbeatEvents> = {};
    
    // 定时器
    private heartbeatTimer?: number;
    private timeoutTimer?: number;
    
    // 延迟测量
    private pendingPings: Map<number, number> = new Map();
    private latencyHistory: number[] = [];
    private sequence = 0;
    
    // 统计信息
    private sentCount = 0;
    private receivedCount = 0;

    /**
     * 发送心跳回调
     */
    private sendHeartbeat?: (message: HeartbeatMessage) => void;

    /**
     * 构造函数
     */
    constructor(config: Partial<HeartbeatConfig> = {}) {
        this.config = {
            interval: 30000,           // 30秒
            timeout: 60000,            // 60秒
            maxMissedHeartbeats: 3,    // 最大丢失3次
            enableLatencyMeasurement: true,
            ...config
        };

        this.status = {
            isHealthy: true,
            lastHeartbeat: Date.now(),
            missedHeartbeats: 0
        };
    }

    /**
     * 启动心跳
     */
    start(sendCallback: (message: HeartbeatMessage) => void): void {
        this.sendHeartbeat = sendCallback;
        this.startHeartbeatTimer();
        this.logger.info('心跳管理器已启动');
    }

    /**
     * 停止心跳
     */
    stop(): void {
        this.stopHeartbeatTimer();
        this.stopTimeoutTimer();
        this.pendingPings.clear();
        this.logger.info('心跳管理器已停止');
    }

    /**
     * 处理接收到的心跳响应
     */
    handleHeartbeatResponse(message: HeartbeatMessage): void {
        const now = Date.now();
        this.status.lastHeartbeat = now;
        this.receivedCount++;
        
        // 重置丢失心跳计数
        this.status.missedHeartbeats = 0;
        
        // 计算延迟
        if (this.config.enableLatencyMeasurement && message.sequence !== undefined) {
            const sentTime = this.pendingPings.get(message.sequence);
            if (sentTime) {
                const latency = now - sentTime;
                this.updateLatency(latency);
                this.pendingPings.delete(message.sequence);
                
                this.eventHandlers.heartbeatReceived?.(latency);
            }
        }
        
        // 更新健康状态
        this.updateHealthStatus(true);
        
        // 停止超时定时器
        this.stopTimeoutTimer();
    }

    /**
     * 处理心跳超时
     */
    handleHeartbeatTimeout(): void {
        this.status.missedHeartbeats++;
        this.logger.warn(`心跳超时，丢失次数: ${this.status.missedHeartbeats}`);
        
        // 触发超时事件
        this.eventHandlers.heartbeatTimeout?.(this.status.missedHeartbeats);
        
        // 检查是否达到最大丢失次数
        if (this.status.missedHeartbeats >= this.config.maxMissedHeartbeats) {
            this.updateHealthStatus(false);
        }
    }

    /**
     * 获取心跳状态
     */
    getStatus(): HeartbeatStatus {
        return { ...this.status };
    }

    /**
     * 获取统计信息
     */
    getStats() {
        const packetLoss = this.sentCount > 0 ? 
            ((this.sentCount - this.receivedCount) / this.sentCount) * 100 : 0;
            
        return {
            sentCount: this.sentCount,
            receivedCount: this.receivedCount,
            packetLoss,
            averageLatency: this.status.averageLatency,
            currentLatency: this.status.latency,
            isHealthy: this.status.isHealthy,
            missedHeartbeats: this.status.missedHeartbeats,
            latencyHistory: [...this.latencyHistory]
        };
    }

    /**
     * 设置事件处理器
     */
    on<K extends keyof HeartbeatEvents>(event: K, handler: HeartbeatEvents[K]): void {
        this.eventHandlers[event] = handler;
    }

    /**
     * 移除事件处理器
     */
    off<K extends keyof HeartbeatEvents>(event: K): void {
        delete this.eventHandlers[event];
    }

    /**
     * 手动发送心跳
     */
    sendHeartbeatNow(): void {
        this.doSendHeartbeat();
    }

    /**
     * 更新配置
     */
    updateConfig(newConfig: Partial<HeartbeatConfig>): void {
        Object.assign(this.config, newConfig);
        this.logger.info('心跳配置已更新:', newConfig);
        
        // 重启定时器以应用新配置
        if (this.heartbeatTimer) {
            this.stop();
            if (this.sendHeartbeat) {
                this.start(this.sendHeartbeat);
            }
        }
    }

    /**
     * 启动心跳定时器
     */
    private startHeartbeatTimer(): void {
        this.heartbeatTimer = window.setInterval(() => {
            this.doSendHeartbeat();
        }, this.config.interval);
    }

    /**
     * 停止心跳定时器
     */
    private stopHeartbeatTimer(): void {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = undefined;
        }
    }

    /**
     * 启动超时定时器
     */
    private startTimeoutTimer(): void {
        this.timeoutTimer = window.setTimeout(() => {
            this.handleHeartbeatTimeout();
        }, this.config.timeout);
    }

    /**
     * 停止超时定时器
     */
    private stopTimeoutTimer(): void {
        if (this.timeoutTimer) {
            clearTimeout(this.timeoutTimer);
            this.timeoutTimer = undefined;
        }
    }

    /**
     * 执行发送心跳
     */
    private doSendHeartbeat(): void {
        if (!this.sendHeartbeat) {
            this.logger.error('心跳发送回调未设置');
            return;
        }

        const now = Date.now();
        const sequence = this.config.enableLatencyMeasurement ? ++this.sequence : undefined;
        
        const message: HeartbeatMessage = {
            type: MessageType.HEARTBEAT,
            clientTime: now,
            sequence
        };

        try {
            this.sendHeartbeat(message);
            this.sentCount++;
            
            // 记录发送时间用于延迟计算
            if (sequence !== undefined) {
                this.pendingPings.set(sequence, now);
                
                // 清理过期的pending pings
                this.cleanupPendingPings();
            }
            
            // 启动超时定时器
            this.stopTimeoutTimer();
            this.startTimeoutTimer();
            
            this.eventHandlers.heartbeatSent?.(now);
            
        } catch (error) {
            this.logger.error('发送心跳失败:', error);
        }
    }

    /**
     * 更新延迟信息
     */
    private updateLatency(latency: number): void {
        this.status.latency = latency;
        
        // 保存延迟历史（最多100个样本）
        this.latencyHistory.push(latency);
        if (this.latencyHistory.length > 100) {
            this.latencyHistory.shift();
        }
        
        // 计算平均延迟
        this.status.averageLatency = this.latencyHistory.reduce((sum, lat) => sum + lat, 0) / this.latencyHistory.length;
        
        this.logger.debug(`延迟更新: ${latency}ms, 平均: ${this.status.averageLatency?.toFixed(1)}ms`);
    }

    /**
     * 更新健康状态
     */
    private updateHealthStatus(isHealthy: boolean): void {
        if (this.status.isHealthy !== isHealthy) {
            this.status.isHealthy = isHealthy;
            this.logger.info(`连接健康状态变更: ${isHealthy ? '健康' : '不健康'}`);
            this.eventHandlers.healthStatusChanged?.(isHealthy);
        }
    }

    /**
     * 清理过期的pending pings
     */
    private cleanupPendingPings(): void {
        const now = Date.now();
        const timeout = this.config.timeout * 2; // 清理超过2倍超时时间的记录
        
        for (const [sequence, sentTime] of this.pendingPings) {
            if (now - sentTime > timeout) {
                this.pendingPings.delete(sequence);
            }
        }
    }

    /**
     * 重置统计信息
     */
    resetStats(): void {
        this.sentCount = 0;
        this.receivedCount = 0;
        this.latencyHistory.length = 0;
        this.status.averageLatency = undefined;
        this.status.latency = undefined;
        this.status.missedHeartbeats = 0;
        this.pendingPings.clear();
        this.logger.info('心跳统计信息已重置');
    }

    /**
     * 检查连接是否健康
     */
    isConnectionHealthy(): boolean {
        const now = Date.now();
        const timeSinceLastHeartbeat = now - this.status.lastHeartbeat;
        
        return this.status.isHealthy && 
               timeSinceLastHeartbeat <= this.config.timeout &&
               this.status.missedHeartbeats < this.config.maxMissedHeartbeats;
    }

    /**
     * 获取建议的重连延迟
     */
    getReconnectDelay(): number {
        // 基于丢失心跳次数计算重连延迟
        const baseDelay = this.config.interval;
        const multiplier = Math.min(Math.pow(2, this.status.missedHeartbeats), 8);
        return baseDelay * multiplier;
    }
}