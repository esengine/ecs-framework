/**
 * 网络性能监控器
 * 
 * 监控网络连接的性能指标，包括延迟、吞吐量、包丢失率等
 */
import { createLogger } from '@esengine/ecs-framework';
import { HeartbeatManager, HeartbeatStats } from './HeartbeatManager';
import { NetworkConnection } from './NetworkConnection';

export interface NetworkMetrics {
    /** 往返时延 (ms) */
    rtt: number;
    /** 延迟 (ms) */
    latency: number;
    /** 上行带宽 (bytes/s) */
    uploadBandwidth: number;
    /** 下行带宽 (bytes/s) */
    downloadBandwidth: number;
    /** 包丢失率 (0-1) */
    packetLoss: number;
    /** 抖动 (ms) */
    jitter: number;
    /** 连接质量评分 (0-100) */
    connectionQuality: number;
}

export interface PerformanceSnapshot {
    /** 时间戳 */
    timestamp: number;
    /** 网络指标 */
    metrics: NetworkMetrics;
    /** 连接统计 */
    connectionStats: {
        /** 发送的总字节数 */
        bytesSent: number;
        /** 接收的总字节数 */
        bytesReceived: number;
        /** 发送的总消息数 */
        messagesSent: number;
        /** 接收的总消息数 */
        messagesReceived: number;
        /** 活跃连接数 */
        activeConnections: number;
    };
    /** SyncVar同步统计 */
    syncVarStats?: {
        /** 同步的组件数 */
        syncedComponents: number;
        /** 同步的字段数 */
        syncedFields: number;
        /** 平均同步频率 (Hz) */
        averageSyncRate: number;
        /** 同步数据大小 (bytes) */
        syncDataSize: number;
    };
}

/**
 * 网络性能监控器
 */
export class NetworkPerformanceMonitor {
    private static readonly logger = createLogger('NetworkPerformanceMonitor');
    private static _instance: NetworkPerformanceMonitor | null = null;
    
    /** 性能快照历史 */
    private _snapshots: PerformanceSnapshot[] = [];
    
    /** 最大历史记录数量 */
    private _maxSnapshots: number = 100;
    
    /** 监控间隔 (ms) */
    private _monitoringInterval: number = 1000;
    
    /** 监控定时器 */
    private _monitoringTimer: NodeJS.Timeout | null = null;
    
    /** 是否正在监控 */
    private _isMonitoring: boolean = false;
    
    /** RTT测量历史 */
    private _rttHistory: number[] = [];
    
    /** 最大RTT历史长度 */
    private _maxRttHistory: number = 20;
    
    /** 带宽测量窗口 */
    private _bandwidthWindow: {
        timestamp: number;
        uploadBytes: number;
        downloadBytes: number;
    }[] = [];
    
    /** 带宽测量窗口大小 */
    private _bandwidthWindowSize: number = 10;
    
    /** 连接统计 */
    private _connectionStats = {
        bytesSent: 0,
        bytesReceived: 0,
        messagesSent: 0,
        messagesReceived: 0,
        activeConnections: 0
    };
    
    /** 事件监听器 */
    private _eventListeners: Map<string, Function[]> = new Map();
    
    /** 心跳管理器映射 */
    private _heartbeatManagers: Map<string, HeartbeatManager> = new Map();
    
    public static get Instance(): NetworkPerformanceMonitor {
        if (!NetworkPerformanceMonitor._instance) {
            NetworkPerformanceMonitor._instance = new NetworkPerformanceMonitor();
        }
        return NetworkPerformanceMonitor._instance;
    }
    
    private constructor() {}
    
    /**
     * 开始性能监控
     * 
     * @param interval - 监控间隔 (ms)
     */
    public startMonitoring(interval: number = 1000): void {
        if (this._isMonitoring) {
            NetworkPerformanceMonitor.logger.warn('监控已在运行');
            return;
        }
        
        this._monitoringInterval = interval;
        this._isMonitoring = true;
        
        this._monitoringTimer = setInterval(() => {
            this.collectMetrics();
        }, this._monitoringInterval);
        
        NetworkPerformanceMonitor.logger.info(`开始性能监控，间隔: ${interval}ms`);
    }
    
