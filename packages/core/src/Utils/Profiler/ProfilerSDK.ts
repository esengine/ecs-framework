/**
 * 性能分析器 SDK
 *
 * 提供统一的性能分析接口，支持：
 * - 手动采样标记
 * - 自动作用域测量
 * - 调用层级追踪
 * - 计数器和仪表
 */

import {
    ProfileCategory,
    ProfileSample,
    ProfileSampleStats,
    ProfileFrame,
    ProfileCounter,
    MemorySnapshot,
    SampleHandle,
    ProfilerConfig,
    CallGraphNode,
    ProfileReport,
    LongTaskInfo,
    DEFAULT_PROFILER_CONFIG
} from './ProfilerTypes';

let idCounter = 0;
function generateId(): string {
    return `sample_${++idCounter}_${Date.now()}`;
}

/**
 * 性能分析器 SDK
 */
export class ProfilerSDK {
    private static instance: ProfilerSDK | null = null;

    private config: ProfilerConfig;
    private currentFrame: ProfileFrame | null = null;
    private frameHistory: ProfileFrame[] = [];
    private frameNumber = 0;
    private activeSamples: Map<string, SampleHandle> = new Map();
    private sampleStack: SampleHandle[] = [];
    private counters: Map<string, ProfileCounter> = new Map();
    private callGraph: Map<string, CallGraphNode> = new Map();
    private gcCount = 0;
    private previousHeapSize = 0;
    private longTasks: LongTaskInfo[] = [];
    private performanceObserver: PerformanceObserver | null = null;

    private constructor(config?: Partial<ProfilerConfig>) {
        this.config = { ...DEFAULT_PROFILER_CONFIG, ...config };
        if (this.config.detectLongTasks) {
            this.setupLongTaskObserver();
        }
    }

    /**
     * 获取单例实例
     */
    public static getInstance(config?: Partial<ProfilerConfig>): ProfilerSDK {
        if (!ProfilerSDK.instance) {
            ProfilerSDK.instance = new ProfilerSDK(config);
        }
        return ProfilerSDK.instance;
    }

    /**
     * 重置实例（测试用）
     */
    public static resetInstance(): void {
        if (ProfilerSDK.instance) {
            ProfilerSDK.instance.dispose();
            ProfilerSDK.instance = null;
        }
    }

    /**
     * 开始采样
     */
    public static beginSample(name: string, category: ProfileCategory = ProfileCategory.Custom): SampleHandle | null {
        return ProfilerSDK.getInstance().beginSample(name, category);
    }

    /**
     * 结束采样
     */
    public static endSample(handle: SampleHandle | null): void {
        if (handle) {
            ProfilerSDK.getInstance().endSample(handle);
        }
    }

    /**
     * 测量同步函数执行时间
     */
    public static measure<T>(name: string, fn: () => T, category: ProfileCategory = ProfileCategory.Custom): T {
        return ProfilerSDK.getInstance().measure(name, fn, category);
    }

    /**
     * 测量异步函数执行时间
     */
    public static async measureAsync<T>(
        name: string,
        fn: () => Promise<T>,
        category: ProfileCategory = ProfileCategory.Custom
    ): Promise<T> {
        return ProfilerSDK.getInstance().measureAsync(name, fn, category);
    }

    /**
     * 开始帧
     */
    public static beginFrame(): void {
        ProfilerSDK.getInstance().beginFrame();
    }

    /**
     * 结束帧
     */
    public static endFrame(): void {
        ProfilerSDK.getInstance().endFrame();
    }

    /**
     * 递增计数器
     */
    public static incrementCounter(
        name: string,
        value: number = 1,
        category: ProfileCategory = ProfileCategory.Custom
    ): void {
        ProfilerSDK.getInstance().incrementCounter(name, value, category);
    }

    /**
     * 设置仪表值
     */
    public static setGauge(
        name: string,
        value: number,
        category: ProfileCategory = ProfileCategory.Custom
    ): void {
        ProfilerSDK.getInstance().setGauge(name, value, category);
    }

    /**
     * 启用/禁用分析器
     */
    public static setEnabled(enabled: boolean): void {
        ProfilerSDK.getInstance().setEnabled(enabled);
    }

