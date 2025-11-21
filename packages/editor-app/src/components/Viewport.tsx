import { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Maximize2, Grid3x3, Eye, EyeOff, Activity } from 'lucide-react';
import '../styles/Viewport.css';
import { useEngine } from '../hooks/useEngine';
import { EngineService } from '../services/EngineService';

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

    // Rust engine hook - always active for 2D rendering
    const engine = useEngine('viewport-canvas', true);

    // Camera state
    const [camera2DOffset, setCamera2DOffset] = useState({ x: 0, y: 0 });
    const [camera2DZoom, setCamera2DZoom] = useState(1);
    const isDraggingRef = useRef(false);
    const lastMousePosRef = useRef({ x: 0, y: 0 });

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
            if (e.button === 0) {
                isDraggingRef.current = true;
                lastMousePosRef.current = { x: e.clientX, y: e.clientY };
                canvas.style.cursor = 'grabbing';
                e.preventDefault();
            }
        };

        const handleMouseMove = (e: MouseEvent) => {
            if (!isDraggingRef.current) return;

            const deltaX = e.clientX - lastMousePosRef.current.x;
            const deltaY = e.clientY - lastMousePosRef.current.y;

            // Convert screen pixels to world units: world_delta = screen_delta / zoom
            // This ensures the point under the mouse stays under the mouse during drag
            const dpr = window.devicePixelRatio || 1;
            setCamera2DOffset((prev) => ({
                x: prev.x - (deltaX * dpr) / camera2DZoom,
                y: prev.y + (deltaY * dpr) / camera2DZoom
            }));

            lastMousePosRef.current = { x: e.clientX, y: e.clientY };
        };

        const handleMouseUp = () => {
            if (isDraggingRef.current) {
                isDraggingRef.current = false;
                canvas.style.cursor = 'grab';
            }
        };

        const handleWheel = (e: WheelEvent) => {
            e.preventDefault();
            // Zoom range 0.01-100
            setCamera2DZoom((prev) => Math.max(0.01, Math.min(100, prev - e.deltaY * 0.001)));
        };

        canvas.addEventListener('mousedown', handleMouseDown);
        canvas.addEventListener('wheel', handleWheel, { passive: false });
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            resizeObserver.disconnect();
            canvas.removeEventListener('mousedown', handleMouseDown);
            canvas.removeEventListener('wheel', handleWheel);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [camera2DZoom]);

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

    return (
        <div className="viewport" ref={containerRef}>
            <div className="viewport-toolbar">
                <div className="viewport-toolbar-left">
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