    /**
     * 停止性能监控
     */
    public stopMonitoring(): void {
        if (!this._isMonitoring) {
            return;
        }
        
        if (this._monitoringTimer) {
            clearInterval(this._monitoringTimer);
            this._monitoringTimer = null;
        }
        
        this._isMonitoring = false;
        NetworkPerformanceMonitor.logger.info('停止性能监控');
    }
    
    /**
     * 收集网络性能指标
     */
    private collectMetrics(): void {
        const timestamp = Date.now();
        
        // 计算网络指标
        const metrics = this.calculateNetworkMetrics();
        
        // 获取SyncVar统计
        const syncVarStats = this.getSyncVarStatistics();
        
        // 创建性能快照
        const snapshot: PerformanceSnapshot = {
            timestamp,
            metrics,
            connectionStats: { ...this._connectionStats },
            syncVarStats
        };
        
        // 添加到历史记录
        this._snapshots.push(snapshot);
        
        // 限制历史记录数量
        if (this._snapshots.length > this._maxSnapshots) {
            this._snapshots.shift();
        }
        
        // 触发监控事件
        this.emit('metricsCollected', snapshot);
        
        // 检查性能警告
        this.checkPerformanceWarnings(metrics);
    }
    
    /**
     * 计算网络指标
     */
    private calculateNetworkMetrics(): NetworkMetrics {
        // 计算RTT
        const avgRtt = this._rttHistory.length > 0 
            ? this._rttHistory.reduce((a, b) => a + b, 0) / this._rttHistory.length
            : 0;
        
        // 计算抖动
        const jitter = this.calculateJitter();
        
        // 计算带宽
        const { uploadBandwidth, downloadBandwidth } = this.calculateBandwidth();
        
        // 获取真实的包丢失率（优先使用心跳管理器数据）
        const packetLoss = this.getAccuratePacketLoss();
        
        // 计算连接质量评分
        const connectionQuality = this.calculateConnectionQuality(avgRtt, jitter, packetLoss);
        
        return {
            rtt: avgRtt,
            latency: avgRtt / 2, // 单向延迟近似为RTT的一半
            uploadBandwidth,
            downloadBandwidth,
            packetLoss,
            jitter,
            connectionQuality
        };
    }
    
    /**
     * 计算抖动
     */
    private calculateJitter(): number {
        if (this._rttHistory.length < 2) {
            return 0;
        }
        
        let totalVariation = 0;
        for (let i = 1; i < this._rttHistory.length; i++) {
            totalVariation += Math.abs(this._rttHistory[i] - this._rttHistory[i - 1]);
        }
        
        return totalVariation / (this._rttHistory.length - 1);
    }
    
    /**
     * 计算带宽
     */
    private calculateBandwidth(): { uploadBandwidth: number; downloadBandwidth: number } {
        if (this._bandwidthWindow.length < 2) {
            return { uploadBandwidth: 0, downloadBandwidth: 0 };
        }
        
        const first = this._bandwidthWindow[0];
        const last = this._bandwidthWindow[this._bandwidthWindow.length - 1];
        const timeDiff = (last.timestamp - first.timestamp) / 1000; // 转换为秒
        
        if (timeDiff <= 0) {
            return { uploadBandwidth: 0, downloadBandwidth: 0 };
        }
        
        const uploadBandwidth = (last.uploadBytes - first.uploadBytes) / timeDiff;
        const downloadBandwidth = (last.downloadBytes - first.downloadBytes) / timeDiff;
        
        return { uploadBandwidth, downloadBandwidth };
    }
    
