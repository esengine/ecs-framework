import { useState, useEffect, useRef } from 'react';
import { Core } from '@esengine/ecs-framework';
import { Activity, BarChart3, Clock, Cpu, TrendingUp, RefreshCw, Pause, Play } from 'lucide-react';
import '../styles/ProfilerPanel.css';

interface SystemPerformanceData {
  name: string;
  executionTime: number;
  entityCount: number;
  averageTime: number;
  minTime: number;
  maxTime: number;
  percentage: number;
}

export function ProfilerPanel() {
  const [systems, setSystems] = useState<SystemPerformanceData[]>([]);
  const [totalFrameTime, setTotalFrameTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [sortBy, setSortBy] = useState<'time' | 'average' | 'name'>('time');
  const animationRef = useRef<number>();

  useEffect(() => {
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

      const systemsData: SystemPerformanceData[] = [];
      let total = 0;

      for (const [name, data] of systemDataMap.entries()) {
        const stats = systemStatsMap.get(name);
        if (stats) {
          systemsData.push({
            name,
            executionTime: data.executionTime,
            entityCount: data.entityCount,
            averageTime: stats.averageTime,
            minTime: stats.minTime,
            maxTime: stats.maxTime,
            percentage: 0
          });
          total += data.executionTime;
        }
      }

      // Calculate percentages
      systemsData.forEach(system => {
        system.percentage = total > 0 ? (system.executionTime / total) * 100 : 0;
      });

      // Sort systems
      systemsData.sort((a, b) => {
        switch (sortBy) {
          case 'time':
            return b.executionTime - a.executionTime;
          case 'average':
            return b.averageTime - a.averageTime;
          case 'name':
            return a.name.localeCompare(b.name);
          default:
            return 0;
        }
      });

      setSystems(systemsData);
      setTotalFrameTime(total);

      animationRef.current = requestAnimationFrame(updateProfilerData);
    };

    animationRef.current = requestAnimationFrame(updateProfilerData);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPaused, sortBy]);

  const handleReset = () => {
    const coreInstance = Core.Instance;
    if (coreInstance && coreInstance._performanceMonitor) {
      coreInstance._performanceMonitor.reset();
    }
  };

  const fps = totalFrameTime > 0 ? Math.round(1000 / totalFrameTime) : 0;
  const targetFrameTime = 16.67; // 60 FPS
  const isOverBudget = totalFrameTime > targetFrameTime;

  return (
    <div className="profiler-panel">
      <div className="profiler-toolbar">
        <div className="profiler-toolbar-left">
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
        </div>
        <div className="profiler-toolbar-right">
          <select
            className="profiler-sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
          >
            <option value="time">Sort by Time</option>
            <option value="average">Sort by Average</option>
            <option value="name">Sort by Name</option>
          </select>
          <button
            className="profiler-btn"
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

      <div className="profiler-content">
        {systems.length === 0 ? (
          <div className="profiler-empty">
            <Cpu size={48} />
            <p>No performance data available</p>
            <p className="profiler-empty-hint">
              Make sure Core debug mode is enabled and systems are running
            </p>
          </div>
        ) : (
          <div className="profiler-systems">
            {systems.map((system, index) => (
              <div key={system.name} className="system-row">
                <div className="system-header">
                  <div className="system-info">
                    <span className="system-rank">#{index + 1}</span>
                    <span className="system-name">{system.name}</span>
                    {system.entityCount > 0 && (
                      <span className="system-entities">
                        ({system.entityCount} entities)
                      </span>
                    )}
                  </div>
                  <div className="system-metrics">
                    <span className="metric-time">{system.executionTime.toFixed(2)}ms</span>
                    <span className="metric-percentage">{system.percentage.toFixed(1)}%</span>
                  </div>
                </div>
                <div className="system-bar">
                  <div
                    className="system-bar-fill"
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
                <div className="system-stats">
                  <div className="stat-item">
                    <span className="stat-label">Avg:</span>
                    <span className="stat-value">{system.averageTime.toFixed(2)}ms</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Min:</span>
                    <span className="stat-value">{system.minTime.toFixed(2)}ms</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Max:</span>
                    <span className="stat-value">{system.maxTime.toFixed(2)}ms</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="profiler-footer">
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
  );
}
