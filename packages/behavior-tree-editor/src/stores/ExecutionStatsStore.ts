import { createStore } from '@esengine/editor-runtime';

const create = createStore;

/**
 * 节点执行统计信息
 */
export interface NodeExecutionStats {
    /** 节点ID */
    nodeId: string;

    /** 执行总次数 */
    totalExecutions: number;

    /** 成功次数 */
    successCount: number;

    /** 失败次数 */
    failureCount: number;

    /** 运行中次数（记录开始运行的次数） */
    runningCount: number;

    /** 总耗时（毫秒） */
    totalDuration: number;

    /** 平均耗时（毫秒） */
    averageDuration: number;

    /** 最小耗时（毫秒） */
    minDuration: number;

    /** 最大耗时（毫秒） */
    maxDuration: number;

    /** 最后执行时间戳 */
    lastExecutionTime: number;

    /** 最后执行状态 */
    lastStatus: 'success' | 'failure' | 'running' | 'idle';
}

/**
 * 执行历史记录项
 */
export interface ExecutionHistoryEntry {
    /** 节点ID */
    nodeId: string;

    /** 执行开始时间 */
    startTime: number;

    /** 执行结束时间 */
    endTime?: number;

    /** 执行状态 */
    status: 'success' | 'failure' | 'running';

    /** 执行耗时（毫秒） */
    duration?: number;

    /** 执行顺序号 */
    executionOrder: number;
}

/**
 * 执行路径（一次完整的树执行）
 */
export interface ExecutionPath {
    /** 路径ID */
    id: string;

    /** 开始时间 */
    startTime: number;

    /** 结束时间 */
    endTime?: number;

    /** 执行历史记录 */
    history: ExecutionHistoryEntry[];

    /** 是否正在执行 */
    isActive: boolean;
}

interface ExecutionStatsState {
    /** 节点统计信息 */
    nodeStats: Map<string, NodeExecutionStats>;

    /** 执行路径列表 */
    executionPaths: ExecutionPath[];

    /** 当前活动路径ID */
    currentPathId: string | null;

    /** 是否启用统计 */
    isEnabled: boolean;

    /** 是否启用历史记录 */
    enableHistory: boolean;

    /** 历史记录最大条数 */
    maxHistorySize: number;

    /**
     * 记录节点开始执行
     */
    recordNodeStart: (nodeId: string, executionOrder: number) => void;

    /**
     * 记录节点执行结束
     */
    recordNodeEnd: (nodeId: string, status: 'success' | 'failure' | 'running') => void;

    /**
     * 开始新的执行路径
     */
    startNewPath: () => void;

    /**
     * 结束当前执行路径
     */
    endCurrentPath: () => void;

    /**
     * 获取节点统计信息
     */
    getNodeStats: (nodeId: string) => NodeExecutionStats | undefined;

    /**
     * 获取当前执行路径
     */
    getCurrentPath: () => ExecutionPath | undefined;

    /**
     * 清空所有统计数据
     */
    clearStats: () => void;

    /**
     * 清空执行历史
     */
    clearHistory: () => void;

    /**
     * 设置是否启用统计
     */
    setEnabled: (enabled: boolean) => void;

    /**
     * 设置是否启用历史记录
     */
    setEnableHistory: (enabled: boolean) => void;

    /**
     * 导出统计数据为JSON
     */
    exportStats: () => string;
}

/**
 * 创建默认的节点统计信息
 */
function createDefaultNodeStats(nodeId: string): NodeExecutionStats {
    return {
        nodeId,
        totalExecutions: 0,
        successCount: 0,
        failureCount: 0,
        runningCount: 0,
        totalDuration: 0,
        averageDuration: 0,
        minDuration: Infinity,
        maxDuration: 0,
        lastExecutionTime: 0,
        lastStatus: 'idle'
    };
}

/**
 * 执行统计状态存储
 */
