/**
 * 服务获取辅助函数
 * Service getter helper functions
 *
 * 提供类型安全的服务获取，避免直接访问全局变量。
 * Provides type-safe service access, avoiding direct global variable access.
 */

import { Core } from '@esengine/ecs-framework';
import type { ServiceToken } from '@esengine/ecs-framework';
import { ProfilerServiceToken, type IProfilerService } from './tokens';

/**
 * 安全获取插件服务
 * Safely get plugin service
 *
 * 在 Core 未初始化时返回 undefined 而非抛出异常。
 * Returns undefined instead of throwing when Core is not initialized.
 */
export function getPluginService<T>(token: ServiceToken<T>): T | undefined {
    try {
        return Core.pluginServices.get(token);
    } catch {
        // Core 可能还没有初始化
        // Core might not be initialized yet
        return undefined;
    }
}

/**
 * 获取 ProfilerService 实例
 * Get ProfilerService instance
 */
export function getProfilerService(): IProfilerService | undefined {
    return getPluginService(ProfilerServiceToken);
}
