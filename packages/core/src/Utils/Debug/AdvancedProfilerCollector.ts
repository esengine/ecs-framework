/**
 * 高级性能分析数据收集器
 *
 * 整合 ProfilerSDK 和现有 PerformanceMonitor 的数据，
 * 提供统一的高级性能分析数据接口
 */

import { ProfilerSDK } from '../Profiler/ProfilerSDK';
import {
    ProfileCategory,
    ProfileFrame,
    ProfileReport,
    MemorySnapshot
} from '../Profiler/ProfilerTypes';
import { Time } from '../Time';

/**
 * 旧版 PerformanceMonitor 接口 (用于兼容)
 */
export interface ILegacyPerformanceMonitor {
    getAllSystemStats?: () => Map<string, {
        averageTime: number;
        minTime?: number;
        maxTime?: number;
        executionCount?: number;
    }>;
    getAllSystemData?: () => Map<string, {
        executionTime: number;
        entityCount?: number;
    }>;
}

/**
 * 高级性能数据接口
 */
export interface IAdvancedProfilerData {
    /** 当前帧信息 */
    currentFrame: {
        frameNumber: number;
        frameTime: number;
        fps: number;
        memory: MemorySnapshot;
    };
    /** 帧时间历史 (用于绘制图表) */
    frameTimeHistory: Array<{
        frameNumber: number;
        time: number;
        duration: number;
    }>;
    /** 按类别分组的统计 */
    categoryStats: Array<{
        category: string;
        totalTime: number;
        percentOfFrame: number;
        sampleCount: number;
        expanded?: boolean;
        items: Array<{
            name: string;
            inclusiveTime: number;
            exclusiveTime: number;
            callCount: number;
            percentOfCategory: number;
            percentOfFrame: number;
        }>;
    }>;
    /** 热点函数列表 */
    hotspots: Array<{
        name: string;
        category: string;
        inclusiveTime: number;
        inclusiveTimePercent: number;
        exclusiveTime: number;
        exclusiveTimePercent: number;
        callCount: number;
        avgCallTime: number;
    }>;
    /** 调用关系数据 */
    callGraph: {
        /** 当前选中的函数 */
        currentFunction: string | null;
        /** 调用当前函数的函数列表 */
        callers: Array<{
            name: string;
            callCount: number;
            totalTime: number;
            percentOfCurrent: number;
        }>;
        /** 当前函数调用的函数列表 */
        callees: Array<{
            name: string;
            callCount: number;
            totalTime: number;
            percentOfCurrent: number;
        }>;
    };
    /** 长任务列表 */
    longTasks: Array<{
        startTime: number;
        duration: number;
        attribution: string[];
    }>;
    /** 内存趋势 */
    memoryTrend: Array<{
        time: number;
        usedMB: number;
        totalMB: number;
        gcCount: number;
    }>;
    /** 统计摘要 */
    summary: {
        totalFrames: number;
        averageFrameTime: number;
        minFrameTime: number;
        maxFrameTime: number;
        p95FrameTime: number;
        p99FrameTime: number;
        currentMemoryMB: number;
        peakMemoryMB: number;
        gcCount: number;
        longTaskCount: number;
    };
}

/**
 * 高级性能分析数据收集器
 */
export class AdvancedProfilerCollector {
    private selectedFunction: string | null = null;
    private peakMemory = 0;

    constructor() {
        // ProfilerSDK 通过静态方法访问
    }

    /**
     * 设置选中的函数（用于调用关系视图）
     */
    public setSelectedFunction(name: string | null): void {
        this.selectedFunction = name;
    }

