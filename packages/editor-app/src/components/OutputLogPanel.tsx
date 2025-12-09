import { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import { LogService, LogEntry } from '@esengine/editor-core';
import { LogLevel } from '@esengine/ecs-framework';
import {
    Search, Filter, Settings, X, Trash2, ChevronDown,
    Bug, Info, AlertTriangle, XCircle, AlertCircle, Wifi, Pause, Play, Copy
} from 'lucide-react';
import { useLocale } from '../hooks/useLocale';
import '../styles/OutputLogPanel.css';

interface OutputLogPanelProps {
    logService: LogService;
    locale?: string;
    onClose?: () => void;
}

const MAX_LOGS = 1000;

function formatTime(date: Date): string {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    const ms = date.getMilliseconds().toString().padStart(3, '0');
    return `${hours}:${minutes}:${seconds}.${ms}`;
}

function getLevelIcon(level: LogLevel, size: number = 14) {
    switch (level) {
        case LogLevel.Debug:
            return <Bug size={size} />;
        case LogLevel.Info:
            return <Info size={size} />;
        case LogLevel.Warn:
            return <AlertTriangle size={size} />;
        case LogLevel.Error:
        case LogLevel.Fatal:
            return <XCircle size={size} />;
        default:
            return <AlertCircle size={size} />;
    }
}

function getLevelClass(level: LogLevel): string {
    switch (level) {
        case LogLevel.Debug:
            return 'output-log-entry-debug';
        case LogLevel.Info:
            return 'output-log-entry-info';
        case LogLevel.Warn:
            return 'output-log-entry-warn';
        case LogLevel.Error:
        case LogLevel.Fatal:
            return 'output-log-entry-error';
        default:
            return '';
    }
}

/**
 * 尝试从消息中提取堆栈信息
 */
function extractStackTrace(message: string): { message: string; stack: string | null } {
    const stackPattern = /\n\s*at\s+/;
    if (stackPattern.test(message)) {
        const lines = message.split('\n');
        const messageLines: string[] = [];
        const stackLines: string[] = [];
        let inStack = false;

        for (const line of lines) {
            if (line.trim().startsWith('at ') || inStack) {
                inStack = true;
                stackLines.push(line);
            } else {
                messageLines.push(line);
            }
        }

        return {
            message: messageLines.join('\n').trim(),
            stack: stackLines.length > 0 ? stackLines.join('\n') : null
        };
    }

    return { message, stack: null };
}

const LogEntryItem = memo(({ log, isExpanded, onToggle, onCopy }: {
    log: LogEntry;
    isExpanded: boolean;
    onToggle: () => void;
    onCopy: () => void;
}) => {
    // 优先使用 log.stack，否则尝试从 message 中提取
    const { message, stack } = useMemo(() => {
        if (log.stack) {
            return { message: log.message, stack: log.stack };
        }
        return extractStackTrace(log.message);
    }, [log.message, log.stack]);

    const hasStack = !!stack;

    return (
        <div
            className={`output-log-entry ${getLevelClass(log.level)} ${isExpanded ? 'expanded' : ''} ${log.source === 'remote' ? 'log-entry-remote' : ''} ${hasStack ? 'has-stack' : ''}`}
        >
            <div className="output-log-entry-main" onClick={hasStack ? onToggle : undefined} style={{ cursor: hasStack ? 'pointer' : 'default' }}>
                <div className="output-log-entry-icon">
                    {getLevelIcon(log.level)}
                </div>
                <div className="output-log-entry-time">
                    {formatTime(log.timestamp)}
                </div>
                <div className={`output-log-entry-source ${log.source === 'remote' ? 'source-remote' : ''}`}>
                    [{log.source === 'remote' ? 'Remote' : log.source}]
                </div>
                <div className="output-log-entry-message">
                    {message}
                </div>
                <button
                    className="output-log-entry-copy"
                    onClick={(e) => {
                        e.stopPropagation();
                        onCopy();
                    }}
                    title="复制"
                >
                    <Copy size={12} />
                </button>
            </div>
            {isExpanded && stack && (
                <div className="output-log-entry-stack">
                    <div className="output-log-stack-header">调用堆栈:</div>
                    {stack.split('\n').filter(line => line.trim()).map((line, index) => (
                        <div key={index} className="output-log-stack-line">
                            {line}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
});

LogEntryItem.displayName = 'LogEntryItem';

export function OutputLogPanel({ logService, locale = 'en', onClose }: OutputLogPanelProps) {
    const { t } = useLocale();
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
    const [expandedLogIds, setExpandedLogIds] = useState<Set<string>>(new Set());
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
        setExpandedLogIds(new Set());
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

    const toggleLogExpanded = useCallback((logId: string) => {
        setExpandedLogIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(logId)) {
                newSet.delete(logId);
            } else {
                newSet.add(logId);
            }
            return newSet;
        });
    }, []);

    const handleCopyLog = useCallback((log: LogEntry) => {
        navigator.clipboard.writeText(log.message);
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
                            placeholder={t('outputLog.searchPlaceholder')}
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
                            <span>{t('outputLog.filters')}</span>
                            {activeFilterCount > 0 && (
                                <span className="filter-badge">{activeFilterCount}</span>
                            )}
                            <ChevronDown size={12} />
                        </button>
                        {showFilterMenu && (
                            <div className="output-log-menu">
                                <div className="output-log-menu-header">
                                    {t('outputLog.logLevels')}
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
                                    <span>{t('outputLog.remoteOnly')}</span>
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
                            ? t('outputLog.pauseAutoScroll')
                            : t('outputLog.resumeAutoScroll')
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
                            title={t('outputLog.settings')}
                        >
                            <Settings size={14} />
                        </button>
                        {showSettingsMenu && (
                            <div className="output-log-menu settings-menu">
                                <button
                                    className="output-log-menu-action"
                                    onClick={handleClear}
                                >
                                    <Trash2 size={14} />
                                    <span>{t('outputLog.clearLogs')}</span>
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
                className="output-log-content"
                ref={logContainerRef}
                onScroll={handleScroll}
            >
                {filteredLogs.length === 0 ? (
                    <div className="output-log-empty">
                        <AlertCircle size={32} />
                        <p>{searchQuery
                            ? t('outputLog.noMatchingLogs')
                            : t('outputLog.noLogs')
                        }</p>
                    </div>
                ) : (
                    filteredLogs.map((log, index) => (
                        <LogEntryItem
                            key={`${log.id}-${index}`}
                            log={log}
                            isExpanded={expandedLogIds.has(String(log.id))}
                            onToggle={() => toggleLogExpanded(String(log.id))}
                            onCopy={() => handleCopyLog(log)}
                        />
                    ))
                )}
            </div>

            {/* Status Bar */}
            <div className="output-log-status">
                <span>{filteredLogs.length} / {logs.length} {t('outputLog.logs')}</span>
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
                        ↓ {t('outputLog.scrollToBottom')}
                    </button>
                )}
            </div>
        </div>
    );
}
