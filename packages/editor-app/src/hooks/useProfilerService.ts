/**
 * ProfilerService Hook
 *
 * 通过 ServiceToken 获取 ProfilerService 实例。
 * Get ProfilerService instance via ServiceToken.
 */

import { useEffect, useState } from 'react';
import { Core } from '@esengine/ecs-framework';
import { ProfilerServiceToken, type IProfilerService } from '../services/tokens';

/**
 * 获取 ProfilerService 实例的 Hook
 * Hook to get ProfilerService instance
 *
 * 使用 ServiceToken 从 Core.pluginServices 获取服务，
 * 提供类型安全的服务访问。
 *
 * Uses ServiceToken to get service from Core.pluginServices,
 * providing type-safe service access.
 *
 * @returns ProfilerService 实例，如果未注册则返回 undefined
 */
export function useProfilerService(): IProfilerService | undefined {
    const [service, setService] = useState<IProfilerService | undefined>(() => {
        try {
            return Core.pluginServices.get(ProfilerServiceToken);
        } catch {
            // Core 可能还没有初始化
            // Core might not be initialized yet
            return undefined;
        }
    });

    useEffect(() => {
        // 定期检查服务是否可用（处理服务延迟注册的情况）
        // Periodically check if service is available (handles delayed service registration)
        const checkService = () => {
            try {
                const newService = Core.pluginServices.get(ProfilerServiceToken);
                if (newService !== service) {
                    setService(newService);
                }
            } catch {
                // Core 可能还没有初始化
                // Core might not be initialized yet
                if (service !== undefined) {
                    setService(undefined);
                }
            }
        };

        const interval = setInterval(checkService, 1000);
        return () => clearInterval(interval);
    }, [service]);

    return service;
}
