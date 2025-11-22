import { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, Square, RotateCcw, Maximize2, Grid3x3, Eye, EyeOff, Activity, MousePointer2, Move, RotateCw, Scaling, Globe, QrCode, ChevronDown } from 'lucide-react';
import '../styles/Viewport.css';
import { useEngine } from '../hooks/useEngine';
import { EngineService } from '../services/EngineService';
import { Core, Entity, SceneSerializer } from '@esengine/ecs-framework';
import { MessageHub } from '@esengine/editor-core';
import { TransformComponent, CameraComponent } from '@esengine/ecs-components';
import { TauriAPI } from '../api/tauri';
import { open } from '@tauri-apps/plugin-shell';
import { RuntimeResolver } from '../services/RuntimeResolver';
import { QRCodeDialog } from './QRCodeDialog';

// Generate runtime HTML for browser preview
function generateRuntimeHtml(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ECS Runtime Preview</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body {
            background: #1e1e1e;
            margin: 0;
            padding: 0;
            overflow: hidden;
            width: 100%;
            height: 100%;
            position: fixed;
        }
        canvas {
            display: block;
            touch-action: none;
            user-select: none;
            -webkit-user-select: none;
            -webkit-user-drag: none;
        }
    </style>
</head>
<body>
    <canvas id="runtime-canvas"></canvas>
    <script src="/runtime.browser.js"></script>
    <script type="module">
        import * as esEngine from '/engine.js';
        (async function() {
            try {
                // Set canvas size before creating runtime
                const canvas = document.getElementById('runtime-canvas');
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;

                const runtime = ECSRuntime.create({
                    canvasId: 'runtime-canvas',
                    width: window.innerWidth,
                    height: window.innerHeight
                });

                await runtime.initialize(esEngine);
                await runtime.loadScene('/scene.json?_=' + Date.now());
                runtime.start();

                window.addEventListener('resize', () => {
                    const canvas = document.getElementById('runtime-canvas');
                    const newWidth = window.innerWidth;
                    const newHeight = window.innerHeight;
                    canvas.width = newWidth;
                    canvas.height = newHeight;
                    runtime.handleResize(newWidth, newHeight);
                });
            } catch (e) {
                console.error('Runtime error:', e);
            }
        })();
    </script>
</body>
</html>`;
}

// Transform tool modes
export type TransformMode = 'select' | 'move' | 'rotate' | 'scale';
export type PlayState = 'stopped' | 'playing' | 'paused';

interface ViewportProps {
  locale?: string;
  messageHub?: MessageHub;
}

export function Viewport({ locale = 'en', messageHub }: ViewportProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [playState, setPlayState] = useState<PlayState>('stopped');
    const [showGrid, setShowGrid] = useState(true);
    const [showGizmos, setShowGizmos] = useState(true);
    const [showStats, setShowStats] = useState(false);
    const [transformMode, setTransformMode] = useState<TransformMode>('select');
    const [showRunMenu, setShowRunMenu] = useState(false);
    const [showQRDialog, setShowQRDialog] = useState(false);
    const [devicePreviewUrl, setDevicePreviewUrl] = useState('');
    const runMenuRef = useRef<HTMLDivElement>(null);

    // Store editor camera state when entering play mode
    const editorCameraRef = useRef({ x: 0, y: 0, zoom: 1 });
    const playStateRef = useRef<PlayState>('stopped');

    // Keep ref in sync with state
    useEffect(() => {
        playStateRef.current = playState;
    }, [playState]);

    // Rust engine hook with multi-viewport support
    const engine = useEngine({
        viewportId: 'editor-viewport',
        canvasId: 'viewport-canvas',
        showGrid: true,
        showGizmos: true,
        autoInit: true
    });

    // Camera state
    const [camera2DOffset, setCamera2DOffset] = useState({ x: 0, y: 0 });
    const [camera2DZoom, setCamera2DZoom] = useState(1);
    const camera2DZoomRef = useRef(1);
    const camera2DOffsetRef = useRef({ x: 0, y: 0 });
    const isDraggingCameraRef = useRef(false);
    const isDraggingTransformRef = useRef(false);
    const lastMousePosRef = useRef({ x: 0, y: 0 });
    const selectedEntityRef = useRef<Entity | null>(null);
    const messageHubRef = useRef<MessageHub | null>(null);
    const transformModeRef = useRef<TransformMode>('select');

    // Keep refs in sync with state
    useEffect(() => {
        camera2DZoomRef.current = camera2DZoom;
    }, [camera2DZoom]);

    useEffect(() => {
        camera2DOffsetRef.current = camera2DOffset;
    }, [camera2DOffset]);

    useEffect(() => {
        transformModeRef.current = transformMode;
    }, [transformMode]);

    // Screen to world coordinate conversion - uses refs to avoid re-registering event handlers
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

        // Apply inverse zoom and add camera position - use refs for current values
        const zoom = camera2DZoomRef.current;
        const offset = camera2DOffsetRef.current;
        const worldX = centeredX / zoom + offset.x;
        const worldY = centeredY / zoom + offset.y;

        return { x: worldX, y: worldY };
    }, []);

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
            // Disable camera/transform manipulation in play mode
            if (playStateRef.current === 'playing') {
                return;
            }

            // Middle mouse button (1) or right button (2) for camera pan
            if (e.button === 1 || e.button === 2) {
                isDraggingCameraRef.current = true;
                lastMousePosRef.current = { x: e.clientX, y: e.clientY };
                canvas.style.cursor = 'grabbing';
                e.preventDefault();
            }
            // Left button (0) for transform or camera pan (if no transform mode active)
            else if (e.button === 0) {
                if (transformModeRef.current === 'select') {
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
                // Camera pan - use ref to avoid stale closure
                const dpr = window.devicePixelRatio || 1;
                const zoom = camera2DZoomRef.current;
                setCamera2DOffset((prev) => ({
                    x: prev.x - (deltaX * dpr) / zoom,
                    y: prev.y + (deltaY * dpr) / zoom
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

                const mode = transformModeRef.current;
                if (mode === 'move') {
                    // Update position
                    transform.position.x += worldDelta.x;
                    transform.position.y += worldDelta.y;
                } else if (mode === 'rotate') {
                    // Horizontal mouse movement controls rotation (in radians)
                    const rotationSpeed = 0.01; // radians per pixel
                    transform.rotation.z += deltaX * rotationSpeed;
                } else if (mode === 'scale') {
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

                // Notify system of transform change for real-time update
                // 通知系统变换更改，用于实时更新
                if (messageHubRef.current) {
                    const propertyName = mode === 'move' ? 'position' : mode === 'rotate' ? 'rotation' : 'scale';
                    messageHubRef.current.publish('component:property:changed', {
                        entity,
                        component: transform,
                        propertyName,
                        value: transform[propertyName]
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

                // Notify Inspector to refresh after transform change
                // 通知 Inspector 在变换更改后刷新
                if (messageHubRef.current && selectedEntityRef.current) {
                    messageHubRef.current.publish('entity:selected', {
                        entity: selectedEntityRef.current
                    });
                }
            }
        };

        // Prevent context menu on right click
        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();
        };

        const handleWheel = (e: WheelEvent) => {
            e.preventDefault();
            // Disable zoom in play mode
            if (playStateRef.current === 'playing') {
                return;
            }
            // Use multiplicative zoom for consistent feel across all zoom levels
            // 使用乘法缩放，在所有缩放级别都有一致的感觉
            const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
            setCamera2DZoom((prev) => Math.max(0.01, Math.min(100, prev * zoomFactor)));
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
    }, []);

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

    // Sync grid and gizmo visibility
    useEffect(() => {
        if (engine.state.initialized) {
            EngineService.getInstance().setShowGrid(showGrid);
            EngineService.getInstance().setShowGizmos(showGizmos);
        }
    }, [showGrid, showGizmos, engine.state.initialized]);

    // Sync transform mode to engine
    useEffect(() => {
        if (engine.state.initialized) {
            EngineService.getInstance().setTransformMode(transformMode);
        }
    }, [transformMode, engine.state.initialized]);

    // Find player camera in scene
    const findPlayerCamera = useCallback((): Entity | null => {
        const scene = Core.scene;
        if (!scene) return null;

        const cameraEntities = scene.entities.findEntitiesWithComponent(CameraComponent);
        return cameraEntities.length > 0 ? cameraEntities[0]! : null;
    }, []);

    // Sync player camera to viewport when playing
    const syncPlayerCamera = useCallback(() => {
        const cameraEntity = findPlayerCamera();
        if (!cameraEntity) return;

        const transform = cameraEntity.getComponent(TransformComponent);
        const camera = cameraEntity.getComponent(CameraComponent);
        if (transform && camera) {
            const zoom = camera.orthographicSize > 0 ? 1 / camera.orthographicSize : 1;
            setCamera2DOffset({ x: transform.position.x, y: transform.position.y });
            setCamera2DZoom(zoom);

            // Set background color from camera
            const bgColor = camera.backgroundColor || '#000000';
            const r = parseInt(bgColor.slice(1, 3), 16) / 255;
            const g = parseInt(bgColor.slice(3, 5), 16) / 255;
            const b = parseInt(bgColor.slice(5, 7), 16) / 255;
            EngineService.getInstance().setClearColor(r, g, b, 1.0);
        }
    }, [findPlayerCamera]);

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
            // Check if there's a camera entity
            const cameraEntity = findPlayerCamera();
            if (!cameraEntity) {
                const warningMessage = locale === 'zh'
                    ? '缺少相机: 场景中没有相机实体，请添加一个带有Camera组件的实体'
                    : 'Missing Camera: No camera entity in scene. Please add an entity with Camera component.';
                if (messageHub) {
                    messageHub.publish('notification:show', {
                        message: warningMessage,
                        type: 'warning',
                        timestamp: Date.now()
                    });
                } else {
                    console.warn(warningMessage);
                }
                return;
            }
            // Save scene snapshot before playing
            EngineService.getInstance().saveSceneSnapshot();
            // Save editor camera state
            editorCameraRef.current = { x: camera2DOffset.x, y: camera2DOffset.y, zoom: camera2DZoom };
            setPlayState('playing');
            // Hide grid and gizmos in play mode
            EngineService.getInstance().setShowGrid(false);
            EngineService.getInstance().setShowGizmos(false);
            // Switch to player camera
            syncPlayerCamera();
            engine.start();
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
        // Restore scene snapshot
        EngineService.getInstance().restoreSceneSnapshot();
        // Restore editor camera state
        setCamera2DOffset({ x: editorCameraRef.current.x, y: editorCameraRef.current.y });
        setCamera2DZoom(editorCameraRef.current.zoom);
        // Restore grid and gizmos
        EngineService.getInstance().setShowGrid(showGrid);
        EngineService.getInstance().setShowGizmos(showGizmos);
        // Restore editor default background color
        EngineService.getInstance().setClearColor(0.1, 0.1, 0.12, 1.0);
    };

    const handleReset = () => {
        // Reset camera to origin without stopping playback
        setCamera2DOffset({ x: 0, y: 0 });
        setCamera2DZoom(1);
    };

    const handleRunInBrowser = async () => {
        setShowRunMenu(false);

        try {
            const engineService = EngineService.getInstance();
            const scene = engineService.getScene();
            if (!scene) {
                messageHub?.publish('notification:error', {
                    title: locale === 'zh' ? '错误' : 'Error',
                    message: locale === 'zh' ? '没有可运行的场景' : 'No scene to run'
                });
                return;
            }

            // Serialize current scene
            const serialized = SceneSerializer.serialize(scene, {
                format: 'json',
                pretty: true,
                includeMetadata: true
            });

            // Ensure we have string data
            const sceneData = typeof serialized === 'string'
                ? serialized
                : new TextDecoder().decode(serialized);

            // Get temp directory and create runtime files
            const tempDir = await TauriAPI.getTempDir();
            const runtimeDir = `${tempDir}/ecs-runtime`;

            // Create runtime directory
            const dirExists = await TauriAPI.pathExists(runtimeDir);
            if (!dirExists) {
                await TauriAPI.createDirectory(runtimeDir);
            }

            // Use RuntimeResolver to copy runtime files
            // 使用 RuntimeResolver 复制运行时文件
            const runtimeResolver = RuntimeResolver.getInstance();
            await runtimeResolver.initialize();
            await runtimeResolver.prepareRuntimeFiles(runtimeDir);

            // Write scene data and HTML (always update)
            await TauriAPI.writeFileContent(`${runtimeDir}/scene.json`, sceneData);

            // Copy texture assets referenced in the scene
            // 复制场景中引用的纹理资产
            const sceneObj = JSON.parse(sceneData);
            const texturePathSet = new Set<string>();

            // Find all texture paths in sprite components
            if (sceneObj.entities) {
                for (const entity of sceneObj.entities) {
                    if (entity.components) {
                        for (const comp of entity.components) {
                            if (comp.type === 'Sprite' && comp.data?.texture) {
                                texturePathSet.add(comp.data.texture);
                            }
                        }
                    }
                }
            }

            // Create assets directory and copy textures
            const assetsDir = `${runtimeDir}\\assets`;
            const assetsDirExists = await TauriAPI.pathExists(assetsDir);
            if (!assetsDirExists) {
                await TauriAPI.createDirectory(assetsDir);
            }

            for (const texturePath of texturePathSet) {
                if (texturePath && (texturePath.includes(':\\') || texturePath.startsWith('/'))) {
                    try {
                        const filename = texturePath.split(/[\\\/]/).pop() || '';
                        const destPath = `${assetsDir}\\${filename}`;
                        const exists = await TauriAPI.pathExists(texturePath);
                        if (exists) {
                            await TauriAPI.copyFile(texturePath, destPath);
                        }
                    } catch (error) {
                        console.error(`Failed to copy texture ${texturePath}:`, error);
                    }
                }
            }

            const runtimeHtml = generateRuntimeHtml();
            await TauriAPI.writeFileContent(`${runtimeDir}/index.html`, runtimeHtml);

            // Start local server and open browser
            const serverUrl = await TauriAPI.startLocalServer(runtimeDir, 3333);
            await open(serverUrl);

            messageHub?.publish('notification:success', {
                title: locale === 'zh' ? '浏览器运行' : 'Run in Browser',
                message: locale === 'zh' ? `已在浏览器中打开: ${serverUrl}` : `Opened in browser: ${serverUrl}`
            });
        } catch (error) {
            console.error('Failed to run in browser:', error);
            messageHub?.publish('notification:error', {
                title: locale === 'zh' ? '运行失败' : 'Run Failed',
                message: String(error)
            });
        }
    };

    const handleRunOnDevice = async () => {
        setShowRunMenu(false);

        if (!Core.scene) {
            if (messageHub) {
                messageHub.publish('notification:warning', {
                    title: locale === 'zh' ? '无场景' : 'No Scene',
                    message: locale === 'zh' ? '请先创建场景' : 'Please create a scene first'
                });
            }
            return;
        }

        try {
            // Get scene data
            const sceneData = SceneSerializer.serialize(Core.scene);

            // Get temp directory and create runtime folder
            const tempDir = await TauriAPI.getTempDir();
            const runtimeDir = `${tempDir}\\ecs-device-preview`;

            // Create directory
            const dirExists = await TauriAPI.pathExists(runtimeDir);
            if (!dirExists) {
                await TauriAPI.createDirectory(runtimeDir);
            }

            // Use RuntimeResolver to copy runtime files
            const runtimeResolver = RuntimeResolver.getInstance();
            await runtimeResolver.initialize();
            await runtimeResolver.prepareRuntimeFiles(runtimeDir);

            // Write scene data and HTML
            const sceneDataStr = typeof sceneData === 'string' ? sceneData : new TextDecoder().decode(sceneData);
            await TauriAPI.writeFileContent(`${runtimeDir}/scene.json`, sceneDataStr);
            await TauriAPI.writeFileContent(`${runtimeDir}/index.html`, generateRuntimeHtml());

            // Copy textures referenced in scene
            const assetsDir = `${runtimeDir}\\assets`;
            const assetsDirExists = await TauriAPI.pathExists(assetsDir);
            if (!assetsDirExists) {
                await TauriAPI.createDirectory(assetsDir);
            }

            // Collect texture paths from scene data
            const texturePathSet = new Set<string>();
            try {
                const entityData = JSON.parse(sceneDataStr);
                if (entityData.entities) {
                    for (const ent of entityData.entities) {
                        if (ent.components) {
                            for (const comp of ent.components) {
                                if (comp.texture && typeof comp.texture === 'string') {
                                    texturePathSet.add(comp.texture);
                                }
                            }
                        }
                    }
                }
            } catch (e) {
                console.error('Failed to parse scene data for textures:', e);
            }

            // Copy texture files
            for (const texturePath of texturePathSet) {
                if (texturePath && (texturePath.includes(':\\') || texturePath.startsWith('/'))) {
                    try {
                        const filename = texturePath.split(/[\\\/]/).pop() || '';
                        const destPath = `${assetsDir}\\${filename}`;
                        const exists = await TauriAPI.pathExists(texturePath);
                        if (exists) {
                            await TauriAPI.copyFile(texturePath, destPath);
                        }
                    } catch (error) {
                        console.error(`Failed to copy texture ${texturePath}:`, error);
                    }
                }
            }

            // Get local IP and start server
            const localIp = await TauriAPI.getLocalIp();
            const port = 3333;
            await TauriAPI.startLocalServer(runtimeDir, port);

            // Generate preview URL
            const previewUrl = `http://${localIp}:${port}`;
            setDevicePreviewUrl(previewUrl);
            setShowQRDialog(true);

            if (messageHub) {
                messageHub.publish('notification:success', {
                    title: locale === 'zh' ? '服务器已启动' : 'Server Started',
                    message: locale === 'zh' ? `预览地址: ${previewUrl}` : `Preview URL: ${previewUrl}`
                });
            }
        } catch (error) {
            console.error('Failed to run on device:', error);
            if (messageHub) {
                messageHub.publish('notification:error', {
                    title: locale === 'zh' ? '启动失败' : 'Failed to Start',
                    message: error instanceof Error ? error.message : String(error)
                });
            }
        }
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
        const activeElement = document.activeElement;
        if (activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement) {
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
                        className={`viewport-btn ${playState === 'playing' ? 'active' : ''}`}
                        onClick={handlePlay}
                        disabled={playState === 'playing'}
                        title={locale === 'zh' ? '播放' : 'Play'}
                    >
                        <Play size={16} />
                    </button>
                    <button
                        className={`viewport-btn ${playState === 'paused' ? 'active' : ''}`}
                        onClick={handlePause}
                        disabled={playState !== 'playing'}
                        title={locale === 'zh' ? '暂停' : 'Pause'}
                    >
                        <Pause size={16} />
                    </button>
                    <button
                        className="viewport-btn"
                        onClick={handleStop}
                        disabled={playState === 'stopped'}
                        title={locale === 'zh' ? '停止' : 'Stop'}
                    >
                        <Square size={16} />
                    </button>
                    <div className="viewport-divider" />
                    {/* Run options dropdown */}
                    <div className="viewport-dropdown" ref={runMenuRef}>
                        <button
                            className="viewport-btn"
                            onClick={() => setShowRunMenu(!showRunMenu)}
                            title={locale === 'zh' ? '运行选项' : 'Run Options'}
                        >
                            <Globe size={16} />
                            <ChevronDown size={12} />
                        </button>
                        {showRunMenu && (
                            <div className="viewport-dropdown-menu">
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

            <QRCodeDialog
                url={devicePreviewUrl}
                isOpen={showQRDialog}
                onClose={() => setShowQRDialog(false)}
            />
        </div>
    );
}
