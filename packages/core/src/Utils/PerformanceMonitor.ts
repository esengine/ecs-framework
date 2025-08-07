/**
 * 性能监控数据
 */
export interface PerformanceData {
    /** 系统名称 */
    name: string;
    /** 执行时间（毫秒） */
    executionTime: number;
    /** 处理的实体数量 */
    entityCount: number;
    /** 平均每个实体的处理时间 */
    averageTimePerEntity: number;
    /** 最后更新时间戳 */
    lastUpdateTime: number;
    /** 内存使用量（字节） */
    memoryUsage?: number;
    /** CPU使用率（百分比） */
    cpuUsage?: number;
}

/**
 * 性能统计信息
 */
export interface PerformanceStats {
    /** 总执行时间 */
    totalTime: number;
    /** 平均执行时间 */
    averageTime: number;
    /** 最小执行时间 */
    minTime: number;
    /** 最大执行时间 */
    maxTime: number;
    /** 执行次数 */
    executionCount: number;
    /** 最近的执行时间列表 */
    recentTimes: number[];
    /** 标准差 */
    standardDeviation: number;
    /** 95百分位数 */
    percentile95: number;
    /** 99百分位数 */
    percentile99: number;
}

/**
 * 性能警告类型
 */
export enum PerformanceWarningType {
    HIGH_EXECUTION_TIME = 'high_execution_time',
    HIGH_MEMORY_USAGE = 'high_memory_usage',
    HIGH_CPU_USAGE = 'high_cpu_usage',
    FREQUENT_GC = 'frequent_gc',
    LOW_FPS = 'low_fps',
    HIGH_ENTITY_COUNT = 'high_entity_count'
}

/**
 * 性能警告
 */
export interface PerformanceWarning {
    type: PerformanceWarningType;
    systemName: string;
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    timestamp: number;
    value: number;
    threshold: number;
    suggestion?: string;
}

/**
 * 性能阈值配置
 */
export interface PerformanceThresholds {
    /** 执行时间阈值（毫秒） */
    executionTime: {
        warning: number;
        critical: number;
    };
    /** 内存使用阈值（MB） */
    memoryUsage: {
        warning: number;
        critical: number;
    };
    /** CPU使用率阈值（百分比） */
    cpuUsage: {
        warning: number;
        critical: number;
    };
    /** FPS阈值 */
    fps: {
        warning: number;
        critical: number;
    };
    /** 实体数量阈值 */
    entityCount: {
        warning: number;
        critical: number;
    };
}

/**
 * 高性能监控器
 * 用于监控ECS系统的性能表现，提供详细的分析和优化建议
 */
export class PerformanceMonitor {
    private static _instance: PerformanceMonitor;
    
    private _systemData = new Map<string, PerformanceData>();
    private _systemStats = new Map<string, PerformanceStats>();
    private _warnings: PerformanceWarning[] = [];
    private _isEnabled = false;
    private _maxRecentSamples = 60; // 保留最近60帧的数据
    private _maxWarnings = 100; // 最大警告数量
    
    // 性能阈值配置
    private _thresholds: PerformanceThresholds = {
        executionTime: { warning: 16.67, critical: 33.33 }, // 60fps和30fps对应的帧时间
        memoryUsage: { warning: 100, critical: 200 }, // MB
        cpuUsage: { warning: 70, critical: 90 }, // 百分比
        fps: { warning: 45, critical: 30 },
        entityCount: { warning: 1000, critical: 5000 }
    };

    // FPS监控
    private _fpsHistory: number[] = [];
    private _lastFrameTime = 0;
    private _frameCount = 0;
    private _fpsUpdateInterval = 1000; // 1秒更新一次FPS
    private _lastFpsUpdate = 0;
    private _currentFps = 60;

    // 内存监控
    private _memoryCheckInterval = 5000; // 5秒检查一次内存
    private _lastMemoryCheck = 0;
    private _memoryHistory: number[] = [];

    // GC监控
    private _gcCount = 0;
    private _lastGcCheck = 0;
    private _gcCheckInterval = 1000;
    
    /**
     * 获取单例实例
     */
    public static get instance(): PerformanceMonitor {
        if (!PerformanceMonitor._instance) {
            PerformanceMonitor._instance = new PerformanceMonitor();
        }
        return PerformanceMonitor._instance;
    }

    private constructor() {}

    /**
     * 启用性能监控
     */
    public enable(): void {
        this._isEnabled = true;
    }

    /**
     * 禁用性能监控
     */
    public disable(): void {
        this._isEnabled = false;
    }

    /**
     * 检查是否启用了性能监控
     */
    public get isEnabled(): boolean {
        return this._isEnabled;
    }

    /**
     * 开始监控系统性能
     * @param systemName 系统名称
     * @returns 开始时间戳
     */
    public startMonitoring(systemName: string): number {
        if (!this._isEnabled) {
            return 0;
        }
        return performance.now();
    }

    /**
     * 结束监控并记录性能数据
     * @param systemName 系统名称
     * @param startTime 开始时间戳
     * @param entityCount 处理的实体数量
     */
    public endMonitoring(systemName: string, startTime: number, entityCount: number = 0): void {
        if (!this._isEnabled || startTime === 0) {
            return;
        }

        const endTime = performance.now();
        const executionTime = endTime - startTime;
        const averageTimePerEntity = entityCount > 0 ? executionTime / entityCount : 0;

        // 更新当前性能数据
        const data: PerformanceData = {
            name: systemName,
            executionTime,
            entityCount,
            averageTimePerEntity,
            lastUpdateTime: endTime
        };

        this._systemData.set(systemName, data);

        // 更新统计信息
        this.updateStats(systemName, executionTime);
    }

