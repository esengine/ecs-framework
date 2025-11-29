import React, { useRef, useCallback, useState, useMemo } from 'react';
import { Position } from '../../domain/value-objects/Position';

export interface GraphCanvasProps {
    /** Canvas width in pixels (画布宽度，像素) */
    width?: number | string;

    /** Canvas height in pixels (画布高度，像素) */
    height?: number | string;

    /** Initial pan offset (初始平移偏移) */
    initialPan?: Position;

    /** Initial zoom level (初始缩放级别) */
    initialZoom?: number;

    /** Minimum zoom level (最小缩放级别) */
    minZoom?: number;

    /** Maximum zoom level (最大缩放级别) */
    maxZoom?: number;

    /** Grid size in pixels (网格大小，像素) */
    gridSize?: number;

    /** Whether to show grid (是否显示网格) */
    showGrid?: boolean;

    /** Background color (背景颜色) */
    backgroundColor?: string;

    /** Grid color (网格颜色) */
    gridColor?: string;

    /** Major grid line interval (主网格线间隔) */
    majorGridInterval?: number;

    /** Major grid color (主网格颜色) */
    majorGridColor?: string;

    /** Pan change callback (平移变化回调) */
    onPanChange?: (pan: Position) => void;

    /** Zoom change callback (缩放变化回调) */
    onZoomChange?: (zoom: number) => void;

    /** Canvas click callback (画布点击回调) */
    onClick?: (position: Position, e: React.MouseEvent) => void;

    /** Canvas context menu callback (画布右键菜单回调) */
    onContextMenu?: (position: Position, e: React.MouseEvent) => void;

    /** Children to render (要渲染的子元素) */
    children?: React.ReactNode;
}

/**
 * GraphCanvas - Pannable and zoomable canvas for node graphs
 * GraphCanvas - 可平移和缩放的节点图画布
 */
export const GraphCanvas: React.FC<GraphCanvasProps> = ({
    width = '100%',
    height = '100%',
    initialPan = Position.ZERO,
    initialZoom = 1,
    minZoom = 0.1,
    maxZoom = 2,
    gridSize = 20,
    showGrid = true,
    backgroundColor = 'var(--ne-canvas-bg)',
    gridColor = 'var(--ne-canvas-grid)',
    majorGridInterval = 5,
    majorGridColor = 'var(--ne-canvas-grid-major)',
    onPanChange,
    onZoomChange,
    onClick,
    onContextMenu,
    children
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [pan, setPan] = useState(initialPan);
    const [zoom, setZoom] = useState(initialZoom);
    const [isPanning, setIsPanning] = useState(false);
    const lastMousePos = useRef<Position>(Position.ZERO);

    // Sync pan state with callback
    const updatePan = useCallback((newPan: Position) => {
        setPan(newPan);
        onPanChange?.(newPan);
    }, [onPanChange]);

    // Sync zoom state with callback
    const updateZoom = useCallback((newZoom: number) => {
        setZoom(newZoom);
        onZoomChange?.(newZoom);
    }, [onZoomChange]);

    /**
     * Converts screen coordinates to canvas coordinates
     * 将屏幕坐标转换为画布坐标
     */
    const screenToCanvas = useCallback((screenX: number, screenY: number): Position => {
        if (!containerRef.current) return new Position(screenX, screenY);
        const rect = containerRef.current.getBoundingClientRect();
        const x = (screenX - rect.left - pan.x) / zoom;
        const y = (screenY - rect.top - pan.y) / zoom;
        return new Position(x, y);
    }, [pan, zoom]);

    /**
     * Handles mouse wheel for zooming
     * 处理鼠标滚轮缩放
     */
    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault();
        const delta = -e.deltaY * 0.001;
        const newZoom = Math.max(minZoom, Math.min(maxZoom, zoom * (1 + delta)));

        if (newZoom !== zoom && containerRef.current) {
            // Zoom towards cursor position (以光标位置为中心缩放)
            const rect = containerRef.current.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            const zoomRatio = newZoom / zoom;
            const newPanX = mouseX - (mouseX - pan.x) * zoomRatio;
            const newPanY = mouseY - (mouseY - pan.y) * zoomRatio;

            updateZoom(newZoom);
            updatePan(new Position(newPanX, newPanY));
        }
    }, [zoom, pan, minZoom, maxZoom, updateZoom, updatePan]);

    /**
     * Handles mouse down for panning
     * 处理鼠标按下开始平移
     */
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        // Middle mouse button or space + left click for panning
        // 中键或空格+左键平移
        if (e.button === 1 || (e.button === 0 && e.altKey)) {
            e.preventDefault();
            setIsPanning(true);
            lastMousePos.current = new Position(e.clientX, e.clientY);
        }
    }, []);

    /**
     * Handles mouse move for panning
     * 处理鼠标移动进行平移
     */
    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (isPanning) {
            const dx = e.clientX - lastMousePos.current.x;
            const dy = e.clientY - lastMousePos.current.y;
            lastMousePos.current = new Position(e.clientX, e.clientY);
            const newPan = new Position(pan.x + dx, pan.y + dy);
            updatePan(newPan);
        }
    }, [isPanning, pan, updatePan]);

    /**
     * Handles mouse up to stop panning
     * 处理鼠标释放停止平移
     */
    const handleMouseUp = useCallback(() => {
        setIsPanning(false);
    }, []);

    /**
     * Handles canvas click
     * 处理画布点击
     */
    const handleClick = useCallback((e: React.MouseEvent) => {
        if (e.target === containerRef.current || (e.target as HTMLElement).classList.contains('ne-canvas-content')) {
            const canvasPos = screenToCanvas(e.clientX, e.clientY);
            onClick?.(canvasPos, e);
        }
    }, [onClick, screenToCanvas]);

    /**
     * Handles context menu
     * 处理右键菜单
     */
    const handleContextMenu = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        const canvasPos = screenToCanvas(e.clientX, e.clientY);
        onContextMenu?.(canvasPos, e);
    }, [onContextMenu, screenToCanvas]);

    // Grid pattern SVG
    // 网格图案 SVG
    const gridPattern = useMemo(() => {
        if (!showGrid) return null;

        const scaledGridSize = gridSize * zoom;
        const majorSize = scaledGridSize * majorGridInterval;

        return (
            <svg
                className="ne-canvas-grid"
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none'
                }}
            >
                <defs>
                    {/* Minor grid pattern (小网格图案) */}
                    <pattern
                        id="ne-grid-minor"
                        width={scaledGridSize}
                        height={scaledGridSize}
                        patternUnits="userSpaceOnUse"
                        x={pan.x % scaledGridSize}
                        y={pan.y % scaledGridSize}
                    >
                        <path
                            d={`M ${scaledGridSize} 0 L 0 0 0 ${scaledGridSize}`}
                            fill="none"
                            stroke={gridColor}
                            strokeWidth="0.5"
                        />
                    </pattern>
                    {/* Major grid pattern (主网格图案) */}
                    <pattern
                        id="ne-grid-major"
                        width={majorSize}
                        height={majorSize}
                        patternUnits="userSpaceOnUse"
                        x={pan.x % majorSize}
                        y={pan.y % majorSize}
                    >
                        <path
                            d={`M ${majorSize} 0 L 0 0 0 ${majorSize}`}
                            fill="none"
                            stroke={majorGridColor}
                            strokeWidth="1"
                        />
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#ne-grid-minor)" />
                <rect width="100%" height="100%" fill="url(#ne-grid-major)" />
            </svg>
        );
    }, [showGrid, gridSize, zoom, pan, gridColor, majorGridColor, majorGridInterval]);

    // Transform style for content
    // 内容的变换样式
    const contentStyle: React.CSSProperties = useMemo(() => ({
        transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
        transformOrigin: '0 0',
        position: 'absolute' as const,
        top: 0,
        left: 0,
        width: '100%',
        height: '100%'
    }), [pan, zoom]);

    return (
        <div
            ref={containerRef}
            className="ne-canvas"
            style={{
                width,
                height,
                backgroundColor,
                position: 'relative',
                overflow: 'hidden',
                cursor: isPanning ? 'grabbing' : 'default'
            }}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onClick={handleClick}
            onContextMenu={handleContextMenu}
        >
            {/* Grid background (网格背景) */}
            {gridPattern}

            {/* Transformable content container (可变换的内容容器) */}
            <div className="ne-canvas-content" style={contentStyle}>
                {children}
            </div>
        </div>
    );
};

