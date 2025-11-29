/**
 * 性能分析器类型定义
 */

/**
 * 性能分析类别
 */
export enum ProfileCategory {
    /** ECS 系统 */
    ECS = 'ECS',
    /** 渲染相关 */
    Rendering = 'Rendering',
    /** 物理系统 */
    Physics = 'Physics',
    /** 音频系统 */
    Audio = 'Audio',
    /** 网络相关 */
    Network = 'Network',
    /** 用户脚本 */
    Script = 'Script',
    /** 内存相关 */
    Memory = 'Memory',
    /** 动画系统 */
    Animation = 'Animation',
    /** AI/行为树 */
    AI = 'AI',
    /** 输入处理 */
    Input = 'Input',
    /** 资源加载 */
    Loading = 'Loading',
    /** 自定义 */
    Custom = 'Custom'
}

/**
 * 采样句柄
 */
export interface SampleHandle {
    id: string;
    name: string;
    category: ProfileCategory;
    startTime: number;
    depth: number;
    parentId?: string | undefined;
}

/**
 * 性能采样数据
 */
export interface ProfileSample {
    id: string;
    name: string;
    category: ProfileCategory;
    startTime: number;
    endTime: number;
    duration: number;
    selfTime: number;
    parentId?: string | undefined;
    depth: number;
    callCount: number;
    metadata?: Record<string, unknown>;
}

/**
 * 聚合后的采样统计
 */
export interface ProfileSampleStats {
    name: string;
    category: ProfileCategory;
    /** 包含时间（包含子调用） */
    inclusiveTime: number;
    /** 独占时间（不包含子调用） */
    exclusiveTime: number;
    /** 调用次数 */
    callCount: number;
    /** 平均时间 */
    averageTime: number;
    /** 最小时间 */
    minTime: number;
    /** 最大时间 */
    maxTime: number;
    /** 占总帧时间百分比 */
    percentOfFrame: number;
    /** 占父级时间百分比 */
    percentOfParent: number;
    /** 子采样 */
    children: ProfileSampleStats[];
    /** 深度 */
    depth: number;
}

/**
 * 内存快照
 */
export interface MemorySnapshot {
    timestamp: number;
    /** 已使用堆内存 (bytes) */
    usedHeapSize: number;
    /** 总堆内存 (bytes) */
    totalHeapSize: number;
    /** 堆内存限制 (bytes) */
    heapSizeLimit: number;
    /** 使用率 (0-100) */
    utilizationPercent: number;
    /** 检测到的 GC 次数 */
    gcCount: number;
}

/**
 * 计数器数据
 */
export interface ProfileCounter {
    name: string;
    category: ProfileCategory;
    value: number;
    type: 'counter' | 'gauge';
    history: Array<{ time: number; value: number }>;
}

/**
 * 单帧性能数据
 */
export interface ProfileFrame {
    frameNumber: number;
    startTime: number;
    endTime: number;
    duration: number;
    samples: ProfileSample[];
    sampleStats: ProfileSampleStats[];
    counters: Map<string, ProfileCounter>;
    memory: MemorySnapshot;
    /** 按类别分组的统计 */
    categoryStats: Map<ProfileCategory, {
        totalTime: number;
        sampleCount: number;
        percentOfFrame: number;
    }>;
}

/**
 * 分析器配置
 */
export interface ProfilerConfig {
    /** 是否启用 */
    enabled: boolean;
    /** 最大历史帧数 */
    maxFrameHistory: number;
    /** 采样深度限制 */
    maxSampleDepth: number;
    /** 是否收集内存数据 */
    collectMemory: boolean;
    /** 内存采样间隔 (ms) */
    memorySampleInterval: number;
    /** 是否检测长任务 */
    detectLongTasks: boolean;
    /** 长任务阈值 (ms) */
    longTaskThreshold: number;
    /** 启用的类别 */
    enabledCategories: Set<ProfileCategory>;
}

/**
 * 长任务信息
 */
export interface LongTaskInfo {
    startTime: number;
    duration: number;
    attribution: string[];
}

/**
 * 调用关系节点
 */
export interface CallGraphNode {
    name: string;
    category: ProfileCategory;
    /** 被调用次数 */
    callCount: number;
    /** 总耗时 */
    totalTime: number;
    /** 调用者列表 */
    callers: Map<string, { count: number; totalTime: number }>;
    /** 被调用者列表 */
    callees: Map<string, { count: number; totalTime: number }>;
}

/**
 * 性能分析报告
 */
export interface ProfileReport {
    startTime: number;
    endTime: number;
    totalFrames: number;
    averageFrameTime: number;
    minFrameTime: number;
    maxFrameTime: number;
    p95FrameTime: number;
    p99FrameTime: number;
    /** 热点函数 (按耗时排序) */
    hotspots: ProfileSampleStats[];
    /** 调用图 */
    callGraph: Map<string, CallGraphNode>;
    /** 类别统计 */
    categoryBreakdown: Map<ProfileCategory, {
        totalTime: number;
        averageTime: number;
        percentOfTotal: number;
    }>;
    /** 内存趋势 */
    memoryTrend: MemorySnapshot[];
    /** 长任务列表 */
    longTasks: LongTaskInfo[];
}

/**
 * 默认配置
 */
export const DEFAULT_PROFILER_CONFIG: ProfilerConfig = {
    enabled: false,
    maxFrameHistory: 300,
    maxSampleDepth: 32,
    collectMemory: true,
    memorySampleInterval: 100,
    detectLongTasks: true,
    longTaskThreshold: 50,
    enabledCategories: new Set(Object.values(ProfileCategory))
};
