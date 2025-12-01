import { useState, useEffect, useRef, useCallback } from 'react';
import {
    Activity, Pause, Play, RefreshCw, Search, ChevronDown, ChevronUp,
    ChevronRight, ArrowRight, Cpu, BarChart3, Settings
} from 'lucide-react';
import '../styles/AdvancedProfiler.css';

/**
 * 高级性能数据接口（与 Core 的 IAdvancedProfilerData 对应）
 */
interface HotspotItem {
    name: string;
    category: string;
    inclusiveTime: number;
    inclusiveTimePercent: number;
    exclusiveTime: number;
    exclusiveTimePercent: number;
    callCount: number;
    avgCallTime: number;
    depth: number;
    children?: HotspotItem[];
}

interface AdvancedProfilerData {
    currentFrame: {
        frameNumber: number;
        frameTime: number;
        fps: number;
        memory: {
            usedHeapSize: number;
            totalHeapSize: number;
            heapSizeLimit: number;
            utilizationPercent: number;
            gcCount: number;
        };
    };
    frameTimeHistory: Array<{
        frameNumber: number;
        time: number;
        duration: number;
    }>;
    categoryStats: Array<{
        category: string;
        totalTime: number;
        percentOfFrame: number;
        sampleCount: number;
        expanded?: boolean;
        items: Array<{
            name: string;
            inclusiveTime: number;
            exclusiveTime: number;
            callCount: number;
            percentOfCategory: number;
            percentOfFrame: number;
        }>;
    }>;
    hotspots: HotspotItem[];
    callGraph: {
        currentFunction: string | null;
        callers: Array<{
            name: string;
            callCount: number;
            totalTime: number;
            percentOfCurrent: number;
        }>;
        callees: Array<{
            name: string;
            callCount: number;
            totalTime: number;
            percentOfCurrent: number;
        }>;
    };
    longTasks: Array<{
        startTime: number;
        duration: number;
        attribution: string[];
    }>;
    memoryTrend: Array<{
        time: number;
        usedMB: number;
        totalMB: number;
        gcCount: number;
    }>;
    summary: {
        totalFrames: number;
        averageFrameTime: number;
        minFrameTime: number;
        maxFrameTime: number;
        p95FrameTime: number;
        p99FrameTime: number;
        currentMemoryMB: number;
        peakMemoryMB: number;
        gcCount: number;
        longTaskCount: number;
    };
}

interface ProfilerServiceInterface {
    subscribeAdvanced: (listener: (data: { advancedProfiler?: AdvancedProfilerData; performance?: unknown; systems?: unknown }) => void) => () => void;
    isConnected: () => boolean;
    requestAdvancedProfilerData?: () => void;
    setProfilerSelectedFunction?: (name: string | null) => void;
}

interface AdvancedProfilerProps {
    profilerService: ProfilerServiceInterface | null;
}

type SortColumn = 'name' | 'incTime' | 'incPercent' | 'excTime' | 'excPercent' | 'calls' | 'avgTime' | 'framePercent';
type SortDirection = 'asc' | 'desc';

const CATEGORY_COLORS: Record<string, string> = {
    'ECS': '#3b82f6',
    'Rendering': '#8b5cf6',
    'Physics': '#f59e0b',
    'Audio': '#ec4899',
    'Network': '#14b8a6',
    'Script': '#84cc16',
    'Memory': '#ef4444',
    'Animation': '#f97316',
    'AI': '#6366f1',
    'Input': '#06b6d4',
    'Loading': '#a855f7',
    'Custom': '#64748b'
};

type DataMode = 'oneframe' | 'average' | 'maximum';

