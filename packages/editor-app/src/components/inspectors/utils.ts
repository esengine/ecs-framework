import { ComponentData } from './types';

export function formatNumber(value: number, decimalPlaces: number): string {
    if (decimalPlaces < 0) {
        return String(value);
    }
    if (Number.isInteger(value)) {
        return String(value);
    }
    return value.toFixed(decimalPlaces);
}

export interface ProfilerService {
    requestEntityDetails(entityId: number): void;
    subscribe(callback: () => void): () => void;
}

export function getProfilerService(): ProfilerService | undefined {
    return (window as any).__PROFILER_SERVICE__;
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
