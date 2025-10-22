import { useState, useEffect, useRef, useMemo, memo } from 'react';
import { LogService, LogEntry } from '@esengine/editor-core';
import { LogLevel } from '@esengine/ecs-framework';
import { Trash2, AlertCircle, Info, AlertTriangle, XCircle, Bug, Search, Maximize2, ChevronRight, ChevronDown, Wifi } from 'lucide-react';
import { JsonViewer } from './JsonViewer';
import '../styles/ConsolePanel.css';

interface ConsolePanelProps {
    logService: LogService;
}

interface ParsedLogData {
    isJSON: boolean;
    jsonStr?: string;
    extracted?: { prefix: string; json: string; suffix: string } | null;
}

const LogEntryItem = memo(({
    log,
    isExpanded,
    onToggleExpand,
    onOpenJsonViewer,
    parsedData
}: {
    log: LogEntry;
    isExpanded: boolean;
    onToggleExpand: (id: number) => void;
    onOpenJsonViewer: (jsonStr: string) => void;
    parsedData: ParsedLogData;
}) => {
    const getLevelIcon = (level: LogLevel) => {
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
    };

    const getLevelClass = (level: LogLevel): string => {
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
    };

    const formatTime = (date: Date): string => {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');
        const ms = date.getMilliseconds().toString().padStart(3, '0');
        return `${hours}:${minutes}:${seconds}.${ms}`;
    };

    const formatMessage = (message: string, isExpanded: boolean, parsedData: ParsedLogData): JSX.Element => {
        const MAX_PREVIEW_LENGTH = 200;
        const { isJSON, jsonStr, extracted } = parsedData;
        const shouldTruncate = message.length > MAX_PREVIEW_LENGTH && !isExpanded;

        return (
            <div className="log-message-container">
                <div className="log-message-text">
                    {shouldTruncate ? (
                        <>
                            {extracted && extracted.prefix && <span>{extracted.prefix} </span>}
                            <span className="log-message-preview">
                                {message.substring(0, MAX_PREVIEW_LENGTH)}...
                            </span>
                        </>
                    ) : (
                        <span>{message}</span>
                    )}
                </div>
                {isJSON && jsonStr && (
                    <button
                        className="log-open-json-btn"
                        onClick={(e) => {
                            e.stopPropagation();
                            onOpenJsonViewer(jsonStr);
                        }}
                        title="Open in JSON Viewer"
                    >
                        <Maximize2 size={12} />
                    </button>
                )}
            </div>
        );
    };

    const shouldShowExpander = log.message.length > 200;

    return (
        <div
            className={`log-entry ${getLevelClass(log.level)} ${log.source === 'remote' ? 'log-entry-remote' : ''} ${isExpanded ? 'log-entry-expanded' : ''}`}
        >
            {shouldShowExpander && (
                <div
                    className="log-entry-expander"
                    onClick={() => onToggleExpand(log.id)}
                >
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </div>
            )}
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
                {formatMessage(log.message, isExpanded, parsedData)}
            </div>
        </div>
    );
});

LogEntryItem.displayName = 'LogEntryItem';

export function ConsolePanel({ logService }: ConsolePanelProps) {
    const [logs, setLogs] = useState<LogEntry[]>([]);
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
    const [expandedLogs, setExpandedLogs] = useState<Set<number>>(new Set());
    const [jsonViewerData, setJsonViewerData] = useState<any>(null);
    const logContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setLogs(logService.getLogs());

        const unsubscribe = logService.subscribe((entry) => {
            setLogs(prev => [...prev, entry]);
        });

        return unsubscribe;
    }, [logService]);

    useEffect(() => {
        if (autoScroll && logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [logs, autoScroll]);

    const handleClear = () => {
        logService.clear();
        setLogs([]);
    };

    const handleScroll = () => {
        if (logContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = logContainerRef.current;
            const isAtBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 10;
            setAutoScroll(isAtBottom);
        }
    };

    const toggleLevelFilter = (level: LogLevel) => {
        const newFilter = new Set(levelFilter);
        if (newFilter.has(level)) {
            newFilter.delete(level);
        } else {
            newFilter.add(level);
        }
        setLevelFilter(newFilter);
    };

    const extractJSON = useMemo(() => {
        return (message: string): { prefix: string; json: string; suffix: string } | null => {
            const jsonStartChars = ['{', '['];
            let startIndex = -1;

            for (const char of jsonStartChars) {
                const index = message.indexOf(char);
                if (index !== -1 && (startIndex === -1 || index < startIndex)) {
                    startIndex = index;
                }
            }

            if (startIndex === -1) return null;

            for (let endIndex = message.length; endIndex > startIndex; endIndex--) {
                const possibleJson = message.substring(startIndex, endIndex);
                try {
                    JSON.parse(possibleJson);
                    return {
                        prefix: message.substring(0, startIndex).trim(),
                        json: possibleJson,
                        suffix: message.substring(endIndex).trim()
                    };
                } catch {
                    continue;
                }
            }

            return null;
        };
    }, []);

    const parsedLogsCache = useMemo(() => {
        const cache = new Map<number, ParsedLogData>();

        for (const log of logs) {
            try {
                const parsed = JSON.parse(log.message);
                cache.set(log.id, {
                    isJSON: true,
                    jsonStr: log.message,
                    extracted: null
                });
            } catch {
                const extracted = extractJSON(log.message);
                if (extracted) {
                    try {
                        JSON.parse(extracted.json);
                        cache.set(log.id, {
                            isJSON: true,
                            jsonStr: extracted.json,
                            extracted
                        });
                    } catch {
                        cache.set(log.id, {
                            isJSON: false,
                            extracted
                        });
                    }
                } else {
                    cache.set(log.id, {
                        isJSON: false,
                        extracted: null
                    });
                }
            }
        }

        return cache;
    }, [logs, extractJSON]);

    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
            if (!levelFilter.has(log.level)) return false;
            if (showRemoteOnly && log.source !== 'remote') return false;
            if (filter && !log.message.toLowerCase().includes(filter.toLowerCase())) {
                return false;
            }
            return true;
        });
    }, [logs, levelFilter, showRemoteOnly, filter]);

    const toggleLogExpand = (logId: number) => {
        const newExpanded = new Set(expandedLogs);
        if (newExpanded.has(logId)) {
            newExpanded.delete(logId);
        } else {
            newExpanded.add(logId);
        }
        setExpandedLogs(newExpanded);
    };

    const openJsonViewer = (jsonStr: string) => {
        try {
            const parsed = JSON.parse(jsonStr);
            setJsonViewerData(parsed);
        } catch {
            console.error('Failed to parse JSON:', jsonStr);
        }
    };

    const levelCounts = {
        [LogLevel.Debug]: logs.filter(l => l.level === LogLevel.Debug).length,
        [LogLevel.Info]: logs.filter(l => l.level === LogLevel.Info).length,
        [LogLevel.Warn]: logs.filter(l => l.level === LogLevel.Warn).length,
        [LogLevel.Error]: logs.filter(l => l.level === LogLevel.Error || l.level === LogLevel.Fatal).length
    };

    const remoteLogCount = logs.filter(l => l.source === 'remote').length;

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
                    filteredLogs.map(log => (
                        <LogEntryItem
                            key={log.id}
                            log={log}
                            isExpanded={expandedLogs.has(log.id)}
                            onToggleExpand={toggleLogExpand}
                            onOpenJsonViewer={openJsonViewer}
                            parsedData={parsedLogsCache.get(log.id) || { isJSON: false }}
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