export function AdvancedProfiler({ profilerService }: AdvancedProfilerProps) {
    const [data, setData] = useState<AdvancedProfilerData | null>(null);
    const [isPaused, setIsPaused] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFunction, setSelectedFunction] = useState<string | null>(null);
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['ECS']));
    const [expandedHotspots, setExpandedHotspots] = useState<Set<string>>(new Set());
    const [sortColumn, setSortColumn] = useState<SortColumn>('incTime');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [viewMode, setViewMode] = useState<'hierarchical' | 'flat'>('hierarchical');
    const [dataMode, setDataMode] = useState<DataMode>('average');
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const frameHistoryRef = useRef<Array<{ time: number; duration: number }>>([]);
    const lastDataRef = useRef<AdvancedProfilerData | null>(null);
    // 用于计算平均值和最大值的历史数据
    const hotspotHistoryRef = useRef<Map<string, { times: number[]; maxTime: number }>>(new Map());

    // 更新历史数据
    const updateHotspotHistory = useCallback((hotspots: HotspotItem[]) => {
        const updateItem = (item: HotspotItem) => {
            const history = hotspotHistoryRef.current.get(item.name) || { times: [], maxTime: 0 };
            history.times.push(item.inclusiveTime);
            // 保留最近 60 帧的数据
            if (history.times.length > 60) {
                history.times.shift();
            }
            history.maxTime = Math.max(history.maxTime, item.inclusiveTime);
            hotspotHistoryRef.current.set(item.name, history);

            if (item.children) {
                item.children.forEach(updateItem);
            }
        };
        hotspots.forEach(updateItem);
    }, []);

    // 根据数据模式处理 hotspots
    const processHotspotsWithDataMode = useCallback((hotspots: HotspotItem[], mode: DataMode): HotspotItem[] => {
        if (mode === 'oneframe') {
            return hotspots;
        }

        const processItem = (item: HotspotItem): HotspotItem => {
            const history = hotspotHistoryRef.current.get(item.name);
            let processedTime = item.inclusiveTime;

            if (history && history.times.length > 0) {
                if (mode === 'average') {
                    processedTime = history.times.reduce((a, b) => a + b, 0) / history.times.length;
                } else if (mode === 'maximum') {
                    processedTime = history.maxTime;
                }
            }

            return {
                ...item,
                inclusiveTime: processedTime,
                avgCallTime: item.callCount > 0 ? processedTime / item.callCount : 0,
                children: item.children ? item.children.map(processItem) : undefined
            };
        };

        return hotspots.map(processItem);
    }, []);

    // 订阅数据更新
    useEffect(() => {
        if (!profilerService) return;

        const unsubscribe = profilerService.subscribeAdvanced((rawData: { advancedProfiler?: AdvancedProfilerData; performance?: unknown; systems?: unknown }) => {
            if (isPaused) return;

            // 解析高级性能数据
            if (rawData.advancedProfiler) {
                // 更新历史数据
                updateHotspotHistory(rawData.advancedProfiler.hotspots);
                setData(rawData.advancedProfiler);
                lastDataRef.current = rawData.advancedProfiler;
            } else if (rawData.performance) {
                // 从传统数据构建
                const advancedData = buildFromLegacyData(rawData);
                updateHotspotHistory(advancedData.hotspots);
                setData(advancedData);
                lastDataRef.current = advancedData;
            }
        });

        return unsubscribe;
    }, [profilerService, isPaused, updateHotspotHistory]);

    // 当选中函数变化时，通知服务端
    useEffect(() => {
        if (profilerService?.setProfilerSelectedFunction) {
            profilerService.setProfilerSelectedFunction(selectedFunction);
        }
    }, [selectedFunction, profilerService]);

    // 绘制帧时间图表
    useEffect(() => {
        if (!canvasRef.current || !data) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // 更新帧历史
        if (data.currentFrame.frameTime > 0) {
            frameHistoryRef.current.push({
                time: Date.now(),
                duration: data.currentFrame.frameTime
            });
            if (frameHistoryRef.current.length > 300) {
                frameHistoryRef.current.shift();
            }
        }

        drawFrameTimeGraph(ctx, canvas, frameHistoryRef.current);
    }, [data]);

    const drawFrameTimeGraph = useCallback((
        ctx: CanvasRenderingContext2D,
        canvas: HTMLCanvasElement,
        history: Array<{ time: number; duration: number }>
    ) => {
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();

        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);

        const width = rect.width;
        const height = rect.height;

        // 清空画布
        ctx.fillStyle = '#1e1e1e';
        ctx.fillRect(0, 0, width, height);

        if (history.length < 2) return;

        // 计算最大值
        const maxTime = Math.max(...history.map((h) => h.duration), 33.33);
        const targetLine = 16.67; // 60 FPS

        // 绘制网格线
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);

        // 16.67ms 线 (60 FPS)
        const targetY = height - (targetLine / maxTime) * height;
        ctx.beginPath();
        ctx.moveTo(0, targetY);
        ctx.lineTo(width, targetY);
        ctx.stroke();

        // 33.33ms 线 (30 FPS)
        const halfY = height - (33.33 / maxTime) * height;
        ctx.beginPath();
        ctx.moveTo(0, halfY);
        ctx.lineTo(width, halfY);
        ctx.stroke();

        ctx.setLineDash([]);

        // 绘制帧时间曲线
        const stepX = width / (history.length - 1);

        ctx.beginPath();
        ctx.strokeStyle = '#4ade80';
        ctx.lineWidth = 1.5;

        history.forEach((frame, i) => {
            const x = i * stepX;
            const y = height - (frame.duration / maxTime) * height;

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }

            // 如果超过阈值，改变颜色
            if (frame.duration > 33.33) {
                ctx.stroke();
                ctx.beginPath();
                ctx.strokeStyle = '#ef4444';
                ctx.moveTo(x, y);
            } else if (frame.duration > 16.67) {
                ctx.stroke();
                ctx.beginPath();
                ctx.strokeStyle = '#fbbf24';
                ctx.moveTo(x, y);
            }
        });
        ctx.stroke();

        // 绘制填充区域
        ctx.beginPath();
        ctx.fillStyle = 'rgba(74, 222, 128, 0.1)';
        ctx.moveTo(0, height);
        history.forEach((frame, i) => {
            const x = i * stepX;
            const y = height - (frame.duration / maxTime) * height;
            ctx.lineTo(x, y);
        });
        ctx.lineTo(width, height);
        ctx.closePath();
        ctx.fill();
    }, []);

    const handleSort = (column: SortColumn) => {
        if (sortColumn === column) {
            setSortDirection((d) => d === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('desc');
        }
    };

    const toggleCategory = (category: string) => {
        setExpandedCategories((prev) => {
            const next = new Set(prev);
            if (next.has(category)) {
                next.delete(category);
            } else {
                next.add(category);
            }
            return next;
        });
    };

    const handleReset = () => {
        frameHistoryRef.current = [];
        setData(null);
    };

    const getFrameTimeClass = (frameTime: number): string => {
        if (frameTime > 33.33) return 'critical';
        if (frameTime > 16.67) return 'warning';
        return '';
    };

    const formatTime = (ms: number): string => {
        if (ms < 0.01) return '< 0.01';
        return ms.toFixed(2);
    };

    const formatPercent = (percent: number): string => {
        return percent.toFixed(1) + '%';
    };

    // 展平层级数据用于显示
    const flattenHotspots = (items: HotspotItem[], result: HotspotItem[] = []): HotspotItem[] => {
        for (const item of items) {
            // 搜索过滤
            const matchesSearch = searchTerm === '' || item.name.toLowerCase().includes(searchTerm.toLowerCase());

            if (viewMode === 'flat') {
                // 扁平模式：显示所有层级的项目
                if (matchesSearch) {
                    result.push({ ...item, depth: 0 }); // 扁平模式下深度都是0
                }
                if (item.children) {
                    flattenHotspots(item.children, result);
                }
            } else {
                // 层级模式：根据展开状态显示
                if (matchesSearch || (item.children && item.children.some(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())))) {
                    result.push(item);
                }
                if (item.children && expandedHotspots.has(item.name)) {
                    flattenHotspots(item.children, result);
                }
            }
        }
        return result;
    };

    // 切换展开状态
    const toggleHotspotExpand = (name: string) => {
        setExpandedHotspots(prev => {
            const next = new Set(prev);
            if (next.has(name)) {
                next.delete(name);
            } else {
                next.add(name);
            }
            return next;
        });
    };

    // 排序数据
    const getSortedHotspots = (): HotspotItem[] => {
        if (!data) return [];

        // 先根据数据模式处理 hotspots
        const processedHotspots = processHotspotsWithDataMode(data.hotspots, dataMode);
        const flattened = flattenHotspots(processedHotspots);

        // 扁平模式下排序
        if (viewMode === 'flat') {
            return [...flattened].sort((a, b) => {
                let comparison = 0;
                switch (sortColumn) {
                    case 'name':
                        comparison = a.name.localeCompare(b.name);
                        break;
                    case 'incTime':
                        comparison = a.inclusiveTime - b.inclusiveTime;
                        break;
                    case 'incPercent':
                        comparison = a.inclusiveTimePercent - b.inclusiveTimePercent;
                        break;
                    case 'excTime':
                        comparison = a.exclusiveTime - b.exclusiveTime;
                        break;
                    case 'excPercent':
                        comparison = a.exclusiveTimePercent - b.exclusiveTimePercent;
                        break;
                    case 'calls':
                        comparison = a.callCount - b.callCount;
                        break;
                    case 'avgTime':
                        comparison = a.avgCallTime - b.avgCallTime;
                        break;
                    case 'framePercent':
                        comparison = a.inclusiveTimePercent - b.inclusiveTimePercent;
                        break;
                }
                return sortDirection === 'asc' ? comparison : -comparison;
            });
        }

        // 层级模式下保持原有层级顺序
        return flattened;
    };

    const renderSortIcon = (column: SortColumn) => {
        if (sortColumn !== column) return null;
        return sortDirection === 'asc' ? <ChevronUp size={10} /> : <ChevronDown size={10} />;
    };

    if (!profilerService) {
        return (
            <div className="advanced-profiler">
                <div className="profiler-empty-state">
                    <Cpu size={48} />
                    <div className="profiler-empty-state-title">Profiler Service Unavailable</div>
                    <div className="profiler-empty-state-hint">
                        Connect to a running game to start profiling
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="advanced-profiler">
            {/* Top Toolbar */}
            <div className="profiler-top-bar">
                <div className="profiler-thread-selector">
                    <button className="profiler-thread-btn active">Main Thread</button>
                </div>

                <div className="profiler-frame-time">
                    <span className="profiler-frame-time-label">Frame:</span>
                    <span className={`profiler-frame-time-value ${getFrameTimeClass(data?.currentFrame.frameTime || 0)}`}>
                        {formatTime(data?.currentFrame.frameTime || 0)} ms
                    </span>
                    <span className="profiler-frame-time-label">FPS:</span>
                    <span className="profiler-frame-time-value">
                        {data?.currentFrame.fps || 0}
                    </span>
                </div>

                <div className="profiler-controls">
                    <button
                        className={`profiler-control-btn ${isPaused ? '' : 'active'}`}
                        onClick={() => setIsPaused(!isPaused)}
                        title={isPaused ? 'Resume' : 'Pause'}
                    >
                        {isPaused ? <Play size={14} /> : <Pause size={14} />}
                    </button>
                    <button
                        className="profiler-control-btn"
                        onClick={handleReset}
                        title="Reset"
                    >
                        <RefreshCw size={14} />
                    </button>
                    <button className="profiler-control-btn" title="Settings">
                        <Settings size={14} />
                    </button>
                </div>
            </div>

            <div className="profiler-main">
                {/* Left Panel - Stats Groups */}
                <div className="profiler-left-panel">
                    <div className="profiler-search-box">
                        <Search size={14} />
                        <input
                            type="text"
                            placeholder="Search stats..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="profiler-group-controls">
                        <select className="profiler-group-select" defaultValue="category">
                            <option value="category">Group by Category</option>
                            <option value="name">Group by Name</option>
                        </select>
                    </div>

                    <div className="profiler-type-filters">
                        <button className="profiler-type-filter hier active">Hier</button>
                        <button className="profiler-type-filter float">Float</button>
                        <button className="profiler-type-filter int">Int</button>
                        <button className="profiler-type-filter mem">Mem</button>
                    </div>

                    <div className="profiler-groups-list">
                        {data?.categoryStats.map(cat => (
                            <div key={cat.category}>
                                <div
                                    className={`profiler-group-item ${expandedCategories.has(cat.category) ? 'selected' : ''}`}
                                    onClick={() => toggleCategory(cat.category)}
                                >
                                    <input
                                        type="checkbox"
                                        className="profiler-group-checkbox"
                                        checked={expandedCategories.has(cat.category)}
                                        onChange={() => {}}
                                    />
                                    <span
                                        className="category-dot"
                                        style={{ background: CATEGORY_COLORS[cat.category] || '#666' }}
                                    />
                                    <span className="profiler-group-name">{cat.category}</span>
                                    <span className="profiler-group-count">({cat.sampleCount})</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Content */}
                <div className="profiler-content">
                    {/* Graph View */}
                    <div className="profiler-graph-section">
                        <div className="profiler-graph-header">
                            <BarChart3 size={14} />
                            <span className="profiler-graph-title">Graph View</span>
                            <div className="profiler-graph-stats">
                                <div className="profiler-graph-stat">
                                    <span className="profiler-graph-stat-label">Avg:</span>
                                    <span className="profiler-graph-stat-value">
                                        {formatTime(data?.summary.averageFrameTime || 0)} ms
                                    </span>
                                </div>
                                <div className="profiler-graph-stat">
                                    <span className="profiler-graph-stat-label">Min:</span>
                                    <span className="profiler-graph-stat-value">
                                        {formatTime(data?.summary.minFrameTime || 0)} ms
                                    </span>
                                </div>
                                <div className="profiler-graph-stat">
                                    <span className="profiler-graph-stat-label">Max:</span>
                                    <span className="profiler-graph-stat-value">
                                        {formatTime(data?.summary.maxFrameTime || 0)} ms
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="profiler-graph-canvas">
                            <canvas ref={canvasRef} />
                            <div className="profiler-graph-overlay">
                                <div className="profiler-graph-line" style={{ top: '50%' }}>
                                    <span className="profiler-graph-line-label">16.67ms</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Call Graph */}
                    <div className="profiler-callgraph-section">
                        <div className="profiler-callgraph-header">
                            <Activity size={14} />
                            <span className="profiler-graph-title">Call Graph</span>
                            <div className="profiler-callgraph-controls">
                                <select
                                    className="profiler-callgraph-type-select"
                                    value={dataMode}
                                    onChange={(e) => setDataMode(e.target.value as DataMode)}
                                >
                                    <option value="oneframe">One Frame</option>
                                    <option value="average">Average</option>
                                    <option value="maximum">Maximum</option>
                                </select>
                                <div className="profiler-callgraph-view-mode">
                                    <button
                                        className={`profiler-callgraph-view-btn ${viewMode === 'hierarchical' ? 'active' : ''}`}
                                        onClick={() => setViewMode('hierarchical')}
                                    >
                                        Hierarchical
                                    </button>
                                    <button
                                        className={`profiler-callgraph-view-btn ${viewMode === 'flat' ? 'active' : ''}`}
                                        onClick={() => setViewMode('flat')}
                                    >
                                        Flat
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="profiler-callgraph-content">
                            <div className="profiler-callgraph-column">
                                <div className="profiler-callgraph-column-header">
                                    <ArrowRight size={10} />
                                    Calling Functions
                                </div>
                                <div className="profiler-callgraph-list">
                                    {data?.callGraph.callers.map((caller, i) => (
                                        <div
                                            key={i}
                                            className="profiler-callgraph-item"
                                            onClick={() => setSelectedFunction(caller.name)}
                                        >
                                            <span className="profiler-callgraph-item-name">{caller.name}</span>
                                            <span className="profiler-callgraph-item-percent">
                                                {formatPercent(caller.percentOfCurrent)}
                                            </span>
                                            <span className="profiler-callgraph-item-time">
                                                {formatTime(caller.totalTime)} ms
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="profiler-callgraph-column">
                                <div className="profiler-callgraph-column-header">
                                    Current Function
                                </div>
                                <div className="profiler-callgraph-list">
                                    {selectedFunction ? (
                                        <div className="profiler-callgraph-item current">
                                            <span className="profiler-callgraph-item-name">{selectedFunction}</span>
                                        </div>
                                    ) : (
                                        <div className="profiler-callgraph-item">
                                            <span className="profiler-callgraph-item-name" style={{ color: '#666' }}>
                                                Select a function from the table
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="profiler-callgraph-column">
                                <div className="profiler-callgraph-column-header">
                                    Called Functions
                                    <ArrowRight size={10} />
                                </div>
                                <div className="profiler-callgraph-list">
                                    {data?.callGraph.callees.map((callee, i) => (
                                        <div
                                            key={i}
                                            className="profiler-callgraph-item"
                                            onClick={() => setSelectedFunction(callee.name)}
                                        >
                                            <span className="profiler-callgraph-item-name">{callee.name}</span>
                                            <span className="profiler-callgraph-item-percent">
                                                {formatPercent(callee.percentOfCurrent)}
                                            </span>
                                            <span className="profiler-callgraph-item-time">
                                                {formatTime(callee.totalTime)} ms
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Data Table */}
                    <div className="profiler-table-section">
                        <div className="profiler-table-header">
                            <div
                                className={`profiler-table-header-cell col-name ${sortColumn === 'name' ? 'sorted' : ''}`}
                                onClick={() => handleSort('name')}
                            >
                                Event Name {renderSortIcon('name')}
                            </div>
                            <div
                                className={`profiler-table-header-cell col-inc-time ${sortColumn === 'incTime' ? 'sorted' : ''}`}
                                onClick={() => handleSort('incTime')}
                            >
                                Inc Time (ms) {renderSortIcon('incTime')}
                            </div>
                            <div
                                className={`profiler-table-header-cell col-inc-percent ${sortColumn === 'incPercent' ? 'sorted' : ''}`}
                                onClick={() => handleSort('incPercent')}
                            >
                                Inc % {renderSortIcon('incPercent')}
                            </div>
                            <div
                                className={`profiler-table-header-cell col-exc-time ${sortColumn === 'excTime' ? 'sorted' : ''}`}
                                onClick={() => handleSort('excTime')}
                            >
                                Exc Time (ms) {renderSortIcon('excTime')}
                            </div>
                            <div
                                className={`profiler-table-header-cell col-exc-percent ${sortColumn === 'excPercent' ? 'sorted' : ''}`}
                                onClick={() => handleSort('excPercent')}
                            >
                                Exc % {renderSortIcon('excPercent')}
                            </div>
                            <div
                                className={`profiler-table-header-cell col-calls ${sortColumn === 'calls' ? 'sorted' : ''}`}
                                onClick={() => handleSort('calls')}
                            >
                                Calls {renderSortIcon('calls')}
                            </div>
                            <div
                                className={`profiler-table-header-cell col-avg-calls ${sortColumn === 'avgTime' ? 'sorted' : ''}`}
                                onClick={() => handleSort('avgTime')}
                            >
                                Avg (ms) {renderSortIcon('avgTime')}
                            </div>
                            <div
                                className={`profiler-table-header-cell col-frame-percent ${sortColumn === 'framePercent' ? 'sorted' : ''}`}
                                onClick={() => handleSort('framePercent')}
                            >
                                % of Frame {renderSortIcon('framePercent')}
                            </div>
                        </div>
                        <div className="profiler-table-body">
                            {getSortedHotspots().map((item, index) => {
                                const hasChildren = item.children && item.children.length > 0;
                                const isExpanded = expandedHotspots.has(item.name);
                                const indentPadding = viewMode === 'hierarchical' ? item.depth * 16 : 0;

                                return (
                                    <div
                                        key={item.name + index + item.depth}
                                        className={`profiler-table-row ${selectedFunction === item.name ? 'selected' : ''} depth-${item.depth}`}
                                        onClick={() => setSelectedFunction(item.name)}
                                    >
                                        <div className="profiler-table-cell col-name name" style={{ paddingLeft: indentPadding }}>
                                            {hasChildren && viewMode === 'hierarchical' ? (
                                                <span
                                                    className={`expand-icon clickable ${isExpanded ? 'expanded' : ''}`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleHotspotExpand(item.name);
                                                    }}
                                                >
                                                    {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                                                </span>
                                            ) : (
                                                <span className="expand-icon placeholder" style={{ width: 12 }} />
                                            )}
                                            <span
                                                className="category-dot"
                                                style={{ background: CATEGORY_COLORS[item.category] || '#666' }}
                                            />
                                            {item.name}
                                        </div>
                                        <div className="profiler-table-cell col-inc-time numeric">
                                            {formatTime(item.inclusiveTime)}
                                        </div>
                                        <div className="profiler-table-cell col-inc-percent percent">
                                            <div className="bar-container">
                                                <div
                                                    className={`bar ${item.inclusiveTimePercent > 50 ? 'critical' : item.inclusiveTimePercent > 25 ? 'warning' : ''}`}
                                                    style={{ width: `${Math.min(item.inclusiveTimePercent, 100)}%` }}
                                                />
                                                <span>{formatPercent(item.inclusiveTimePercent)}</span>
                                            </div>
                                        </div>
                                        <div className="profiler-table-cell col-exc-time numeric">
                                            {formatTime(item.exclusiveTime)}
                                        </div>
                                        <div className="profiler-table-cell col-exc-percent percent">
                                            {formatPercent(item.exclusiveTimePercent)}
                                        </div>
                                        <div className="profiler-table-cell col-calls numeric">
                                            {item.callCount}
                                        </div>
                                        <div className="profiler-table-cell col-avg-calls numeric">
                                            {formatTime(item.avgCallTime)}
                                        </div>
                                        <div className="profiler-table-cell col-frame-percent percent">
                                            {formatPercent(item.inclusiveTimePercent)}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * 从传统数据构建高级性能数据
 */
function buildFromLegacyData(rawData: any): AdvancedProfilerData {
    const performance = rawData.performance || {};
    const systems = rawData.systems?.systemsInfo || [];

    const frameTime = performance.frameTime || 0;
    const fps = frameTime > 0 ? Math.round(1000 / frameTime) : 0;

    // 构建 hotspots
    const hotspots: HotspotItem[] = systems.map((sys: any) => ({
        name: sys.name || sys.type || 'Unknown',
        category: 'ECS',
        inclusiveTime: sys.executionTime || 0,
        inclusiveTimePercent: frameTime > 0 ? (sys.executionTime / frameTime) * 100 : 0,
        exclusiveTime: sys.executionTime || 0,
        exclusiveTimePercent: frameTime > 0 ? (sys.executionTime / frameTime) * 100 : 0,
        callCount: 1,
        avgCallTime: sys.executionTime || 0,
        depth: 0
    }));

    // 构建 categoryStats
    const totalECSTime = hotspots.reduce((sum: number, h: any) => sum + h.inclusiveTime, 0);
    const categoryStats = [{
        category: 'ECS',
        totalTime: totalECSTime,
        percentOfFrame: frameTime > 0 ? (totalECSTime / frameTime) * 100 : 0,
        sampleCount: hotspots.length,
        items: hotspots.map((h: any) => ({
            name: h.name,
            inclusiveTime: h.inclusiveTime,
            exclusiveTime: h.exclusiveTime,
            callCount: h.callCount,
            percentOfCategory: totalECSTime > 0 ? (h.inclusiveTime / totalECSTime) * 100 : 0,
            percentOfFrame: h.inclusiveTimePercent
        }))
    }];

    return {
        currentFrame: {
            frameNumber: 0,
            frameTime,
            fps,
            memory: {
                usedHeapSize: (performance.memoryUsage || 0) * 1024 * 1024,
                totalHeapSize: 0,
                heapSizeLimit: 0,
                utilizationPercent: 0,
                gcCount: 0
            }
        },
        frameTimeHistory: performance.frameTimeHistory?.map((t: number, i: number) => ({
            frameNumber: i,
            time: Date.now() - (performance.frameTimeHistory.length - i) * 16,
            duration: t
        })) || [],
        categoryStats,
        hotspots,
        callGraph: {
            currentFunction: null,
            callers: [],
            callees: []
        },
        longTasks: [],
        memoryTrend: [],
        summary: {
            totalFrames: 0,
            averageFrameTime: performance.averageFrameTime || frameTime,
            minFrameTime: performance.minFrameTime || frameTime,
            maxFrameTime: performance.maxFrameTime || frameTime,
            p95FrameTime: frameTime,
            p99FrameTime: frameTime,
            currentMemoryMB: performance.memoryUsage || 0,
            peakMemoryMB: performance.memoryUsage || 0,
            gcCount: 0,
            longTaskCount: 0
        }
    };
}
