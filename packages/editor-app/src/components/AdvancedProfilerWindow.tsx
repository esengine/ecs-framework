import { useState, useEffect, useCallback } from 'react';
import { X, BarChart3, Maximize2, Minimize2 } from 'lucide-react';
import { Core } from '@esengine/ecs-framework';
import { ProfilerServiceToken, type IProfilerService } from '../services/tokens';
import { AdvancedProfiler } from './AdvancedProfiler';
import '../styles/ProfilerWindow.css';

interface AdvancedProfilerWindowProps {
    onClose: () => void;
}

export function AdvancedProfilerWindow({ onClose }: AdvancedProfilerWindowProps) {
    const [profilerService, setProfilerService] = useState<IProfilerService | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        try {
            const service = Core.pluginServices.get(ProfilerServiceToken);
            if (service) {
                setProfilerService(service);
            }
        } catch {
            // Core 可能还没有初始化
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

    // 处理 ESC 键退出全屏
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isFullscreen) {
                setIsFullscreen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isFullscreen]);

    const toggleFullscreen = useCallback(() => {
        setIsFullscreen(prev => !prev);
    }, []);

    const windowStyle = isFullscreen
        ? { width: '100vw', height: '100vh', maxWidth: 'none', borderRadius: 0 }
        : { width: '90vw', height: '85vh', maxWidth: '1600px' };

    return (
        <div
            className={`profiler-window-overlay ${isFullscreen ? 'fullscreen' : ''}`}
            onClick={isFullscreen ? undefined : onClose}
        >
            <div
                className={`profiler-window advanced-profiler-window ${isFullscreen ? 'fullscreen' : ''}`}
                onClick={(e) => e.stopPropagation()}
                style={windowStyle}
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
                    <div className="profiler-window-controls">
                        <button
                            className="profiler-window-btn"
                            onClick={toggleFullscreen}
                            title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Fullscreen'}
                        >
                            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                        </button>
                        <button className="profiler-window-close" onClick={onClose} title="Close">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="profiler-window-content" style={{ padding: 0 }}>
                    <AdvancedProfiler profilerService={profilerService} />
                </div>
            </div>
        </div>
    );
}