    /**
     * 估算包丢失率
     * 使用多种指标进行更精确的丢包检测
     */
    private estimatePacketLoss(): number {
        const recentRtt = this._rttHistory.slice(-10); // 增加样本数量
        if (recentRtt.length < 3) return 0; // 需要足够的样本
        
        // 1. 基于RTT标准差的检测
        const avgRtt = recentRtt.reduce((a, b) => a + b, 0) / recentRtt.length;
        const variance = recentRtt.reduce((sum, rtt) => sum + Math.pow(rtt - avgRtt, 2), 0) / recentRtt.length;
        const stdDev = Math.sqrt(variance);
        const coefficientOfVariation = stdDev / avgRtt;
        
        // 2. 异常RTT值检测（可能是重传导致）
        const threshold = avgRtt + 2 * stdDev;
        const abnormalRttCount = recentRtt.filter(rtt => rtt > threshold).length;
        const abnormalRttRatio = abnormalRttCount / recentRtt.length;
        
        // 3. 基于连续超时的检测
        let consecutiveHighRtt = 0;
        let maxConsecutive = 0;
        for (const rtt of recentRtt) {
            if (rtt > avgRtt * 1.5) {
                consecutiveHighRtt++;
                maxConsecutive = Math.max(maxConsecutive, consecutiveHighRtt);
            } else {
                consecutiveHighRtt = 0;
            }
        }
        const consecutiveImpact = Math.min(maxConsecutive / recentRtt.length * 2, 1);
        
        // 综合评估丢包率
        const basePacketLoss = Math.min(coefficientOfVariation * 0.3, 0.15);
        const abnormalAdjustment = abnormalRttRatio * 0.1;
        const consecutiveAdjustment = consecutiveImpact * 0.05;
        
        const totalPacketLoss = basePacketLoss + abnormalAdjustment + consecutiveAdjustment;
        return Math.min(totalPacketLoss, 0.2); // 最大20%丢包率
    }
    
    /**
     * 计算连接质量评分
     */
    private calculateConnectionQuality(rtt: number, jitter: number, packetLoss: number): number {
        let quality = 100;
        
        // RTT影响（大于100ms开始扣分）
        if (rtt > 100) {
            quality -= Math.min((rtt - 100) / 10, 30);
        }
        
        // 抖动影响（大于20ms开始扣分）
        if (jitter > 20) {
            quality -= Math.min((jitter - 20) / 5, 25);
        }
        
        // 丢包影响
        quality -= packetLoss * 100;
        
        return Math.max(Math.min(quality, 100), 0);
    }
    
    /**
     * 获取SyncVar统计信息
     * 改进异常处理，提供更详细的错误信息和降级策略
     * 使用懒加载避免循环依赖问题
     */
    private getSyncVarStatistics(): PerformanceSnapshot['syncVarStats'] {
        try {
            // 使用懒加载获取SyncVarSyncScheduler，避免循环依赖
            const scheduler = this.getSyncVarScheduler();
            
            if (!scheduler) {
                NetworkPerformanceMonitor.logger.debug('SyncVarSyncScheduler实例不存在，可能尚未初始化');
                return {
                    syncedComponents: 0,
                    syncedFields: 0,
                    averageSyncRate: 0,
                    syncDataSize: 0
                };
            }
            
            // 检查getStats方法是否存在
            if (typeof scheduler.getStats !== 'function') {
                NetworkPerformanceMonitor.logger.warn('SyncVarSyncScheduler缺少getStats方法');
                return {
                    syncedComponents: 0,
                    syncedFields: 0,
                    averageSyncRate: 0,
                    syncDataSize: 0
                };
            }
            
            const stats = scheduler.getStats();
            
            // 验证统计数据的有效性
            const validatedStats = {
                syncedComponents: (typeof stats.totalComponents === 'number') ? Math.max(0, stats.totalComponents) : 0,
                syncedFields: (typeof stats.totalFields === 'number') ? Math.max(0, stats.totalFields) : 0,
                averageSyncRate: (typeof stats.averageFrequency === 'number') ? Math.max(0, stats.averageFrequency) : 0,
                syncDataSize: (typeof stats.totalDataSize === 'number') ? Math.max(0, stats.totalDataSize) : 0
            };
            
            return validatedStats;
            
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            NetworkPerformanceMonitor.logger.warn(`获取SyncVar统计失败: ${errorMsg}, 返回默认统计数据`);
            
            // 返回安全的默认值而不是undefined
            return {
                syncedComponents: 0,
                syncedFields: 0,
                averageSyncRate: 0,
                syncDataSize: 0
            };
        }
    }

