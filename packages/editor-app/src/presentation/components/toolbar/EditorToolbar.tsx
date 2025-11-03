import React from 'react';
import { Play, Pause, Square, SkipForward, RotateCcw, Trash2, Undo, Redo } from 'lucide-react';

type ExecutionMode = 'idle' | 'running' | 'paused' | 'step';

interface EditorToolbarProps {
    executionMode: ExecutionMode;
    canUndo: boolean;
    canRedo: boolean;
    onPlay: () => void;
    onPause: () => void;
    onStop: () => void;
    onStep: () => void;
    onReset: () => void;
    onUndo: () => void;
    onRedo: () => void;
    onResetView: () => void;
    onClearCanvas: () => void;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
    executionMode,
    canUndo,
    canRedo,
    onPlay,
    onPause,
    onStop,
    onStep,
    onReset,
    onUndo,
    onRedo,
    onResetView,
    onClearCanvas
}) => {
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
                title="运行 (Play)"
            >
                <Play size={16} />
            </button>

            {/* 暂停按钮 */}
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
                title={executionMode === 'paused' ? '继续' : '暂停'}
            >
                {executionMode === 'paused' ? <Play size={16} /> : <Pause size={16} />}
            </button>

            {/* 停止按钮 */}
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
                title="停止"
            >
                <Square size={16} />
            </button>

            {/* 单步执行按钮 */}
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
                title="单步执行"
            >
                <SkipForward size={16} />
            </button>

            {/* 重置按钮 */}
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
                title="重置"
            >
                <RotateCcw size={16} />
            </button>

            {/* 分隔符 */}
            <div style={{
                width: '1px',
                backgroundColor: '#666',
                margin: '4px 0'
            }} />

            {/* 重置视图按钮 */}
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
                title="重置视图 (滚轮缩放, Alt+拖动平移)"
            >
                <RotateCcw size={14} />
                View
            </button>

            {/* 清空画布按钮 */}
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
                title="清空画布"
                onClick={onClearCanvas}
            >
                <Trash2 size={14} />
                清空
            </button>

            {/* 分隔符 */}
            <div style={{
                width: '1px',
                height: '24px',
                backgroundColor: '#555',
                margin: '0 4px'
            }} />

            {/* 撤销按钮 */}
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
                title="撤销 (Ctrl+Z)"
            >
                <Undo size={16} />
            </button>

            {/* 重做按钮 */}
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
                title="重做 (Ctrl+Shift+Z / Ctrl+Y)"
            >
                <Redo size={16} />
            </button>

            {/* 状态指示器 */}
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
                {executionMode === 'idle' ? 'Idle' :
                    executionMode === 'running' ? 'Running' :
                        executionMode === 'paused' ? 'Paused' : 'Step'}
            </div>
        </div>
    );
};
