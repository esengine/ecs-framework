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
import { useLocale } from '../hooks/useLocale';
import '../styles/MainToolbar.css';

export type PlayState = 'stopped' | 'playing' | 'paused';

interface MainToolbarProps {
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
    const { t } = useLocale();
    const [playState, setPlayState] = useState<PlayState>('stopped');
    const [canUndo, setCanUndo] = useState(false);
    const [canRedo, setCanRedo] = useState(false);
    const [showRunMenu, setShowRunMenu] = useState(false);
    const runMenuRef = useRef<HTMLDivElement>(null);

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
                    label={t('toolbar.save')}
                    onClick={onSaveScene}
                />
                <ToolButton
                    icon={<FolderOpen size={16} />}
                    label={t('toolbar.open')}
                    onClick={onOpenScene}
                />
            </div>

            <ToolSeparator />

            {/* Undo/Redo */}
            <div className="toolbar-group">
                <ToolButton
                    icon={<Undo2 size={16} />}
                    label={t('toolbar.undo')}
                    disabled={!canUndo}
                    onClick={handleUndo}
                />
                <ToolButton
                    icon={<Redo2 size={16} />}
                    label={t('toolbar.redo')}
                    disabled={!canRedo}
                    onClick={handleRedo}
                />
            </div>

            {/* Play Controls - Absolutely Centered */}
            <div className="toolbar-center-wrapper">
                <div className="toolbar-group toolbar-center">
                    <ToolButton
                        icon={playState === 'playing' ? <Pause size={18} /> : <Play size={18} />}
                        label={playState === 'playing' ? t('toolbar.pause') : t('toolbar.play')}
                        onClick={playState === 'playing' ? handlePause : handlePlay}
                    />
                    <ToolButton
                        icon={<Square size={16} />}
                        label={t('toolbar.stop')}
                        disabled={playState === 'stopped'}
                        onClick={handleStop}
                    />
                    <ToolButton
                        icon={<SkipForward size={16} />}
                        label={t('toolbar.step')}
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
                            title={t('toolbar.runOptions')}
                            type="button"
                        >
                            <Globe size={16} />
                            <ChevronDown size={12} />
                        </button>
                        {showRunMenu && (
                            <div className="toolbar-dropdown-menu">
                                <button type="button" onClick={handleRunInBrowser}>
                                    <Globe size={14} />
                                    <span>{t('toolbar.runInBrowser')}</span>
                                </button>
                                <button type="button" onClick={handleRunOnDevice}>
                                    <QrCode size={14} />
                                    <span>{t('toolbar.runOnDevice')}</span>
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
                        <span>{t('toolbar.preview')}</span>
                    </div>
                )}
            </div>
        </div>
    );
}