    /**
     * 懒加载获取SyncVarSyncScheduler实例，避免循环依赖
     */
    private getSyncVarScheduler(): any | null {
        try {
            // 检查全局对象中是否已有实例
            const globalObj = (globalThis as any);
            if (globalObj.SyncVarSyncScheduler && globalObj.SyncVarSyncScheduler.Instance) {
                return globalObj.SyncVarSyncScheduler.Instance;
            }
            
            // 尝试动态导入（仅在必要时）
            try {
                const SyncVarModule = require('../SyncVar/SyncVarSyncScheduler');
                if (SyncVarModule.SyncVarSyncScheduler && SyncVarModule.SyncVarSyncScheduler.Instance) {
                    return SyncVarModule.SyncVarSyncScheduler.Instance;
                }
            } catch (requireError) {
                // 如果动态require失败，返回null而不是抛出错误
                NetworkPerformanceMonitor.logger.debug('无法动态加载SyncVarSyncScheduler模块');
            }
            
            return null;
        } catch (error) {
            NetworkPerformanceMonitor.logger.debug('获取SyncVarScheduler实例失败');
            return null;
        }
    }
    
    /**
     * 检查性能警告
     */
    private checkPerformanceWarnings(metrics: NetworkMetrics): void {
        const warnings: string[] = [];
        
        if (metrics.rtt > 200) {
            warnings.push(`高延迟: ${metrics.rtt.toFixed(1)}ms`);
        }
        
        if (metrics.jitter > 50) {
            warnings.push(`高抖动: ${metrics.jitter.toFixed(1)}ms`);
        }
        
        if (metrics.packetLoss > 0.05) {
            warnings.push(`高丢包率: ${(metrics.packetLoss * 100).toFixed(1)}%`);
        }
        
        if (metrics.connectionQuality < 70) {
            warnings.push(`连接质量低: ${metrics.connectionQuality.toFixed(0)}/100`);
        }
        
        if (warnings.length > 0) {
            this.emit('performanceWarning', warnings);
            NetworkPerformanceMonitor.logger.warn('性能警告:', warnings.join(', '));
        }
    }
    
    /**
     * 记录RTT测量
     */
    public recordRtt(rtt: number): void {
        this._rttHistory.push(rtt);
        
        if (this._rttHistory.length > this._maxRttHistory) {
            this._rttHistory.shift();
        }
    }
    
    /**
     * 记录数据传输
     */
    public recordDataTransfer(sent: number, received: number): void {
        this._connectionStats.bytesSent += sent;
        this._connectionStats.bytesReceived += received;
        
        // 更新带宽测量窗口
        const timestamp = Date.now();
        this._bandwidthWindow.push({
            timestamp,
            uploadBytes: this._connectionStats.bytesSent,
            downloadBytes: this._connectionStats.bytesReceived
        });
        
        if (this._bandwidthWindow.length > this._bandwidthWindowSize) {
            this._bandwidthWindow.shift();
        }
    }
    
    /**
     * 记录消息传输
     */
    public recordMessageTransfer(sent: number, received: number): void {
        this._connectionStats.messagesSent += sent;
        this._connectionStats.messagesReceived += received;
    }
    
    /**
     * 更新活跃连接数
     */
    public updateActiveConnections(count: number): void {
        this._connectionStats.activeConnections = count;
    }
    
