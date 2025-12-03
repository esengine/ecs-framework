/**
 * EditorViewport Component
 * 编辑器视口组件
 *
 * A reusable viewport component for editor panels that need engine rendering.
 * Supports camera controls, overlays, and preview scenes.
 *
 * 用于需要引擎渲染的编辑器面板的可重用视口组件。
 * 支持相机控制、覆盖层和预览场景。
 */

import { useEffect, useRef, useCallback, useState, forwardRef, useImperativeHandle } from 'react';
import type { ViewportCameraConfig, IViewportOverlay } from '@esengine/editor-core';
import { ViewportService } from '../services/ViewportService';
import '../styles/EditorViewport.css';

/**
 * EditorViewport configuration
 * 编辑器视口配置
 */
export interface EditorViewportConfig {
    /** Unique viewport identifier | 唯一视口标识符 */
    viewportId: string;
    /** Initial camera config | 初始相机配置 */
    initialCamera?: ViewportCameraConfig;
    /** Whether to show grid | 是否显示网格 */
    showGrid?: boolean;
    /** Whether to show gizmos | 是否显示辅助线 */
    showGizmos?: boolean;
    /** Background clear color | 背景清除颜色 */
    clearColor?: { r: number; g: number; b: number; a: number };
    /** Min zoom level | 最小缩放级别 */
    minZoom?: number;
    /** Max zoom level | 最大缩放级别 */
    maxZoom?: number;
    /** Enable camera pan | 启用相机平移 */
    enablePan?: boolean;
    /** Enable camera zoom | 启用相机缩放 */
    enableZoom?: boolean;
}

/**
 * EditorViewport props
 * 编辑器视口属性
 */
export interface EditorViewportProps extends EditorViewportConfig {
    /** Class name for styling | 样式类名 */
    className?: string;
    /** Called when camera changes | 相机变化时的回调 */
    onCameraChange?: (camera: ViewportCameraConfig) => void;
    /** Called when viewport is ready | 视口准备就绪时的回调 */
    onReady?: () => void;
    /** Called on mouse down | 鼠标按下时的回调 */
    onMouseDown?: (e: React.MouseEvent, worldPos: { x: number; y: number }) => void;
    /** Called on mouse move | 鼠标移动时的回调 */
    onMouseMove?: (e: React.MouseEvent, worldPos: { x: number; y: number }) => void;
    /** Called on mouse up | 鼠标抬起时的回调 */
    onMouseUp?: (e: React.MouseEvent, worldPos: { x: number; y: number }) => void;
    /** Called on mouse wheel | 鼠标滚轮时的回调 */
    onWheel?: (e: React.WheelEvent, worldPos: { x: number; y: number }) => void;
    /** Render custom overlays | 渲染自定义覆盖层 */
    renderOverlays?: () => React.ReactNode;
}

/**
 * EditorViewport handle for imperative access
 * 编辑器视口句柄，用于命令式访问
 */
export interface EditorViewportHandle {
    /** Get current camera | 获取当前相机 */
    getCamera(): ViewportCameraConfig;
    /** Set camera | 设置相机 */
    setCamera(camera: ViewportCameraConfig): void;
    /** Reset camera to initial state | 重置相机到初始状态 */
    resetCamera(): void;
    /** Convert screen coordinates to world coordinates | 将屏幕坐标转换为世界坐标 */
    screenToWorld(screenX: number, screenY: number): { x: number; y: number };
    /** Convert world coordinates to screen coordinates | 将世界坐标转换为屏幕坐标 */
    worldToScreen(worldX: number, worldY: number): { x: number; y: number };
    /** Get canvas element | 获取画布元素 */
    getCanvas(): HTMLCanvasElement | null;
    /** Request render | 请求渲染 */
    requestRender(): void;
}

/**
 * EditorViewport Component
 * 编辑器视口组件
 */