    /**
     * 检查是否启用
     */
    public static isEnabled(): boolean {
        return ProfilerSDK.getInstance().config.enabled;
    }

    /**
     * 获取当前帧数据
     */
    public static getCurrentFrame(): ProfileFrame | null {
        return ProfilerSDK.getInstance().currentFrame;
    }

    /**
     * 获取帧历史
     */
    public static getFrameHistory(): ProfileFrame[] {
        return ProfilerSDK.getInstance().frameHistory;
    }

    /**
     * 获取分析报告
     */
    public static getReport(frameCount?: number): ProfileReport {
        return ProfilerSDK.getInstance().generateReport(frameCount);
    }

    /**
     * 重置数据
     */
    public static reset(): void {
        ProfilerSDK.getInstance().reset();
    }

    /**
     * 开始采样
     */
    public beginSample(name: string, category: ProfileCategory = ProfileCategory.Custom): SampleHandle | null {
        if (!this.config.enabled || !this.config.enabledCategories.has(category)) {
            return null;
        }

        const parentHandle = this.sampleStack.length > 0
            ? this.sampleStack[this.sampleStack.length - 1]
            : undefined;

        if (parentHandle && this.sampleStack.length >= this.config.maxSampleDepth) {
            return null;
        }

        const handle: SampleHandle = {
            id: generateId(),
            name,
            category,
            startTime: performance.now(),
            depth: this.sampleStack.length,
            parentId: parentHandle?.id
        };

        this.activeSamples.set(handle.id, handle);
        this.sampleStack.push(handle);

        return handle;
    }

    /**
     * 结束采样
     */
    public endSample(handle: SampleHandle): void {
        if (!this.config.enabled || !this.activeSamples.has(handle.id)) {
            return;
        }

        const endTime = performance.now();
        const duration = endTime - handle.startTime;

        const sample: ProfileSample = {
            id: handle.id,
            name: handle.name,
            category: handle.category,
            startTime: handle.startTime,
            endTime,
            duration,
            selfTime: duration,
            parentId: handle.parentId,
            depth: handle.depth,
            callCount: 1
        };

        if (this.currentFrame) {
            this.currentFrame.samples.push(sample);
        }

        this.updateCallGraph(handle.name, handle.category, duration, handle.parentId);

        this.activeSamples.delete(handle.id);
        const stackIndex = this.sampleStack.indexOf(handle);
        if (stackIndex !== -1) {
            this.sampleStack.splice(stackIndex, 1);
        }
    }

    /**
     * 测量同步函数
     */
    public measure<T>(name: string, fn: () => T, category: ProfileCategory = ProfileCategory.Custom): T {
        const handle = this.beginSample(name, category);
        try {
            return fn();
        } finally {
            if (handle) {
                this.endSample(handle);
            }
        }
    }

    /**
     * 测量异步函数
     */
    public async measureAsync<T>(
        name: string,
        fn: () => Promise<T>,
        category: ProfileCategory = ProfileCategory.Custom
    ): Promise<T> {
        const handle = this.beginSample(name, category);
        try {
            return await fn();
        } finally {
            if (handle) {
                this.endSample(handle);
            }
        }
    }

    /**
     * 开始帧
     */
    public beginFrame(): void {
        if (!this.config.enabled) return;

        this.frameNumber++;
        this.currentFrame = {
            frameNumber: this.frameNumber,
            startTime: performance.now(),
            endTime: 0,
            duration: 0,
            samples: [],
            sampleStats: [],
            counters: new Map(this.counters),
            memory: this.captureMemory(),
            categoryStats: new Map()
        };

        this.resetFrameCounters();
    }

    /**
     * 结束帧
     */
    public endFrame(): void {
        if (!this.config.enabled || !this.currentFrame) return;

        this.currentFrame.endTime = performance.now();
        this.currentFrame.duration = this.currentFrame.endTime - this.currentFrame.startTime;

        this.calculateSampleStats();
        this.calculateCategoryStats();

        this.frameHistory.push(this.currentFrame);

        while (this.frameHistory.length > this.config.maxFrameHistory) {
            this.frameHistory.shift();
        }

        this.sampleStack = [];
        this.activeSamples.clear();
    }