    /**
     * 获取当前网络指标
     */
    public getCurrentMetrics(): NetworkMetrics {
        return this.calculateNetworkMetrics();
    }
    
    /**
     * 获取性能快照历史
     */
    public getSnapshots(count?: number): PerformanceSnapshot[] {
        if (count && count > 0) {
            return this._snapshots.slice(-count);
        }
        return [...this._snapshots];
    }
    
    /**
     * 获取最新的性能快照
     */
    public getLatestSnapshot(): PerformanceSnapshot | null {
        return this._snapshots.length > 0 ? this._snapshots[this._snapshots.length - 1] : null;
    }
    
    /**
     * 清除历史数据
     */
    public clearHistory(): void {
        this._snapshots = [];
        this._rttHistory = [];
        this._bandwidthWindow = [];
        NetworkPerformanceMonitor.logger.debug('清除历史数据');
    }
    
    /**
     * 生成性能报告
     */
    public generateReport(timeRangeMs?: number): {
        summary: {
            averageRtt: number;
            averageJitter: number;
            averagePacketLoss: number;
            averageQuality: number;
            totalBytesSent: number;
            totalBytesReceived: number;
            totalMessages: number;
        };
        snapshots: PerformanceSnapshot[];
    } {
        let snapshots = this._snapshots;
        
        if (timeRangeMs && timeRangeMs > 0) {
            const cutoffTime = Date.now() - timeRangeMs;
            snapshots = snapshots.filter(s => s.timestamp >= cutoffTime);
        }
        
        if (snapshots.length === 0) {
            return {
                summary: {
                    averageRtt: 0,
                    averageJitter: 0,
                    averagePacketLoss: 0,
                    averageQuality: 0,
                    totalBytesSent: 0,
                    totalBytesReceived: 0,
                    totalMessages: 0
                },
                snapshots: []
            };
        }
        
        const summary = {
            averageRtt: snapshots.reduce((sum, s) => sum + s.metrics.rtt, 0) / snapshots.length,
            averageJitter: snapshots.reduce((sum, s) => sum + s.metrics.jitter, 0) / snapshots.length,
            averagePacketLoss: snapshots.reduce((sum, s) => sum + s.metrics.packetLoss, 0) / snapshots.length,
            averageQuality: snapshots.reduce((sum, s) => sum + s.metrics.connectionQuality, 0) / snapshots.length,
            totalBytesSent: this._connectionStats.bytesSent,
            totalBytesReceived: this._connectionStats.bytesReceived,
            totalMessages: this._connectionStats.messagesSent + this._connectionStats.messagesReceived
        };
        
        return { summary, snapshots };
    }
    
    /**
     * 添加事件监听器
     */
    public on(event: string, listener: Function): void {
        if (!this._eventListeners.has(event)) {
            this._eventListeners.set(event, []);
        }
        this._eventListeners.get(event)!.push(listener);
    }
    
    /**
     * 移除事件监听器
     */
    public off(event: string, listener: Function): void {
        const listeners = this._eventListeners.get(event);
        if (listeners) {
            const index = listeners.indexOf(listener);
            if (index !== -1) {
                listeners.splice(index, 1);
            }
        }
    }
    
    /**
     * 触发事件
     */
    private emit(event: string, ...args: any[]): void {
        const listeners = this._eventListeners.get(event);
        if (listeners) {
            listeners.forEach(listener => {
                try {
                    listener(...args);
                } catch (error) {
                    NetworkPerformanceMonitor.logger.error(`事件处理器错误 (${event}):`, error);
                }
            });
        }
    }
    
