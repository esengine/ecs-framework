import { NetworkConnection } from './NetworkConnection';
import { MessageData } from '../types/NetworkTypes';
import { NETWORK_CONFIG } from '../constants/NetworkConstants';

// Logger akan diimport dari framework logger
const logger = { 
    info: console.log, 
    warn: console.warn, 
    error: console.error, 
    debug: console.debug 
};

/**
 * 心跳包数据
 */
export interface HeartbeatPacket {
    id: string;
    timestamp: number;
    sequenceNumber: number;
    type: 'ping' | 'pong';
    payload?: MessageData;
}

/**
 * 心跳统计信息
 */
export interface HeartbeatStats {
    /** 总发送数 */
    totalSent: number;
    /** 总接收数 */
    totalReceived: number;
    /** 丢包数 */
    lostPackets: number;
    /** 丢包率 */
    packetLossRate: number;
    /** 平均RTT */
    averageRtt: number;
    /** 最小RTT */
    minRtt: number;
    /** 最大RTT */
    maxRtt: number;
    /** 抖动 */
    jitter: number;
    /** 连续丢包数 */
    consecutiveLoss: number;
    /** 最后心跳时间 */
    lastHeartbeat: number;
    /** 连接状态 */
    isAlive: boolean;
}

/**
 * 心跳配置
 */
export interface HeartbeatConfig {
    /** 心跳间隔（毫秒） */
    interval: number;
    /** 超时时间（毫秒） */
    timeout: number;
    /** 最大连续丢包数 */
    maxConsecutiveLoss: number;
    /** 心跳包大小（字节） */
    packetSize: number;
    /** 是否启用自适应间隔 */
    enableAdaptiveInterval: boolean;
    /** RTT历史记录数量 */
    rttHistorySize: number;
}

/**
 * 心跳管理器
 * 
 * 提供精确的包丢失检测和连接质量监控
 */
export class HeartbeatManager {
    private static readonly DEFAULT_CONFIG: HeartbeatConfig = {
        interval: NETWORK_CONFIG.DEFAULT_HEARTBEAT_INTERVAL,
        timeout: NETWORK_CONFIG.DEFAULT_HEARTBEAT_TIMEOUT,
        maxConsecutiveLoss: NETWORK_CONFIG.DEFAULT_MAX_CONSECUTIVE_LOSS,
        packetSize: NETWORK_CONFIG.DEFAULT_HEARTBEAT_PACKET_SIZE,
        enableAdaptiveInterval: true,
        rttHistorySize: NETWORK_CONFIG.DEFAULT_RTT_HISTORY_SIZE
    };

    private _config: HeartbeatConfig;
    private _connection: NetworkConnection;
    private _isRunning: boolean = false;
    private _intervalId: NodeJS.Timeout | null = null;
    private _sequenceNumber: number = 0;

    // 统计数据
    private _stats: HeartbeatStats = {
        totalSent: 0,
        totalReceived: 0,
        lostPackets: 0,
        packetLossRate: 0,
        averageRtt: 0,
        minRtt: Number.MAX_VALUE,
        maxRtt: 0,
        jitter: 0,
        consecutiveLoss: 0,
        lastHeartbeat: 0,
        isAlive: true
    };

    // 心跳记录
    private _pendingPings: Map<string, { packet: HeartbeatPacket; sentAt: number }> = new Map();
    private _rttHistory: number[] = [];
    private _lastRtt: number = 0;

    constructor(connection: NetworkConnection, config?: Partial<HeartbeatConfig>) {
        this._connection = connection;
        this._config = { ...HeartbeatManager.DEFAULT_CONFIG, ...config };
        this.setupConnectionHandlers();
    }

    /**
     * 设置连接处理器
     */
    private setupConnectionHandlers(): void {
        this._connection.on('message', (data) => {
            this.handleMessage(data);
        });

        this._connection.on('disconnected', () => {
            this.stop();
        });
    }

    /**
     * 开始心跳监控
     */
    public start(): void {
        if (this._isRunning) {
            return;
        }

        this._isRunning = true;
        this.scheduleNextHeartbeat();
        logger.info('心跳管理器已启动');
    }

    /**
     * 停止心跳监控
     */
    public stop(): void {
        if (!this._isRunning) {
            return;
        }

        this._isRunning = false;
        
        if (this._intervalId) {
            clearTimeout(this._intervalId);
            this._intervalId = null;
        }

        this._pendingPings.clear();
        logger.info('心跳管理器已停止');
    }