    /**
     * 递增计数器
     */
    public incrementCounter(
        name: string,
        value: number = 1,
        category: ProfileCategory = ProfileCategory.Custom
    ): void {
        if (!this.config.enabled) return;

        let counter = this.counters.get(name);
        if (!counter) {
            counter = {
                name,
                category,
                value: 0,
                type: 'counter',
                history: []
            };
            this.counters.set(name, counter);
        }

        counter.value += value;
        counter.history.push({ time: performance.now(), value: counter.value });

        if (counter.history.length > 100) {
            counter.history.shift();
        }
    }

    /**
     * 设置仪表值
     */
    public setGauge(
        name: string,
        value: number,
        category: ProfileCategory = ProfileCategory.Custom
    ): void {
        if (!this.config.enabled) return;

        let counter = this.counters.get(name);
        if (!counter) {
            counter = {
                name,
                category,
                value: 0,
                type: 'gauge',
                history: []
            };
            this.counters.set(name, counter);
        }

        counter.value = value;
        counter.history.push({ time: performance.now(), value });

        if (counter.history.length > 100) {
            counter.history.shift();
        }
    }

    /**
     * 设置启用状态
     */
    public setEnabled(enabled: boolean): void {
        this.config.enabled = enabled;
        if (enabled && this.config.detectLongTasks && !this.performanceObserver) {
            this.setupLongTaskObserver();
        }
    }

    /**
     * 重置数据
     */
    public reset(): void {
        this.frameHistory = [];
        this.currentFrame = null;
        this.frameNumber = 0;
        this.activeSamples.clear();
        this.sampleStack = [];
        this.counters.clear();
        this.callGraph.clear();
        this.gcCount = 0;
        this.longTasks = [];
    }

    /**
     * 生成分析报告
     */
    public generateReport(frameCount?: number): ProfileReport {
        const frames = frameCount
            ? this.frameHistory.slice(-frameCount)
            : this.frameHistory;

        if (frames.length === 0) {
            return this.createEmptyReport();
        }

        const frameTimes = frames.map((f) => f.duration);
        const sortedTimes = [...frameTimes].sort((a, b) => a - b);

        const aggregatedStats = this.aggregateSampleStats(frames);
        const hotspots = aggregatedStats
            .sort((a, b) => b.inclusiveTime - a.inclusiveTime)
            .slice(0, 20);

        const categoryBreakdown = this.aggregateCategoryStats(frames);

        const firstFrame = frames[0];
        const lastFrame = frames[frames.length - 1];

        return {
            startTime: firstFrame?.startTime ?? 0,
            endTime: lastFrame?.endTime ?? 0,
            totalFrames: frames.length,
            averageFrameTime: frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length,
            minFrameTime: Math.min(...frameTimes),
            maxFrameTime: Math.max(...frameTimes),
            p95FrameTime: sortedTimes[Math.floor(sortedTimes.length * 0.95)] || 0,
            p99FrameTime: sortedTimes[Math.floor(sortedTimes.length * 0.99)] || 0,
            hotspots,
            callGraph: new Map(this.callGraph),
            categoryBreakdown,
            memoryTrend: frames.map((f) => f.memory),
            longTasks: [...this.longTasks]
        };
    }

    /**
     * 获取调用图数据
     */
    public getCallGraph(): Map<string, CallGraphNode> {
        return new Map(this.callGraph);
    }

    /**
     * 获取特定函数的调用关系
     */
    public getFunctionCallInfo(name: string): {
        callers: Array<{ name: string; count: number; totalTime: number }>;
        callees: Array<{ name: string; count: number; totalTime: number }>;
    } | null {
        const node = this.callGraph.get(name);
        if (!node) return null;

        return {
            callers: Array.from(node.callers.entries()).map(([name, data]) => ({
                name,
                ...data
            })),
            callees: Array.from(node.callees.entries()).map(([name, data]) => ({
                name,
                ...data
            }))
        };
    }

    /**
     * 释放资源
     */
    public dispose(): void {
        if (this.performanceObserver) {
            this.performanceObserver.disconnect();
            this.performanceObserver = null;
        }
        this.reset();
    }