    /**
     * 更新系统统计信息
     * @param systemName 系统名称
     * @param executionTime 执行时间
     */
    private updateStats(systemName: string, executionTime: number): void {
        let stats = this._systemStats.get(systemName);
        
        if (!stats) {
            stats = {
                totalTime: 0,
                averageTime: 0,
                minTime: Number.MAX_VALUE,
                maxTime: 0,
                executionCount: 0,
                recentTimes: [],
                standardDeviation: 0,
                percentile95: 0,
                percentile99: 0
            };
            this._systemStats.set(systemName, stats);
        }

        // 更新基本统计
        stats.totalTime += executionTime;
        stats.executionCount++;
        stats.averageTime = stats.totalTime / stats.executionCount;
        stats.minTime = Math.min(stats.minTime, executionTime);
        stats.maxTime = Math.max(stats.maxTime, executionTime);

        // 更新最近时间列表
        stats.recentTimes.push(executionTime);
        if (stats.recentTimes.length > this._maxRecentSamples) {
            stats.recentTimes.shift();
        }

        // 计算高级统计信息
        this.calculateAdvancedStats(stats);
    }

    /**
     * 计算高级统计信息
     * @param stats 统计信息对象
     */
    private calculateAdvancedStats(stats: PerformanceStats): void {
        if (stats.recentTimes.length === 0) return;

        // 计算标准差
        const mean = stats.recentTimes.reduce((a, b) => a + b, 0) / stats.recentTimes.length;
        const variance = stats.recentTimes.reduce((acc, time) => acc + Math.pow(time - mean, 2), 0) / stats.recentTimes.length;
        stats.standardDeviation = Math.sqrt(variance);

        // 计算百分位数
        const sortedTimes = [...stats.recentTimes].sort((a, b) => a - b);
        const len = sortedTimes.length;
        
        stats.percentile95 = sortedTimes[Math.floor(len * 0.95)] || 0;
        stats.percentile99 = sortedTimes[Math.floor(len * 0.99)] || 0;
    }

    /**
     * 获取系统的当前性能数据
     * @param systemName 系统名称
     * @returns 性能数据或undefined
     */
    public getSystemData(systemName: string): PerformanceData | undefined {
        return this._systemData.get(systemName);
    }

    /**
     * 获取系统的统计信息
     * @param systemName 系统名称
     * @returns 统计信息或undefined
     */
    public getSystemStats(systemName: string): PerformanceStats | undefined {
        return this._systemStats.get(systemName);
    }

    /**
     * 获取所有系统的性能数据
     * @returns 所有系统的性能数据
     */
    public getAllSystemData(): Map<string, PerformanceData> {
        return new Map(this._systemData);
    }

    /**
     * 获取所有系统的统计信息
     * @returns 所有系统的统计信息
     */
    public getAllSystemStats(): Map<string, PerformanceStats> {
        return new Map(this._systemStats);
    }

    /**
     * 获取性能报告
     * @returns 格式化的性能报告字符串
     */
    public getPerformanceReport(): string {
        if (!this._isEnabled) {
            return "Performance monitoring is disabled.";
        }

        const lines: string[] = [];
        lines.push("=== ECS Performance Report ===");
        lines.push("");

        // 按平均执行时间排序
        const sortedSystems = Array.from(this._systemStats.entries())
            .sort((a, b) => b[1].averageTime - a[1].averageTime);

        for (const [systemName, stats] of sortedSystems) {
            const data = this._systemData.get(systemName);
            
            lines.push(`System: ${systemName}`);
            lines.push(`  Current: ${data?.executionTime.toFixed(2)}ms (${data?.entityCount} entities)`);
            lines.push(`  Average: ${stats.averageTime.toFixed(2)}ms`);
            lines.push(`  Min/Max: ${stats.minTime.toFixed(2)}ms / ${stats.maxTime.toFixed(2)}ms`);
            lines.push(`  Total: ${stats.totalTime.toFixed(2)}ms (${stats.executionCount} calls)`);
            
            if (data?.averageTimePerEntity && data.averageTimePerEntity > 0) {
                lines.push(`  Per Entity: ${data.averageTimePerEntity.toFixed(4)}ms`);
            }
            
            lines.push("");
        }

        // 总体统计
        const totalCurrentTime = Array.from(this._systemData.values())
            .reduce((sum, data) => sum + data.executionTime, 0);
        
        lines.push(`Total Frame Time: ${totalCurrentTime.toFixed(2)}ms`);
        lines.push(`Systems Count: ${this._systemData.size}`);

        return lines.join('\n');
    }

    /**
     * 重置所有性能数据
     */
    public reset(): void {
        this._systemData.clear();
        this._systemStats.clear();
    }

    /**
     * 重置指定系统的性能数据
     * @param systemName 系统名称
     */
    public resetSystem(systemName: string): void {
        this._systemData.delete(systemName);
        this._systemStats.delete(systemName);
    }

    /**
     * 获取性能警告
     * @param thresholdMs 警告阈值（毫秒）
     * @returns 超过阈值的系统列表
     */
    public getPerformanceWarnings(thresholdMs: number = 16.67): string[] {
        const warnings: string[] = [];
        
        for (const [systemName, data] of this._systemData.entries()) {
            if (data.executionTime > thresholdMs) {
                warnings.push(`${systemName}: ${data.executionTime.toFixed(2)}ms (>${thresholdMs}ms)`);
            }
        }
        
        return warnings;
    }

    /**
     * 设置最大保留样本数
     * @param maxSamples 最大样本数
     */
    public setMaxRecentSamples(maxSamples: number): void {
        this._maxRecentSamples = maxSamples;
        
        // 裁剪现有数据
        for (const stats of this._systemStats.values()) {
            while (stats.recentTimes.length > maxSamples) {
                stats.recentTimes.shift();
            }
        }
    }
} 