    /**
     * 安排下次心跳
     */
    private scheduleNextHeartbeat(): void {
        if (!this._isRunning) {
            return;
        }

        let interval = this._config.interval;

        // 自适应间隔调整
        if (this._config.enableAdaptiveInterval) {
            interval = this.calculateAdaptiveInterval();
        }

        this._intervalId = setTimeout(() => {
            this.sendHeartbeat();
            this.scheduleNextHeartbeat();
        }, interval);
    }

    /**
     * 计算自适应间隔
     */
    private calculateAdaptiveInterval(): number {
        const baseInterval = this._config.interval;
        
        // 根据网络质量调整间隔
        if (this._stats.packetLossRate > 0.05) {
            // 丢包率高时增加心跳频率
            return Math.max(baseInterval * 0.5, 1000);
        } else if (this._stats.packetLossRate < 0.01 && this._stats.averageRtt < 50) {
            // 网络质量好时减少心跳频率
            return Math.min(baseInterval * 1.5, 15000);
        }

        return baseInterval;
    }

    /**
     * 发送心跳包
     */
    private sendHeartbeat(): void {
        const packet: HeartbeatPacket = {
            id: this.generatePacketId(),
            timestamp: Date.now(),
            sequenceNumber: ++this._sequenceNumber,
            type: 'ping',
            payload: this.generateHeartbeatPayload()
        };

        const data = this.serializePacket(packet);
        const success = this._connection.send(data);

        if (success) {
            this._pendingPings.set(packet.id, {
                packet,
                sentAt: Date.now()
            });
            this._stats.totalSent++;

            // 清理超时的心跳包
            this.cleanupTimeoutPings();
        } else {
            logger.warn('心跳包发送失败');
            this._stats.consecutiveLoss++;
            this.updateConnectionStatus();
        }
    }

    /**
     * 处理接收到的消息
     */
    private handleMessage(data: Uint8Array): void {
        try {
            const packet = this.deserializePacket(data);
            if (!packet || !this.isHeartbeatPacket(packet)) {
                return;
            }

            if (packet.type === 'ping') {
                this.handlePingPacket(packet);
            } else if (packet.type === 'pong') {
                this.handlePongPacket(packet);
            }
        } catch (error) {
            logger.debug('处理心跳包时出错:', error);
        }
    }

    /**
     * 处理Ping包
     */
    private handlePingPacket(packet: HeartbeatPacket): void {
        const pongPacket: HeartbeatPacket = {
            id: packet.id,
            timestamp: Date.now(),
            sequenceNumber: packet.sequenceNumber,
            type: 'pong',
            payload: packet.payload
        };

        const data = this.serializePacket(pongPacket);
        this._connection.send(data);
    }

    /**
     * 处理Pong包
     */
    private handlePongPacket(packet: HeartbeatPacket): void {
        const pendingPing = this._pendingPings.get(packet.id);
        if (!pendingPing) {
            return; // 可能是超时的包
        }

        // 计算RTT
        const now = Date.now();
        const rtt = now - pendingPing.sentAt;

        // 更新统计信息
        this._stats.totalReceived++;
        this._stats.lastHeartbeat = now;
        this._stats.consecutiveLoss = 0;
        this._stats.isAlive = true;

        // 更新RTT统计
        this.updateRttStats(rtt);

        // 移除已确认的ping
        this._pendingPings.delete(packet.id);

        // 更新丢包统计
        this.updatePacketLossStats();

        logger.debug(`心跳RTT: ${rtt}ms`);
    }

    /**
     * 更新RTT统计
     */
    private updateRttStats(rtt: number): void {
        this._rttHistory.push(rtt);
        if (this._rttHistory.length > this._config.rttHistorySize) {
            this._rttHistory.shift();
        }

        // 计算平均RTT
        this._stats.averageRtt = this._rttHistory.reduce((sum, r) => sum + r, 0) / this._rttHistory.length;
        
        // 更新最小/最大RTT
        this._stats.minRtt = Math.min(this._stats.minRtt, rtt);
        this._stats.maxRtt = Math.max(this._stats.maxRtt, rtt);

        // 计算抖动
        if (this._lastRtt > 0) {
            const jitterSample = Math.abs(rtt - this._lastRtt);
            this._stats.jitter = (this._stats.jitter * 0.9) + (jitterSample * 0.1);
        }
        this._lastRtt = rtt;
    }