    /**
     * 收集高级性能数据
     */
    public collectAdvancedData(performanceMonitor?: ILegacyPerformanceMonitor): IAdvancedProfilerData {
        const frameHistory = ProfilerSDK.getFrameHistory();
        const currentFrame = ProfilerSDK.getCurrentFrame();
        const report = ProfilerSDK.getReport(300);

        const currentMemory = currentFrame?.memory || this.getDefaultMemory();
        if (currentMemory.usedHeapSize > this.peakMemory) {
            this.peakMemory = currentMemory.usedHeapSize;
        }

        return {
            currentFrame: this.buildCurrentFrameData(currentFrame),
            frameTimeHistory: this.buildFrameTimeHistory(frameHistory),
            categoryStats: this.buildCategoryStats(currentFrame, performanceMonitor),
            hotspots: this.buildHotspots(report),
            callGraph: this.buildCallGraph(report),
            longTasks: report.longTasks,
            memoryTrend: this.buildMemoryTrend(report.memoryTrend),
            summary: this.buildSummary(report, currentMemory)
        };
    }

    /**
     * 从现有 PerformanceMonitor 数据构建兼容格式
     */
    public collectFromLegacyMonitor(performanceMonitor: ILegacyPerformanceMonitor | null): IAdvancedProfilerData {
        if (!performanceMonitor) {
            return this.createEmptyData();
        }

        const systemStats = performanceMonitor.getAllSystemStats?.() || new Map();
        const systemData = performanceMonitor.getAllSystemData?.() || new Map();

        const frameTime = Time.deltaTime * 1000;
        const fps = frameTime > 0 ? Math.round(1000 / frameTime) : 0;

        const categoryStats = this.buildCategoryStatsFromLegacy(systemStats, systemData, frameTime);
        const hotspots = this.buildHotspotsFromLegacy(systemStats, systemData, frameTime);

        return {
            currentFrame: {
                frameNumber: 0,
                frameTime,
                fps,
                memory: this.getCurrentMemory()
            },
            frameTimeHistory: [],
            categoryStats,
            hotspots,
            callGraph: {
                currentFunction: this.selectedFunction,
                callers: [],
                callees: []
            },
            longTasks: [],
            memoryTrend: [],
            summary: {
                totalFrames: 0,
                averageFrameTime: frameTime,
                minFrameTime: frameTime,
                maxFrameTime: frameTime,
                p95FrameTime: frameTime,
                p99FrameTime: frameTime,
                currentMemoryMB: this.getCurrentMemory().usedHeapSize / (1024 * 1024),
                peakMemoryMB: this.peakMemory / (1024 * 1024),
                gcCount: 0,
                longTaskCount: 0
            }
        };
    }

    private buildCurrentFrameData(frame: ProfileFrame | null): IAdvancedProfilerData['currentFrame'] {
        if (!frame) {
            const frameTime = Time.deltaTime * 1000;
            return {
                frameNumber: 0,
                frameTime,
                fps: frameTime > 0 ? Math.round(1000 / frameTime) : 0,
                memory: this.getCurrentMemory()
            };
        }

        return {
            frameNumber: frame.frameNumber,
            frameTime: frame.duration,
            fps: frame.duration > 0 ? Math.round(1000 / frame.duration) : 0,
            memory: frame.memory
        };
    }

    private buildFrameTimeHistory(frames: ProfileFrame[]): IAdvancedProfilerData['frameTimeHistory'] {
        return frames.map(f => ({
            frameNumber: f.frameNumber,
            time: f.startTime,
            duration: f.duration
        }));
    }

    private buildCategoryStats(
        frame: ProfileFrame | null,
        performanceMonitor?: any
    ): IAdvancedProfilerData['categoryStats'] {
        const result: IAdvancedProfilerData['categoryStats'] = [];

        if (frame && frame.categoryStats.size > 0) {
            const frameDuration = frame.duration || 1;

            for (const [category, stats] of frame.categoryStats) {
                const categoryItems = frame.sampleStats
                    .filter(s => s.category === category)
                    .map(s => ({
                        name: s.name,
                        inclusiveTime: s.inclusiveTime,
                        exclusiveTime: s.exclusiveTime,
                        callCount: s.callCount,
                        percentOfCategory: stats.totalTime > 0
                            ? (s.inclusiveTime / stats.totalTime) * 100
                            : 0,
                        percentOfFrame: (s.inclusiveTime / frameDuration) * 100
                    }))
                    .sort((a, b) => b.inclusiveTime - a.inclusiveTime);

                result.push({
                    category,
                    totalTime: stats.totalTime,
                    percentOfFrame: stats.percentOfFrame,
                    sampleCount: stats.sampleCount,
                    items: categoryItems
                });
            }
        }

        if (performanceMonitor && result.length === 0) {
            const systemStats = performanceMonitor.getAllSystemStats?.() || new Map();
            const systemData = performanceMonitor.getAllSystemData?.() || new Map();
            const frameTime = Time.deltaTime * 1000 || 1;

            return this.buildCategoryStatsFromLegacy(systemStats, systemData, frameTime);
        }

        return result.sort((a, b) => b.totalTime - a.totalTime);
    }

