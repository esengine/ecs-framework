import { useState, useEffect, useRef, useMemo, memo } from 'react';
import { LogService, LogEntry } from '@esengine/editor-core';
import { LogLevel } from '@esengine/ecs-framework';
import { Trash2, AlertCircle, Info, AlertTriangle, XCircle, Bug, Search, Wifi } from 'lucide-react';
import { JsonViewer } from './JsonViewer';
import '../styles/ConsolePanel.css';

interface ConsolePanelProps {
    logService: LogService;
}

const MAX_LOGS = 1000;

// 提取JSON检测和格式化逻辑
function tryParseJSON(message: string): { isJSON: boolean; parsed?: unknown } {
    try {
        const parsed: unknown = JSON.parse(message);
        return { isJSON: true, parsed };
    } catch {
        return { isJSON: false };
    }
}

// 格式化时间
function formatTime(date: Date): string {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    const ms = date.getMilliseconds().toString().padStart(3, '0');
    return `${hours}:${minutes}:${seconds}.${ms}`;
}

// 日志等级图标
function getLevelIcon(level: LogLevel) {
    switch (level) {
        case LogLevel.Debug:
            return <Bug size={14} />;
        case LogLevel.Info:
            return <Info size={14} />;
        case LogLevel.Warn:
            return <AlertTriangle size={14} />;
        case LogLevel.Error:
        case LogLevel.Fatal:
            return <XCircle size={14} />;
        default:
            return <AlertCircle size={14} />;
    }
}

// 日志等级样式类
function getLevelClass(level: LogLevel): string {
    switch (level) {
        case LogLevel.Debug:
            return 'log-entry-debug';
        case LogLevel.Info:
            return 'log-entry-info';
        case LogLevel.Warn:
            return 'log-entry-warn';
        case LogLevel.Error:
        case LogLevel.Fatal:
            return 'log-entry-error';
        default:
            return '';
    }
}

