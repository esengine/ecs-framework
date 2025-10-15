import { useState, useEffect, useRef } from 'react';
import { LogService, LogEntry } from '@esengine/editor-core';
import { LogLevel } from '@esengine/ecs-framework';
import { Trash2, AlertCircle, Info, AlertTriangle, XCircle, Bug, Search, Filter } from 'lucide-react';
import '../styles/ConsolePanel.css';

interface ConsolePanelProps {
    logService: LogService;
}

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
    const [autoScroll, setAutoScroll] = useState(true);
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

    const filteredLogs = logs.filter(log => {
        if (!levelFilter.has(log.level)) return false;
        if (filter && !log.message.toLowerCase().includes(filter.toLowerCase())) {
            return false;
        }
        return true;
    });

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
        return date.toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            fractionalSecondDigits: 3
        });
    };

    const levelCounts = {
        [LogLevel.Debug]: logs.filter(l => l.level === LogLevel.Debug).length,
        [LogLevel.Info]: logs.filter(l => l.level === LogLevel.Info).length,
        [LogLevel.Warn]: logs.filter(l => l.level === LogLevel.Warn).length,
        [LogLevel.Error]: logs.filter(l => l.level === LogLevel.Error || l.level === LogLevel.Fatal).length
    };

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
                        <div key={log.id} className={`log-entry ${getLevelClass(log.level)}`}>
                            <div className="log-entry-icon">
                                {getLevelIcon(log.level)}
                            </div>
                            <div className="log-entry-time">
                                {formatTime(log.timestamp)}
                            </div>
                            <div className="log-entry-source">
                                [{log.source}]
                            </div>
                            <div className="log-entry-message">
                                {log.message}
                            </div>
                        </div>
                    ))
                )}
            </div>
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