export const EditorViewport = forwardRef<EditorViewportHandle, EditorViewportProps>(function EditorViewport(
    {
        viewportId,
        initialCamera = { x: 0, y: 0, zoom: 1 },
        showGrid = true,
        showGizmos = false,
        clearColor,
        minZoom = 0.1,
        maxZoom = 10,
        enablePan = true,
        enableZoom = true,
        className,
        onCameraChange,
        onReady,
        onMouseDown,
        onMouseMove,
        onMouseUp,
        onWheel,
        renderOverlays
    },
    ref
) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isReady, setIsReady] = useState(false);

    // Camera state
    const [camera, setCamera] = useState<ViewportCameraConfig>(initialCamera);
    const cameraRef = useRef(camera);

    // Drag state
    const isDraggingRef = useRef(false);
    const lastMousePosRef = useRef({ x: 0, y: 0 });

    // Keep camera ref in sync
    useEffect(() => {
        cameraRef.current = camera;
    }, [camera]);

    // Screen to world conversion
    const screenToWorld = useCallback((screenX: number, screenY: number): { x: number; y: number } => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };

        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;

        // Convert to canvas pixel coordinates
        const canvasX = (screenX - rect.left) * dpr;
        const canvasY = (screenY - rect.top) * dpr;

        // Convert to centered coordinates (Y-up)
        const centeredX = canvasX - canvas.width / 2;
        const centeredY = canvas.height / 2 - canvasY;

        // Apply inverse zoom and add camera position
        const cam = cameraRef.current;
        const worldX = centeredX / cam.zoom + cam.x;
        const worldY = centeredY / cam.zoom + cam.y;

        return { x: worldX, y: worldY };
    }, []);

    // World to screen conversion
    const worldToScreen = useCallback((worldX: number, worldY: number): { x: number; y: number } => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };

        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        const cam = cameraRef.current;

        // Apply camera transform
        const centeredX = (worldX - cam.x) * cam.zoom;
        const centeredY = (worldY - cam.y) * cam.zoom;

        // Convert from centered coordinates
        const canvasX = centeredX + canvas.width / 2;
        const canvasY = canvas.height / 2 - centeredY;

        // Convert to screen coordinates
        const screenX = canvasX / dpr + rect.left;
        const screenY = canvasY / dpr + rect.top;

        return { x: screenX, y: screenY };
    }, []);

    // Request render
    const requestRender = useCallback(() => {
        const viewportService = ViewportService.getInstance();
        if (viewportService.isInitialized()) {
            viewportService.renderToViewport(viewportId);
        }
    }, [viewportId]);

    // Expose imperative handle
    useImperativeHandle(ref, () => ({
        getCamera: () => cameraRef.current,
        setCamera: (newCamera: ViewportCameraConfig) => {
            setCamera(newCamera);
            onCameraChange?.(newCamera);
        },
        resetCamera: () => {
            setCamera(initialCamera);
            onCameraChange?.(initialCamera);
        },
        screenToWorld,
        worldToScreen,
        getCanvas: () => canvasRef.current,
        requestRender
    }), [initialCamera, screenToWorld, worldToScreen, onCameraChange, requestRender]);

    // Initialize viewport
    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const canvasId = `editor-viewport-canvas-${viewportId}`;
        canvas.id = canvasId;

        const viewportService = ViewportService.getInstance();

        // Wait for service to be initialized
        const checkInit = () => {
            if (viewportService.isInitialized()) {
                // Register viewport
                viewportService.registerViewport(viewportId, canvasId);
                viewportService.setViewportConfig(viewportId, showGrid, showGizmos);
                viewportService.setViewportCamera(viewportId, camera);

                setIsReady(true);
                onReady?.();
            } else {
                // Retry after a short delay
                setTimeout(checkInit, 100);
            }
        };

        checkInit();

        return () => {
            if (viewportService.isInitialized()) {
                viewportService.unregisterViewport(viewportId);
            }
        };
    }, [viewportId]);

    // Update viewport config when props change
    useEffect(() => {
        if (!isReady) return;

        const viewportService = ViewportService.getInstance();
        if (viewportService.isInitialized()) {
            viewportService.setViewportConfig(viewportId, showGrid, showGizmos);
        }
    }, [viewportId, showGrid, showGizmos, isReady]);

    // Sync camera to viewport service
    useEffect(() => {
        if (!isReady) return;

        const viewportService = ViewportService.getInstance();
        if (viewportService.isInitialized()) {
            viewportService.setViewportCamera(viewportId, camera);
        }
    }, [viewportId, camera, isReady]);

    // Handle resize
    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const resizeCanvas = () => {
            const rect = container.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;

            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            canvas.style.width = `${rect.width}px`;
            canvas.style.height = `${rect.height}px`;

            if (isReady) {
                const viewportService = ViewportService.getInstance();
                if (viewportService.isInitialized()) {
                    viewportService.resizeViewport(viewportId, canvas.width, canvas.height);
                }
            }
        };

        resizeCanvas();

        let rafId: number | null = null;
        const resizeObserver = new ResizeObserver(() => {
            if (rafId !== null) {
                cancelAnimationFrame(rafId);
            }
            rafId = requestAnimationFrame(() => {
                resizeCanvas();
                rafId = null;
            });
        });

        resizeObserver.observe(container);

        return () => {
            if (rafId !== null) {
                cancelAnimationFrame(rafId);
            }
            resizeObserver.disconnect();
        };
    }, [viewportId, isReady]);

    // Mouse handlers
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        const worldPos = screenToWorld(e.clientX, e.clientY);

        // Middle or right button for camera pan
        if (enablePan && (e.button === 1 || e.button === 2)) {
            isDraggingRef.current = true;
            lastMousePosRef.current = { x: e.clientX, y: e.clientY };
            e.preventDefault();
        }

        onMouseDown?.(e, worldPos);
    }, [enablePan, screenToWorld, onMouseDown]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        const worldPos = screenToWorld(e.clientX, e.clientY);

        if (isDraggingRef.current && enablePan) {
            const deltaX = e.clientX - lastMousePosRef.current.x;
            const deltaY = e.clientY - lastMousePosRef.current.y;
            const dpr = window.devicePixelRatio || 1;

            setCamera(prev => {
                const newCamera = {
                    ...prev,
                    x: prev.x - (deltaX * dpr) / prev.zoom,
                    y: prev.y + (deltaY * dpr) / prev.zoom
                };
                onCameraChange?.(newCamera);
                return newCamera;
            });

            lastMousePosRef.current = { x: e.clientX, y: e.clientY };
        }

        onMouseMove?.(e, worldPos);
    }, [enablePan, screenToWorld, onMouseMove, onCameraChange]);

    const handleMouseUp = useCallback((e: React.MouseEvent) => {
        const worldPos = screenToWorld(e.clientX, e.clientY);
        isDraggingRef.current = false;
        onMouseUp?.(e, worldPos);
    }, [screenToWorld, onMouseUp]);

    const handleWheel = useCallback((e: React.WheelEvent) => {
        const worldPos = screenToWorld(e.clientX, e.clientY);

        if (enableZoom) {
            e.preventDefault();
            const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;

            setCamera(prev => {
                const newZoom = Math.max(minZoom, Math.min(maxZoom, prev.zoom * zoomFactor));
                const newCamera = { ...prev, zoom: newZoom };
                onCameraChange?.(newCamera);
                return newCamera;
            });
        }

        onWheel?.(e, worldPos);
    }, [enableZoom, minZoom, maxZoom, screenToWorld, onWheel, onCameraChange]);

    const handleContextMenu = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
    }, []);

    return (
        <div
            ref={containerRef}
            className={`editor-viewport ${className || ''}`}
        >
            <canvas
                ref={canvasRef}
                className="editor-viewport-canvas"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onWheel={handleWheel}
                onContextMenu={handleContextMenu}
            />
            {renderOverlays?.()}
        </div>
    );
});

export default EditorViewport;
