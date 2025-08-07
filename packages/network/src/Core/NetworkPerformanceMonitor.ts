/**
 * 网络性能监控器
 * 
 * 监控网络连接的性能指标，包括延迟、吞吐量、包丢失率等
 */

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
            console.warn('[NetworkPerformanceMonitor] 监控已在运行');
            return;
        }
        
        this._monitoringInterval = interval;
        this._isMonitoring = true;
        
        this._monitoringTimer = setInterval(() => {
            this.collectMetrics();
        }, this._monitoringInterval);
        
        console.log(`[NetworkPerformanceMonitor] 开始性能监控，间隔: ${interval}ms`);
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
        console.log('[NetworkPerformanceMonitor] 停止性能监控');
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
        
        // 模拟包丢失率（实际应用中需要通过心跳包检测）
        const packetLoss = this.estimatePacketLoss();
        
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
     */
    private estimatePacketLoss(): number {
        // 实际实现中应该通过心跳包或消息确认机制来检测包丢失
        // 这里提供一个简单的估算
        const recentRtt = this._rttHistory.slice(-5);
        if (recentRtt.length === 0) return 0;
        
        const avgRtt = recentRtt.reduce((a, b) => a + b, 0) / recentRtt.length;
        const maxRtt = Math.max(...recentRtt);
        
        // 基于RTT变化估算丢包率
        const rttVariation = maxRtt / avgRtt - 1;
        return Math.min(rttVariation * 0.1, 0.1); // 最大10%丢包率
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
     */
    private getSyncVarStatistics(): PerformanceSnapshot['syncVarStats'] {
        try {
            const { SyncVarSyncScheduler } = require('../SyncVar/SyncVarSyncScheduler');
            const scheduler = SyncVarSyncScheduler.Instance;
            const stats = scheduler.getStats();
            
            return {
                syncedComponents: stats.totalComponents || 0,
                syncedFields: stats.totalFields || 0,
                averageSyncRate: stats.averageFrequency || 0,
                syncDataSize: stats.totalDataSize || 0
            };
        } catch (error) {
            console.warn('[NetworkPerformanceMonitor] 获取SyncVar统计失败:', error);
            return undefined;
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
            console.warn('[NetworkPerformanceMonitor] 性能警告:', warnings.join(', '));
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
        console.log('[NetworkPerformanceMonitor] 清除历史数据');
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
                    console.error(`[NetworkPerformanceMonitor] 事件处理器错误 (${event}):`, error);
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
        
        console.log('[NetworkPerformanceMonitor] 配置已更新:', options);
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
}