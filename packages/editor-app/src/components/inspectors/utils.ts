import { Core } from '@esengine/ecs-framework';
import { ComponentData } from './types';
import { ProfilerServiceToken, type IProfilerService } from '../../services/tokens';

export function formatNumber(value: number, decimalPlaces: number): string {
    if (decimalPlaces < 0) {
        return String(value);
    }
    if (Number.isInteger(value)) {
        return String(value);
    }
    return value.toFixed(decimalPlaces);
}

/**
 * 获取 ProfilerService 实例
 * Get ProfilerService instance
 *
 * 使用 ServiceToken 从 Core.pluginServices 获取服务。
 * Uses ServiceToken to get service from Core.pluginServices.
 */
export function getProfilerService(): IProfilerService | undefined {
    try {
        return Core.pluginServices.get(ProfilerServiceToken);
    } catch {
        // Core 可能还没有初始化
        // Core might not be initialized yet
        return undefined;
    }
}

export function isComponentData(value: unknown): value is ComponentData {
    return (
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value) &&
        'typeName' in value &&
        typeof (value as Record<string, unknown>).typeName === 'string' &&
        'properties' in value &&
        typeof (value as Record<string, unknown>).properties === 'object'
    );
}