    private buildCategoryStatsFromLegacy(
        systemStats: Map<string, any>,
        systemData: Map<string, any>,
        frameTime: number
    ): IAdvancedProfilerData['categoryStats'] {
        const ecsItems: IAdvancedProfilerData['categoryStats'][0]['items'] = [];
        let totalECSTime = 0;

        for (const [name, stats] of systemStats.entries()) {
            const data = systemData.get(name);
            const execTime = data?.executionTime || stats?.averageTime || 0;
            totalECSTime += execTime;

            ecsItems.push({
                name,
                inclusiveTime: execTime,
                exclusiveTime: execTime,
                callCount: 1,
                percentOfCategory: 0,
                percentOfFrame: frameTime > 0 ? (execTime / frameTime) * 100 : 0
            });
        }

        for (const item of ecsItems) {
            item.percentOfCategory = totalECSTime > 0
                ? (item.inclusiveTime / totalECSTime) * 100
                : 0;
        }

        ecsItems.sort((a, b) => b.inclusiveTime - a.inclusiveTime);

        if (ecsItems.length === 0) {
            return [];
        }

        return [{
            category: ProfileCategory.ECS,
            totalTime: totalECSTime,
            percentOfFrame: frameTime > 0 ? (totalECSTime / frameTime) * 100 : 0,
            sampleCount: ecsItems.length,
            items: ecsItems
        }];
    }

    private buildHotspots(report: ProfileReport): IAdvancedProfilerData['hotspots'] {
        const totalTime = report.hotspots.reduce((sum, h) => sum + h.inclusiveTime, 0) || 1;

        return report.hotspots.slice(0, 50).map(h => ({
            name: h.name,
            category: h.category,
            inclusiveTime: h.inclusiveTime,
            inclusiveTimePercent: (h.inclusiveTime / totalTime) * 100,
            exclusiveTime: h.exclusiveTime,
            exclusiveTimePercent: (h.exclusiveTime / totalTime) * 100,
            callCount: h.callCount,
            avgCallTime: h.averageTime
        }));
    }

    private buildHotspotsFromLegacy(
        systemStats: Map<string, any>,
        systemData: Map<string, any>,
        frameTime: number
    ): IAdvancedProfilerData['hotspots'] {
        const hotspots: IAdvancedProfilerData['hotspots'] = [];

        for (const [name, stats] of systemStats.entries()) {
            const data = systemData.get(name);
            const execTime = data?.executionTime || stats?.averageTime || 0;

            hotspots.push({
                name,
                category: ProfileCategory.ECS,
                inclusiveTime: execTime,
                inclusiveTimePercent: frameTime > 0 ? (execTime / frameTime) * 100 : 0,
                exclusiveTime: execTime,
                exclusiveTimePercent: frameTime > 0 ? (execTime / frameTime) * 100 : 0,
                callCount: stats?.executionCount || 1,
                avgCallTime: stats?.averageTime || execTime
            });
        }

        return hotspots.sort((a, b) => b.inclusiveTime - a.inclusiveTime).slice(0, 50);
    }

