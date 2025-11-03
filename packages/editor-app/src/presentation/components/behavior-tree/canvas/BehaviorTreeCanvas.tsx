import React, { useRef, useCallback } from 'react';
import { useCanvasInteraction } from '../../../hooks/useCanvasInteraction';
import { EditorConfig } from '../../../types';

/**
 * 画布组件属性
 */
interface BehaviorTreeCanvasProps {
    /**
     * 编辑器配置
     */
    config: EditorConfig;

    /**
     * 子组件
     */
    children: React.ReactNode;

    /**
     * 画布点击事件
     */
    onClick?: (e: React.MouseEvent) => void;

    /**
     * 画布双击事件
     */
    onDoubleClick?: (e: React.MouseEvent) => void;

    /**
     * 画布右键事件
     */
    onContextMenu?: (e: React.MouseEvent) => void;

    /**
     * 鼠标移动事件
     */
    onMouseMove?: (e: React.MouseEvent) => void;

    /**
     * 鼠标按下事件
     */
    onMouseDown?: (e: React.MouseEvent) => void;

    /**
     * 鼠标抬起事件
     */
    onMouseUp?: (e: React.MouseEvent) => void;
}

/**
 * 行为树画布组件
 * 负责画布的渲染、缩放、平移等基础功能
 */
export const BehaviorTreeCanvas: React.FC<BehaviorTreeCanvasProps> = ({
    config,
    children,
    onClick,
    onDoubleClick,
    onContextMenu,
    onMouseMove,
    onMouseDown,
    onMouseUp
}) => {
    const canvasRef = useRef<HTMLDivElement>(null);
    const {
        canvasOffset,
        canvasScale,
        isPanning,
        handleWheel,
        startPanning,
        updatePanning,
        stopPanning
    } = useCanvasInteraction();

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (e.button === 1 || (e.button === 0 && e.altKey)) {
            e.preventDefault();
            startPanning(e.clientX, e.clientY);
        }

        onMouseDown?.(e);
    }, [startPanning, onMouseDown]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (isPanning) {
            updatePanning(e.clientX, e.clientY);
        }

        onMouseMove?.(e);
    }, [isPanning, updatePanning, onMouseMove]);

    const handleMouseUp = useCallback((e: React.MouseEvent) => {
        if (isPanning) {
            stopPanning();
        }

        onMouseUp?.(e);
    }, [isPanning, stopPanning, onMouseUp]);

    const handleContextMenu = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        onContextMenu?.(e);
    }, [onContextMenu]);

    return (
        <div
            ref={canvasRef}
            className="behavior-tree-canvas"
            style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                overflow: 'hidden',
                cursor: isPanning ? 'grabbing' : 'default',
                backgroundColor: '#1a1a1a'
            }}
            onWheel={handleWheel}
            onClick={onClick}
            onDoubleClick={onDoubleClick}
            onContextMenu={handleContextMenu}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
        >
            {/* 网格背景 */}
            {config.showGrid && (
                <div
                    className="canvas-grid"
                    style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundImage: `
                            linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)
                        `,
                        backgroundSize: `${config.gridSize * canvasScale}px ${config.gridSize * canvasScale}px`,
                        backgroundPosition: `${canvasOffset.x}px ${canvasOffset.y}px`
                    }}
                />
            )}

            {/* 内容容器（应用变换） */}
            <div
                className="canvas-content"
                style={{
                    position: 'absolute',
                    transformOrigin: '0 0',
                    transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${canvasScale})`,
                    width: '100%',
                    height: '100%'
                }}
            >
                {children}
            </div>
        </div>
    );
};
