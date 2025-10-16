import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { X, Server, WifiOff } from 'lucide-react';
import '../styles/PortManager.css';

interface PortManagerProps {
  onClose: () => void;
}

export function PortManager({ onClose }: PortManagerProps) {
  const [isServerRunning, setIsServerRunning] = useState(false);
  const [serverPort] = useState<number>(8080);
  const [isChecking, setIsChecking] = useState(false);
  const [isStopping, setIsStopping] = useState(false);

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
      const result = await invoke<string>('stop_profiler_server');
      console.log('[PortManager]', result);
      setIsServerRunning(false);
    } catch (error) {
      console.error('[PortManager] Failed to stop server:', error);
    } finally {
      setIsStopping(false);
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
              <div className="port-hint">
                <p>No server is currently running.</p>
                <p className="hint-text">Open Profiler window to start the server.</p>
              </div>
            )}
          </div>

          <div className="port-tips">
            <h4>Tips</h4>
            <ul>
              <li>Use this when the Profiler server port is stuck and cannot be restarted</li>
              <li>The server will automatically stop when the Profiler window is closed</li>
              <li>Default port: 8080</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
