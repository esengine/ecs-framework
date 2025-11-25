import { React, useRef, useCallback, forwardRef, useState, useEffect } from '@esengine/editor-runtime';
import { useCanvasInteraction } from '../../hooks/useCanvasInteraction';
import { EditorConfig } from '../../types';
import { GridBackground } from './GridBackground';

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

    /**
     * 鼠标离开事件
     */
    onMouseLeave?: (e: React.MouseEvent) => void;

    /**
     * 拖放事件
     */
    onDrop?: (e: React.DragEvent) => void;

    /**
     * 拖动悬停事件
     */
    onDragOver?: (e: React.DragEvent) => void;

    /**
     * 拖动进入事件
     */
    onDragEnter?: (e: React.DragEvent) => void;

    /**
     * 拖动离开事件
     */
    onDragLeave?: (e: React.DragEvent) => void;
}

/**
 * 行为树画布组件
 * 负责画布的渲染、缩放、平移等基础功能
 */
export const BehaviorTreeCanvas = forwardRef<HTMLDivElement, BehaviorTreeCanvasProps>(({
    config,
    children,
    onClick,
    onDoubleClick,
    onContextMenu,
    onMouseMove,
    onMouseDown,
    onMouseUp,
    onMouseLeave,
    onDrop,
    onDragOver,
    onDragEnter,
    onDragLeave
}, forwardedRef) => {
    const internalRef = useRef<HTMLDivElement>(null);
    const canvasRef = (forwardedRef as React.RefObject<HTMLDivElement>) || internalRef;

    const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

    const {
        canvasOffset,
        canvasScale,
        isPanning,
        handleWheel,
        startPanning,
        updatePanning,
        stopPanning
    } = useCanvasInteraction();

    // 监听画布尺寸变化
    useEffect(() => {
        const updateSize = () => {
            if (canvasRef.current) {
                const rect = canvasRef.current.getBoundingClientRect();
                setCanvasSize({
                    width: rect.width,
                    height: rect.height
                });
            }
        };

        updateSize();

        const resizeObserver = new ResizeObserver(updateSize);
        if (canvasRef.current) {
            resizeObserver.observe(canvasRef.current);
        }

        return () => {
            resizeObserver.disconnect();
        };
    }, [canvasRef]);

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
            onMouseLeave={onMouseLeave}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragEnter={onDragEnter}
            onDragLeave={onDragLeave}
        >
            {/* 网格背景 */}
            {config.showGrid && canvasSize.width > 0 && canvasSize.height > 0 && (
                <GridBackground
                    canvasOffset={canvasOffset}
                    canvasScale={canvasScale}
                    width={canvasSize.width}
                    height={canvasSize.height}
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
});

BehaviorTreeCanvas.displayName = 'BehaviorTreeCanvas';
