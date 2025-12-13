/**
 * 编辑器服务令牌
 * Editor Service Tokens
 *
 * 遵循"谁定义接口，谁导出 Token"原则。
 * 这些服务定义在 editor-app 中，所以 Token 也在这里定义。
 *
 * Following "who defines interface, who exports Token" principle.
 * These services are defined in editor-app, so Tokens are also defined here.
 */

import { createServiceToken } from '@esengine/ecs-framework';

// ============================================================================
// Profiler Data Types (定义在这里以避免循环依赖)
// ============================================================================

export interface SystemPerformanceData {
    name: string;
    executionTime: number;
    entityCount: number;
    averageTime: number;
    percentage: number;
}

export interface RemoteEntity {
    id: number;
    name: string;
    enabled: boolean;
    active: boolean;
    activeInHierarchy: boolean;
    componentCount: number;
    componentTypes: string[];
    parentId: number | null;
    childIds: number[];
    depth: number;
    tag: number;
    updateOrder: number;
}

export interface ProfilerData {
    totalFrameTime: number;
    systems: SystemPerformanceData[];
    entityCount: number;
    componentCount: number;
    fps: number;
    entities?: RemoteEntity[];
}

/**
 * 高级性能数据结构（用于高级性能分析器）
 * Advanced profiler data structure
 */
export interface AdvancedProfilerDataPayload {
    advancedProfiler?: any;
    performance?: any;
    systems?: any;
}

// ============================================================================
// Profiler Service Token
// ============================================================================

/**
 * ProfilerService 接口（用于类型检查）
 * ProfilerService interface (for type checking)
 *
 * 提供远程性能分析功能，包括：
 * - WebSocket 连接管理
 * - 性能数据收集和分发
 * - 远程日志接收
 *
 * Provides remote profiling capabilities including:
 * - WebSocket connection management
 * - Performance data collection and distribution
 * - Remote log reception
 */
export interface IProfilerService {
    /** 检查是否已连接 | Check if connected */
    isConnected(): boolean;

    /** 检查服务器是否运行 | Check if server is running */
    isServerActive(): boolean;

    /** 手动启动服务器 | Manually start server */
    manualStartServer(): Promise<void>;

    /** 手动停止服务器 | Manually stop server */
    manualStopServer(): Promise<void>;

    /** 订阅数据更新 | Subscribe to data updates */
    subscribe(callback: (data: ProfilerData) => void): () => void;

    /** 订阅高级数据更新 | Subscribe to advanced data updates */
    subscribeAdvanced(callback: (data: AdvancedProfilerDataPayload) => void): () => void;

    /** 请求实体详情 | Request entity details */
    requestEntityDetails(entityId: number): void;

    /** 请求高级性能分析数据 | Request advanced profiler data */
    requestAdvancedProfilerData(): void;

    /** 设置选中的函数 | Set selected function */
    setProfilerSelectedFunction(functionName: string | null): void;

    /** 销毁服务 | Destroy service */
    destroy(): void;
}

/**
 * ProfilerService 的服务令牌
 * Service token for ProfilerService
 */
export const ProfilerServiceToken = createServiceToken<IProfilerService>('profilerService');
