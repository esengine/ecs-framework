import { React, Icons } from '@esengine/editor-runtime';
import { useBTLocale } from '../../hooks/useBTLocale';

const { Play, Pause, Square, SkipForward, Undo, Redo, ZoomIn, Save, FolderOpen, Download, Clipboard, Home } = Icons;

type ExecutionMode = 'idle' | 'running' | 'paused';

interface EditorToolbarProps {
    executionMode: ExecutionMode;
    canUndo: boolean;
    canRedo: boolean;
    hasUnsavedChanges?: boolean;
    onPlay: () => void;
    onPause: () => void;
    onStop: () => void;
    onStep: () => void;
    onReset: () => void;
    onUndo: () => void;
    onRedo: () => void;
    onResetView: () => void;
    onSave?: () => void;
    onOpen?: () => void;
    onExport?: () => void;
    onCopyToClipboard?: () => void;
    onGoToRoot?: () => void;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
    executionMode,
    canUndo,
    canRedo,
    hasUnsavedChanges = false,
    onPlay,
    onPause,
    onStop,
    onStep,
    onReset,
    onUndo,
    onRedo,
    onResetView,
    onSave,
    onOpen,
    onExport,
    onCopyToClipboard,
    onGoToRoot
}) => {
    const { t } = useBTLocale();

    return (
        <div style={{
            position: 'absolute',
            top: '12px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '6px',
            backgroundColor: '#2a2a2a',
            padding: '6px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            border: '1px solid #3f3f3f',
            zIndex: 100
        }}>
            {/* 文件操作组 */}
            <div style={{
                display: 'flex',
                gap: '4px',
                padding: '2px',
                backgroundColor: '#1e1e1e',
                borderRadius: '6px'
            }}>
                {onOpen && (
                    <button
                        onClick={onOpen}
                        style={{
                            padding: '6px 8px',
                            backgroundColor: '#3c3c3c',
                            border: 'none',
                            borderRadius: '4px',
                            color: '#ccc',
                            cursor: 'pointer',
                            fontSize: '13px',
                            display: 'flex',
                            alignItems: 'center',
                            transition: 'all 0.15s'
                        }}
                        title={t('toolbar.openFile')}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4a4a4a'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3c3c3c'}
                    >
                        <FolderOpen size={14} />
                    </button>
                )}

                {onSave && (
                    <button
                        onClick={onSave}
                        style={{
                            padding: '6px 8px',
                            backgroundColor: hasUnsavedChanges ? '#2563eb' : '#3c3c3c',
                            border: 'none',
                            borderRadius: '4px',
                            color: hasUnsavedChanges ? '#fff' : '#ccc',
                            cursor: 'pointer',
                            fontSize: '13px',
                            display: 'flex',
                            alignItems: 'center',
                            transition: 'all 0.15s'
                        }}
                        title={hasUnsavedChanges ? t('toolbar.saveUnsaved') : t('toolbar.save')}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = hasUnsavedChanges ? '#1d4ed8' : '#4a4a4a'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = hasUnsavedChanges ? '#2563eb' : '#3c3c3c'}
                    >
                        <Save size={14} />
                    </button>
                )}

                {onExport && (
                    <button
                        onClick={onExport}
                        style={{
                            padding: '6px 8px',
                            backgroundColor: '#3c3c3c',
                            border: 'none',
                            borderRadius: '4px',
                            color: '#ccc',
                            cursor: 'pointer',
                            fontSize: '13px',
                            display: 'flex',
                            alignItems: 'center',
                            transition: 'all 0.15s'
                        }}
                        title={t('toolbar.export')}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4a4a4a'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3c3c3c'}
                    >
                        <Download size={14} />
                    </button>
                )}

                {onCopyToClipboard && (
                    <button
                        onClick={onCopyToClipboard}
                        style={{
                            padding: '6px 8px',
                            backgroundColor: '#3c3c3c',
                            border: 'none',
                            borderRadius: '4px',
                            color: '#ccc',
                            cursor: 'pointer',
                            fontSize: '13px',
                            display: 'flex',
                            alignItems: 'center',
                            transition: 'all 0.15s'
                        }}
                        title={t('toolbar.copyToClipboard')}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4a4a4a'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3c3c3c'}
                    >
                        <Clipboard size={14} />
                    </button>
                )}
            </div>

            {/* 分隔符 */}
            <div style={{
                width: '1px',
                backgroundColor: '#444',
                margin: '2px 0'
            }} />

            {/* 执行控制组 */}
            <div style={{
                display: 'flex',
                gap: '4px',
                padding: '2px',
                backgroundColor: '#1e1e1e',
                borderRadius: '6px'
            }}>
                {/* 播放按钮 */}
                <button
                    onClick={onPlay}
                    disabled={executionMode === 'running'}
                    style={{
                        padding: '6px 10px',
                        backgroundColor: executionMode === 'running' ? '#2a2a2a' : '#16a34a',
                        border: 'none',
                        borderRadius: '4px',
                        color: executionMode === 'running' ? '#666' : '#fff',
                        cursor: executionMode === 'running' ? 'not-allowed' : 'pointer',
                        fontSize: '13px',
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'all 0.15s'
                    }}
                    title={t('toolbar.run')}
                    onMouseEnter={(e) => {
                        if (executionMode !== 'running') {
                            e.currentTarget.style.backgroundColor = '#15803d';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (executionMode !== 'running') {
                            e.currentTarget.style.backgroundColor = '#16a34a';
                        }
                    }}
                >
                    <Play size={14} fill="currentColor" />
                </button>

                {/* 暂停按钮 */}
                <button
                    onClick={onPause}
                    disabled={executionMode === 'idle'}
                    style={{
                        padding: '6px 10px',
                        backgroundColor: executionMode === 'idle' ? '#2a2a2a' : '#f59e0b',
                        border: 'none',
                        borderRadius: '4px',
                        color: executionMode === 'idle' ? '#666' : '#fff',
                        cursor: executionMode === 'idle' ? 'not-allowed' : 'pointer',
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        transition: 'all 0.15s'
                    }}
                    title={executionMode === 'paused' ? t('toolbar.resume') : t('toolbar.pause')}
                    onMouseEnter={(e) => {
                        if (executionMode !== 'idle') {
                            e.currentTarget.style.backgroundColor = '#d97706';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (executionMode !== 'idle') {
                            e.currentTarget.style.backgroundColor = '#f59e0b';
                        }
                    }}
                >
                    {executionMode === 'paused' ? <Play size={14} fill="currentColor" /> : <Pause size={14} fill="currentColor" />}
                </button>

                {/* 停止按钮 */}
                <button
                    onClick={onStop}
                    disabled={executionMode === 'idle'}
                    style={{
                        padding: '6px 10px',
                        backgroundColor: executionMode === 'idle' ? '#2a2a2a' : '#dc2626',
                        border: 'none',
                        borderRadius: '4px',
                        color: executionMode === 'idle' ? '#666' : '#fff',
                        cursor: executionMode === 'idle' ? 'not-allowed' : 'pointer',
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        transition: 'all 0.15s'
                    }}
                    title={t('toolbar.stop')}
                    onMouseEnter={(e) => {
                        if (executionMode !== 'idle') {
                            e.currentTarget.style.backgroundColor = '#b91c1c';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (executionMode !== 'idle') {
                            e.currentTarget.style.backgroundColor = '#dc2626';
                        }
                    }}
                >
                    <Square size={14} fill="currentColor" />
                </button>

                {/* 单步执行按钮 */}
                <button
                    onClick={onStep}
                    disabled={executionMode !== 'idle' && executionMode !== 'paused'}
                    style={{
                        padding: '6px 10px',
                        backgroundColor: (executionMode !== 'idle' && executionMode !== 'paused') ? '#2a2a2a' : '#3b82f6',
                        border: 'none',
                        borderRadius: '4px',
                        color: (executionMode !== 'idle' && executionMode !== 'paused') ? '#666' : '#fff',
                        cursor: (executionMode !== 'idle' && executionMode !== 'paused') ? 'not-allowed' : 'pointer',
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        transition: 'all 0.15s'
                    }}
                    title={t('toolbar.step')}
                    onMouseEnter={(e) => {
                        if (executionMode === 'idle' || executionMode === 'paused') {
                            e.currentTarget.style.backgroundColor = '#2563eb';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (executionMode === 'idle' || executionMode === 'paused') {
                            e.currentTarget.style.backgroundColor = '#3b82f6';
                        }
                    }}
                >
                    <SkipForward size={14} />
                </button>
            </div>

            {/* 分隔符 */}
            <div style={{
                width: '1px',
                backgroundColor: '#444',
                margin: '2px 0'
            }} />

            {/* 视图控制 */}
            <button
                onClick={onResetView}
                style={{
                    padding: '6px 10px',
                    backgroundColor: '#3c3c3c',
                    border: 'none',
                    borderRadius: '4px',
                    color: '#ccc',
                    cursor: 'pointer',
                    fontSize: '11px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.15s'
                }}
                title={t('toolbar.resetView')}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4a4a4a'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3c3c3c'}
            >
                <ZoomIn size={13} />
                <span>Reset View</span>
            </button>

            {/* 分隔符 */}
            <div style={{
                width: '1px',
                backgroundColor: '#444',
                margin: '2px 0'
            }} />

            {/* 历史控制组 */}
            <div style={{
                display: 'flex',
                gap: '4px',
                padding: '2px',
                backgroundColor: '#1e1e1e',
                borderRadius: '6px'
            }}>
                <button
                    onClick={onUndo}
                    disabled={!canUndo}
                    style={{
                        padding: '6px 8px',
                        backgroundColor: canUndo ? '#3c3c3c' : '#2a2a2a',
                        border: 'none',
                        borderRadius: '4px',
                        color: canUndo ? '#ccc' : '#666',
                        cursor: canUndo ? 'pointer' : 'not-allowed',
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        transition: 'all 0.15s'
                    }}
                    title={t('toolbar.undo')}
                    onMouseEnter={(e) => {
                        if (canUndo) {
                            e.currentTarget.style.backgroundColor = '#4a4a4a';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (canUndo) {
                            e.currentTarget.style.backgroundColor = '#3c3c3c';
                        }
                    }}
                >
                    <Undo size={14} />
                </button>

                <button
                    onClick={onRedo}
                    disabled={!canRedo}
                    style={{
                        padding: '6px 8px',
                        backgroundColor: canRedo ? '#3c3c3c' : '#2a2a2a',
                        border: 'none',
                        borderRadius: '4px',
                        color: canRedo ? '#ccc' : '#666',
                        cursor: canRedo ? 'pointer' : 'not-allowed',
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        transition: 'all 0.15s'
                    }}
                    title={t('toolbar.redo')}
                    onMouseEnter={(e) => {
                        if (canRedo) {
                            e.currentTarget.style.backgroundColor = '#4a4a4a';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (canRedo) {
                            e.currentTarget.style.backgroundColor = '#3c3c3c';
                        }
                    }}
                >
                    <Redo size={14} />
                </button>
            </div>

            {/* 状态指示器 */}
            <div style={{
                padding: '6px 12px',
                backgroundColor: '#1e1e1e',
                borderRadius: '6px',
                fontSize: '11px',
                color: '#999',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: 500,
                minWidth: '70px'
            }}>
                <span style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor:
                        executionMode === 'running' ? '#16a34a' :
                            executionMode === 'paused' ? '#f59e0b' : '#666',
                    boxShadow: executionMode !== 'idle' ? `0 0 8px ${
                        executionMode === 'running' ? '#16a34a' :
                            executionMode === 'paused' ? '#f59e0b' : 'transparent'
                    }` : 'none',
                    transition: 'all 0.2s'
                }} />
                <span style={{
                    color: executionMode === 'running' ? '#16a34a' :
                        executionMode === 'paused' ? '#f59e0b' : '#888'
                }}>
                    {executionMode === 'idle' ? t('execution.idle') :
                        executionMode === 'running' ? t('execution.running') : t('execution.paused')}
                </span>
            </div>

            {onGoToRoot && (
                <>
                    <div style={{
                        width: '1px',
                        backgroundColor: '#444',
                        margin: '2px 0'
                    }} />
                    <button
                        onClick={onGoToRoot}
                        style={{
                            padding: '6px 10px',
                            backgroundColor: '#3c3c3c',
                            border: 'none',
                            borderRadius: '4px',
                            color: '#ccc',
                            cursor: 'pointer',
                            fontSize: '11px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'all 0.15s'
                        }}
                        title={t('toolbar.goToRoot')}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4a4a4a'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3c3c3c'}
                    >
                        <Home size={13} />
                        <span>Root</span>
                    </button>
                </>
            )}
        </div>
    );
};
