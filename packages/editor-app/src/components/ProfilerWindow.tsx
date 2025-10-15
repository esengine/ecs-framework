import { useState, useEffect, useRef } from 'react';
import { Core } from '@esengine/ecs-framework';
import { Activity, BarChart3, Clock, Cpu, RefreshCw, Pause, Play, X, Wifi, WifiOff, Server, Search, Table2, TreePine } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import '../styles/ProfilerWindow.css';

interface SystemPerformanceData {
  name: string;
  executionTime: number;
  entityCount: number;
  averageTime: number;
  minTime: number;
  maxTime: number;
  percentage: number;
  level: number;
  children?: SystemPerformanceData[];
  isExpanded?: boolean;
}

interface ProfilerWindowProps {
  onClose: () => void;
}

type DataSource = 'local' | 'remote';

export function ProfilerWindow({ onClose }: ProfilerWindowProps) {
  const [systems, setSystems] = useState<SystemPerformanceData[]>([]);
  const [totalFrameTime, setTotalFrameTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [sortBy, setSortBy] = useState<'time' | 'average' | 'name'>('time');
  const [dataSource, setDataSource] = useState<DataSource>('local');
  const [viewMode, setViewMode] = useState<'tree' | 'table'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [wsPort, setWsPort] = useState('8080');
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const animationRef = useRef<number>();
  const wsRef = useRef<WebSocket | null>(null);

  // WebSocket connection management
  useEffect(() => {
    if (dataSource === 'remote' && isConnected && wsRef.current) {
      // Keep WebSocket connection alive
      const pingInterval = setInterval(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'ping' }));
        }
      }, 5000);

      return () => clearInterval(pingInterval);
    }
  }, [dataSource, isConnected]);

  // Cleanup WebSocket and stop server on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }

      // Check if server is running and stop it
      invoke<boolean>('get_profiler_status')
        .then(isRunning => {
          if (isRunning) {
            return invoke<string>('stop_profiler_server');
          }
        })
        .then(() => console.log('[Profiler] Server stopped on unmount'))
        .catch(err => console.error('[Profiler] Failed to stop server on unmount:', err));
    };
  }, []);

  const buildSystemTree = (flatSystems: Map<string, any>, statsMap: Map<string, any>): SystemPerformanceData[] => {
    const coreUpdate = flatSystems.get('Core.update');
    const servicesUpdate = flatSystems.get('Services.update');

    if (!coreUpdate) return [];

    const coreStats = statsMap.get('Core.update');
    const coreNode: SystemPerformanceData = {
      name: 'Core.update',
      executionTime: coreUpdate.executionTime,
      entityCount: 0,
      averageTime: coreStats?.averageTime || 0,
      minTime: coreStats?.minTime || 0,
      maxTime: coreStats?.maxTime || 0,
      percentage: 100,
      level: 0,
      children: [],
      isExpanded: true
    };

    if (servicesUpdate) {
      const servicesStats = statsMap.get('Services.update');
      coreNode.children!.push({
        name: 'Services.update',
        executionTime: servicesUpdate.executionTime,
        entityCount: 0,
        averageTime: servicesStats?.averageTime || 0,
        minTime: servicesStats?.minTime || 0,
        maxTime: servicesStats?.maxTime || 0,
        percentage: coreUpdate.executionTime > 0
          ? (servicesUpdate.executionTime / coreUpdate.executionTime) * 100
          : 0,
        level: 1,
        isExpanded: false
      });
    }

    const sceneSystems: SystemPerformanceData[] = [];
    let sceneSystemsTotal = 0;

    for (const [name, data] of flatSystems.entries()) {
      if (name !== 'Core.update' && name !== 'Services.update') {
        const stats = statsMap.get(name);
        if (stats) {
          sceneSystems.push({
            name,
            executionTime: data.executionTime,
            entityCount: data.entityCount,
            averageTime: stats.averageTime,
            minTime: stats.minTime,
            maxTime: stats.maxTime,
            percentage: 0,
            level: 1,
            isExpanded: false
          });
          sceneSystemsTotal += data.executionTime;
        }
      }
    }

    sceneSystems.forEach(system => {
      system.percentage = coreUpdate.executionTime > 0
        ? (system.executionTime / coreUpdate.executionTime) * 100
        : 0;
    });

    sceneSystems.sort((a, b) => b.executionTime - a.executionTime);
    coreNode.children!.push(...sceneSystems);

    return [coreNode];
  };

  useEffect(() => {
    if (dataSource !== 'local') return;

    const updateProfilerData = () => {
      if (isPaused) {
        animationRef.current = requestAnimationFrame(updateProfilerData);
        return;
      }

      const coreInstance = Core.Instance;
      if (!coreInstance || !coreInstance._performanceMonitor?.isEnabled) {
        animationRef.current = requestAnimationFrame(updateProfilerData);
        return;
      }

      const performanceMonitor = coreInstance._performanceMonitor;
      const systemDataMap = performanceMonitor.getAllSystemData();
      const systemStatsMap = performanceMonitor.getAllSystemStats();

      const tree = buildSystemTree(systemDataMap, systemStatsMap);
      const coreData = systemDataMap.get('Core.update');

      setSystems(tree);
      setTotalFrameTime(coreData?.executionTime || 0);

      animationRef.current = requestAnimationFrame(updateProfilerData);
    };

    animationRef.current = requestAnimationFrame(updateProfilerData);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPaused, sortBy, dataSource]);

  const handleReset = () => {
    if (dataSource === 'local') {
      const coreInstance = Core.Instance;
      if (coreInstance && coreInstance._performanceMonitor) {
        coreInstance._performanceMonitor.reset();
      }
    } else {
      // Reset remote data
      setSystems([]);
      setTotalFrameTime(0);
    }
  };

  const handleConnect = async () => {
    if (isConnecting) return;

    if (wsRef.current) {
      wsRef.current.close();
    }

    setIsConnecting(true);
    setConnectionError(null);

    try {
      const port = parseInt(wsPort);
      const result = await invoke<string>('start_profiler_server', { port });
      console.log('[Profiler]', result);

      const ws = new WebSocket(`ws://localhost:${wsPort}`);

      ws.onopen = () => {
        console.log('[Profiler] Frontend connected to profiler server');
        setIsConnected(true);
        setIsConnecting(false);
        setConnectionError(null);
      };

      ws.onclose = () => {
        console.log('[Profiler] Frontend disconnected');
        setIsConnected(false);
        setIsConnecting(false);
      };

      ws.onerror = (error) => {
        console.error('[Profiler] WebSocket error:', error);
        setConnectionError(`Failed to connect to profiler server`);
        setIsConnected(false);
        setIsConnecting(false);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          if (message.type === 'debug_data' && message.data) {
            handleRemoteDebugData(message.data);
          } else if (message.type === 'pong') {
            // Ping-pong response, connection is alive
          }
        } catch (error) {
          console.error('[Profiler] Failed to parse message:', error);
        }
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('[Profiler] Failed to start server:', error);
      setConnectionError(String(error));
      setIsConnected(false);
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    try {
      // Stop WebSocket server in Tauri backend
      const result = await invoke<string>('stop_profiler_server');
      console.log('[Profiler]', result);
    } catch (error) {
      console.error('[Profiler] Failed to stop server:', error);
    }

    setIsConnected(false);
    setSystems([]);
    setTotalFrameTime(0);
  };

  const handleRemoteDebugData = (debugData: any) => {
    if (isPaused) return;

    const performance = debugData.performance;
    if (!performance) return;

    if (!performance.systemPerformance || !Array.isArray(performance.systemPerformance)) {
      return;
    }

    const flatSystemsMap = new Map();
    const statsMap = new Map();

    for (const system of performance.systemPerformance) {
      flatSystemsMap.set(system.systemName, {
        executionTime: system.lastExecutionTime || system.averageTime || 0,
        entityCount: system.entityCount || 0
      });

      statsMap.set(system.systemName, {
        averageTime: system.averageTime || 0,
        minTime: system.minTime || 0,
        maxTime: system.maxTime || 0
      });
    }

    const tree = buildSystemTree(flatSystemsMap, statsMap);
    setSystems(tree);
    setTotalFrameTime(performance.frameTime || 0);
  };

  const handleDataSourceChange = (newSource: DataSource) => {
    if (newSource === 'remote' && dataSource === 'local') {
      // Switching to remote
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    } else if (newSource === 'local' && dataSource === 'remote') {
      // Switching to local
      handleDisconnect();
    }
    setDataSource(newSource);
    setSystems([]);
    setTotalFrameTime(0);
  };

  const toggleExpand = (systemName: string) => {
    const toggleNode = (nodes: SystemPerformanceData[]): SystemPerformanceData[] => {
      return nodes.map(node => {
        if (node.name === systemName) {
          return { ...node, isExpanded: !node.isExpanded };
        }
        if (node.children) {
          return { ...node, children: toggleNode(node.children) };
        }
        return node;
      });
    };
    setSystems(toggleNode(systems));
  };

  const flattenTree = (nodes: SystemPerformanceData[]): SystemPerformanceData[] => {
    const result: SystemPerformanceData[] = [];
    for (const node of nodes) {
      result.push(node);
      if (node.isExpanded && node.children) {
        result.push(...flattenTree(node.children));
      }
    }
    return result;
  };

  const fps = totalFrameTime > 0 ? Math.round(1000 / totalFrameTime) : 0;
  const targetFrameTime = 16.67;
  const isOverBudget = totalFrameTime > targetFrameTime;

  let displaySystems = viewMode === 'tree' ? flattenTree(systems) : systems;

  // Apply search filter
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    if (viewMode === 'tree') {
      displaySystems = displaySystems.filter(sys =>
        sys.name.toLowerCase().includes(query)
      );
    } else {
      // For table view, flatten and filter
      const flatList: SystemPerformanceData[] = [];
      const flatten = (nodes: SystemPerformanceData[]) => {
        for (const node of nodes) {
          flatList.push(node);
          if (node.children) flatten(node.children);
        }
      };
      flatten(systems);
      displaySystems = flatList.filter(sys =>
        sys.name.toLowerCase().includes(query)
      );
    }
  } else if (viewMode === 'table') {
    // For table view without search, flatten all
    const flatList: SystemPerformanceData[] = [];
    const flatten = (nodes: SystemPerformanceData[]) => {
      for (const node of nodes) {
        flatList.push(node);
        if (node.children) flatten(node.children);
      }
    };
    flatten(systems);
    displaySystems = flatList;
  }

  return (
    <div className="profiler-window-overlay" onClick={onClose}>
      <div className="profiler-window" onClick={(e) => e.stopPropagation()}>
        <div className="profiler-window-header">
          <div className="profiler-window-title">
            <BarChart3 size={20} />
            <h2>Performance Profiler</h2>
            {isPaused && (
              <span className="paused-indicator">PAUSED</span>
            )}
          </div>
          <button className="profiler-window-close" onClick={onClose} title="Close">
            <X size={20} />
          </button>
        </div>

        <div className="profiler-window-toolbar">
          <div className="profiler-toolbar-left">
            <div className="profiler-mode-switch">
              <button
                className={`mode-btn ${dataSource === 'local' ? 'active' : ''}`}
                onClick={() => handleDataSourceChange('local')}
                title="Local Core Instance"
              >
                <Cpu size={14} />
                <span>Local</span>
              </button>
              <button
                className={`mode-btn ${dataSource === 'remote' ? 'active' : ''}`}
                onClick={() => handleDataSourceChange('remote')}
                title="Remote Game Connection"
              >
                <Server size={14} />
                <span>Remote</span>
              </button>
            </div>

            {dataSource === 'remote' && (
              <div className="profiler-connection">
                <input
                  type="text"
                  className="connection-port"
                  placeholder="Port"
                  value={wsPort}
                  onChange={(e) => setWsPort(e.target.value)}
                  disabled={isConnected || isConnecting}
                />
                {isConnected ? (
                  <button
                    className="connection-btn disconnect"
                    onClick={handleDisconnect}
                    title="Disconnect"
                  >
                    <WifiOff size={14} />
                    <span>Disconnect</span>
                  </button>
                ) : (
                  <button
                    className="connection-btn connect"
                    onClick={handleConnect}
                    disabled={isConnecting}
                    title="Connect to Remote Game"
                  >
                    <Wifi size={14} />
                    <span>{isConnecting ? 'Connecting...' : 'Connect'}</span>
                  </button>
                )}
                {isConnected && (
                  <span className="connection-status connected">Connected</span>
                )}
                {isConnecting && (
                  <span className="connection-status connected">Connecting...</span>
                )}
                {connectionError && (
                  <span className="connection-status error" title={connectionError}>Error</span>
                )}
              </div>
            )}

            {dataSource === 'local' && (
              <div className="profiler-stats-summary">
                <div className="summary-item">
                  <Clock size={14} />
                  <span className="summary-label">Frame:</span>
                  <span className={`summary-value ${isOverBudget ? 'over-budget' : ''}`}>
                    {totalFrameTime.toFixed(2)}ms
                  </span>
                </div>
                <div className="summary-item">
                  <Activity size={14} />
                  <span className="summary-label">FPS:</span>
                  <span className={`summary-value ${fps < 55 ? 'low-fps' : ''}`}>{fps}</span>
                </div>
                <div className="summary-item">
                  <BarChart3 size={14} />
                  <span className="summary-label">Systems:</span>
                  <span className="summary-value">{systems.length}</span>
                </div>
              </div>
            )}
          </div>
          <div className="profiler-toolbar-right">
            <div className="profiler-search">
              <Search size={14} />
              <input
                type="text"
                placeholder="Search systems..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>
            <div className="view-mode-switch">
              <button
                className={`view-mode-btn ${viewMode === 'table' ? 'active' : ''}`}
                onClick={() => setViewMode('table')}
                title="Table View"
              >
                <Table2 size={14} />
              </button>
              <button
                className={`view-mode-btn ${viewMode === 'tree' ? 'active' : ''}`}
                onClick={() => setViewMode('tree')}
                title="Tree View"
              >
                <TreePine size={14} />
              </button>
            </div>
            <button
              className={`profiler-btn ${isPaused ? 'paused' : ''}`}
              onClick={() => setIsPaused(!isPaused)}
              title={isPaused ? 'Resume' : 'Pause'}
            >
              {isPaused ? <Play size={14} /> : <Pause size={14} />}
            </button>
            <button
              className="profiler-btn"
              onClick={handleReset}
              title="Reset Statistics"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        <div className="profiler-window-content">
          {displaySystems.length === 0 ? (
            <div className="profiler-empty">
              <Cpu size={48} />
              <p>No performance data available</p>
              <p className="profiler-empty-hint">
                {searchQuery ? 'No systems match your search' : 'Make sure Core debug mode is enabled and systems are running'}
              </p>
            </div>
          ) : viewMode === 'table' ? (
            <table className="profiler-table">
              <thead>
                <tr>
                  <th className="col-name">System Name</th>
                  <th className="col-time">Current</th>
                  <th className="col-time">Average</th>
                  <th className="col-time">Min</th>
                  <th className="col-time">Max</th>
                  <th className="col-percent">%</th>
                  <th className="col-entities">Entities</th>
                </tr>
              </thead>
              <tbody>
                {displaySystems.map((system) => (
                  <tr key={system.name} className={`level-${system.level}`}>
                    <td className="col-name">
                      <span className="system-name-cell" style={{ paddingLeft: `${system.level * 16}px` }}>
                        {system.name}
                      </span>
                    </td>
                    <td className="col-time">
                      <span className={`time-value ${system.executionTime > targetFrameTime ? 'critical' : system.executionTime > targetFrameTime * 0.5 ? 'warning' : ''}`}>
                        {system.executionTime.toFixed(2)}ms
                      </span>
                    </td>
                    <td className="col-time">{system.averageTime.toFixed(2)}ms</td>
                    <td className="col-time">{system.minTime.toFixed(2)}ms</td>
                    <td className="col-time">{system.maxTime.toFixed(2)}ms</td>
                    <td className="col-percent">{system.percentage.toFixed(1)}%</td>
                    <td className="col-entities">{system.entityCount || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="profiler-tree">
              {displaySystems.map((system) => (
                <div key={system.name} className={`tree-row level-${system.level}`}>
                  <div className="tree-row-header">
                    <div className="tree-row-left">
                      {system.children && system.children.length > 0 && (
                        <button
                          className="expand-btn"
                          onClick={() => toggleExpand(system.name)}
                        >
                          {system.isExpanded ? '▼' : '▶'}
                        </button>
                      )}
                      <span className="system-name">{system.name}</span>
                      {system.entityCount > 0 && (
                        <span className="system-entities">({system.entityCount})</span>
                      )}
                    </div>
                    <div className="tree-row-right">
                      <span className={`time-value ${system.executionTime > targetFrameTime ? 'critical' : system.executionTime > targetFrameTime * 0.5 ? 'warning' : ''}`}>
                        {system.executionTime.toFixed(2)}ms
                      </span>
                      <span className="percentage-badge">{system.percentage.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="tree-row-stats">
                    <span>Avg: {system.averageTime.toFixed(2)}ms</span>
                    <span>Min: {system.minTime.toFixed(2)}ms</span>
                    <span>Max: {system.maxTime.toFixed(2)}ms</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="profiler-window-footer">
          <div className="profiler-legend">
            <div className="legend-item">
              <div className="legend-color" style={{ background: 'var(--color-success)' }} />
              <span>Good (&lt;8ms)</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ background: 'var(--color-warning)' }} />
              <span>Warning (8-16ms)</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ background: 'var(--color-danger)' }} />
              <span>Critical (&gt;16ms)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
