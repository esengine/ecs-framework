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
import type { ProfilerService } from './ProfilerService';

// ============================================================================
// Profiler Service Token
// ============================================================================

/**
 * ProfilerService 的服务令牌
 * Service token for ProfilerService
 *
 * ProfilerService 提供远程性能分析功能，包括：
 * - WebSocket 连接管理
 * - 性能数据收集和分发
 * - 远程日志接收
 *
 * ProfilerService provides remote profiling capabilities including:
 * - WebSocket connection management
 * - Performance data collection and distribution
 * - Remote log reception
 */
export const ProfilerServiceToken = createServiceToken<ProfilerService>('profilerService');

/**
 * ProfilerService 接口（用于类型检查）
 * ProfilerService interface (for type checking)
 *
 * 注意：完整实现在 ProfilerService.ts 中
 * Note: Full implementation is in ProfilerService.ts
 */
export interface IProfilerService {
    /** 检查是否已连接 | Check if connected */
    isConnected(): boolean;

    /** 检查服务器是否运行 | Check if server is running */
    isServerActive(): boolean;

    /** 获取当前数据 | Get current data */
    getCurrentData(): import('./ProfilerService').ProfilerData | null;

    /** 手动启动服务器 | Manually start server */
    manualStartServer(): void;

    /** 停止服务器 | Stop server */
    stopServer(): void;

    /** 添加监听器 | Add listener */
    addListener(listener: (data: import('./ProfilerService').ProfilerData) => void): void;

    /** 移除监听器 | Remove listener */
    removeListener(listener: (data: import('./ProfilerService').ProfilerData) => void): void;

    /** 添加高级分析器监听器 | Add advanced profiler listener */
    addAdvancedListener(listener: (data: import('./ProfilerService').AdvancedProfilerDataPayload) => void): void;

    /** 移除高级分析器监听器 | Remove advanced profiler listener */
    removeAdvancedListener(listener: (data: import('./ProfilerService').AdvancedProfilerDataPayload) => void): void;
}