    private buildCallGraph(report: ProfileReport): IAdvancedProfilerData['callGraph'] {
        if (!this.selectedFunction) {
            return {
                currentFunction: null,
                callers: [],
                callees: []
            };
        }

        const node = report.callGraph.get(this.selectedFunction);
        if (!node) {
            return {
                currentFunction: this.selectedFunction,
                callers: [],
                callees: []
            };
        }

        const callers = Array.from(node.callers.entries())
            .map(([name, data]) => ({
                name,
                callCount: data.count,
                totalTime: data.totalTime,
                percentOfCurrent: node.totalTime > 0 ? (data.totalTime / node.totalTime) * 100 : 0
            }))
            .sort((a, b) => b.totalTime - a.totalTime);

        const callees = Array.from(node.callees.entries())
            .map(([name, data]) => ({
                name,
                callCount: data.count,
                totalTime: data.totalTime,
                percentOfCurrent: node.totalTime > 0 ? (data.totalTime / node.totalTime) * 100 : 0
            }))
            .sort((a, b) => b.totalTime - a.totalTime);

        return {
            currentFunction: this.selectedFunction,
            callers,
            callees
        };
    }

    private buildMemoryTrend(snapshots: MemorySnapshot[]): IAdvancedProfilerData['memoryTrend'] {
        return snapshots.map(s => ({
            time: s.timestamp,
            usedMB: s.usedHeapSize / (1024 * 1024),
            totalMB: s.totalHeapSize / (1024 * 1024),
            gcCount: s.gcCount
        }));
    }

    private buildSummary(
        report: ProfileReport,
        currentMemory: MemorySnapshot
    ): IAdvancedProfilerData['summary'] {
        return {
            totalFrames: report.totalFrames,
            averageFrameTime: report.averageFrameTime,
            minFrameTime: report.minFrameTime,
            maxFrameTime: report.maxFrameTime,
            p95FrameTime: report.p95FrameTime,
            p99FrameTime: report.p99FrameTime,
            currentMemoryMB: currentMemory.usedHeapSize / (1024 * 1024),
            peakMemoryMB: this.peakMemory / (1024 * 1024),
            gcCount: currentMemory.gcCount,
            longTaskCount: report.longTasks.length
        };
    }

    private getCurrentMemory(): MemorySnapshot {
        const perfWithMemory = performance as Performance & {
            memory?: {
                usedJSHeapSize?: number;
                totalJSHeapSize?: number;
                jsHeapSizeLimit?: number;
            };
        };

        const usedHeapSize = perfWithMemory.memory?.usedJSHeapSize || 0;
        const totalHeapSize = perfWithMemory.memory?.totalJSHeapSize || 0;
        const heapSizeLimit = perfWithMemory.memory?.jsHeapSizeLimit || 0;

        return {
            timestamp: performance.now(),
            usedHeapSize,
            totalHeapSize,
            heapSizeLimit,
            utilizationPercent: heapSizeLimit > 0 ? (usedHeapSize / heapSizeLimit) * 100 : 0,
            gcCount: 0
        };
    }

    private getDefaultMemory(): MemorySnapshot {
        return {
            timestamp: performance.now(),
            usedHeapSize: 0,
            totalHeapSize: 0,
            heapSizeLimit: 0,
            utilizationPercent: 0,
            gcCount: 0
        };
    }

    private createEmptyData(): IAdvancedProfilerData {
        return {
            currentFrame: {
                frameNumber: 0,
                frameTime: 0,
                fps: 0,
                memory: this.getDefaultMemory()
            },
            frameTimeHistory: [],
            categoryStats: [],
            hotspots: [],
            callGraph: {
                currentFunction: null,
                callers: [],
                callees: []
            },
            longTasks: [],
            memoryTrend: [],
            summary: {
                totalFrames: 0,
                averageFrameTime: 0,
                minFrameTime: 0,
                maxFrameTime: 0,
                p95FrameTime: 0,
                p99FrameTime: 0,
                currentMemoryMB: 0,
                peakMemoryMB: 0,
                gcCount: 0,
                longTaskCount: 0
            }
        };
    }
}
