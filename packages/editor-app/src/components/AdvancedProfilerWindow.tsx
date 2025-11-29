import { useState, useEffect } from 'react';
import { X, BarChart3 } from 'lucide-react';
import { ProfilerService } from '../services/ProfilerService';
import { AdvancedProfiler } from './AdvancedProfiler';
import '../styles/ProfilerWindow.css';

interface AdvancedProfilerWindowProps {
    onClose: () => void;
}

interface WindowWithProfiler extends Window {
    __PROFILER_SERVICE__?: ProfilerService;
}

export function AdvancedProfilerWindow({ onClose }: AdvancedProfilerWindowProps) {
    const [profilerService, setProfilerService] = useState<ProfilerService | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const service = (window as WindowWithProfiler).__PROFILER_SERVICE__;
        if (service) {
            setProfilerService(service);
        }
    }, []);

    useEffect(() => {
        if (!profilerService) return;

        const checkStatus = () => {
            setIsConnected(profilerService.isConnected());
        };

        checkStatus();
        const interval = setInterval(checkStatus, 1000);

        return () => clearInterval(interval);
    }, [profilerService]);

    return (
        <div className="profiler-window-overlay" onClick={onClose}>
            <div
                className="profiler-window advanced-profiler-window"
                onClick={(e) => e.stopPropagation()}
                style={{ width: '90vw', height: '85vh', maxWidth: '1600px' }}
            >
                <div className="profiler-window-header">
                    <div className="profiler-window-title">
                        <BarChart3 size={20} />
                        <h2>Advanced Performance Profiler</h2>
                        {!isConnected && (
                            <span className="paused-indicator" style={{ background: '#ef4444' }}>
                                DISCONNECTED
                            </span>
                        )}
                    </div>
                    <button className="profiler-window-close" onClick={onClose} title="Close">
                        <X size={20} />
                    </button>
                </div>

                <div className="profiler-window-content" style={{ padding: 0 }}>
                    <AdvancedProfiler profilerService={profilerService} />
                </div>
            </div>
        </div>
    );
}