    /**
     * 更新丢包统计
     */
    private updatePacketLossStats(): void {
        const now = Date.now();
        let lostPackets = 0;

        // 计算超时的包数量
        for (const [id, pingInfo] of this._pendingPings) {
            if (now - pingInfo.sentAt > this._config.timeout) {
                lostPackets++;
                this._pendingPings.delete(id);
            }
        }

        this._stats.lostPackets += lostPackets;
        
        if (this._stats.totalSent > 0) {
            this._stats.packetLossRate = this._stats.lostPackets / this._stats.totalSent;
        }
    }

    /**
     * 清理超时的ping包
     */
    private cleanupTimeoutPings(): void {
        const now = Date.now();
        const timeoutIds: string[] = [];

        for (const [id, pingInfo] of this._pendingPings) {
            if (now - pingInfo.sentAt > this._config.timeout) {
                timeoutIds.push(id);
            }
        }

        if (timeoutIds.length > 0) {
            this._stats.consecutiveLoss += timeoutIds.length;
            this._stats.lostPackets += timeoutIds.length;
            
            for (const id of timeoutIds) {
                this._pendingPings.delete(id);
            }

            this.updateConnectionStatus();
            logger.debug(`清理了 ${timeoutIds.length} 个超时心跳包`);
        }
    }

    /**
     * 更新连接状态
     */
    private updateConnectionStatus(): void {
        const now = Date.now();
        const timeSinceLastHeartbeat = now - this._stats.lastHeartbeat;
        
        // 检查连接是否还活着
        this._stats.isAlive = 
            this._stats.consecutiveLoss < this._config.maxConsecutiveLoss &&
            timeSinceLastHeartbeat < this._config.timeout * 2;

        if (!this._stats.isAlive) {
            logger.warn('连接被判定为不活跃', {
                consecutiveLoss: this._stats.consecutiveLoss,
                timeSinceLastHeartbeat
            });
        }
    }

    /**
     * 生成包ID
     */
    private generatePacketId(): string {
        return `heartbeat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * 生成心跳载荷
     */
    private generateHeartbeatPayload(): MessageData {
        const payloadSize = this._config.packetSize - 50; // 减去头部大小
        return {
            data: 'x'.repeat(Math.max(0, payloadSize)),
            timestamp: Date.now()
        };
    }

    /**
     * 序列化包
     */
    private serializePacket(packet: HeartbeatPacket): Uint8Array {
        const jsonString = JSON.stringify(packet);
        return new TextEncoder().encode(jsonString);
    }

    /**
     * 反序列化包
     */
    private deserializePacket(data: Uint8Array): HeartbeatPacket | null {
        try {
            const jsonString = new TextDecoder().decode(data);
            return JSON.parse(jsonString) as HeartbeatPacket;
        } catch {
            return null;
        }
    }

    /**
     * 检查是否为心跳包
     */
    private isHeartbeatPacket(packet: unknown): packet is HeartbeatPacket {
        return typeof packet === 'object' &&
               packet !== null &&
               typeof (packet as Record<string, unknown>).id === 'string' &&
               typeof (packet as Record<string, unknown>).timestamp === 'number' &&
               typeof (packet as Record<string, unknown>).sequenceNumber === 'number' &&
               ((packet as Record<string, unknown>).type === 'ping' || (packet as Record<string, unknown>).type === 'pong');
    }

    /**
     * 获取统计信息
     */
    public getStats(): HeartbeatStats {
        return { ...this._stats };
    }

    /**
     * 重置统计信息
     */
    public resetStats(): void {
        this._stats = {
            totalSent: 0,
            totalReceived: 0,
            lostPackets: 0,
            packetLossRate: 0,
            averageRtt: 0,
            minRtt: Number.MAX_VALUE,
            maxRtt: 0,
            jitter: 0,
            consecutiveLoss: 0,
            lastHeartbeat: 0,
            isAlive: true
        };
        this._rttHistory = [];
        this._pendingPings.clear();
        logger.debug('心跳统计信息已重置');
    }

    /**
     * 更新配置
     */
    public updateConfig(newConfig: Partial<HeartbeatConfig>): void {
        this._config = { ...this._config, ...newConfig };
        logger.debug('心跳配置已更新');
    }
}