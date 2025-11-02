import { createLogger } from '@esengine/ecs-framework';
import { EventEmitter } from '../utils/EventEmitter';

/**
 * 带宽监控配置
 */
export interface BandwidthMonitorConfig {
    /** 监控间隔(毫秒) */
    monitorInterval: number;
    /** 采样窗口大小 */
    sampleWindowSize: number;
    /** 预警阈值(0-1) */
    warningThreshold: number;
    /** 严重阈值(0-1) */
    criticalThreshold: number;
    /** 是否启用自适应调整 */
    enableAdaptive: boolean;
    /** 自适应调整因子 */
    adaptiveFactor: number;
}

/**
 * 带宽样本
 */
export interface BandwidthSample {
    timestamp: number;
    bytesIn: number;
    bytesOut: number;
    packetsIn: number;
    packetsOut: number;
    latency: number;
}

/**
 * 带宽统计
 */
export interface BandwidthStats {
    /** 当前上行带宽(bytes/s) */
    currentUpload: number;
    /** 当前下行带宽(bytes/s) */
    currentDownload: number;
    /** 平均上行带宽(bytes/s) */
    averageUpload: number;
    /** 平均下行带宽(bytes/s) */
    averageDownload: number;
    /** 峰值上行带宽(bytes/s) */
    peakUpload: number;
    /** 峰值下行带宽(bytes/s) */
    peakDownload: number;
    /** 总上传字节数 */
    totalUpload: number;
    /** 总下载字节数 */
    totalDownload: number;
    /** 当前包速率(packets/s) */
    currentPacketRate: number;
    /** 平均延迟(ms) */
    averageLatency: number;
    /** 延迟抖动(ms) */
    latencyJitter: number;
    /** 利用率(0-1) */
    utilization: number;
}

/**
 * 带宽限制
 */
export interface BandwidthLimit {
    /** 上行限制(bytes/s) */
    uploadLimit: number;
    /** 下行限制(bytes/s) */
    downloadLimit: number;
    /** 是否启用限制 */
    enabled: boolean;
}

/**
 * 带宽警告级别
 */
export enum BandwidthWarningLevel {
    Normal = 'normal',
    Warning = 'warning',
    Critical = 'critical'
}

/**
 * 带宽事件
 */
export interface BandwidthMonitorEvents {
    bandwidthChanged: (stats: BandwidthStats) => void;
    limitExceeded: (direction: 'upload' | 'download', current: number, limit: number) => void;
    warningLevelChanged: (level: BandwidthWarningLevel, stats: BandwidthStats) => void;
    adaptiveAdjustment: (oldLimits: BandwidthLimit, newLimits: BandwidthLimit) => void;
}

/**
 * 带宽监控器
 * 负责监控网络带宽使用情况并提供自适应调整
 */
export class BandwidthMonitor extends EventEmitter {
    private logger = createLogger('BandwidthMonitor');
    private config: BandwidthMonitorConfig;

    /** 带宽样本历史 */
    private samples: BandwidthSample[] = [];

    /** 当前带宽限制 */
    private limits: BandwidthLimit;

    /** 当前警告级别 */
    private currentWarningLevel = BandwidthWarningLevel.Normal;

    /** 监控定时器 */
    private monitorTimer: ReturnType<typeof setInterval> | null = null;

    /** 统计信息 */
    private stats: BandwidthStats = {
        currentUpload: 0,
        currentDownload: 0,
        averageUpload: 0,
        averageDownload: 0,
        peakUpload: 0,
        peakDownload: 0,
        totalUpload: 0,
        totalDownload: 0,
        currentPacketRate: 0,
        averageLatency: 0,
        latencyJitter: 0,
        utilization: 0
    };

    /** 上次统计时间 */
    private lastStatsTime = Date.now();

    /** 累计字节数 */
    private cumulativeBytesIn = 0;
    private cumulativeBytesOut = 0;
    private cumulativePacketsIn = 0;
    private cumulativePacketsOut = 0;

    constructor(config: Partial<BandwidthMonitorConfig> = {}) {
        super();

        this.config = {
            monitorInterval: 1000,
            sampleWindowSize: 60,
            warningThreshold: 0.8,
            criticalThreshold: 0.95,
            enableAdaptive: true,
            adaptiveFactor: 0.1,
            ...config
        };

        this.limits = {
            uploadLimit: 1024 * 1024, // 1MB/s
            downloadLimit: 1024 * 1024, // 1MB/s
            enabled: false
        };

        this.startMonitoring();
    }

    /**
     * 记录网络活动
     */
    public recordActivity(bytesIn: number, bytesOut: number, packetsIn: number = 0, packetsOut: number = 0, latency: number = 0): void {
        this.cumulativeBytesIn += bytesIn;
        this.cumulativeBytesOut += bytesOut;
        this.cumulativePacketsIn += packetsIn;
        this.cumulativePacketsOut += packetsOut;

        this.stats.totalUpload += bytesOut;
        this.stats.totalDownload += bytesIn;
    }