    /**
     * 配置监控参数
     */
    public configure(options: {
        maxSnapshots?: number;
        maxRttHistory?: number;
        bandwidthWindowSize?: number;
    }): void {
        if (options.maxSnapshots && options.maxSnapshots > 0) {
            this._maxSnapshots = options.maxSnapshots;
        }
        
        if (options.maxRttHistory && options.maxRttHistory > 0) {
            this._maxRttHistory = options.maxRttHistory;
        }
        
        if (options.bandwidthWindowSize && options.bandwidthWindowSize > 0) {
            this._bandwidthWindowSize = options.bandwidthWindowSize;
        }
        
        NetworkPerformanceMonitor.logger.info('配置已更新:', options);
    }
    
    /**
     * 获取监控器统计信息
     */
    public getMonitorStats(): {
        isMonitoring: boolean;
        interval: number;
        snapshotCount: number;
        rttHistoryLength: number;
        bandwidthWindowSize: number;
    } {
        return {
            isMonitoring: this._isMonitoring,
            interval: this._monitoringInterval,
            snapshotCount: this._snapshots.length,
            rttHistoryLength: this._rttHistory.length,
            bandwidthWindowSize: this._bandwidthWindow.length
        };
    }

    /**
     * 网络质量自适应机制
     * 根据网络状况动态调整同步策略
     */
    public adaptNetworkStrategy(): {
        suggestedSyncInterval: number;
        suggestedBatchSize: number;
        suggestedCompressionLevel: number;
        prioritizeUpdate: boolean;
    } {
        const metrics = this.getCurrentMetrics();
        
        // 基础设置
        let syncInterval = 50; // 默认50ms
        let batchSize = 10;   // 默认批大小
        let compressionLevel = 1; // 默认压缩级别
        let prioritizeUpdate = false;
        
        // 根据连接质量调整
        if (metrics.connectionQuality >= 80) {
            // 高质量网络: 高频更新，小批次
            syncInterval = 33; // 30fps
            batchSize = 5;
            compressionLevel = 0; // 不压缩
        } else if (metrics.connectionQuality >= 60) {
            // 中等质量网络: 标准设置
            syncInterval = 50; // 20fps
            batchSize = 10;
            compressionLevel = 1;
        } else if (metrics.connectionQuality >= 40) {
            // 低质量网络: 降低频率，增加批处理
            syncInterval = 100; // 10fps
            batchSize = 20;
            compressionLevel = 2;
            prioritizeUpdate = true;
        } else {
            // 极低质量网络: 最保守设置
            syncInterval = 200; // 5fps
            batchSize = 50;
            compressionLevel = 3;
            prioritizeUpdate = true;
        }
        
        // 根据RTT进一步调整
        if (metrics.rtt > 300) {
            syncInterval = Math.max(syncInterval * 1.5, 200);
            batchSize = Math.min(batchSize * 2, 100);
        }
        
        // 根据丢包率调整
        if (metrics.packetLoss > 0.1) {
            syncInterval = Math.max(syncInterval * 1.2, 150);
            compressionLevel = Math.min(compressionLevel + 1, 3);
            prioritizeUpdate = true;
        }
        
        return {
            suggestedSyncInterval: Math.round(syncInterval),
            suggestedBatchSize: Math.round(batchSize),
            suggestedCompressionLevel: compressionLevel,
            prioritizeUpdate
        };
    }

