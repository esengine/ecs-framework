import { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import { LogService, LogEntry } from '@esengine/editor-core';
import { LogLevel } from '@esengine/ecs-framework';
import {
    Search, Filter, Settings, X, Trash2, ChevronDown,
    Bug, Info, AlertTriangle, XCircle, AlertCircle, Wifi, Pause, Play
} from 'lucide-react';
import { JsonViewer } from './JsonViewer';
import '../styles/OutputLogPanel.css';

interface OutputLogPanelProps {
    logService: LogService;
    locale?: string;
    onClose?: () => void;
}

const MAX_LOGS = 1000;

function tryParseJSON(message: string): { isJSON: boolean; parsed?: unknown } {
    try {
        const parsed: unknown = JSON.parse(message);
        return { isJSON: true, parsed };
    } catch {
        return { isJSON: false };
    }
}

function formatTime(date: Date): string {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    const ms = date.getMilliseconds().toString().padStart(3, '0');
    return `${hours}:${minutes}:${seconds}.${ms}`;
}

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

const LogEntryItem = memo(({ log, onOpenJsonViewer }: {
    log: LogEntry;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onOpenJsonViewer: (data: any) => void;
}) => {
    const { isJSON, parsed } = useMemo(() => tryParseJSON(log.message), [log.message]);
    const shouldTruncate = log.message.length > 200;
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className={`output-log-entry ${getLevelClass(log.level)} ${log.source === 'remote' ? 'log-entry-remote' : ''}`}>
            <div className="output-log-entry-icon">
                {getLevelIcon(log.level)}
            </div>
            <div className="output-log-entry-time">
                {formatTime(log.timestamp)}
            </div>
            <div className={`output-log-entry-source ${log.source === 'remote' ? 'source-remote' : ''}`}>
                [{log.source === 'remote' ? '🌐 Remote' : log.source}]
            </div>
            {log.clientId && (
                <div className="output-log-entry-client" title={`Client: ${log.clientId}`}>
                    {log.clientId}
                </div>
            )}
            <div className="output-log-entry-message">
                <div className="output-log-message-container">
                    <div className="output-log-message-text">
                        {shouldTruncate && !isExpanded ? (
                            <>
                                <span className="output-log-message-preview">
                                    {log.message.substring(0, 200)}...
                                </span>
                                <button
                                    className="output-log-expand-btn"
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
                                        className="output-log-expand-btn"
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
                            className="output-log-json-btn"
                            onClick={() => onOpenJsonViewer(parsed)}
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

export function OutputLogPanel({ logService, locale = 'en', onClose }: OutputLogPanelProps) {
    const [logs, setLogs] = useState<LogEntry[]>(() => logService.getLogs().slice(-MAX_LOGS));
    const [searchQuery, setSearchQuery] = useState('');
    const [levelFilter, setLevelFilter] = useState<Set<LogLevel>>(new Set([
        LogLevel.Debug,
        LogLevel.Info,
        LogLevel.Warn,
        LogLevel.Error,
        LogLevel.Fatal
    ]));
    const [showRemoteOnly, setShowRemoteOnly] = useState(false);
    const [autoScroll, setAutoScroll] = useState(true);
    const [showFilterMenu, setShowFilterMenu] = useState(false);
    const [showSettingsMenu, setShowSettingsMenu] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [jsonViewerData, setJsonViewerData] = useState<any>(null);
    const [showTimestamp, setShowTimestamp] = useState(true);
    const [showSource, setShowSource] = useState(true);
    const logContainerRef = useRef<HTMLDivElement>(null);
    const filterMenuRef = useRef<HTMLDivElement>(null);
    const settingsMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const unsubscribe = logService.subscribe((entry) => {
            setLogs((prev) => {
                const newLogs = [...prev, entry];
                return newLogs.length > MAX_LOGS ? newLogs.slice(-MAX_LOGS) : newLogs;
            });
        });
        return unsubscribe;
    }, [logService]);

    useEffect(() => {
        if (autoScroll && logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [logs, autoScroll]);

    // Close menus on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (filterMenuRef.current && !filterMenuRef.current.contains(e.target as Node)) {
                setShowFilterMenu(false);
            }
            if (settingsMenuRef.current && !settingsMenuRef.current.contains(e.target as Node)) {
                setShowSettingsMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleScroll = useCallback(() => {
        if (logContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = logContainerRef.current;
            const isAtBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 10;
            setAutoScroll(isAtBottom);
        }
    }, []);

    const handleClear = useCallback(() => {
        logService.clear();
        setLogs([]);
    }, [logService]);

    const toggleLevelFilter = useCallback((level: LogLevel) => {
        setLevelFilter((prev) => {
            const newFilter = new Set(prev);
            if (newFilter.has(level)) {
                newFilter.delete(level);
            } else {
                newFilter.add(level);
            }
            return newFilter;
        });
    }, []);

    const filteredLogs = useMemo(() => {
        return logs.filter((log) => {
            if (!levelFilter.has(log.level)) return false;
            if (showRemoteOnly && log.source !== 'remote') return false;
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                if (!log.message.toLowerCase().includes(query) &&
                    !log.source.toLowerCase().includes(query)) {
                    return false;
                }
            }
            return true;
        });
    }, [logs, levelFilter, showRemoteOnly, searchQuery]);

    const levelCounts = useMemo(() => ({
        [LogLevel.Debug]: logs.filter((l) => l.level === LogLevel.Debug).length,
        [LogLevel.Info]: logs.filter((l) => l.level === LogLevel.Info).length,
        [LogLevel.Warn]: logs.filter((l) => l.level === LogLevel.Warn).length,
        [LogLevel.Error]: logs.filter((l) => l.level === LogLevel.Error || l.level === LogLevel.Fatal).length
    }), [logs]);

    const remoteLogCount = useMemo(() =>
        logs.filter((l) => l.source === 'remote').length
    , [logs]);

    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (!levelFilter.has(LogLevel.Debug)) count++;
        if (!levelFilter.has(LogLevel.Info)) count++;
        if (!levelFilter.has(LogLevel.Warn)) count++;
        if (!levelFilter.has(LogLevel.Error)) count++;
        if (showRemoteOnly) count++;
        return count;
    }, [levelFilter, showRemoteOnly]);

    return (
        <div className="output-log-panel">
            {/* Toolbar */}
            <div className="output-log-toolbar">
                <div className="output-log-toolbar-left">
                    <div className="output-log-search">
                        <Search size={14} />
                        <input
                            type="text"
                            placeholder={locale === 'zh' ? '搜索日志...' : 'Search logs...'}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button
                                className="output-log-search-clear"
                                onClick={() => setSearchQuery('')}
                            >
                                <X size={12} />
                            </button>
                        )}
                    </div>
                </div>

                <div className="output-log-toolbar-right">
                    {/* Filter Dropdown */}
                    <div className="output-log-dropdown" ref={filterMenuRef}>
                        <button
                            className={`output-log-btn ${showFilterMenu ? 'active' : ''} ${activeFilterCount > 0 ? 'has-filter' : ''}`}
                            onClick={() => {
                                setShowFilterMenu(!showFilterMenu);
                                setShowSettingsMenu(false);
                            }}
                        >
                            <Filter size={14} />
                            <span>{locale === 'zh' ? '过滤器' : 'Filters'}</span>
                            {activeFilterCount > 0 && (
                                <span className="filter-badge">{activeFilterCount}</span>
                            )}
                            <ChevronDown size={12} />
                        </button>
                        {showFilterMenu && (
                            <div className="output-log-menu">
                                <div className="output-log-menu-header">
                                    {locale === 'zh' ? '日志级别' : 'Log Levels'}
                                </div>
                                <label className="output-log-menu-item">
                                    <input
                                        type="checkbox"
                                        checked={levelFilter.has(LogLevel.Debug)}
                                        onChange={() => toggleLevelFilter(LogLevel.Debug)}
                                    />
                                    <Bug size={14} className="level-icon debug" />
                                    <span>Debug</span>
                                    <span className="level-count">{levelCounts[LogLevel.Debug]}</span>
                                </label>
                                <label className="output-log-menu-item">
                                    <input
                                        type="checkbox"
                                        checked={levelFilter.has(LogLevel.Info)}
                                        onChange={() => toggleLevelFilter(LogLevel.Info)}
                                    />
                                    <Info size={14} className="level-icon info" />
                                    <span>Info</span>
                                    <span className="level-count">{levelCounts[LogLevel.Info]}</span>
                                </label>
                                <label className="output-log-menu-item">
                                    <input
                                        type="checkbox"
                                        checked={levelFilter.has(LogLevel.Warn)}
                                        onChange={() => toggleLevelFilter(LogLevel.Warn)}
                                    />
                                    <AlertTriangle size={14} className="level-icon warn" />
                                    <span>Warning</span>
                                    <span className="level-count">{levelCounts[LogLevel.Warn]}</span>
                                </label>
                                <label className="output-log-menu-item">
                                    <input
                                        type="checkbox"
                                        checked={levelFilter.has(LogLevel.Error)}
                                        onChange={() => toggleLevelFilter(LogLevel.Error)}
                                    />
                                    <XCircle size={14} className="level-icon error" />
                                    <span>Error</span>
                                    <span className="level-count">{levelCounts[LogLevel.Error]}</span>
                                </label>
                                <div className="output-log-menu-divider" />
                                <label className="output-log-menu-item">
                                    <input
                                        type="checkbox"
                                        checked={showRemoteOnly}
                                        onChange={() => setShowRemoteOnly(!showRemoteOnly)}
                                    />
                                    <Wifi size={14} className="level-icon remote" />
                                    <span>{locale === 'zh' ? '仅远程日志' : 'Remote Only'}</span>
                                    <span className="level-count">{remoteLogCount}</span>
                                </label>
                            </div>
                        )}
                    </div>

                    {/* Auto Scroll Toggle */}
                    <button
                        className={`output-log-icon-btn ${autoScroll ? 'active' : ''}`}
                        onClick={() => setAutoScroll(!autoScroll)}
                        title={autoScroll
                            ? (locale === 'zh' ? '暂停自动滚动' : 'Pause auto-scroll')
                            : (locale === 'zh' ? '恢复自动滚动' : 'Resume auto-scroll')
                        }
                    >
                        {autoScroll ? <Pause size={14} /> : <Play size={14} />}
                    </button>

                    {/* Settings Dropdown */}
                    <div className="output-log-dropdown" ref={settingsMenuRef}>
                        <button
                            className={`output-log-icon-btn ${showSettingsMenu ? 'active' : ''}`}
                            onClick={() => {
                                setShowSettingsMenu(!showSettingsMenu);
                                setShowFilterMenu(false);
                            }}
                            title={locale === 'zh' ? '设置' : 'Settings'}
                        >
                            <Settings size={14} />
                        </button>
                        {showSettingsMenu && (
                            <div className="output-log-menu settings-menu">
                                <div className="output-log-menu-header">
                                    {locale === 'zh' ? '显示选项' : 'Display Options'}
                                </div>
                                <label className="output-log-menu-item">
                                    <input
                                        type="checkbox"
                                        checked={showTimestamp}
                                        onChange={() => setShowTimestamp(!showTimestamp)}
                                    />
                                    <span>{locale === 'zh' ? '显示时间戳' : 'Show Timestamp'}</span>
                                </label>
                                <label className="output-log-menu-item">
                                    <input
                                        type="checkbox"
                                        checked={showSource}
                                        onChange={() => setShowSource(!showSource)}
                                    />
                                    <span>{locale === 'zh' ? '显示来源' : 'Show Source'}</span>
                                </label>
                                <div className="output-log-menu-divider" />
                                <button
                                    className="output-log-menu-action"
                                    onClick={handleClear}
                                >
                                    <Trash2 size={14} />
                                    <span>{locale === 'zh' ? '清空日志' : 'Clear Logs'}</span>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Close Button */}
                    {onClose && (
                        <button
                            className="output-log-close-btn"
                            onClick={onClose}
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>
            </div>

            {/* Log Content */}
            <div
                className={`output-log-content ${!showTimestamp ? 'hide-timestamp' : ''} ${!showSource ? 'hide-source' : ''}`}
                ref={logContainerRef}
                onScroll={handleScroll}
            >
                {filteredLogs.length === 0 ? (
                    <div className="output-log-empty">
                        <AlertCircle size={32} />
                        <p>{searchQuery
                            ? (locale === 'zh' ? '没有匹配的日志' : 'No matching logs')
                            : (locale === 'zh' ? '暂无日志' : 'No logs to display')
                        }</p>
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

            {/* Status Bar */}
            <div className="output-log-status">
                <span>{filteredLogs.length} / {logs.length} {locale === 'zh' ? '条日志' : 'logs'}</span>
                {!autoScroll && (
                    <button
                        className="output-log-scroll-btn"
                        onClick={() => {
                            if (logContainerRef.current) {
                                logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
                                setAutoScroll(true);
                            }
                        }}
                    >
                        ↓ {locale === 'zh' ? '滚动到底部' : 'Scroll to bottom'}
                    </button>
                )}
            </div>

            {/* JSON Viewer Modal */}
            {jsonViewerData && (
                <JsonViewer
                    data={jsonViewerData}
                    onClose={() => setJsonViewerData(null)}
                />
            )}
        </div>
    );
}
