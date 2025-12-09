import React from 'react';
import { Play, Pause, Square, SkipForward, RotateCcw, Trash2, Undo, Redo, Box } from 'lucide-react';
import { useLocale } from '../../../hooks/useLocale';

type ExecutionMode = 'idle' | 'running' | 'paused' | 'step';

interface EditorToolbarProps {
    executionMode: ExecutionMode;
    canUndo: boolean;
    canRedo: boolean;
    showGizmos: boolean;
    onPlay: () => void;
    onPause: () => void;
    onStop: () => void;
    onStep: () => void;
    onReset: () => void;
    onUndo: () => void;
    onRedo: () => void;
    onResetView: () => void;
    onClearCanvas: () => void;
    onToggleGizmos: () => void;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
    executionMode,
    canUndo,
    canRedo,
    showGizmos,
    onPlay,
    onPause,
    onStop,
    onStep,
    onReset,
    onUndo,
    onRedo,
    onResetView,
    onClearCanvas,
    onToggleGizmos
}) => {
    const { t } = useLocale();
    return (
        <div style={{
            position: 'absolute',
            top: '10px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '8px',
            backgroundColor: 'rgba(45, 45, 45, 0.95)',
            padding: '8px',
            borderRadius: '6px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            zIndex: 100
        }}>
            {/* 播放按钮 */}
            <button
                onClick={onPlay}
                disabled={executionMode === 'running'}
                style={{
                    padding: '8px',
                    backgroundColor: executionMode === 'running' ? '#2d2d2d' : '#4caf50',
                    border: 'none',
                    borderRadius: '4px',
                    color: executionMode === 'running' ? '#666' : '#fff',
                    cursor: executionMode === 'running' ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
                title={t('editorToolbar.play')}
            >
                <Play size={16} />
            </button>

            {/* 暂停按钮 | Pause button */}
            <button
                onClick={onPause}
                disabled={executionMode === 'idle'}
                style={{
                    padding: '8px',
                    backgroundColor: executionMode === 'idle' ? '#2d2d2d' : '#ff9800',
                    border: 'none',
                    borderRadius: '4px',
                    color: executionMode === 'idle' ? '#666' : '#fff',
                    cursor: executionMode === 'idle' ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
                title={executionMode === 'paused' ? t('editorToolbar.resume') : t('editorToolbar.pause')}
            >
                {executionMode === 'paused' ? <Play size={16} /> : <Pause size={16} />}
            </button>

            {/* 停止按钮 | Stop button */}
            <button
                onClick={onStop}
                disabled={executionMode === 'idle'}
                style={{
                    padding: '8px',
                    backgroundColor: executionMode === 'idle' ? '#2d2d2d' : '#f44336',
                    border: 'none',
                    borderRadius: '4px',
                    color: executionMode === 'idle' ? '#666' : '#fff',
                    cursor: executionMode === 'idle' ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
                title={t('editorToolbar.stop')}
            >
                <Square size={16} />
            </button>

            {/* 单步执行按钮 | Step forward button */}
            <button
                onClick={onStep}
                disabled={executionMode !== 'idle' && executionMode !== 'paused'}
                style={{
                    padding: '8px',
                    backgroundColor: (executionMode !== 'idle' && executionMode !== 'paused') ? '#2d2d2d' : '#2196f3',
                    border: 'none',
                    borderRadius: '4px',
                    color: (executionMode !== 'idle' && executionMode !== 'paused') ? '#666' : '#fff',
                    cursor: (executionMode !== 'idle' && executionMode !== 'paused') ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
                title={t('editorToolbar.stepForward')}
            >
                <SkipForward size={16} />
            </button>

            {/* 重置按钮 | Reset button */}
            <button
                onClick={onReset}
                style={{
                    padding: '8px',
                    backgroundColor: '#9e9e9e',
                    border: 'none',
                    borderRadius: '4px',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
                title={t('editorToolbar.reset')}
            >
                <RotateCcw size={16} />
            </button>

            {/* 分隔符 */}
            <div style={{
                width: '1px',
                backgroundColor: '#666',
                margin: '4px 0'
            }} />

            {/* 重置视图按钮 | Reset view button */}
            <button
                onClick={onResetView}
                style={{
                    padding: '8px 12px',
                    backgroundColor: '#3c3c3c',
                    border: 'none',
                    borderRadius: '4px',
                    color: '#cccccc',
                    cursor: 'pointer',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                }}
                title={t('editorToolbar.resetView')}
            >
                <RotateCcw size={14} />
                View
            </button>

            {/* 清空画布按钮 | Clear canvas button */}
            <button
                style={{
                    padding: '8px 12px',
                    backgroundColor: '#3c3c3c',
                    border: 'none',
                    borderRadius: '4px',
                    color: '#cccccc',
                    cursor: 'pointer',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                }}
                title={t('editorToolbar.clearCanvas')}
                onClick={onClearCanvas}
            >
                <Trash2 size={14} />
                {t('editorToolbar.clear')}
            </button>

            {/* Gizmo 开关按钮 | Gizmo toggle button */}
            <button
                onClick={onToggleGizmos}
                style={{
                    padding: '8px 12px',
                    backgroundColor: showGizmos ? '#4a9eff' : '#3c3c3c',
                    border: 'none',
                    borderRadius: '4px',
                    color: showGizmos ? '#fff' : '#cccccc',
                    cursor: 'pointer',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                }}
                title={t('editorToolbar.toggleGizmos')}
            >
                <Box size={14} />
                Gizmos
            </button>

            {/* 分隔符 */}
            <div style={{
                width: '1px',
                height: '24px',
                backgroundColor: '#555',
                margin: '0 4px'
            }} />

            {/* 撤销按钮 | Undo button */}
            <button
                onClick={onUndo}
                disabled={!canUndo}
                style={{
                    padding: '8px',
                    backgroundColor: canUndo ? '#3c3c3c' : '#2d2d2d',
                    border: 'none',
                    borderRadius: '4px',
                    color: canUndo ? '#cccccc' : '#666',
                    cursor: canUndo ? 'pointer' : 'not-allowed',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
                title={t('editorToolbar.undo')}
            >
                <Undo size={16} />
            </button>

            {/* 重做按钮 | Redo button */}
            <button
                onClick={onRedo}
                disabled={!canRedo}
                style={{
                    padding: '8px',
                    backgroundColor: canRedo ? '#3c3c3c' : '#2d2d2d',
                    border: 'none',
                    borderRadius: '4px',
                    color: canRedo ? '#cccccc' : '#666',
                    cursor: canRedo ? 'pointer' : 'not-allowed',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
                title={t('editorToolbar.redo')}
            >
                <Redo size={16} />
            </button>

            {/* 状态指示器 | Status indicator */}
            <div style={{
                padding: '8px 12px',
                backgroundColor: '#1e1e1e',
                borderRadius: '4px',
                fontSize: '12px',
                color: '#ccc',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
            }}>
                <span style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor:
                        executionMode === 'running' ? '#4caf50' :
                            executionMode === 'paused' ? '#ff9800' : '#666'
                }} />
                {executionMode === 'idle' ? t('editorToolbar.idle') :
                    executionMode === 'running' ? t('editorToolbar.running') :
                        executionMode === 'paused' ? t('editorToolbar.paused') : t('editorToolbar.step')}
            </div>
        </div>
    );
};
