import { useState, useEffect, useRef } from 'react';
import {
    Play,
    Pause,
    Square,
    SkipForward,
    Save,
    FolderOpen,
    Undo2,
    Redo2,
    Eye,
    Globe,
    QrCode,
    ChevronDown
} from 'lucide-react';
import type { MessageHub, CommandManager } from '@esengine/editor-core';
import '../styles/MainToolbar.css';

export type PlayState = 'stopped' | 'playing' | 'paused';

interface MainToolbarProps {
    locale?: string;
    messageHub?: MessageHub;
    commandManager?: CommandManager;
    onSaveScene?: () => void;
    onOpenScene?: () => void;
    onUndo?: () => void;
    onRedo?: () => void;
    onPlay?: () => void;
    onPause?: () => void;
    onStop?: () => void;
    onStep?: () => void;
    onRunInBrowser?: () => void;
    onRunOnDevice?: () => void;
}

interface ToolButtonProps {
    icon: React.ReactNode;
    label: string;
    active?: boolean;
    disabled?: boolean;
    onClick?: () => void;
}

function ToolButton({ icon, label, active, disabled, onClick }: ToolButtonProps) {
    return (
        <button
            className={`toolbar-button ${active ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
            onClick={onClick}
            disabled={disabled}
            title={label}
            type="button"
        >
            {icon}
        </button>
    );
}

function ToolSeparator() {
    return <div className="toolbar-separator" />;
}

export function MainToolbar({
    locale = 'en',
    messageHub,
    commandManager,
    onSaveScene,
    onOpenScene,
    onUndo,
    onRedo,
    onPlay,
    onPause,
    onStop,
    onStep,
    onRunInBrowser,
    onRunOnDevice
}: MainToolbarProps) {
    const [playState, setPlayState] = useState<PlayState>('stopped');
    const [canUndo, setCanUndo] = useState(false);
    const [canRedo, setCanRedo] = useState(false);
    const [showRunMenu, setShowRunMenu] = useState(false);
    const runMenuRef = useRef<HTMLDivElement>(null);

    const t = (key: string) => {
        const translations: Record<string, Record<string, string>> = {
            en: {
                play: 'Play',
                pause: 'Pause',
                stop: 'Stop',
                step: 'Step Forward',
                save: 'Save Scene (Ctrl+S)',
                open: 'Open Scene',
                undo: 'Undo (Ctrl+Z)',
                redo: 'Redo (Ctrl+Y)',
                preview: 'Preview Mode',
                runOptions: 'Run Options',
                runInBrowser: 'Run in Browser',
                runOnDevice: 'Run on Device'
            },
            zh: {
                play: '播放',
                pause: '暂停',
                stop: '停止',
                step: '单步执行',
                save: '保存场景 (Ctrl+S)',
                open: '打开场景',
                undo: '撤销 (Ctrl+Z)',
                redo: '重做 (Ctrl+Y)',
                preview: '预览模式',
                runOptions: '运行选项',
                runInBrowser: '浏览器运行',
                runOnDevice: '真机运行'
            }
        };
        return translations[locale]?.[key] || key;
    };

    // Close run menu when clicking outside
    useEffect(() => {
        if (!showRunMenu) return;

        const handleClickOutside = (e: MouseEvent) => {
            if (runMenuRef.current && !runMenuRef.current.contains(e.target as Node)) {
                setShowRunMenu(false);
            }
        };

        const timer = setTimeout(() => {
            document.addEventListener('click', handleClickOutside);
        }, 10);

        return () => {
            clearTimeout(timer);
            document.removeEventListener('click', handleClickOutside);
        };
    }, [showRunMenu]);

    useEffect(() => {
        if (commandManager) {
            const updateUndoRedo = () => {
                setCanUndo(commandManager.canUndo());
                setCanRedo(commandManager.canRedo());
            };
            updateUndoRedo();

            if (messageHub) {
                const unsubscribe = messageHub.subscribe('command:executed', updateUndoRedo);
                return () => unsubscribe();
            }
        }
    }, [commandManager, messageHub]);

    useEffect(() => {
        if (messageHub) {
            const unsubscribePlay = messageHub.subscribe('preview:started', () => {
                setPlayState('playing');
            });
            const unsubscribePause = messageHub.subscribe('preview:paused', () => {
                setPlayState('paused');
            });
            const unsubscribeStop = messageHub.subscribe('preview:stopped', () => {
                setPlayState('stopped');
            });

            return () => {
                unsubscribePlay();
                unsubscribePause();
                unsubscribeStop();
            };
        }
    }, [messageHub]);

    const handlePlay = () => {
        if (playState === 'stopped' || playState === 'paused') {
            onPlay?.();
            messageHub?.publish('preview:start', {});
        }
    };

    const handlePause = () => {
        if (playState === 'playing') {
            onPause?.();
            messageHub?.publish('preview:pause', {});
        }
    };

    const handleStop = () => {
        if (playState !== 'stopped') {
            onStop?.();
            messageHub?.publish('preview:stop', {});
        }
    };

    const handleStep = () => {
        onStep?.();
        messageHub?.publish('preview:step', {});
    };

    const handleUndo = () => {
        if (commandManager?.canUndo()) {
            commandManager.undo();
            onUndo?.();
        }
    };

    const handleRedo = () => {
        if (commandManager?.canRedo()) {
            commandManager.redo();
            onRedo?.();
        }
    };

    const handleRunInBrowser = () => {
        setShowRunMenu(false);
        onRunInBrowser?.();
        messageHub?.publish('viewport:run-in-browser', {});
    };

    const handleRunOnDevice = () => {
        setShowRunMenu(false);
        onRunOnDevice?.();
        messageHub?.publish('viewport:run-on-device', {});
    };

    return (
        <div className="main-toolbar">
            {/* File Operations */}
            <div className="toolbar-group">
                <ToolButton
                    icon={<Save size={16} />}
                    label={t('save')}
                    onClick={onSaveScene}
                />
                <ToolButton
                    icon={<FolderOpen size={16} />}
                    label={t('open')}
                    onClick={onOpenScene}
                />
            </div>

            <ToolSeparator />

            {/* Undo/Redo */}
            <div className="toolbar-group">
                <ToolButton
                    icon={<Undo2 size={16} />}
                    label={t('undo')}
                    disabled={!canUndo}
                    onClick={handleUndo}
                />
                <ToolButton
                    icon={<Redo2 size={16} />}
                    label={t('redo')}
                    disabled={!canRedo}
                    onClick={handleRedo}
                />
            </div>

            {/* Play Controls - Absolutely Centered */}
            <div className="toolbar-center-wrapper">
                <div className="toolbar-group toolbar-center">
                    <ToolButton
                        icon={playState === 'playing' ? <Pause size={18} /> : <Play size={18} />}
                        label={playState === 'playing' ? t('pause') : t('play')}
                        onClick={playState === 'playing' ? handlePause : handlePlay}
                    />
                    <ToolButton
                        icon={<Square size={16} />}
                        label={t('stop')}
                        disabled={playState === 'stopped'}
                        onClick={handleStop}
                    />
                    <ToolButton
                        icon={<SkipForward size={16} />}
                        label={t('step')}
                        disabled={playState === 'playing'}
                        onClick={handleStep}
                    />

                    <ToolSeparator />

                    {/* Run Options Dropdown */}
                    <div className="toolbar-dropdown" ref={runMenuRef}>
                        <button
                            className="toolbar-button toolbar-dropdown-trigger"
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowRunMenu(prev => !prev);
                            }}
                            title={t('runOptions')}
                            type="button"
                        >
                            <Globe size={16} />
                            <ChevronDown size={12} />
                        </button>
                        {showRunMenu && (
                            <div className="toolbar-dropdown-menu">
                                <button type="button" onClick={handleRunInBrowser}>
                                    <Globe size={14} />
                                    <span>{t('runInBrowser')}</span>
                                </button>
                                <button type="button" onClick={handleRunOnDevice}>
                                    <QrCode size={14} />
                                    <span>{t('runOnDevice')}</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Preview Mode Indicator - Right aligned */}
            <div className="toolbar-right">
                {playState !== 'stopped' && (
                    <div className="preview-indicator">
                        <Eye size={14} />
                        <span>{t('preview')}</span>
                    </div>
                )}
            </div>
        </div>
    );
}