    private captureMemory(): MemorySnapshot {
        const now = performance.now();
        let usedHeapSize = 0;
        let totalHeapSize = 0;
        let heapSizeLimit = 0;

        const perfWithMemory = performance as Performance & {
            memory?: {
                usedJSHeapSize?: number;
                totalJSHeapSize?: number;
                jsHeapSizeLimit?: number;
            };
        };

        if (perfWithMemory.memory) {
            usedHeapSize = perfWithMemory.memory.usedJSHeapSize || 0;
            totalHeapSize = perfWithMemory.memory.totalJSHeapSize || 0;
            heapSizeLimit = perfWithMemory.memory.jsHeapSizeLimit || 0;

            if (this.previousHeapSize > 0 && usedHeapSize < this.previousHeapSize - 1024 * 1024) {
                this.gcCount++;
            }
            this.previousHeapSize = usedHeapSize;
        }

        return {
            timestamp: now,
            usedHeapSize,
            totalHeapSize,
            heapSizeLimit,
            utilizationPercent: heapSizeLimit > 0 ? (usedHeapSize / heapSizeLimit) * 100 : 0,
            gcCount: this.gcCount
        };
    }

    private resetFrameCounters(): void {
        for (const counter of this.counters.values()) {
            if (counter.type === 'counter') {
                counter.value = 0;
            }
        }
    }

    private calculateSampleStats(): void {
        if (!this.currentFrame) return;

        const sampleMap = new Map<string, ProfileSampleStats>();

        for (const sample of this.currentFrame.samples) {
            let stats = sampleMap.get(sample.name);
            if (!stats) {
                stats = {
                    name: sample.name,
                    category: sample.category,
                    inclusiveTime: 0,
                    exclusiveTime: 0,
                    callCount: 0,
                    averageTime: 0,
                    minTime: Number.MAX_VALUE,
                    maxTime: 0,
                    percentOfFrame: 0,
                    percentOfParent: 0,
                    children: [],
                    depth: sample.depth
                };
                sampleMap.set(sample.name, stats);
            }

            stats.inclusiveTime += sample.duration;
            stats.callCount += 1;
            stats.minTime = Math.min(stats.minTime, sample.duration);
            stats.maxTime = Math.max(stats.maxTime, sample.duration);
        }

        for (const sample of this.currentFrame.samples) {
            if (sample.parentId) {
                const parentSample = this.currentFrame.samples.find((s) => s.id === sample.parentId);
                if (parentSample) {
                    const parentStats = sampleMap.get(parentSample.name);
                    if (parentStats) {
                        parentStats.exclusiveTime = parentStats.inclusiveTime;
                        for (const childSample of this.currentFrame.samples) {
                            if (childSample.parentId === parentSample.id) {
                                parentStats.exclusiveTime -= childSample.duration;
                            }
                        }
                    }
                }
            }
        }

        const frameDuration = this.currentFrame.duration || 1;
        for (const stats of sampleMap.values()) {
            stats.averageTime = stats.inclusiveTime / stats.callCount;
            stats.percentOfFrame = (stats.inclusiveTime / frameDuration) * 100;
            if (stats.exclusiveTime === 0) {
                stats.exclusiveTime = stats.inclusiveTime;
            }
        }

        this.currentFrame.sampleStats = Array.from(sampleMap.values())
            .sort((a, b) => b.inclusiveTime - a.inclusiveTime);
    }

    private calculateCategoryStats(): void {
        if (!this.currentFrame) return;

        const categoryMap = new Map<ProfileCategory, { totalTime: number; sampleCount: number }>();

        for (const sample of this.currentFrame.samples) {
            if (sample.depth === 0) {
                let stats = categoryMap.get(sample.category);
                if (!stats) {
                    stats = { totalTime: 0, sampleCount: 0 };
                    categoryMap.set(sample.category, stats);
                }
                stats.totalTime += sample.duration;
                stats.sampleCount += 1;
            }
        }

        const frameDuration = this.currentFrame.duration || 1;
        for (const [category, stats] of categoryMap) {
            this.currentFrame.categoryStats.set(category, {
                ...stats,
                percentOfFrame: (stats.totalTime / frameDuration) * 100
            });
        }
    }

