import { useEffect, useState } from 'react';

export interface ProfilerService {
    connect(port: number): void;
    disconnect(): void;
    isConnected(): boolean;
    requestEntityList(): void;
    requestEntityDetails(entityId: number): void;
}

export function useProfilerService(): ProfilerService | undefined {
    const [service, setService] = useState<ProfilerService | undefined>(() => {
        return (window as any).__PROFILER_SERVICE__;
    });

    useEffect(() => {
        const checkService = () => {
            const newService = (window as any).__PROFILER_SERVICE__;
            if (newService !== service) {
                setService(newService);
            }
        };

        const interval = setInterval(checkService, 1000);
        return () => clearInterval(interval);
    }, [service]);

    return service;
}
