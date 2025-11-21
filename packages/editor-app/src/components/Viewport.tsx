import { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, RotateCcw, Maximize2, Grid3x3, Eye, EyeOff, Activity, MousePointer2, Move, RotateCw, Scaling } from 'lucide-react';
import '../styles/Viewport.css';
import { useEngine } from '../hooks/useEngine';
import { EngineService } from '../services/EngineService';
import { Core, Entity } from '@esengine/ecs-framework';
import { MessageHub } from '@esengine/editor-core';
import { TransformComponent } from '@esengine/ecs-components';

// Transform tool modes
export type TransformMode = 'select' | 'move' | 'rotate' | 'scale';

interface ViewportProps {
  locale?: string;
}

export function Viewport({ locale = 'en' }: ViewportProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [showGrid, setShowGrid] = useState(true);
    const [showGizmos, setShowGizmos] = useState(true);
    const [showStats, setShowStats] = useState(false);
    const [transformMode, setTransformMode] = useState<TransformMode>('select');

    // Rust engine hook - always active for 2D rendering
    const engine = useEngine('viewport-canvas', true);

    // Camera state
    const [camera2DOffset, setCamera2DOffset] = useState({ x: 0, y: 0 });
    const [camera2DZoom, setCamera2DZoom] = useState(1);
    const isDraggingCameraRef = useRef(false);
    const isDraggingTransformRef = useRef(false);
    const lastMousePosRef = useRef({ x: 0, y: 0 });
    const selectedEntityRef = useRef<Entity | null>(null);
    const messageHubRef = useRef<MessageHub | null>(null);

    // Screen to world coordinate conversion
    const screenToWorld = useCallback((screenX: number, screenY: number) => {
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
        const worldX = centeredX / camera2DZoom + camera2DOffset.x;
        const worldY = centeredY / camera2DZoom + camera2DOffset.y;

        return { x: worldX, y: worldY };
    }, [camera2DZoom, camera2DOffset]);

    // Subscribe to entity selection events
    useEffect(() => {
        const hub = Core.services.tryResolve(MessageHub);
        if (hub) {
            messageHubRef.current = hub;
            const unsub = hub.subscribe('entity:selected', (data: { entity: Entity | null }) => {
                selectedEntityRef.current = data.entity;
            });
            return () => unsub();
        }
    }, []);

    // Canvas setup and input handling
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.style.cursor = 'grab';

        const resizeCanvas = () => {
            if (!canvas || !containerRef.current) return;
            const container = containerRef.current;
            const rect = container.getBoundingClientRect();

            const dpr = window.devicePixelRatio || 1;
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            canvas.style.width = `${rect.width}px`;
            canvas.style.height = `${rect.height}px`;

            EngineService.getInstance().resize(canvas.width, canvas.height);
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        const resizeObserver = new ResizeObserver(() => {
            resizeCanvas();
        });

        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }

        const handleMouseDown = (e: MouseEvent) => {
            // Middle mouse button (1) or right button (2) for camera pan
            if (e.button === 1 || e.button === 2) {
                isDraggingCameraRef.current = true;
                lastMousePosRef.current = { x: e.clientX, y: e.clientY };
                canvas.style.cursor = 'grabbing';
                e.preventDefault();
            }
            // Left button (0) for transform or camera pan (if no transform mode active)
            else if (e.button === 0) {
                if (transformMode === 'select') {
                    // In select mode, left click pans camera
                    isDraggingCameraRef.current = true;
                    canvas.style.cursor = 'grabbing';
                } else {
                    // In transform mode, left click transforms entity
                    isDraggingTransformRef.current = true;
                    canvas.style.cursor = 'move';
                }
                lastMousePosRef.current = { x: e.clientX, y: e.clientY };
                e.preventDefault();
            }
        };

        const handleMouseMove = (e: MouseEvent) => {
            const deltaX = e.clientX - lastMousePosRef.current.x;
            const deltaY = e.clientY - lastMousePosRef.current.y;

            if (isDraggingCameraRef.current) {
                // Camera pan
                const dpr = window.devicePixelRatio || 1;
                setCamera2DOffset((prev) => ({
                    x: prev.x - (deltaX * dpr) / camera2DZoom,
                    y: prev.y + (deltaY * dpr) / camera2DZoom
                }));
            } else if (isDraggingTransformRef.current) {
                // Transform selected entity based on mode
                const entity = selectedEntityRef.current;
                if (!entity) return;

                const transform = entity.getComponent(TransformComponent);
                if (!transform) return;

                const worldStart = screenToWorld(lastMousePosRef.current.x, lastMousePosRef.current.y);
                const worldEnd = screenToWorld(e.clientX, e.clientY);
                const worldDelta = {
                    x: worldEnd.x - worldStart.x,
                    y: worldEnd.y - worldStart.y
                };

                if (transformMode === 'move') {
                    // Update position
                    transform.position.x += worldDelta.x;
                    transform.position.y += worldDelta.y;
                } else if (transformMode === 'rotate') {
                    // Horizontal mouse movement controls rotation (in radians)
                    const rotationSpeed = 0.01; // radians per pixel
                    transform.rotation.z += deltaX * rotationSpeed;
                } else if (transformMode === 'scale') {
                    // Scale based on distance from center
                    const centerX = transform.position.x;
                    const centerY = transform.position.y;
                    const startDist = Math.sqrt((worldStart.x - centerX) ** 2 + (worldStart.y - centerY) ** 2);
                    const endDist = Math.sqrt((worldEnd.x - centerX) ** 2 + (worldEnd.y - centerY) ** 2);
                    if (startDist > 0) {
                        const scaleFactor = endDist / startDist;
                        transform.scale.x *= scaleFactor;
                        transform.scale.y *= scaleFactor;
                    }
                }

                // Notify system of transform change
                if (messageHubRef.current) {
                    messageHubRef.current.publish('component:updated', {
                        entity,
                        component: transform,
                        propertyName: transformMode === 'move' ? 'position' : transformMode === 'rotate' ? 'rotation' : 'scale'
                    });
                }
            } else {
                return;
            }

            lastMousePosRef.current = { x: e.clientX, y: e.clientY };
        };

        const handleMouseUp = () => {
            if (isDraggingCameraRef.current) {
                isDraggingCameraRef.current = false;
                canvas.style.cursor = 'grab';
            }
            if (isDraggingTransformRef.current) {
                isDraggingTransformRef.current = false;
                canvas.style.cursor = 'grab';
            }
        };

        // Prevent context menu on right click
        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();
        };

        const handleWheel = (e: WheelEvent) => {
            e.preventDefault();
            // Zoom range 0.01-100
            setCamera2DZoom((prev) => Math.max(0.01, Math.min(100, prev - e.deltaY * 0.001)));
        };

        canvas.addEventListener('mousedown', handleMouseDown);
        canvas.addEventListener('wheel', handleWheel, { passive: false });
        canvas.addEventListener('contextmenu', handleContextMenu);
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            resizeObserver.disconnect();
            canvas.removeEventListener('mousedown', handleMouseDown);
            canvas.removeEventListener('wheel', handleWheel);
            canvas.removeEventListener('contextmenu', handleContextMenu);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [camera2DZoom, transformMode, screenToWorld]);

    // Sync camera state to engine
    useEffect(() => {
        if (engine.state.initialized) {
            EngineService.getInstance().setCamera({
                x: camera2DOffset.x,
                y: camera2DOffset.y,
                zoom: camera2DZoom,
                rotation: 0
            });
        }
    }, [camera2DOffset, camera2DZoom, engine.state.initialized]);

    // Sync grid visibility to engine
    useEffect(() => {
        if (engine.state.initialized) {
            EngineService.getInstance().setShowGrid(showGrid);
        }
    }, [showGrid, engine.state.initialized]);

    // Sync gizmo visibility to engine
    useEffect(() => {
        if (engine.state.initialized) {
            EngineService.getInstance().setShowGizmos(showGizmos);
        }
    }, [showGizmos, engine.state.initialized]);

    // Sync transform mode to engine
    useEffect(() => {
        if (engine.state.initialized) {
            EngineService.getInstance().setTransformMode(transformMode);
        }
    }, [transformMode, engine.state.initialized]);

    const handlePlayPause = () => {
        const newPlaying = !isPlaying;
        setIsPlaying(newPlaying);

        if (engine.state.initialized) {
            if (newPlaying) {
                engine.start();
            } else {
                engine.stop();
            }
        }
    };

    const handleReset = () => {
        setIsPlaying(false);
        setCamera2DOffset({ x: 0, y: 0 });
        setCamera2DZoom(1);
    };

    const handleFullscreen = () => {
        if (containerRef.current) {
            if (document.fullscreenElement) {
                document.exitFullscreen();
            } else {
                containerRef.current.requestFullscreen();
            }
        }
    };

    // Keyboard shortcuts for transform tools
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        // Don't handle if input is focused
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
            return;
        }

        switch (e.key.toLowerCase()) {
            case 'q':
                setTransformMode('select');
                break;
            case 'w':
                setTransformMode('move');
                break;
            case 'e':
                setTransformMode('rotate');
                break;
            case 'r':
                setTransformMode('scale');
                break;
        }
    }, []);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    return (
        <div className="viewport" ref={containerRef}>
            <div className="viewport-toolbar">
                <div className="viewport-toolbar-left">
                    {/* Transform tools */}
                    <button
                        className={`viewport-btn ${transformMode === 'select' ? 'active' : ''}`}
                        onClick={() => setTransformMode('select')}
                        title={locale === 'zh' ? '选择 (Q)' : 'Select (Q)'}
                    >
                        <MousePointer2 size={16} />
                    </button>
                    <button
                        className={`viewport-btn ${transformMode === 'move' ? 'active' : ''}`}
                        onClick={() => setTransformMode('move')}
                        title={locale === 'zh' ? '移动 (W)' : 'Move (W)'}
                    >
                        <Move size={16} />
                    </button>
                    <button
                        className={`viewport-btn ${transformMode === 'rotate' ? 'active' : ''}`}
                        onClick={() => setTransformMode('rotate')}
                        title={locale === 'zh' ? '旋转 (E)' : 'Rotate (E)'}
                    >
                        <RotateCw size={16} />
                    </button>
                    <button
                        className={`viewport-btn ${transformMode === 'scale' ? 'active' : ''}`}
                        onClick={() => setTransformMode('scale')}
                        title={locale === 'zh' ? '缩放 (R)' : 'Scale (R)'}
                    >
                        <Scaling size={16} />
                    </button>
                    <div className="viewport-divider" />
                    {/* Playback controls */}
                    <button
                        className={`viewport-btn ${isPlaying ? 'active' : ''}`}
                        onClick={handlePlayPause}
                        title={isPlaying ? (locale === 'zh' ? '暂停' : 'Pause') : (locale === 'zh' ? '播放' : 'Play')}
                    >
                        {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                    </button>
                    <button
                        className="viewport-btn"
                        onClick={handleReset}
                        title={locale === 'zh' ? '重置' : 'Reset'}
                    >
                        <RotateCcw size={16} />
                    </button>
                    <div className="viewport-divider" />
                    <button
                        className={`viewport-btn ${showGrid ? 'active' : ''}`}
                        onClick={() => setShowGrid(!showGrid)}
                        title={locale === 'zh' ? '显示网格' : 'Show Grid'}
                    >
                        <Grid3x3 size={16} />
                    </button>
                    <button
                        className={`viewport-btn ${showGizmos ? 'active' : ''}`}
                        onClick={() => setShowGizmos(!showGizmos)}
                        title={locale === 'zh' ? '显示辅助工具' : 'Show Gizmos'}
                    >
                        {showGizmos ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                </div>
                <div className="viewport-toolbar-right">
                    <button
                        className={`viewport-btn ${showStats ? 'active' : ''}`}
                        onClick={() => setShowStats(!showStats)}
                        title={locale === 'zh' ? '显示统计信息' : 'Show Stats'}
                    >
                        <Activity size={16} />
                    </button>
                    <button
                        className="viewport-btn"
                        onClick={handleFullscreen}
                        title={locale === 'zh' ? '全屏' : 'Fullscreen'}
                    >
                        <Maximize2 size={16} />
                    </button>
                </div>
            </div>
            <canvas ref={canvasRef} id="viewport-canvas" className="viewport-canvas" />
            {showStats && (
                <div className="viewport-stats">
                    <div className="viewport-stat">
                        <span className="viewport-stat-label">FPS:</span>
                        <span className="viewport-stat-value">{engine.state.fps}</span>
                    </div>
                    <div className="viewport-stat">
                        <span className="viewport-stat-label">Draw Calls:</span>
                        <span className="viewport-stat-value">{engine.state.drawCalls}</span>
                    </div>
                    <div className="viewport-stat">
                        <span className="viewport-stat-label">Sprites:</span>
                        <span className="viewport-stat-value">{engine.state.spriteCount}</span>
                    </div>
                    {engine.state.error && (
                        <div className="viewport-stat viewport-stat-error">
                            <span className="viewport-stat-label">Error:</span>
                            <span className="viewport-stat-value">{engine.state.error}</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