    private updateCallGraph(
        name: string,
        category: ProfileCategory,
        duration: number,
        parentId?: string
    ): void {
        let node = this.callGraph.get(name);
        if (!node) {
            node = {
                name,
                category,
                callCount: 0,
                totalTime: 0,
                callers: new Map(),
                callees: new Map()
            };
            this.callGraph.set(name, node);
        }

        node.callCount++;
        node.totalTime += duration;

        if (parentId) {
            const parentHandle = this.activeSamples.get(parentId);
            if (parentHandle) {
                const callerData = node.callers.get(parentHandle.name) || { count: 0, totalTime: 0 };
                callerData.count++;
                callerData.totalTime += duration;
                node.callers.set(parentHandle.name, callerData);

                const parentNode = this.callGraph.get(parentHandle.name);
                if (parentNode) {
                    const calleeData = parentNode.callees.get(name) || { count: 0, totalTime: 0 };
                    calleeData.count++;
                    calleeData.totalTime += duration;
                    parentNode.callees.set(name, calleeData);
                }
            }
        }
    }

    private aggregateSampleStats(frames: ProfileFrame[]): ProfileSampleStats[] {
        const aggregated = new Map<string, ProfileSampleStats>();

        for (const frame of frames) {
            for (const stats of frame.sampleStats) {
                let agg = aggregated.get(stats.name);
                if (!agg) {
                    agg = {
                        ...stats,
                        minTime: Number.MAX_VALUE
                    };
                    aggregated.set(stats.name, agg);
                } else {
                    agg.inclusiveTime += stats.inclusiveTime;
                    agg.exclusiveTime += stats.exclusiveTime;
                    agg.callCount += stats.callCount;
                    agg.minTime = Math.min(agg.minTime, stats.minTime);
                    agg.maxTime = Math.max(agg.maxTime, stats.maxTime);
                }
            }
        }

        const totalTime = frames.reduce((sum, f) => sum + f.duration, 0);
        for (const stats of aggregated.values()) {
            stats.averageTime = stats.inclusiveTime / stats.callCount;
            stats.percentOfFrame = (stats.inclusiveTime / totalTime) * 100;
        }

        return Array.from(aggregated.values());
    }

    private aggregateCategoryStats(frames: ProfileFrame[]): Map<ProfileCategory, {
        totalTime: number;
        averageTime: number;
        percentOfTotal: number;
    }> {
        const aggregated = new Map<ProfileCategory, { totalTime: number; frameCount: number }>();

        for (const frame of frames) {
            for (const [category, stats] of frame.categoryStats) {
                let agg = aggregated.get(category);
                if (!agg) {
                    agg = { totalTime: 0, frameCount: 0 };
                    aggregated.set(category, agg);
                }
                agg.totalTime += stats.totalTime;
                agg.frameCount++;
            }
        }

        const totalTime = frames.reduce((sum, f) => sum + f.duration, 0);
        const result = new Map<ProfileCategory, { totalTime: number; averageTime: number; percentOfTotal: number }>();

        for (const [category, agg] of aggregated) {
            result.set(category, {
                totalTime: agg.totalTime,
                averageTime: agg.frameCount > 0 ? agg.totalTime / agg.frameCount : 0,
                percentOfTotal: totalTime > 0 ? (agg.totalTime / totalTime) * 100 : 0
            });
        }

        return result;
    }

    private setupLongTaskObserver(): void {
        if (typeof PerformanceObserver === 'undefined') return;

        try {
            this.performanceObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (entry.duration > this.config.longTaskThreshold) {
                        this.longTasks.push({
                            startTime: entry.startTime,
                            duration: entry.duration,
                            attribution: (entry as any).attribution?.map((a: any) => a.name) || []
                        });

                        if (this.longTasks.length > 100) {
                            this.longTasks.shift();
                        }
                    }
                }
            });

            this.performanceObserver.observe({ entryTypes: ['longtask'] });
        } catch {
            // Long Task API not supported
        }
    }

    private createEmptyReport(): ProfileReport {
        return {
            startTime: 0,
            endTime: 0,
            totalFrames: 0,
            averageFrameTime: 0,
            minFrameTime: 0,
            maxFrameTime: 0,
            p95FrameTime: 0,
            p99FrameTime: 0,
            hotspots: [],
            callGraph: new Map(),
            categoryBreakdown: new Map(),
            memoryTrend: [],
            longTasks: []
        };
    }
}