    /**
     * 检测网络拥塞状态
     */
    public detectNetworkCongestion(): {
        isCongested: boolean;
        congestionLevel: 'none' | 'light' | 'moderate' | 'severe';
        suggestedAction: string;
    } {
        const recentSnapshots = this._snapshots.slice(-5);
        if (recentSnapshots.length < 3) {
            return {
                isCongested: false,
                congestionLevel: 'none',
                suggestedAction: '数据不足，继续监控'
            };
        }
        
        // 计算趋势
        const rttTrend = this.calculateTrend(recentSnapshots.map(s => s.metrics.rtt));
        const packetLossTrend = this.calculateTrend(recentSnapshots.map(s => s.metrics.packetLoss));
        const qualityTrend = this.calculateTrend(recentSnapshots.map(s => s.metrics.connectionQuality));
        
        // 检测拥塞指标
        const avgRtt = recentSnapshots.reduce((sum, s) => sum + s.metrics.rtt, 0) / recentSnapshots.length;
        const avgPacketLoss = recentSnapshots.reduce((sum, s) => sum + s.metrics.packetLoss, 0) / recentSnapshots.length;
        const avgQuality = recentSnapshots.reduce((sum, s) => sum + s.metrics.connectionQuality, 0) / recentSnapshots.length;
        
        // 拥塞判定
        let congestionLevel: 'none' | 'light' | 'moderate' | 'severe' = 'none';
        let suggestedAction = '网络状况良好';
        
        if (avgRtt > 500 || avgPacketLoss > 0.15 || avgQuality < 30) {
            congestionLevel = 'severe';
            suggestedAction = '严重拥塞，建议降低同步频率至最低，启用高压缩';
        } else if (avgRtt > 300 || avgPacketLoss > 0.08 || avgQuality < 50) {
            congestionLevel = 'moderate';
            suggestedAction = '中等拥塞，建议减少同步频率，启用压缩';
        } else if (avgRtt > 150 || avgPacketLoss > 0.03 || avgQuality < 70) {
            congestionLevel = 'light';
            suggestedAction = '轻微拥塞，建议适度降低同步频率';
        }
        
        const isCongested = congestionLevel !== 'none';
        
        return {
            isCongested,
            congestionLevel,
            suggestedAction
        };
    }

    /**
     * 计算数据趋势（斜率）
     */
    private calculateTrend(values: number[]): number {
        if (values.length < 2) return 0;
        
        const n = values.length;
        let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
        
        for (let i = 0; i < n; i++) {
            sumX += i;
            sumY += values[i];
            sumXY += i * values[i];
            sumX2 += i * i;
        }
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        return slope;
    }

    /**
     * 为连接添加心跳监控
     */
    public addHeartbeatMonitoring(connectionId: string, connection: NetworkConnection): void {
        if (!this._heartbeatManagers.has(connectionId)) {
            const heartbeatManager = new HeartbeatManager(connection);
            this._heartbeatManagers.set(connectionId, heartbeatManager);
            heartbeatManager.start();
            NetworkPerformanceMonitor.logger.info(`为连接 ${connectionId} 启动心跳监控`);
        }
    }

    /**
     * 移除连接的心跳监控
     */
    public removeHeartbeatMonitoring(connectionId: string): void {
        const heartbeatManager = this._heartbeatManagers.get(connectionId);
        if (heartbeatManager) {
            heartbeatManager.stop();
            this._heartbeatManagers.delete(connectionId);
            NetworkPerformanceMonitor.logger.info(`移除连接 ${connectionId} 的心跳监控`);
        }
    }

    /**
     * 获取精确的包丢失率（优先使用心跳数据）
     */
    private getAccuratePacketLoss(): number {
        let totalPacketLoss = 0;
        let count = 0;

        // 从心跳管理器获取真实丢包率
        for (const heartbeatManager of this._heartbeatManagers.values()) {
            const stats = heartbeatManager.getStats();
            totalPacketLoss += stats.packetLossRate;
            count++;
        }

        if (count > 0) {
            return totalPacketLoss / count;
        }

        // 回退到估算方法
        return this.estimatePacketLoss();
    }

    /**
     * 获取心跳统计信息
     */
    public getHeartbeatStats(): Map<string, HeartbeatStats> {
        const stats = new Map<string, HeartbeatStats>();
        
        for (const [connectionId, manager] of this._heartbeatManagers) {
            stats.set(connectionId, manager.getStats());
        }

        return stats;
    }

    /**
     * 获取所有连接的健康状态
     */
    public getConnectionHealth(): Map<string, boolean> {
        const health = new Map<string, boolean>();
        
        for (const [connectionId, manager] of this._heartbeatManagers) {
            const stats = manager.getStats();
            health.set(connectionId, stats.isAlive);
        }

        return health;
    }
}