// 单个日志条目组件
const LogEntryItem = memo(({ log, onOpenJsonViewer }: {
    log: LogEntry;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onOpenJsonViewer: (data: any) => void;
}) => {
    const { isJSON, parsed } = useMemo(() => tryParseJSON(log.message), [log.message]);
    const shouldTruncate = log.message.length > 200;
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className={`log-entry ${getLevelClass(log.level)} ${log.source === 'remote' ? 'log-entry-remote' : ''}`}>
            <div className="log-entry-icon">
                {getLevelIcon(log.level)}
            </div>
            <div className="log-entry-time">
                {formatTime(log.timestamp)}
            </div>
            <div className={`log-entry-source ${log.source === 'remote' ? 'source-remote' : ''}`}>
                [{log.source === 'remote' ? '🌐 Remote' : log.source}]
            </div>
            {log.clientId && (
                <div className="log-entry-client" title={`Client: ${log.clientId}`}>
                    {log.clientId}
                </div>
            )}
            <div className="log-entry-message">
                <div className="log-message-container">
                    <div className="log-message-text">
                        {shouldTruncate && !isExpanded ? (
                            <>
                                <span className="log-message-preview">
                                    {log.message.substring(0, 200)}...
                                </span>
                                <button
                                    className="log-expand-btn"
                                    onClick={() => setIsExpanded(true)}
                                >
                                    Show more
                                </button>
                            </>
                        ) : (
                            <>
                                <span>{log.message}</span>
                                {shouldTruncate && (
                                    <button
                                        className="log-expand-btn"
                                        onClick={() => setIsExpanded(false)}
                                    >
                                        Show less
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                    {isJSON && parsed !== undefined && (
                        <button
                            className="log-open-json-btn"
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            onClick={() => onOpenJsonViewer(parsed as any)}
                            title="Open in JSON Viewer"
                        >
                            JSON
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
});

LogEntryItem.displayName = 'LogEntryItem';

export function ConsolePanel({ logService }: ConsolePanelProps) {
    // 状态管理
    const [logs, setLogs] = useState<LogEntry[]>(() => logService.getLogs().slice(-MAX_LOGS));
    const [filter, setFilter] = useState('');
    const [levelFilter, setLevelFilter] = useState<Set<LogLevel>>(new Set([
        LogLevel.Debug,
        LogLevel.Info,
        LogLevel.Warn,
        LogLevel.Error,
        LogLevel.Fatal
    ]));
    const [showRemoteOnly, setShowRemoteOnly] = useState(false);
    const [autoScroll, setAutoScroll] = useState(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [jsonViewerData, setJsonViewerData] = useState<any>(null);
    const logContainerRef = useRef<HTMLDivElement>(null);

    // 订阅日志更新
    useEffect(() => {
        const unsubscribe = logService.subscribe((entry) => {
            setLogs((prev) => {
                const newLogs = [...prev, entry];
                return newLogs.length > MAX_LOGS ? newLogs.slice(-MAX_LOGS) : newLogs;
            });
        });

        return unsubscribe;
    }, [logService]);

    // 自动滚动
    useEffect(() => {
        if (autoScroll && logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [logs, autoScroll]);

    // 处理滚动
    const handleScroll = () => {
        if (logContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = logContainerRef.current;
            const isAtBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 10;
            setAutoScroll(isAtBottom);
        }
    };

    // 清空日志
    const handleClear = () => {
        logService.clear();
        setLogs([]);
    };

    // 切换等级过滤
    const toggleLevelFilter = (level: LogLevel) => {
        const newFilter = new Set(levelFilter);
        if (newFilter.has(level)) {
            newFilter.delete(level);
        } else {
            newFilter.add(level);
        }
        setLevelFilter(newFilter);
    };

    // 过滤日志
    const filteredLogs = useMemo(() => {
        return logs.filter((log) => {
            if (!levelFilter.has(log.level)) return false;
            if (showRemoteOnly && log.source !== 'remote') return false;
            if (filter && !log.message.toLowerCase().includes(filter.toLowerCase())) {
                return false;
            }
            return true;
        });
    }, [logs, levelFilter, showRemoteOnly, filter]);

    // 统计各等级日志数量
    const levelCounts = useMemo(() => ({
        [LogLevel.Debug]: logs.filter((l) => l.level === LogLevel.Debug).length,
        [LogLevel.Info]: logs.filter((l) => l.level === LogLevel.Info).length,
        [LogLevel.Warn]: logs.filter((l) => l.level === LogLevel.Warn).length,
        [LogLevel.Error]: logs.filter((l) => l.level === LogLevel.Error || l.level === LogLevel.Fatal).length
    }), [logs]);

    const remoteLogCount = useMemo(() =>
        logs.filter((l) => l.source === 'remote').length
    , [logs]);

    return (
        <div className="console-panel">
            <div className="console-toolbar">
                <div className="console-toolbar-left">
                    <button
                        className="console-btn"
                        onClick={handleClear}
                        title="Clear console"
                    >
                        <Trash2 size={14} />
                    </button>
                    <div className="console-search">
                        <Search size={14} />
                        <input
                            type="text"
                            placeholder="Filter logs..."
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                        />
                    </div>
                </div>
                <div className="console-toolbar-right">
                    <button
                        className={`console-filter-btn ${showRemoteOnly ? 'active' : ''}`}
                        onClick={() => setShowRemoteOnly(!showRemoteOnly)}
                        title="Show Remote Logs Only"
                    >
                        <Wifi size={14} />
                        {remoteLogCount > 0 && <span>{remoteLogCount}</span>}
                    </button>
                    <button
                        className={`console-filter-btn ${levelFilter.has(LogLevel.Debug) ? 'active' : ''}`}
                        onClick={() => toggleLevelFilter(LogLevel.Debug)}
                        title="Debug"
                    >
                        <Bug size={14} />
                        {levelCounts[LogLevel.Debug] > 0 && <span>{levelCounts[LogLevel.Debug]}</span>}
                    </button>
                    <button
                        className={`console-filter-btn ${levelFilter.has(LogLevel.Info) ? 'active' : ''}`}
                        onClick={() => toggleLevelFilter(LogLevel.Info)}
                        title="Info"
                    >
                        <Info size={14} />
                        {levelCounts[LogLevel.Info] > 0 && <span>{levelCounts[LogLevel.Info]}</span>}
                    </button>
                    <button
                        className={`console-filter-btn ${levelFilter.has(LogLevel.Warn) ? 'active' : ''}`}
                        onClick={() => toggleLevelFilter(LogLevel.Warn)}
                        title="Warnings"
                    >
                        <AlertTriangle size={14} />
                        {levelCounts[LogLevel.Warn] > 0 && <span>{levelCounts[LogLevel.Warn]}</span>}
                    </button>
                    <button
                        className={`console-filter-btn ${levelFilter.has(LogLevel.Error) ? 'active' : ''}`}
                        onClick={() => toggleLevelFilter(LogLevel.Error)}
                        title="Errors"
                    >
                        <XCircle size={14} />
                        {levelCounts[LogLevel.Error] > 0 && <span>{levelCounts[LogLevel.Error]}</span>}
                    </button>
                </div>
            </div>
            <div
                className="console-content"
                ref={logContainerRef}
                onScroll={handleScroll}
            >
                {filteredLogs.length === 0 ? (
                    <div className="console-empty">
                        <AlertCircle size={32} />
                        <p>No logs to display</p>
                    </div>
                ) : (
                    filteredLogs.map((log, index) => (
                        <LogEntryItem
                            key={`${log.id}-${index}`}
                            log={log}
                            onOpenJsonViewer={setJsonViewerData}
                        />
                    ))
                )}
            </div>
            {jsonViewerData && (
                <JsonViewer
                    data={jsonViewerData}
                    onClose={() => setJsonViewerData(null)}
                />
            )}
            {!autoScroll && (
                <button
                    className="console-scroll-to-bottom"
                    onClick={() => {
                        if (logContainerRef.current) {
                            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
                            setAutoScroll(true);
                        }
                    }}
                >
                    ↓ Scroll to bottom
                </button>
            )}
        </div>
    );
}
