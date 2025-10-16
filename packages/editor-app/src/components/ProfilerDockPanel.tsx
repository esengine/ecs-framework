import { useState, useEffect } from 'react';
import { Activity, Cpu, Layers, Package, Wifi, WifiOff, Maximize2, Pause, Play } from 'lucide-react';
import { ProfilerService, ProfilerData } from '../services/ProfilerService';
import { SettingsService } from '../services/SettingsService';
import { Core } from '@esengine/ecs-framework';
import { MessageHub } from '@esengine/editor-core';
import '../styles/ProfilerDockPanel.css';

export function ProfilerDockPanel() {
  const [profilerData, setProfilerData] = useState<ProfilerData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isServerRunning, setIsServerRunning] = useState(false);
  const [port, setPort] = useState('8080');
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const settings = SettingsService.getInstance();
    setPort(settings.get('profiler.port', '8080'));

    const handleSettingsChange = ((event: CustomEvent) => {
      const newPort = event.detail['profiler.port'];
      if (newPort) {
        setPort(newPort);
      }
    }) as EventListener;

    window.addEventListener('settings:changed', handleSettingsChange);

    return () => {
      window.removeEventListener('settings:changed', handleSettingsChange);
    };
  }, []);

  useEffect(() => {
    const profilerService = (window as any).__PROFILER_SERVICE__ as ProfilerService | undefined;

    if (!profilerService) {
      console.warn('[ProfilerDockPanel] ProfilerService not available - plugin may be disabled');
      setIsServerRunning(false);
      setIsConnected(false);
      return;
    }

    // 订阅数据更新
    const unsubscribe = profilerService.subscribe((data: ProfilerData) => {
      if (!isPaused) {
        setProfilerData(data);
      }
    });

    // 定期检查连接状态
    const checkStatus = () => {
      setIsConnected(profilerService.isConnected());
      setIsServerRunning(profilerService.isServerActive());
    };

    checkStatus();
    const interval = setInterval(checkStatus, 1000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [isPaused]);

  const fps = profilerData?.fps || 0;
  const totalFrameTime = profilerData?.totalFrameTime || 0;
  const systems = (profilerData?.systems || []).slice(0, 5); // Only show top 5 systems in dock panel
  const entityCount = profilerData?.entityCount || 0;
  const componentCount = profilerData?.componentCount || 0;
  const targetFrameTime = 16.67;

  const handleOpenDetails = () => {
    const messageHub = Core.services.resolve(MessageHub);
    if (messageHub) {
      messageHub.publish('ui:openWindow', { windowId: 'profiler' });
    }
  };

  const handleTogglePause = () => {
    setIsPaused(!isPaused);
  };

  return (
    <div className="profiler-dock-panel">
      <div className="profiler-dock-header">
        <h3>Performance Monitor</h3>
        <div className="profiler-dock-header-actions">
          {isConnected && (
            <>
              <button
                className="profiler-dock-pause-btn"
                onClick={handleTogglePause}
                title={isPaused ? 'Resume data updates' : 'Pause data updates'}
              >
                {isPaused ? <Play size={14} /> : <Pause size={14} />}
              </button>
              <button
                className="profiler-dock-details-btn"
                onClick={handleOpenDetails}
                title="Open detailed profiler"
              >
                <Maximize2 size={14} />
              </button>
            </>
          )}
          <div className="profiler-dock-status">
            {isConnected ? (
              <>
                <Wifi size={12} />
                <span className="status-text connected">Connected</span>
              </>
            ) : isServerRunning ? (
              <>
                <WifiOff size={12} />
                <span className="status-text waiting">Waiting...</span>
              </>
            ) : (
              <>
                <WifiOff size={12} />
                <span className="status-text disconnected">Server Off</span>
              </>
            )}
          </div>
        </div>
      </div>

      {!isServerRunning ? (
        <div className="profiler-dock-empty">
          <Cpu size={32} />
          <p>Profiler server not running</p>
          <p className="hint">Open Profiler window and connect to start monitoring</p>
        </div>
      ) : !isConnected ? (
        <div className="profiler-dock-empty">
          <Activity size={32} />
          <p>Waiting for game connection...</p>
          <p className="hint">Connect to: <code>ws://localhost:{port}</code></p>
        </div>
      ) : (
        <div className="profiler-dock-content">
          <div className="profiler-dock-stats">
            <div className="stat-card">
              <div className="stat-icon">
                <Activity size={16} />
              </div>
              <div className="stat-info">
                <div className="stat-label">FPS</div>
                <div className={`stat-value ${fps < 55 ? 'warning' : ''}`}>{fps}</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <Cpu size={16} />
              </div>
              <div className="stat-info">
                <div className="stat-label">Frame Time</div>
                <div className={`stat-value ${totalFrameTime > targetFrameTime ? 'warning' : ''}`}>
                  {totalFrameTime.toFixed(1)}ms
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <Layers size={16} />
              </div>
              <div className="stat-info">
                <div className="stat-label">Entities</div>
                <div className="stat-value">{entityCount}</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <Package size={16} />
              </div>
              <div className="stat-info">
                <div className="stat-label">Components</div>
                <div className="stat-value">{componentCount}</div>
              </div>
            </div>
          </div>

          {systems.length > 0 && (
            <div className="profiler-dock-systems">
              <h4>Top Systems</h4>
              <div className="systems-list">
                {systems.map((system) => (
                  <div key={system.name} className="system-item">
                    <div className="system-item-header">
                      <span className="system-item-name">{system.name}</span>
                      <span className="system-item-time">
                        {system.executionTime.toFixed(2)}ms
                      </span>
                    </div>
                    <div className="system-item-bar">
                      <div
                        className="system-item-bar-fill"
                        style={{
                          width: `${Math.min(system.percentage, 100)}%`,
                          backgroundColor: system.executionTime > targetFrameTime
                            ? 'var(--color-danger)'
                            : system.executionTime > targetFrameTime * 0.5
                            ? 'var(--color-warning)'
                            : 'var(--color-success)'
                        }}
                      />
                    </div>
                    <div className="system-item-footer">
                      <span className="system-item-percentage">{system.percentage.toFixed(1)}%</span>
                      {system.entityCount > 0 && (
                        <span className="system-item-entities">{system.entityCount} entities</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