    /**
     * 设置带宽限制
     */
    public setBandwidthLimits(limits: Partial<BandwidthLimit>): void {
        const oldLimits = { ...this.limits };
        Object.assign(this.limits, limits);

        this.logger.info(`带宽限制已更新: 上行=${this.limits.uploadLimit}B/s, 下行=${this.limits.downloadLimit}B/s`);

        if (this.config.enableAdaptive) {
            this.emit('adaptiveAdjustment', oldLimits, this.limits);
        }
    }

    /**
     * 获取当前统计信息
     */
    public getStats(): BandwidthStats {
        return { ...this.stats };
    }

    /**
     * 获取当前限制
     */
    public getLimits(): BandwidthLimit {
        return { ...this.limits };
    }

    /**
     * 获取当前警告级别
     */
    public getWarningLevel(): BandwidthWarningLevel {
        return this.currentWarningLevel;
    }

    /**
     * 检查是否超过限制
     */
    public isOverLimit(): { upload: boolean; download: boolean } {
        if (!this.limits.enabled) {
            return { upload: false, download: false };
        }

        return {
            upload: this.stats.currentUpload > this.limits.uploadLimit,
            download: this.stats.currentDownload > this.limits.downloadLimit
        };
    }

    /**
     * 获取建议的数据发送大小
     */
    public getRecommendedSendSize(): number {
        if (!this.limits.enabled) {
            return Infinity;
        }

        const uploadUtilization = this.stats.currentUpload / this.limits.uploadLimit;

        if (uploadUtilization < this.config.warningThreshold) {
            return this.limits.uploadLimit * 0.1; // 10% of limit
        } else if (uploadUtilization < this.config.criticalThreshold) {
            return this.limits.uploadLimit * 0.05; // 5% of limit
        } else {
            return this.limits.uploadLimit * 0.01; // 1% of limit
        }
    }

    /**
     * 获取发送延迟建议
     */
    public getRecommendedDelay(): number {
        const utilization = Math.max(
            this.stats.currentUpload / this.limits.uploadLimit,
            this.stats.currentDownload / this.limits.downloadLimit
        );

        if (utilization < this.config.warningThreshold) {
            return 0;
        } else if (utilization < this.config.criticalThreshold) {
            return 100; // 100ms delay
        } else {
            return 500; // 500ms delay
        }
    }

    /**
     * 重置统计信息
     */
    public resetStats(): void {
        this.stats = {
            currentUpload: 0,
            currentDownload: 0,
            averageUpload: 0,
            averageDownload: 0,
            peakUpload: 0,
            peakDownload: 0,
            totalUpload: 0,
            totalDownload: 0,
            currentPacketRate: 0,
            averageLatency: 0,
            latencyJitter: 0,
            utilization: 0
        };

        this.samples.length = 0;
        this.cumulativeBytesIn = 0;
        this.cumulativeBytesOut = 0;
        this.cumulativePacketsIn = 0;
        this.cumulativePacketsOut = 0;
        this.lastStatsTime = Date.now();
    }

    /**
     * 更新配置
     */
    public updateConfig(newConfig: Partial<BandwidthMonitorConfig>): void {
        Object.assign(this.config, newConfig);

        if (newConfig.monitorInterval !== undefined) {
            this.restartMonitoring();
        }
    }

    /**
     * 销毁监控器
     */
    public destroy(): void {
        this.stopMonitoring();
        this.samples.length = 0;
        this.removeAllListeners();
    }

    /**
     * 开始监控
     */
    private startMonitoring(): void {
        if (this.monitorTimer) {
            return;
        }

        this.monitorTimer = setInterval(() => {
            this.updateStats();
        }, this.config.monitorInterval);
    }

    /**
     * 停止监控
     */
    private stopMonitoring(): void {
        if (this.monitorTimer) {
            clearInterval(this.monitorTimer);
            this.monitorTimer = null;
        }
    }

    /**
     * 重启监控
     */
    private restartMonitoring(): void {
        this.stopMonitoring();
        this.startMonitoring();
    }

    /**
     * 更新统计信息
     */
    private updateStats(): void {
        const now = Date.now();
        const deltaTime = (now - this.lastStatsTime) / 1000; // 转换为秒

        if (deltaTime <= 0) {
            return;
        }

        // 计算当前速率
        const currentUpload = this.cumulativeBytesOut / deltaTime;
        const currentDownload = this.cumulativeBytesIn / deltaTime;
        const currentPacketRate = (this.cumulativePacketsIn + this.cumulativePacketsOut) / deltaTime;

        // 创建新样本
        const sample: BandwidthSample = {
            timestamp: now,
            bytesIn: this.cumulativeBytesIn,
            bytesOut: this.cumulativeBytesOut,
            packetsIn: this.cumulativePacketsIn,
            packetsOut: this.cumulativePacketsOut,
            latency: 0 // 需要从外部提供
        };

        this.samples.push(sample);

        // 限制样本数量
        if (this.samples.length > this.config.sampleWindowSize) {
            this.samples.shift();
        }

        // 更新统计信息
        this.stats.currentUpload = currentUpload;
        this.stats.currentDownload = currentDownload;
        this.stats.currentPacketRate = currentPacketRate;

        // 更新峰值
        this.stats.peakUpload = Math.max(this.stats.peakUpload, currentUpload);
        this.stats.peakDownload = Math.max(this.stats.peakDownload, currentDownload);

        // 计算平均值
        this.calculateAverages();

        // 计算利用率
        this.calculateUtilization();

        // 检查限制
        this.checkLimits();

        // 检查警告级别
        this.checkWarningLevel();

        // 自适应调整
        if (this.config.enableAdaptive) {
            this.performAdaptiveAdjustment();
        }

        // 重置累计值
        this.cumulativeBytesIn = 0;
        this.cumulativeBytesOut = 0;
        this.cumulativePacketsIn = 0;
        this.cumulativePacketsOut = 0;
        this.lastStatsTime = now;

        // 发出事件
        this.emit('bandwidthChanged', this.stats);
    }

