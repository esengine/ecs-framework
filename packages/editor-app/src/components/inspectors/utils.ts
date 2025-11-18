export function formatNumber(value: number, decimalPlaces: number): string {
    if (decimalPlaces < 0) {
        return String(value);
    }
    if (Number.isInteger(value)) {
        return String(value);
    }
    return value.toFixed(decimalPlaces);
}

export function getProfilerService(): any {
    return (window as any).__PROFILER_SERVICE__;
}
