import { useState, useCallback, useRef, useEffect } from 'react';
import { FolderOpen, FileText, Terminal, ChevronDown, ChevronUp, Activity, Wifi, Save, GitBranch, X, LayoutGrid } from 'lucide-react';
import type { MessageHub, LogService } from '@esengine/editor-core';
import { ContentBrowser } from './ContentBrowser';
import { OutputLogPanel } from './OutputLogPanel';
import { useLocale } from '../hooks/useLocale';
import '../styles/StatusBar.css';

interface StatusBarProps {
    pluginCount?: number;
    entityCount?: number;
    messageHub?: MessageHub | null;
    logService?: LogService | null;
    locale?: string;
    projectPath?: string | null;
    onOpenScene?: (scenePath: string) => void;
    /** 停靠内容管理器到布局中的回调 | Callback to dock content browser in layout */
    onDockContentBrowser?: () => void;
    /** 重置布局回调 | Callback to reset layout */
    onResetLayout?: () => void;
}

type ActiveTab = 'output' | 'cmd';

export function StatusBar({
    pluginCount = 0,
    entityCount = 0,
    messageHub,
    logService,
    locale = 'en',
    projectPath,
    onOpenScene,
    onDockContentBrowser,
    onResetLayout
}: StatusBarProps) {
    const { t } = useLocale();
    const [consoleInput, setConsoleInput] = useState('');
    const [activeTab, setActiveTab] = useState<ActiveTab>('output');
    const [contentDrawerOpen, setContentDrawerOpen] = useState(false);
    const [outputLogDrawerOpen, setOutputLogDrawerOpen] = useState(false);
    const [contentDrawerHeight, setContentDrawerHeight] = useState(300);
    const [outputLogDrawerHeight, setOutputLogDrawerHeight] = useState(300);
    const [isResizingContent, setIsResizingContent] = useState(false);
    const [isResizingOutputLog, setIsResizingOutputLog] = useState(false);
    const [revealPath, setRevealPath] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const startY = useRef(0);
    const startHeight = useRef(0);

    // Subscribe to asset:reveal event
    useEffect(() => {
        if (!messageHub) return;

        const unsubscribe = messageHub.subscribe('asset:reveal', (payload: { path: string }) => {
            if (payload.path) {
                // Generate unique key to force re-trigger even with same path
                setRevealPath(`${payload.path}?t=${Date.now()}`);
                setContentDrawerOpen(true);
                setOutputLogDrawerOpen(false);
            }
        });

        return unsubscribe;
    }, [messageHub]);

    // Clear revealPath when drawer closes
    useEffect(() => {
        if (!contentDrawerOpen) {
            setRevealPath(null);
        }
    }, [contentDrawerOpen]);

    const handleSelectPanel = useCallback((panelId: string) => {
        if (messageHub) {
            messageHub.publish('panel:select', { panelId });
        }
    }, [messageHub]);

    const handleContentDrawerClick = useCallback(() => {
        setContentDrawerOpen(!contentDrawerOpen);
        if (!contentDrawerOpen) {
            setOutputLogDrawerOpen(false);
        }
    }, [contentDrawerOpen]);

    const handleOutputLogClick = useCallback(() => {
        setActiveTab('output');
        setOutputLogDrawerOpen(!outputLogDrawerOpen);
        if (!outputLogDrawerOpen) {
            setContentDrawerOpen(false);
        }
    }, [outputLogDrawerOpen]);

    const handleCmdClick = useCallback(() => {
        setActiveTab('cmd');
        handleSelectPanel('console');
        setTimeout(() => {
            inputRef.current?.focus();
        }, 100);
    }, [handleSelectPanel]);

    const handleConsoleSubmit = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && consoleInput.trim()) {
            const command = consoleInput.trim();

            console.info(`> ${command}`);

            try {
                if (command.startsWith('help')) {
                    console.info('Available commands: help, clear, echo <message>');
                } else if (command === 'clear') {
                    logService?.clear();
                } else if (command.startsWith('echo ')) {
                    console.info(command.substring(5));
                } else {
                    console.warn(`Unknown command: ${command}`);
                }
            } catch (error) {
                console.error(`Error executing command: ${error}`);
            }

            setConsoleInput('');
        }
    }, [consoleInput, logService]);

    useEffect(() => {
        if (activeTab === 'cmd') {
            inputRef.current?.focus();
        }
    }, [activeTab]);

    // Handle content drawer resize
    const handleContentResizeStart = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizingContent(true);
        startY.current = e.clientY;
        startHeight.current = contentDrawerHeight;
    }, [contentDrawerHeight]);

    // Handle output log drawer resize
    const handleOutputLogResizeStart = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizingOutputLog(true);
        startY.current = e.clientY;
        startHeight.current = outputLogDrawerHeight;
    }, [outputLogDrawerHeight]);

    useEffect(() => {
        if (!isResizingContent && !isResizingOutputLog) return;

        const handleMouseMove = (e: MouseEvent) => {
            const delta = startY.current - e.clientY;
            const newHeight = Math.max(200, Math.min(startHeight.current + delta, window.innerHeight * 0.7));
            if (isResizingContent) {
                setContentDrawerHeight(newHeight);
            } else if (isResizingOutputLog) {
                setOutputLogDrawerHeight(newHeight);
            }
        };

        const handleMouseUp = () => {
            setIsResizingContent(false);
            setIsResizingOutputLog(false);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizingContent, isResizingOutputLog]);

    // Close drawer on Escape
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (contentDrawerOpen) {
                    setContentDrawerOpen(false);
                }
                if (outputLogDrawerOpen) {
                    setOutputLogDrawerOpen(false);
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [contentDrawerOpen, outputLogDrawerOpen]);

    return (
        <>
            {/* Drawer Backdrop */}
            {(contentDrawerOpen || outputLogDrawerOpen) && (
                <div
                    className="drawer-backdrop"
                    onClick={() => {
                        setContentDrawerOpen(false);
                        setOutputLogDrawerOpen(false);
                    }}
                />
            )}

            {/* Content Drawer Panel */}
            <div
                className={`drawer-panel content-drawer-panel ${contentDrawerOpen ? 'open' : ''}`}
                style={{ height: contentDrawerOpen ? contentDrawerHeight : 0 }}
            >
                <div
                    className="drawer-resize-handle"
                    onMouseDown={handleContentResizeStart}
                />
                <div className="drawer-header">
                    <span className="drawer-title">
                        <FolderOpen size={14} />
                        Content Browser
                    </span>
                    <button
                        className="drawer-close"
                        onClick={() => setContentDrawerOpen(false)}
                    >
                        <X size={14} />
                    </button>
                </div>
                <div className="drawer-body">
                    <ContentBrowser
                        projectPath={projectPath ?? null}
                        locale={locale}
                        onOpenScene={onOpenScene}
                        isDrawer={true}
                        revealPath={revealPath}
                        onDockInLayout={() => {
                            // 关闭抽屉并停靠到布局 | Close drawer and dock to layout
                            setContentDrawerOpen(false);
                            onDockContentBrowser?.();
                        }}
                    />
                </div>
            </div>

            {/* Output Log Drawer Panel */}
            <div
                className={`drawer-panel output-log-drawer-panel ${outputLogDrawerOpen ? 'open' : ''}`}
                style={{ height: outputLogDrawerOpen ? outputLogDrawerHeight : 0 }}
            >
                <div
                    className="drawer-resize-handle"
                    onMouseDown={handleOutputLogResizeStart}
                />
                <div className="drawer-body output-log-body">
                    {logService && (
                        <OutputLogPanel
                            logService={logService}
                            locale={locale}
                            onClose={() => setOutputLogDrawerOpen(false)}
                        />
                    )}
                </div>
            </div>

            {/* Status Bar */}
            <div className="status-bar">
                <div className="status-bar-left">
                    <button
                        className={`status-bar-btn drawer-toggle-btn ${contentDrawerOpen ? 'active' : ''}`}
                        onClick={handleContentDrawerClick}
                    >
                        <FolderOpen size={14} />
                        <span>{t('statusBar.contentDrawer')}</span>
                        {contentDrawerOpen ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
                    </button>

                    <div className="status-bar-divider" />

                    <button
                        className={`status-bar-tab ${outputLogDrawerOpen ? 'active' : ''}`}
                        onClick={handleOutputLogClick}
                    >
                        <FileText size={12} />
                        <span>{t('statusBar.outputLog')}</span>
                    </button>

                    <button
                        className={`status-bar-tab ${activeTab === 'cmd' ? 'active' : ''}`}
                        onClick={handleCmdClick}
                    >
                        <Terminal size={12} />
                        <span>Cmd</span>
                        <ChevronDown size={10} />
                    </button>

                    <div className="status-bar-console-input">
                        <span className="console-prompt">&gt;</span>
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder={t('statusBar.consolePlaceholder')}
                            value={consoleInput}
                            onChange={(e) => setConsoleInput(e.target.value)}
                            onKeyDown={handleConsoleSubmit}
                            onFocus={() => setActiveTab('cmd')}
                        />
                    </div>
                </div>

                <div className="status-bar-right">
                    <button className="status-bar-indicator">
                        <Activity size={12} />
                        <span>{t('statusBar.trace')}</span>
                        <ChevronDown size={10} />
                    </button>

                    <div className="status-bar-divider" />

                    <div className="status-bar-icon-group">
                        <button
                            className="status-bar-icon-btn"
                            title={t('statusBar.resetLayout')}
                            onClick={onResetLayout}
                        >
                            <LayoutGrid size={14} />
                        </button>
                        <button className="status-bar-icon-btn" title={t('statusBar.network')}>
                            <Wifi size={14} />
                        </button>
                        <button className="status-bar-icon-btn" title={t('statusBar.sourceControl')}>
                            <GitBranch size={14} />
                        </button>
                    </div>

                    <div className="status-bar-divider" />

                    <div className="status-bar-info">
                        <Save size={12} />
                        <span>{t('statusBar.allSaved')}</span>
                    </div>

                    <div className="status-bar-info">
                        <span>{t('statusBar.revisionControl')}</span>
                    </div>
                </div>
            </div>
        </>
    );
}
