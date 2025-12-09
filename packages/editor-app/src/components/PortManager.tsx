import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { X, Server, WifiOff, Wifi } from 'lucide-react';
import { SettingsService } from '../services/SettingsService';
import { getProfilerService } from '../services/getService';
import '../styles/PortManager.css';

interface PortManagerProps {
  onClose: () => void;
}

export function PortManager({ onClose }: PortManagerProps) {
    const [isServerRunning, setIsServerRunning] = useState(false);
    const [serverPort, setServerPort] = useState<string>('8080');
    const [isChecking, setIsChecking] = useState(false);
    const [isStopping, setIsStopping] = useState(false);
    const [isStarting, setIsStarting] = useState(false);

    useEffect(() => {
        const settings = SettingsService.getInstance();
        const savedPort = settings.get('profiler.port', 8080);
        console.log('[PortManager] Initial port from settings:', savedPort);
        setServerPort(String(savedPort));

        const handleSettingsChange = ((event: CustomEvent) => {
            console.log('[PortManager] settings:changed event received:', event.detail);
            const newPort = event.detail['profiler.port'];
            if (newPort !== undefined) {
                console.log('[PortManager] Updating port to:', newPort);
                setServerPort(String(newPort));
            }
        }) as EventListener;

        window.addEventListener('settings:changed', handleSettingsChange);

        return () => {
            window.removeEventListener('settings:changed', handleSettingsChange);
        };
    }, []);

    useEffect(() => {
        checkServerStatus();
    }, []);

    const checkServerStatus = async () => {
        setIsChecking(true);
        try {
            const status = await invoke<boolean>('get_profiler_status');
            setIsServerRunning(status);
        } catch (error) {
            console.error('[PortManager] Failed to check server status:', error);
            setIsServerRunning(false);
        } finally {
            setIsChecking(false);
        }
    };

    const handleStopServer = async () => {
        setIsStopping(true);
        try {
            const profilerService = getProfilerService();
            if (profilerService) {
                await profilerService.manualStopServer();
                setIsServerRunning(false);
            }
        } catch (error) {
            console.error('[PortManager] Failed to stop server:', error);
        } finally {
            setIsStopping(false);
        }
    };

    const handleStartServer = async () => {
        setIsStarting(true);
        try {
            const profilerService = getProfilerService();
            if (profilerService) {
                await profilerService.manualStartServer();
                await new Promise((resolve) => setTimeout(resolve, 500));
                await checkServerStatus();
            }
        } catch (error) {
            console.error('[PortManager] Failed to start server:', error);
        } finally {
            setIsStarting(false);
        }
    };

    return (
        <div className="port-manager-overlay" onClick={onClose}>
            <div className="port-manager" onClick={(e) => e.stopPropagation()}>
                <div className="port-manager-header">
                    <div className="port-manager-title">
                        <Server size={20} />
                        <h2>Port Manager</h2>
                    </div>
                    <button className="port-manager-close" onClick={onClose} title="Close">
                        <X size={20} />
                    </button>
                </div>

                <div className="port-manager-content">
                    <div className="port-section">
                        <h3>Profiler Server</h3>
                        <div className="port-info">
                            <div className="port-item">
                                <span className="port-label">Status:</span>
                                <span className={`port-status ${isServerRunning ? 'running' : 'stopped'}`}>
                                    {isChecking ? 'Checking...' : isServerRunning ? 'Running' : 'Stopped'}
                                </span>
                            </div>
                            {isServerRunning && (
                                <div className="port-item">
                                    <span className="port-label">Port:</span>
                                    <span className="port-value">{serverPort}</span>
                                </div>
                            )}
                        </div>

                        {isServerRunning && (
                            <div className="port-actions">
                                <button
                                    className="action-btn danger"
                                    onClick={handleStopServer}
                                    disabled={isStopping}
                                >
                                    <WifiOff size={16} />
                                    <span>{isStopping ? 'Stopping...' : 'Stop Server'}</span>
                                </button>
                            </div>
                        )}

                        {!isServerRunning && (
                            <>
                                <div className="port-actions">
                                    <button
                                        className="action-btn primary"
                                        onClick={handleStartServer}
                                        disabled={isStarting}
                                    >
                                        <Wifi size={16} />
                                        <span>{isStarting ? 'Starting...' : 'Start Server'}</span>
                                    </button>
                                </div>
                                <div className="port-hint">
                                    <p>No server is currently running.</p>
                                    <p className="hint-text">Click "Start Server" to start the profiler server.</p>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="port-tips">
                        <h4>Tips</h4>
                        <ul>
                            <li>Use this when the Profiler server port is stuck and cannot be restarted</li>
                            <li>The server will automatically stop when the Profiler window is closed</li>
                            <li>Current configured port: {serverPort}</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
