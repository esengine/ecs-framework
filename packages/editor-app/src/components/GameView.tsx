import { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, Square, Maximize2, Activity, Globe, QrCode, ChevronDown } from 'lucide-react';
import '../styles/GameView.css';
import { useEngine } from '../hooks/useEngine';
import { EngineService } from '../services/EngineService';
import { Core, Entity } from '@esengine/ecs-framework';
import { MessageHub } from '@esengine/editor-core';
import { CameraComponent, TransformComponent } from '@esengine/ecs-components';

export type PlayState = 'stopped' | 'playing' | 'paused';

interface GameViewProps {
    locale?: string;
    messageHub?: MessageHub;
}

export function GameView({ locale = 'en', messageHub }: GameViewProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [playState, setPlayState] = useState<PlayState>('stopped');
    const [showStats, setShowStats] = useState(false);
    const [showRunMenu, setShowRunMenu] = useState(false);
    const runMenuRef = useRef<HTMLDivElement>(null);

    // Rust engine hook with multi-viewport support (no grid, no gizmos for game view)
    const engine = useEngine({
        viewportId: 'game-viewport',
        canvasId: 'game-view-canvas',
        showGrid: false,
        showGizmos: false,
        autoInit: true
    });

    // Find player camera in scene
    const findPlayerCamera = useCallback((): Entity | null => {
        const scene = Core.scene;
        if (!scene) return null;

        const cameraEntities = scene.entities.findEntitiesWithComponent(CameraComponent);
        return cameraEntities.length > 0 ? cameraEntities[0]! : null;
    }, []);

    // Sync player camera to game viewport
    const syncPlayerCamera = useCallback(() => {
        const cameraEntity = findPlayerCamera();
        const config = cameraEntity ? (() => {
            const transform = cameraEntity.getComponent(TransformComponent);
            const camera = cameraEntity.getComponent(CameraComponent);
            if (transform && camera) {
                const zoom = camera.orthographicSize > 0 ? 1 / camera.orthographicSize : 1;
                return {
                    x: transform.position.x,
                    y: transform.position.y,
                    zoom,
                    rotation: transform.rotation.z
                };
            }
            return { x: 0, y: 0, zoom: 1, rotation: 0 };
        })() : { x: 0, y: 0, zoom: 1, rotation: 0 };

        EngineService.getInstance().setViewportCamera(engine.viewportId, config);
    }, [findPlayerCamera, engine.viewportId]);

    // Canvas setup
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const resizeCanvas = () => {
            if (!canvas || !containerRef.current) return;
            const container = containerRef.current;
            const rect = container.getBoundingClientRect();

            const dpr = window.devicePixelRatio || 1;
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            canvas.style.width = `${rect.width}px`;
            canvas.style.height = `${rect.height}px`;

            EngineService.getInstance().resizeViewport(engine.viewportId, canvas.width, canvas.height);
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        const resizeObserver = new ResizeObserver(() => {
            resizeCanvas();
        });

        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            resizeObserver.disconnect();
        };
    }, [engine.viewportId]);

    // Sync camera when playing
    useEffect(() => {
        if (playState === 'playing' && engine.state.initialized) {
            syncPlayerCamera();
        }
    }, [playState, engine.state.initialized, syncPlayerCamera]);

    // Close run menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (runMenuRef.current && !runMenuRef.current.contains(e.target as Node)) {
                setShowRunMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handlePlay = () => {
        if (playState === 'stopped') {
            // TODO: Save scene snapshot before playing
            setPlayState('playing');
            engine.start();
            syncPlayerCamera();
        } else if (playState === 'paused') {
            setPlayState('playing');
            engine.start();
        }
    };

    const handlePause = () => {
        if (playState === 'playing') {
            setPlayState('paused');
            engine.stop();
        }
    };

    const handleStop = () => {
        setPlayState('stopped');
        engine.stop();
        // TODO: Restore scene snapshot
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

    const handleRunInBrowser = () => {
        setShowRunMenu(false);
        // TODO: Export and run in browser
        console.log('Run in browser - not implemented');
        if (messageHub) {
            messageHub.publish('notification:info', {
                title: locale === 'zh' ? '浏览器运行' : 'Run in Browser',
                message: locale === 'zh' ? '功能开发中...' : 'Feature in development...'
            });
        }
    };

    const handleRunOnDevice = () => {
        setShowRunMenu(false);
        // TODO: Generate QR code for device testing
        console.log('Run on device - not implemented');
        if (messageHub) {
            messageHub.publish('notification:info', {
                title: locale === 'zh' ? '真机运行' : 'Run on Device',
                message: locale === 'zh' ? '功能开发中...' : 'Feature in development...'
            });
        }
    };

    return (
        <div className="game-view" ref={containerRef}>
            <div className="game-view-toolbar">
                <div className="game-view-toolbar-left">
                    {/* Playback controls */}
                    <button
                        className={`game-view-btn ${playState === 'playing' ? 'active' : ''}`}
                        onClick={handlePlay}
                        disabled={playState === 'playing'}
                        title={locale === 'zh' ? '播放' : 'Play'}
                    >
                        <Play size={16} />
                    </button>
                    <button
                        className={`game-view-btn ${playState === 'paused' ? 'active' : ''}`}
                        onClick={handlePause}
                        disabled={playState !== 'playing'}
                        title={locale === 'zh' ? '暂停' : 'Pause'}
                    >
                        <Pause size={16} />
                    </button>
                    <button
                        className="game-view-btn"
                        onClick={handleStop}
                        disabled={playState === 'stopped'}
                        title={locale === 'zh' ? '停止' : 'Stop'}
                    >
                        <Square size={16} />
                    </button>
                    <div className="game-view-divider" />
                    {/* Run options dropdown */}
                    <div className="game-view-dropdown" ref={runMenuRef}>
                        <button
                            className="game-view-btn"
                            onClick={() => setShowRunMenu(!showRunMenu)}
                            title={locale === 'zh' ? '运行选项' : 'Run Options'}
                        >
                            <Globe size={16} />
                            <ChevronDown size={12} />
                        </button>
                        {showRunMenu && (
                            <div className="game-view-dropdown-menu">
                                <button onClick={handleRunInBrowser}>
                                    <Globe size={14} />
                                    {locale === 'zh' ? '浏览器运行' : 'Run in Browser'}
                                </button>
                                <button onClick={handleRunOnDevice}>
                                    <QrCode size={14} />
                                    {locale === 'zh' ? '真机运行' : 'Run on Device'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                <div className="game-view-toolbar-right">
                    <button
                        className={`game-view-btn ${showStats ? 'active' : ''}`}
                        onClick={() => setShowStats(!showStats)}
                        title={locale === 'zh' ? '显示统计信息' : 'Show Stats'}
                    >
                        <Activity size={16} />
                    </button>
                    <button
                        className="game-view-btn"
                        onClick={handleFullscreen}
                        title={locale === 'zh' ? '全屏' : 'Fullscreen'}
                    >
                        <Maximize2 size={16} />
                    </button>
                </div>
            </div>
            <canvas ref={canvasRef} id="game-view-canvas" className="game-view-canvas" />
            {playState === 'stopped' && (
                <div className="game-view-overlay">
                    <div className="game-view-overlay-content">
                        <Play size={48} />
                        <span>{locale === 'zh' ? '点击播放开始游戏' : 'Click Play to start'}</span>
                    </div>
                </div>
            )}
            {showStats && engine.state && (
                <div className="game-view-stats">
                    <div className="game-view-stat">
                        <span className="game-view-stat-label">FPS:</span>
                        <span className="game-view-stat-value">{engine.state.fps}</span>
                    </div>
                    <div className="game-view-stat">
                        <span className="game-view-stat-label">Draw Calls:</span>
                        <span className="game-view-stat-value">{engine.state.drawCalls}</span>
                    </div>
                    <div className="game-view-stat">
                        <span className="game-view-stat-label">Sprites:</span>
                        <span className="game-view-stat-value">{engine.state.spriteCount}</span>
                    </div>
                </div>
            )}
        </div>
    );
}
