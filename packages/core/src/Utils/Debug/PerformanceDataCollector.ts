import { IPerformanceDebugData } from '../../Types';
import { Time } from '../Time';

/**
 * 性能数据收集器
 */
export class PerformanceDataCollector {
    private frameTimeHistory: number[] = [];
    private maxHistoryLength: number = 60;
    private gcCollections: number = 0;
    private lastMemoryCheck: number = 0;

    /**
     * 收集性能数据
     */
    public collectPerformanceData(performanceMonitor: any): IPerformanceDebugData {
        const frameTimeSeconds = Time.deltaTime;
        const engineFrameTimeMs = frameTimeSeconds * 1000;
        const currentFps = frameTimeSeconds > 0 ? Math.round(1 / frameTimeSeconds) : 0;

        const ecsPerformanceData = this.getECSPerformanceData(performanceMonitor);
        const ecsExecutionTimeMs = ecsPerformanceData.totalExecutionTime;
        const ecsPercentage = engineFrameTimeMs > 0 ? (ecsExecutionTimeMs / engineFrameTimeMs * 100) : 0;

        let memoryUsage = 0;
        if ((performance as any).memory) {
            memoryUsage = (performance as any).memory.usedJSHeapSize / 1024 / 1024;
        }

        // 更新ECS执行时间历史记录
        this.frameTimeHistory.push(ecsExecutionTimeMs);
        if (this.frameTimeHistory.length > this.maxHistoryLength) {
            this.frameTimeHistory.shift();
        }

        // 计算ECS执行时间统计
        const history = this.frameTimeHistory.filter((t) => t >= 0);
        const averageECSTime = history.length > 0 ? history.reduce((a, b) => a + b, 0) / history.length : ecsExecutionTimeMs;
        const minECSTime = history.length > 0 ? Math.min(...history) : ecsExecutionTimeMs;
        const maxECSTime = history.length > 0 ? Math.max(...history) : ecsExecutionTimeMs;

        return {
            frameTime: ecsExecutionTimeMs,
            engineFrameTime: engineFrameTimeMs,
            ecsPercentage: ecsPercentage,
            memoryUsage: memoryUsage,
            fps: currentFps,
            averageFrameTime: averageECSTime,
            minFrameTime: minECSTime,
            maxFrameTime: maxECSTime,
            frameTimeHistory: [...this.frameTimeHistory],
            systemPerformance: this.getSystemPerformance(performanceMonitor),
            systemBreakdown: ecsPerformanceData.systemBreakdown,
            memoryDetails: this.getMemoryDetails()
        };
    }

    /**
     * 获取ECS框架整体性能数据
     */
    private getECSPerformanceData(performanceMonitor: any): { totalExecutionTime: number; systemBreakdown: Array<any> } {
        // 检查性能监视器是否存在
        if (!performanceMonitor) {
            return { totalExecutionTime: 0, systemBreakdown: [] };
        }

        if (!performanceMonitor.enabled) {
            // 尝试启用性能监视器
            try {
                performanceMonitor.enabled = true;
            } catch (error) {
                // 如果无法启用，返回默认值
            }
            return { totalExecutionTime: 0, systemBreakdown: [] };
        }

        try {
            let totalTime = 0;
            const systemBreakdown = [];

            const stats = performanceMonitor.getAllSystemStats();

            if (stats.size === 0) {
                return { totalExecutionTime: 0, systemBreakdown: [] };
            }

            // 计算各系统的执行时间
            for (const [systemName, stat] of stats.entries()) {
                // 使用最近的执行时间而不是平均时间，这样更能反映当前状态
                const systemTime = stat.recentTimes && stat.recentTimes.length > 0 ?
                    stat.recentTimes[stat.recentTimes.length - 1] :
                    (stat.averageTime || 0);

                totalTime += systemTime;
                systemBreakdown.push({
                    systemName: systemName,
                    executionTime: systemTime,
                    percentage: 0 // 后面计算
                });
            }

            // 计算各系统占ECS总时间的百分比
            systemBreakdown.forEach((system) => {
                system.percentage = totalTime > 0 ? (system.executionTime / totalTime * 100) : 0;
            });

            // 按执行时间排序
            systemBreakdown.sort((a, b) => b.executionTime - a.executionTime);

            return {
                totalExecutionTime: totalTime,
                systemBreakdown: systemBreakdown
            };
        } catch (error) {
            return { totalExecutionTime: 0, systemBreakdown: [] };
        }
    }

    /**
     * 获取系统性能数据
     */
    private getSystemPerformance(performanceMonitor: any): Array<any> {
        if (!performanceMonitor) {
            return [];
        }

        try {
            const stats = performanceMonitor.getAllSystemStats();
            const systemData = performanceMonitor.getAllSystemData();

            return Array.from(stats.entries() as Iterable<[string, any]>).map(([systemName, stat]) => {
                const data = systemData.get(systemName);
                return {
                    systemName: systemName,
                    averageTime: stat.averageTime || 0,
                    maxTime: stat.maxTime || 0,
                    minTime: stat.minTime === Number.MAX_VALUE ? 0 : (stat.minTime || 0),
                    samples: stat.executionCount || 0,
                    percentage: 0,
                    entityCount: data?.entityCount || 0,
                    lastExecutionTime: data?.executionTime || 0
                };
            });
        } catch (error) {
            return [];
        }
    }

    /**
     * 获取内存详情
     */
    private getMemoryDetails(): any {
        const memoryInfo: any = {
            entities: 0,
            components: 0,
            systems: 0,
            pooled: 0,
            totalMemory: 0,
            usedMemory: 0,
            freeMemory: 0,
            gcCollections: this.updateGCCount()
        };

        try {
            if ((performance as any).memory) {
                const perfMemory = (performance as any).memory;
                memoryInfo.totalMemory = perfMemory.jsHeapSizeLimit || 512 * 1024 * 1024;
                memoryInfo.usedMemory = perfMemory.usedJSHeapSize || 0;
                memoryInfo.freeMemory = memoryInfo.totalMemory - memoryInfo.usedMemory;

                // 检测GC：如果使用的内存突然大幅减少，可能发生了GC
                if (this.lastMemoryCheck > 0) {
                    const memoryDrop = this.lastMemoryCheck - memoryInfo.usedMemory;
                    if (memoryDrop > 1024 * 1024) { // 内存减少超过1MB
                        this.gcCollections++;
                    }
                }
                this.lastMemoryCheck = memoryInfo.usedMemory;
            } else {
                memoryInfo.totalMemory = 512 * 1024 * 1024;
                memoryInfo.freeMemory = 512 * 1024 * 1024;
            }
        } catch (error) {
            return {
                totalMemory: 0,
                usedMemory: 0,
                freeMemory: 0,
                entityMemory: 0,
                componentMemory: 0,
                systemMemory: 0,
                pooledMemory: 0,
                gcCollections: this.gcCollections
            };
        }

        return memoryInfo;
    }

    /**
     * 更新GC计数
     */
    private updateGCCount(): number {
        try {
            // 尝试使用PerformanceObserver来检测GC
            if (typeof PerformanceObserver !== 'undefined') {
                // 这是一个简化的GC检测方法
                // 实际的GC检测需要更复杂的逻辑
                return this.gcCollections;
            }

            // 如果有其他GC检测API，可以在这里添加
            if ((performance as any).measureUserAgentSpecificMemory) {
                // 实验性API，可能不可用
                return this.gcCollections;
            }

            return this.gcCollections;
        } catch (error) {
            return this.gcCollections;
        }
    }
}