/**
 * useCanvasTransform - Hook for managing canvas transform state
 * useCanvasTransform - 管理画布变换状态的 Hook
 */
export interface CanvasTransform {
    pan: Position;
    zoom: number;
    setPan: (pan: Position) => void;
    setZoom: (zoom: number) => void;
    screenToCanvas: (screenX: number, screenY: number) => Position;
    canvasToScreen: (canvasX: number, canvasY: number) => Position;
    resetTransform: () => void;
    fitToContent: (bounds: { minX: number; minY: number; maxX: number; maxY: number }, padding?: number) => void;
}

export function useCanvasTransform(
    containerRef: React.RefObject<HTMLElement | null>,
    initialPan = Position.ZERO,
    initialZoom = 1
): CanvasTransform {
    const [pan, setPan] = useState(initialPan);
    const [zoom, setZoom] = useState(initialZoom);

    const screenToCanvas = useCallback((screenX: number, screenY: number): Position => {
        if (!containerRef.current) return new Position(screenX, screenY);
        const rect = containerRef.current.getBoundingClientRect();
        const x = (screenX - rect.left - pan.x) / zoom;
        const y = (screenY - rect.top - pan.y) / zoom;
        return new Position(x, y);
    }, [containerRef, pan, zoom]);

    const canvasToScreen = useCallback((canvasX: number, canvasY: number): Position => {
        if (!containerRef.current) return new Position(canvasX, canvasY);
        const rect = containerRef.current.getBoundingClientRect();
        const x = canvasX * zoom + pan.x + rect.left;
        const y = canvasY * zoom + pan.y + rect.top;
        return new Position(x, y);
    }, [containerRef, pan, zoom]);

    const resetTransform = useCallback(() => {
        setPan(initialPan);
        setZoom(initialZoom);
    }, [initialPan, initialZoom]);

    const fitToContent = useCallback((
        bounds: { minX: number; minY: number; maxX: number; maxY: number },
        padding = 50
    ) => {
        if (!containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const contentWidth = bounds.maxX - bounds.minX + padding * 2;
        const contentHeight = bounds.maxY - bounds.minY + padding * 2;

        const scaleX = rect.width / contentWidth;
        const scaleY = rect.height / contentHeight;
        const newZoom = Math.min(scaleX, scaleY, 1);

        const centerX = (bounds.minX + bounds.maxX) / 2;
        const centerY = (bounds.minY + bounds.maxY) / 2;

        const newPanX = rect.width / 2 - centerX * newZoom;
        const newPanY = rect.height / 2 - centerY * newZoom;

        setZoom(newZoom);
        setPan(new Position(newPanX, newPanY));
    }, [containerRef]);

    return {
        pan,
        zoom,
        setPan,
        setZoom,
        screenToCanvas,
        canvasToScreen,
        resetTransform,
        fitToContent
    };
}

export default GraphCanvas;