export const useExecutionStatsStore = create<ExecutionStatsState>((set, get) => ({
    nodeStats: new Map(),
    executionPaths: [],
    currentPathId: null,
    isEnabled: true,
    enableHistory: true,
    maxHistorySize: 100,

    recordNodeStart: (nodeId: string, executionOrder: number) => {
        if (!get().isEnabled) return;

        const now = Date.now();
        const state = get();

        // 更新节点统计
        const stats = state.nodeStats.get(nodeId) || createDefaultNodeStats(nodeId);
        const updatedStats = { ...stats };

        set((state) => {
            const newStats = new Map(state.nodeStats);
            newStats.set(nodeId, updatedStats);
            return { nodeStats: newStats };
        });

        // 添加到执行历史
        if (state.enableHistory && state.currentPathId) {
            const paths = [...state.executionPaths];
            const currentPath = paths.find((p) => p.id === state.currentPathId);
            if (currentPath && currentPath.isActive) {
                currentPath.history.push({
                    nodeId,
                    startTime: now,
                    status: 'running',
                    executionOrder
                });
                set({ executionPaths: paths });
            }
        }
    },

    recordNodeEnd: (nodeId: string, status: 'success' | 'failure' | 'running') => {
        if (!get().isEnabled) return;

        const now = Date.now();
        const state = get();

        // 更新节点统计
        const stats = state.nodeStats.get(nodeId) || createDefaultNodeStats(nodeId);

        // 计算耗时（从历史记录中查找对应的开始时间）
        let duration = 0;
        if (state.enableHistory && state.currentPathId) {
            const currentPath = state.executionPaths.find((p) => p.id === state.currentPathId);
            if (currentPath) {
                // 找到最近的该节点的记录
                for (let i = currentPath.history.length - 1; i >= 0; i--) {
                    const entry = currentPath.history[i];
                    if (entry.nodeId === nodeId && !entry.endTime) {
                        duration = now - entry.startTime;
                        entry.endTime = now;
                        entry.status = status;
                        entry.duration = duration;
                        break;
                    }
                }
            }
        }

        const updatedStats: NodeExecutionStats = {
            ...stats,
            totalExecutions: stats.totalExecutions + 1,
            successCount: status === 'success' ? stats.successCount + 1 : stats.successCount,
            failureCount: status === 'failure' ? stats.failureCount + 1 : stats.failureCount,
            runningCount: status === 'running' ? stats.runningCount + 1 : stats.runningCount,
            totalDuration: stats.totalDuration + duration,
            averageDuration: (stats.totalDuration + duration) / (stats.totalExecutions + 1),
            minDuration: Math.min(stats.minDuration, duration || Infinity),
            maxDuration: Math.max(stats.maxDuration, duration),
            lastExecutionTime: now,
            lastStatus: status
        };

        set((state) => {
            const newStats = new Map(state.nodeStats);
            newStats.set(nodeId, updatedStats);
            return { nodeStats: newStats };
        });
    },

    startNewPath: () => {
        if (!get().isEnabled) return;

        const pathId = `path_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newPath: ExecutionPath = {
            id: pathId,
            startTime: Date.now(),
            history: [],
            isActive: true
        };

        set((state) => {
            // 结束之前的路径
            const paths = state.executionPaths.map((p) =>
                p.isActive ? { ...p, isActive: false, endTime: Date.now() } : p
            );

            // 添加新路径
            paths.push(newPath);

            // 限制历史记录数量
            const trimmedPaths = paths.slice(-state.maxHistorySize);

            return {
                executionPaths: trimmedPaths,
                currentPathId: pathId
            };
        });
    },

    endCurrentPath: () => {
        const state = get();
        if (!state.currentPathId) return;

        set((state) => ({
            executionPaths: state.executionPaths.map((p) =>
                p.id === state.currentPathId
                    ? { ...p, isActive: false, endTime: Date.now() }
                    : p
            )
        }));
    },

    getNodeStats: (nodeId: string) => {
        return get().nodeStats.get(nodeId);
    },

    getCurrentPath: () => {
        const state = get();
        if (!state.currentPathId) return undefined;
        return state.executionPaths.find((p) => p.id === state.currentPathId);
    },

    clearStats: () => {
        set({ nodeStats: new Map() });
    },

    clearHistory: () => {
        set({ executionPaths: [], currentPathId: null });
    },

    setEnabled: (enabled: boolean) => {
        set({ isEnabled: enabled });
    },

    setEnableHistory: (enabled: boolean) => {
        set({ enableHistory: enabled });
    },

    exportStats: () => {
        const state = get();
        const data = {
            nodeStats: Array.from(state.nodeStats.entries()).map(([_id, stats]) => stats),
            executionPaths: state.executionPaths,
            exportTime: new Date().toISOString()
        };
        return JSON.stringify(data, null, 2);
    }
}));