    /**
     * 计算平均值
     */
    private calculateAverages(): void {
        if (this.samples.length === 0) {
            return;
        }

        let totalUpload = 0;
        let totalDownload = 0;
        let totalLatency = 0;

        for (let i = 1; i < this.samples.length; i++) {
            const prev = this.samples[i - 1];
            const curr = this.samples[i];
            const deltaTime = (curr.timestamp - prev.timestamp) / 1000;

            if (deltaTime > 0) {
                totalUpload += (curr.bytesOut - prev.bytesOut) / deltaTime;
                totalDownload += (curr.bytesIn - prev.bytesIn) / deltaTime;
                totalLatency += curr.latency;
            }
        }

        const sampleCount = this.samples.length - 1;
        if (sampleCount > 0) {
            this.stats.averageUpload = totalUpload / sampleCount;
            this.stats.averageDownload = totalDownload / sampleCount;
            this.stats.averageLatency = totalLatency / this.samples.length;
        }

        // 计算延迟抖动
        this.calculateLatencyJitter();
    }

    /**
     * 计算延迟抖动
     */
    private calculateLatencyJitter(): void {
        if (this.samples.length < 2) {
            return;
        }

        let jitterSum = 0;
        let jitterCount = 0;

        for (let i = 1; i < this.samples.length; i++) {
            const diff = Math.abs(this.samples[i].latency - this.samples[i - 1].latency);
            jitterSum += diff;
            jitterCount++;
        }

        this.stats.latencyJitter = jitterCount > 0 ? jitterSum / jitterCount : 0;
    }

    /**
     * 计算利用率
     */
    private calculateUtilization(): void {
        if (!this.limits.enabled) {
            this.stats.utilization = 0;
            return;
        }

        const uploadUtilization = this.stats.currentUpload / this.limits.uploadLimit;
        const downloadUtilization = this.stats.currentDownload / this.limits.downloadLimit;

        this.stats.utilization = Math.max(uploadUtilization, downloadUtilization);
    }

    /**
     * 检查限制
     */
    private checkLimits(): void {
        if (!this.limits.enabled) {
            return;
        }

        if (this.stats.currentUpload > this.limits.uploadLimit) {
            this.emit('limitExceeded', 'upload', this.stats.currentUpload, this.limits.uploadLimit);
        }

        if (this.stats.currentDownload > this.limits.downloadLimit) {
            this.emit('limitExceeded', 'download', this.stats.currentDownload, this.limits.downloadLimit);
        }
    }

    /**
     * 检查警告级别
     */
    private checkWarningLevel(): void {
        let newLevel = BandwidthWarningLevel.Normal;

        if (this.stats.utilization >= this.config.criticalThreshold) {
            newLevel = BandwidthWarningLevel.Critical;
        } else if (this.stats.utilization >= this.config.warningThreshold) {
            newLevel = BandwidthWarningLevel.Warning;
        }

        if (newLevel !== this.currentWarningLevel) {
            this.currentWarningLevel = newLevel;
            this.emit('warningLevelChanged', newLevel, this.stats);
        }
    }

    /**
     * 执行自适应调整
     */
    private performAdaptiveAdjustment(): void {
        if (!this.limits.enabled || this.stats.utilization < this.config.warningThreshold) {
            return;
        }

        const oldLimits = { ...this.limits };

        // 根据当前利用率动态调整限制
        if (this.stats.utilization > this.config.criticalThreshold) {
            // 严重超载，降低限制
            this.limits.uploadLimit *= (1 - this.config.adaptiveFactor);
            this.limits.downloadLimit *= (1 - this.config.adaptiveFactor);
        } else if (this.stats.utilization < this.config.warningThreshold * 0.5) {
            // 利用率较低，可以提高限制
            this.limits.uploadLimit *= (1 + this.config.adaptiveFactor * 0.5);
            this.limits.downloadLimit *= (1 + this.config.adaptiveFactor * 0.5);
        }

        // 检查是否有变化
        if (this.limits.uploadLimit !== oldLimits.uploadLimit ||
            this.limits.downloadLimit !== oldLimits.downloadLimit) {
            this.emit('adaptiveAdjustment', oldLimits, this.limits);
        }
    }
}
