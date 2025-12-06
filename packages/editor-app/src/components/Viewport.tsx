import { useEffect, useRef, useState, useCallback } from 'react';
import {
    RotateCcw, Maximize2, Grid3x3, Eye, EyeOff, Activity,
    MousePointer2, Move, RotateCw, Scaling, Globe, QrCode, ChevronDown,
    Magnet, ZoomIn
} from 'lucide-react';
import '../styles/Viewport.css';
import { useEngine } from '../hooks/useEngine';
import { EngineService } from '../services/EngineService';
import { Core, Entity, SceneSerializer } from '@esengine/ecs-framework';
import { MessageHub, ProjectService, AssetRegistryService } from '@esengine/editor-core';
import { TransformComponent } from '@esengine/engine-core';
import { CameraComponent } from '@esengine/camera';
import { UITransformComponent } from '@esengine/ui';
import { TauriAPI } from '../api/tauri';
import { open } from '@tauri-apps/plugin-shell';
import { RuntimeResolver } from '../services/RuntimeResolver';
import { QRCodeDialog } from './QRCodeDialog';

import type { ModuleManifest } from '../services/RuntimeResolver';

/**
 * Generate runtime HTML for browser preview using ES Modules with import maps
 * 使用 ES 模块和 import maps 生成浏览器预览的运行时 HTML
 *
 * This matches the structure of published builds for consistency
 * 这与发布构建的结构一致
 *
 * @param importMap - Import map for module resolution
 * @param modules - Module manifests for plugin loading
 * @param hasUserRuntime - Whether user-runtime.js exists and should be loaded
 */
function generateRuntimeHtml(importMap: Record<string, string>, modules: ModuleManifest[], hasUserRuntime: boolean = false): string {
    const importMapScript = `<script type="importmap">
    ${JSON.stringify({ imports: importMap }, null, 2).split('\n').join('\n    ')}
    </script>`;

    // Generate plugin import code for modules with pluginExport
    // Only modules with pluginExport are considered runtime plugins
    // Core/infrastructure modules don't need to be registered as plugins
    const pluginModules = modules.filter(m => m.pluginExport);

    const pluginImportCode = pluginModules.map(m =>
        `                try {
                    const { ${m.pluginExport} } = await import('@esengine/${m.id}');
                    runtime.registerPlugin(${m.pluginExport});
                } catch (e) {
                    console.warn('[Preview] Failed to load plugin ${m.id}:', e.message);
                }`
    ).join('\n');

    // Generate user runtime loading code
    // 生成用户运行时加载代码
    const userRuntimeCode = hasUserRuntime ? `
            updateLoading('Loading user scripts...');
            try {
                // Import ECS framework and set up global for user-runtime.js shim
                // 导入 ECS 框架并为 user-runtime.js 设置全局变量
                const ecsFramework = await import('@esengine/ecs-framework');
                window.__ESENGINE__ = window.__ESENGINE__ || {};
                window.__ESENGINE__.ecsFramework = ecsFramework;

                // Load user-runtime.js which contains compiled user components
                // 加载 user-runtime.js，其中包含编译的用户组件
                const userRuntimeScript = document.createElement('script');
                userRuntimeScript.src = './user-runtime.js?_=' + Date.now();
                await new Promise((resolve, reject) => {
                    userRuntimeScript.onload = resolve;
                    userRuntimeScript.onerror = reject;
                    document.head.appendChild(userRuntimeScript);
                });

                // Register user components to ComponentRegistry
                // 将用户组件注册到 ComponentRegistry
                if (window.__USER_RUNTIME_EXPORTS__) {
                    const { ComponentRegistry, Component } = ecsFramework;
                    const exports = window.__USER_RUNTIME_EXPORTS__;
                    for (const [name, exported] of Object.entries(exports)) {
                        if (typeof exported === 'function' && exported.prototype instanceof Component) {
                            ComponentRegistry.register(exported);
                            console.log('[Preview] Registered user component:', name);
                        }
                    }
                }
            } catch (e) {
                console.warn('[Preview] Failed to load user scripts:', e.message);
            }
` : '';

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <title>ECS Runtime Preview</title>
${importMapScript}
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { width: 100%; height: 100%; overflow: hidden; background: #1a1a2e; }
        #game-canvas { width: 100%; height: 100%; display: block; }
        #loading {
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            display: flex; flex-direction: column;
            align-items: center; justify-content: center;
            background: #1a1a2e; color: #eee; font-family: sans-serif;
        }
        #loading .spinner {
            width: 40px; height: 40px; border: 3px solid #333;
            border-top-color: #4a9eff; border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        #loading .message { margin-top: 16px; font-size: 14px; }
        @keyframes spin { to { transform: rotate(360deg); } }
        #error {
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            display: none; flex-direction: column;
            align-items: center; justify-content: center;
            background: #1a1a2e; color: #ff6b6b; font-family: sans-serif;
            padding: 20px; text-align: center;
        }
        #error.show { display: flex; }
        #error h2 { margin-bottom: 16px; }
        #error pre {
            background: rgba(0,0,0,0.3); padding: 16px; border-radius: 8px;
            max-width: 600px; white-space: pre-wrap; word-break: break-word;
            font-size: 13px; line-height: 1.5;
        }
    </style>
</head>
<body>
    <div id="loading">
        <div class="spinner"></div>
        <div class="message" id="loading-message">Loading...</div>
    </div>
    <div id="error">
        <h2 id="error-title">Failed to start</h2>
        <pre id="error-message"></pre>
    </div>
    <canvas id="game-canvas"></canvas>

    <script type="module">
        const loading = document.getElementById('loading');
        const loadingMessage = document.getElementById('loading-message');
        const errorDiv = document.getElementById('error');
        const errorTitle = document.getElementById('error-title');
        const errorMessage = document.getElementById('error-message');

        function showError(title, msg) {
            loading.style.display = 'none';
            errorTitle.textContent = title || 'Failed to start';
            errorMessage.textContent = msg;
            errorDiv.classList.add('show');
            console.error('[Preview]', msg);
        }

        function updateLoading(msg) {
            loadingMessage.textContent = msg;
            console.log('[Preview]', msg);
        }

        try {
            updateLoading('Loading runtime...');
            const ECSRuntime = (await import('@esengine/platform-web')).default;

            updateLoading('Loading WASM module...');
            const wasmModule = await import('./libs/es-engine/es_engine.js');

            updateLoading('Initializing runtime...');
            const runtime = ECSRuntime.create({
                canvasId: 'game-canvas',
                width: window.innerWidth,
                height: window.innerHeight,
                assetBaseUrl: './assets',
                projectConfigUrl: './ecs-editor.config.json'
            });

            updateLoading('Loading plugins...');
${pluginImportCode}

            await runtime.initialize(wasmModule);
${userRuntimeCode}
            updateLoading('Loading scene...');
            await runtime.loadScene('./scene.json?_=' + Date.now());

            loading.style.display = 'none';
            runtime.start();

            window.addEventListener('resize', () => {
                runtime.handleResize(window.innerWidth, window.innerHeight);
            });
            console.log('[Preview] Started successfully');
        } catch (error) {
            showError(null, error.message || String(error));
        }
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

    // Snap settings
    const [snapEnabled, setSnapEnabled] = useState(true);
    const [gridSnapValue, setGridSnapValue] = useState(10);
    const [rotationSnapValue, setRotationSnapValue] = useState(15);
    const [scaleSnapValue, setScaleSnapValue] = useState(0.25);
    const [showGridSnapMenu, setShowGridSnapMenu] = useState(false);
    const [showRotationSnapMenu, setShowRotationSnapMenu] = useState(false);
    const [showScaleSnapMenu, setShowScaleSnapMenu] = useState(false);
    const gridSnapMenuRef = useRef<HTMLDivElement>(null);
    const rotationSnapMenuRef = useRef<HTMLDivElement>(null);
    const scaleSnapMenuRef = useRef<HTMLDivElement>(null);

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
    const snapEnabledRef = useRef(true);
    const gridSnapRef = useRef(10);
    const rotationSnapRef = useRef(15);
    const scaleSnapRef = useRef(0.25);

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

    useEffect(() => {
        snapEnabledRef.current = snapEnabled;
    }, [snapEnabled]);

    useEffect(() => {
        gridSnapRef.current = gridSnapValue;
    }, [gridSnapValue]);

    useEffect(() => {
        rotationSnapRef.current = rotationSnapValue;
    }, [rotationSnapValue]);

    useEffect(() => {
        scaleSnapRef.current = scaleSnapValue;
    }, [scaleSnapValue]);

    // Snap helper functions
    const snapToGrid = useCallback((value: number): number => {
        if (!snapEnabledRef.current || gridSnapRef.current <= 0) return value;
        return Math.round(value / gridSnapRef.current) * gridSnapRef.current;
    }, []);

    const snapRotation = useCallback((value: number): number => {
        if (!snapEnabledRef.current || rotationSnapRef.current <= 0) return value;
        const degrees = (value * 180) / Math.PI;
        const snappedDegrees = Math.round(degrees / rotationSnapRef.current) * rotationSnapRef.current;
        return (snappedDegrees * Math.PI) / 180;
    }, []);

    const snapScale = useCallback((value: number): number => {
        if (!snapEnabledRef.current || scaleSnapRef.current <= 0) return value;
        return Math.round(value / scaleSnapRef.current) * scaleSnapRef.current;
    }, []);

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

        let rafId: number | null = null;
        const resizeObserver = new ResizeObserver(() => {
            // 使用 requestAnimationFrame 避免 ResizeObserver loop 错误
            // Use requestAnimationFrame to avoid ResizeObserver loop errors
            if (rafId !== null) {
                cancelAnimationFrame(rafId);
            }
            rafId = requestAnimationFrame(() => {
                resizeCanvas();
                rafId = null;
            });
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

                const worldStart = screenToWorld(lastMousePosRef.current.x, lastMousePosRef.current.y);
                const worldEnd = screenToWorld(e.clientX, e.clientY);
                const worldDelta = {
                    x: worldEnd.x - worldStart.x,
                    y: worldEnd.y - worldStart.y
                };

                const mode = transformModeRef.current;

                // Try standard TransformComponent first
                const transform = entity.getComponent(TransformComponent);
                if (transform) {
                    if (mode === 'move') {
                        transform.position.x += worldDelta.x;
                        transform.position.y += worldDelta.y;
                    } else if (mode === 'rotate') {
                        const rotationSpeed = 0.01;
                        transform.rotation.z += deltaX * rotationSpeed;
                    } else if (mode === 'scale') {
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

                    if (messageHubRef.current) {
                        const propertyName = mode === 'move' ? 'position' : mode === 'rotate' ? 'rotation' : 'scale';
                        const value = propertyName === 'position' ? transform.position :
                                     propertyName === 'rotation' ? transform.rotation : transform.scale;
                        messageHubRef.current.publish('component:property:changed', {
                            entity,
                            component: transform,
                            propertyName,
                            value
                        });
                    }
                }

                // Try UITransformComponent
                const uiTransform = entity.getComponent(UITransformComponent);
                if (uiTransform) {
                    if (mode === 'move') {
                        uiTransform.x += worldDelta.x;
                        uiTransform.y += worldDelta.y;
                    } else if (mode === 'rotate') {
                        const rotationSpeed = 0.01;
                        uiTransform.rotation += deltaX * rotationSpeed;
                    } else if (mode === 'scale') {
                        const oldWidth = uiTransform.width * uiTransform.scaleX;
                        const oldHeight = uiTransform.height * uiTransform.scaleY;

                        // pivot点的世界坐标（缩放前）
                        const pivotWorldX = uiTransform.x + oldWidth * uiTransform.pivotX;
                        const pivotWorldY = uiTransform.y + oldHeight * uiTransform.pivotY;

                        const startDist = Math.sqrt((worldStart.x - pivotWorldX) ** 2 + (worldStart.y - pivotWorldY) ** 2);
                        const endDist = Math.sqrt((worldEnd.x - pivotWorldX) ** 2 + (worldEnd.y - pivotWorldY) ** 2);

                        if (startDist > 0) {
                            const scaleFactor = endDist / startDist;
                            const newScaleX = uiTransform.scaleX * scaleFactor;
                            const newScaleY = uiTransform.scaleY * scaleFactor;

                            const newWidth = uiTransform.width * newScaleX;
                            const newHeight = uiTransform.height * newScaleY;

                            // 调整位置使pivot点保持不动
                            uiTransform.x = pivotWorldX - newWidth * uiTransform.pivotX;
                            uiTransform.y = pivotWorldY - newHeight * uiTransform.pivotY;
                            uiTransform.scaleX = newScaleX;
                            uiTransform.scaleY = newScaleY;
                        }
                    }

                    if (messageHubRef.current) {
                        const propertyName = mode === 'move' ? 'x' : mode === 'rotate' ? 'rotation' : 'scaleX';
                        messageHubRef.current.publish('component:property:changed', {
                            entity,
                            component: uiTransform,
                            propertyName,
                            value: uiTransform[propertyName]
                        });
                    }
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

                // Apply snap on mouse up
                const entity = selectedEntityRef.current;
                if (entity && snapEnabledRef.current) {
                    const mode = transformModeRef.current;
                    const transform = entity.getComponent(TransformComponent);
                    if (transform) {
                        if (mode === 'move') {
                            transform.position.x = snapToGrid(transform.position.x);
                            transform.position.y = snapToGrid(transform.position.y);
                        } else if (mode === 'rotate') {
                            transform.rotation.z = snapRotation(transform.rotation.z);
                        } else if (mode === 'scale') {
                            transform.scale.x = snapScale(transform.scale.x);
                            transform.scale.y = snapScale(transform.scale.y);
                        }
                    }

                    const uiTransform = entity.getComponent(UITransformComponent);
                    if (uiTransform) {
                        if (mode === 'move') {
                            uiTransform.x = snapToGrid(uiTransform.x);
                            uiTransform.y = snapToGrid(uiTransform.y);
                        } else if (mode === 'rotate') {
                            uiTransform.rotation = snapRotation(uiTransform.rotation);
                        } else if (mode === 'scale') {
                            uiTransform.scaleX = snapScale(uiTransform.scaleX);
                            uiTransform.scaleY = snapScale(uiTransform.scaleY);
                        }
                    }
                }

                // Notify Inspector to refresh after transform change
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
            if (rafId !== null) {
                cancelAnimationFrame(rafId);
            }
            window.removeEventListener('resize', resizeCanvas);
            resizeObserver.disconnect();
            canvas.removeEventListener('mousedown', handleMouseDown);
            canvas.removeEventListener('wheel', handleWheel);
            canvas.removeEventListener('contextmenu', handleContextMenu);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    // Sync camera state to engine and publish camera:updated event
    // 同步相机状态到引擎并发布 camera:updated 事件
    useEffect(() => {
        if (engine.state.initialized) {
            EngineService.getInstance().setCamera({
                x: camera2DOffset.x,
                y: camera2DOffset.y,
                zoom: camera2DZoom,
                rotation: 0
            });

            // Publish camera update event for other systems
            // 发布相机更新事件供其他系统使用
            const hub = messageHubRef.current;
            if (hub) {
                hub.publish('camera:updated', {
                    x: camera2DOffset.x,
                    y: camera2DOffset.y,
                    zoom: camera2DZoom
                });
            }
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
            // Disable editor mode (hides grid, gizmos, axis indicator)
            // 禁用编辑器模式（隐藏网格、gizmos、坐标轴指示器）
            EngineService.getInstance().setEditorMode(false);
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

    const handleStop = async () => {
        setPlayState('stopped');
        engine.stop();
        // Restore scene snapshot
        await EngineService.getInstance().restoreSceneSnapshot();
        // Restore editor camera state
        setCamera2DOffset({ x: editorCameraRef.current.x, y: editorCameraRef.current.y });
        setCamera2DZoom(editorCameraRef.current.zoom);
        // Restore editor mode (restores grid, gizmos, axis indicator based on settings)
        // 恢复编辑器模式（根据设置恢复网格、gizmos、坐标轴指示器）
        EngineService.getInstance().setEditorMode(true);
        // Restore editor default background color
        EngineService.getInstance().setClearColor(0.1, 0.1, 0.12, 1.0);
    };

    const handleReset = () => {
        // Reset camera to origin without stopping playback
        setCamera2DOffset({ x: 0, y: 0 });
        setCamera2DZoom(1);
    };

    // Store handlers in refs to avoid dependency issues
    const handlePlayRef = useRef(handlePlay);
    const handlePauseRef = useRef(handlePause);
    const handleStopRef = useRef(handleStop);
    const handleRunInBrowserRef = useRef<(() => void) | null>(null);
    const handleRunOnDeviceRef = useRef<(() => void) | null>(null);
    handlePlayRef.current = handlePlay;
    handlePauseRef.current = handlePause;
    handleStopRef.current = handleStop;

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

            // Use RuntimeResolver to copy runtime files with ES Modules structure
            // 使用 RuntimeResolver 复制运行时文件（ES 模块结构）
            const runtimeResolver = RuntimeResolver.getInstance();
            await runtimeResolver.initialize();
            const { modules, importMap } = await runtimeResolver.prepareRuntimeFiles(runtimeDir);

            // Write scene data
            await TauriAPI.writeFileContent(`${runtimeDir}/scene.json`, sceneData);

            // Copy project config file (for plugin settings)
            // 复制项目配置文件（用于插件设置）
            const projectService = Core.services.tryResolve(ProjectService);
            const projectPath = projectService?.getCurrentProject()?.path;
            if (projectPath) {
                const configPath = `${projectPath}\\ecs-editor.config.json`;
                const configExists = await TauriAPI.pathExists(configPath);
                if (configExists) {
                    await TauriAPI.copyFile(configPath, `${runtimeDir}\\ecs-editor.config.json`);
                    console.log('[Viewport] Copied project config to runtime dir');
                }
            }

            // Create assets directory
            // 创建资产目录
            const assetsDir = `${runtimeDir}\\assets`;
            const assetsDirExists = await TauriAPI.pathExists(assetsDir);
            if (!assetsDirExists) {
                await TauriAPI.createDirectory(assetsDir);
            }

            // Collect all asset paths from scene
            // 从场景中收集所有资产路径
            const sceneObj = JSON.parse(sceneData);
            const assetPaths = new Set<string>();
            // GUID 到路径的映射，用于需要通过 GUID 加载的资产
            // GUID to path mapping for assets that need to be loaded by GUID
            const guidToPath = new Map<string, string>();

            // Get asset registry for resolving GUIDs
            const assetRegistry = Core.services.tryResolve(AssetRegistryService);

            // Scan all components for asset references
            if (sceneObj.entities) {
                for (const entity of sceneObj.entities) {
                    if (entity.components) {
                        for (const comp of entity.components) {
                            // Sprite textures
                            if (comp.type === 'Sprite' && comp.data?.texture) {
                                assetPaths.add(comp.data.texture);
                            }
                            // Behavior tree assets
                            if (comp.type === 'BehaviorTreeRuntime' && comp.data?.treeAssetId) {
                                assetPaths.add(comp.data.treeAssetId);
                            }
                            // Tilemap assets
                            if (comp.type === 'Tilemap' && comp.data?.tmxPath) {
                                assetPaths.add(comp.data.tmxPath);
                            }
                            // Audio assets
                            if (comp.type === 'AudioSource' && comp.data?.clip) {
                                assetPaths.add(comp.data.clip);
                            }
                            // Particle assets - resolve GUID to path
                            if (comp.type === 'ParticleSystem' && comp.data?.particleAssetGuid) {
                                const guid = comp.data.particleAssetGuid;
                                if (assetRegistry) {
                                    const relativePath = assetRegistry.getPathByGuid(guid);
                                    if (relativePath && projectPath) {
                                        // Convert relative path to absolute path
                                        // 将相对路径转换为绝对路径
                                        const absolutePath = `${projectPath}\\${relativePath.replace(/\//g, '\\')}`;
                                        assetPaths.add(absolutePath);
                                        guidToPath.set(guid, absolutePath);

                                        // Also check for texture referenced in particle asset
                                        // 同时检查粒子资产中引用的纹理
                                        try {
                                            const particleContent = await TauriAPI.readFileContent(absolutePath);
                                            const particleData = JSON.parse(particleContent);
                                            const textureRef = particleData.textureGuid || particleData.texturePath;
                                            if (textureRef) {
                                                // Check if it's a GUID or a path
                                                if (textureRef.includes('-') && textureRef.length > 30) {
                                                    // Looks like a GUID
                                                    const textureRelPath = assetRegistry.getPathByGuid(textureRef);
                                                    if (textureRelPath && projectPath) {
                                                        const textureAbsPath = `${projectPath}\\${textureRelPath.replace(/\//g, '\\')}`;
                                                        assetPaths.add(textureAbsPath);
                                                        guidToPath.set(textureRef, textureAbsPath);
                                                    }
                                                } else {
                                                    // It's a path
                                                    const textureAbsPath = `${projectPath}\\${textureRef.replace(/\//g, '\\')}`;
                                                    assetPaths.add(textureAbsPath);
                                                }
                                            }
                                        } catch {
                                            // Ignore parse errors
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // Build asset catalog and copy files
            // 构建资产目录并复制文件
            const catalogEntries: Record<string, { guid: string; path: string; type: string; size: number; hash: string }> = {};

            for (const assetPath of assetPaths) {
                if (!assetPath || (!assetPath.includes(':\\') && !assetPath.startsWith('/'))) continue;

                try {
                    const exists = await TauriAPI.pathExists(assetPath);
                    if (!exists) {
                        console.warn(`[Viewport] Asset not found: ${assetPath}`);
                        continue;
                    }

                    // Get filename and determine relative path
                    const filename = assetPath.split(/[/\\]/).pop() || '';
                    const destPath = `${assetsDir}\\${filename}`;
                    const relativePath = `assets/${filename}`;

                    // Copy file
                    await TauriAPI.copyFile(assetPath, destPath);

                    // Determine asset type from extension
                    const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase();
                    const typeMap: Record<string, string> = {
                        '.png': 'texture', '.jpg': 'texture', '.jpeg': 'texture', '.webp': 'texture',
                        '.btree': 'btree',
                        '.tmx': 'tilemap', '.tsx': 'tileset',
                        '.mp3': 'audio', '.ogg': 'audio', '.wav': 'audio',
                        '.json': 'json',
                        '.particle': 'particle'
                    };
                    const assetType = typeMap[ext] || 'binary';

                    // Check if this asset was referenced by a GUID (e.g., particle assets)
                    // If so, use the original GUID; otherwise generate one from the path
                    // 检查此资产是否通过 GUID 引用（如粒子资产）
                    // 如果是，使用原始 GUID；否则根据路径生成
                    let guid: string | undefined;
                    for (const [originalGuid, mappedPath] of guidToPath.entries()) {
                        if (mappedPath === assetPath) {
                            guid = originalGuid;
                            break;
                        }
                    }
                    if (!guid) {
                        guid = assetPath.replace(/[^a-zA-Z0-9]/g, '-').substring(0, 36);
                    }

                    catalogEntries[guid] = {
                        guid,
                        path: relativePath,
                        type: assetType,
                        size: 0,
                        hash: ''
                    };
                } catch (error) {
                    console.error(`[Viewport] Failed to copy asset ${assetPath}:`, error);
                }
            }

            // Write asset catalog
            // 写入资产目录
            const assetCatalog = {
                version: '1.0.0',
                createdAt: Date.now(),
                entries: catalogEntries
            };
            await TauriAPI.writeFileContent(`${runtimeDir}/asset-catalog.json`, JSON.stringify(assetCatalog, null, 2));

            // Copy user-runtime.js if it exists
            // 如果存在用户运行时，复制 user-runtime.js
            let hasUserRuntime = false;
            if (projectPath) {
                const userRuntimePath = `${projectPath}\\.esengine\\compiled\\user-runtime.js`;
                const userRuntimeExists = await TauriAPI.pathExists(userRuntimePath);
                if (userRuntimeExists) {
                    await TauriAPI.copyFile(userRuntimePath, `${runtimeDir}\\user-runtime.js`);
                    console.log('[Viewport] Copied user-runtime.js');
                    hasUserRuntime = true;
                }
            }

            // Generate HTML with import maps (matching published build structure)
            const runtimeHtml = generateRuntimeHtml(importMap, modules, hasUserRuntime);
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

            // Use RuntimeResolver to copy runtime files with ES Modules structure
            const runtimeResolver = RuntimeResolver.getInstance();
            await runtimeResolver.initialize();
            const { modules, importMap } = await runtimeResolver.prepareRuntimeFiles(runtimeDir);

            // Copy project config file (for plugin settings)
            const projectService = Core.services.tryResolve(ProjectService);
            if (projectService) {
                const currentProject = projectService.getCurrentProject();
                if (currentProject?.path) {
                    const configPath = `${currentProject.path}\\ecs-editor.config.json`;
                    const configExists = await TauriAPI.pathExists(configPath);
                    if (configExists) {
                        await TauriAPI.copyFile(configPath, `${runtimeDir}\\ecs-editor.config.json`);
                    }
                }
            }

            // Write scene data
            const sceneDataStr = typeof sceneData === 'string' ? sceneData : new TextDecoder().decode(sceneData);
            await TauriAPI.writeFileContent(`${runtimeDir}/scene.json`, sceneDataStr);

            // Copy user-runtime.js if it exists
            // 如果存在用户运行时，复制 user-runtime.js
            let hasUserRuntime = false;
            const currentProject = projectService?.getCurrentProject();
            if (currentProject?.path) {
                const userRuntimePath = `${currentProject.path}\\.esengine\\compiled\\user-runtime.js`;
                const userRuntimeExists = await TauriAPI.pathExists(userRuntimePath);
                if (userRuntimeExists) {
                    await TauriAPI.copyFile(userRuntimePath, `${runtimeDir}\\user-runtime.js`);
                    console.log('[Viewport] Copied user-runtime.js for device preview');
                    hasUserRuntime = true;
                }
            }

            // Write HTML with import maps
            await TauriAPI.writeFileContent(`${runtimeDir}/index.html`, generateRuntimeHtml(importMap, modules, hasUserRuntime));

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
                        const filename = texturePath.split(/[/\\]/).pop() || '';
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

    // Update refs after function definitions
    handleRunInBrowserRef.current = handleRunInBrowser;
    handleRunOnDeviceRef.current = handleRunOnDevice;

    // Subscribe to MainToolbar events
    useEffect(() => {
        if (!messageHub) return;

        const unsubscribeStart = messageHub.subscribe('preview:start', () => {
            handlePlayRef.current();
            messageHub.publish('preview:started', {});
        });

        const unsubscribePause = messageHub.subscribe('preview:pause', () => {
            handlePauseRef.current();
            messageHub.publish('preview:paused', {});
        });

        const unsubscribeStop = messageHub.subscribe('preview:stop', () => {
            handleStopRef.current();
            messageHub.publish('preview:stopped', {});
        });

        const unsubscribeStep = messageHub.subscribe('preview:step', () => {
            engine.step();
        });

        const unsubscribeRunBrowser = messageHub.subscribe('viewport:run-in-browser', () => {
            handleRunInBrowserRef.current?.();
        });

        const unsubscribeRunDevice = messageHub.subscribe('viewport:run-on-device', () => {
            handleRunOnDeviceRef.current?.();
        });

        return () => {
            unsubscribeStart();
            unsubscribePause();
            unsubscribeStop();
            unsubscribeStep();
            unsubscribeRunBrowser();
            unsubscribeRunDevice();
        };
    }, [messageHub]);

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

    const gridSnapOptions = [1, 5, 10, 25, 50, 100];
    const rotationSnapOptions = [5, 10, 15, 30, 45, 90];
    const scaleSnapOptions = [0.1, 0.25, 0.5, 1];

    const closeAllSnapMenus = useCallback(() => {
        setShowGridSnapMenu(false);
        setShowRotationSnapMenu(false);
        setShowScaleSnapMenu(false);
        setShowRunMenu(false);
    }, []);

    // Close menus when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as Node;
            if (gridSnapMenuRef.current && !gridSnapMenuRef.current.contains(target)) {
                setShowGridSnapMenu(false);
            }
            if (rotationSnapMenuRef.current && !rotationSnapMenuRef.current.contains(target)) {
                setShowRotationSnapMenu(false);
            }
            if (scaleSnapMenuRef.current && !scaleSnapMenuRef.current.contains(target)) {
                setShowScaleSnapMenu(false);
            }
            if (runMenuRef.current && !runMenuRef.current.contains(target)) {
                setShowRunMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="viewport" ref={containerRef}>
            {/* Internal Overlay Toolbar */}
            <div className="viewport-internal-toolbar">
                <div className="viewport-internal-toolbar-left">
                    {/* Transform tools */}
                    <div className="viewport-btn-group">
                        <button
                            className={`viewport-btn ${transformMode === 'select' ? 'active' : ''}`}
                            onClick={() => setTransformMode('select')}
                            title={locale === 'zh' ? '选择 (Q)' : 'Select (Q)'}
                        >
                            <MousePointer2 size={14} />
                        </button>
                        <button
                            className={`viewport-btn ${transformMode === 'move' ? 'active' : ''}`}
                            onClick={() => setTransformMode('move')}
                            title={locale === 'zh' ? '移动 (W)' : 'Move (W)'}
                        >
                            <Move size={14} />
                        </button>
                        <button
                            className={`viewport-btn ${transformMode === 'rotate' ? 'active' : ''}`}
                            onClick={() => setTransformMode('rotate')}
                            title={locale === 'zh' ? '旋转 (E)' : 'Rotate (E)'}
                        >
                            <RotateCw size={14} />
                        </button>
                        <button
                            className={`viewport-btn ${transformMode === 'scale' ? 'active' : ''}`}
                            onClick={() => setTransformMode('scale')}
                            title={locale === 'zh' ? '缩放 (R)' : 'Scale (R)'}
                        >
                            <Scaling size={14} />
                        </button>
                    </div>

                    <div className="viewport-divider" />

                    {/* Snap toggle */}
                    <button
                        className={`viewport-btn ${snapEnabled ? 'active' : ''}`}
                        onClick={() => setSnapEnabled(!snapEnabled)}
                        title={locale === 'zh' ? '吸附开关' : 'Toggle Snap'}
                    >
                        <Magnet size={14} />
                    </button>

                    {/* Grid Snap Value */}
                    <div className="viewport-snap-dropdown" ref={gridSnapMenuRef}>
                        <button
                            className="viewport-snap-btn"
                            onClick={() => { closeAllSnapMenus(); setShowGridSnapMenu(!showGridSnapMenu); }}
                            title={locale === 'zh' ? '网格吸附' : 'Grid Snap'}
                        >
                            <Grid3x3 size={12} />
                            <span>{gridSnapValue}</span>
                            <ChevronDown size={10} />
                        </button>
                        {showGridSnapMenu && (
                            <div className="viewport-snap-menu">
                                {gridSnapOptions.map((val) => (
                                    <button
                                        key={val}
                                        className={gridSnapValue === val ? 'active' : ''}
                                        onClick={() => { setGridSnapValue(val); setShowGridSnapMenu(false); }}
                                    >
                                        {val}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Rotation Snap Value */}
                    <div className="viewport-snap-dropdown" ref={rotationSnapMenuRef}>
                        <button
                            className="viewport-snap-btn"
                            onClick={() => { closeAllSnapMenus(); setShowRotationSnapMenu(!showRotationSnapMenu); }}
                            title={locale === 'zh' ? '旋转吸附' : 'Rotation Snap'}
                        >
                            <RotateCw size={12} />
                            <span>{rotationSnapValue}°</span>
                            <ChevronDown size={10} />
                        </button>
                        {showRotationSnapMenu && (
                            <div className="viewport-snap-menu">
                                {rotationSnapOptions.map((val) => (
                                    <button
                                        key={val}
                                        className={rotationSnapValue === val ? 'active' : ''}
                                        onClick={() => { setRotationSnapValue(val); setShowRotationSnapMenu(false); }}
                                    >
                                        {val}°
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Scale Snap Value */}
                    <div className="viewport-snap-dropdown" ref={scaleSnapMenuRef}>
                        <button
                            className="viewport-snap-btn"
                            onClick={() => { closeAllSnapMenus(); setShowScaleSnapMenu(!showScaleSnapMenu); }}
                            title={locale === 'zh' ? '缩放吸附' : 'Scale Snap'}
                        >
                            <Scaling size={12} />
                            <span>{scaleSnapValue}</span>
                            <ChevronDown size={10} />
                        </button>
                        {showScaleSnapMenu && (
                            <div className="viewport-snap-menu">
                                {scaleSnapOptions.map((val) => (
                                    <button
                                        key={val}
                                        className={scaleSnapValue === val ? 'active' : ''}
                                        onClick={() => { setScaleSnapValue(val); setShowScaleSnapMenu(false); }}
                                    >
                                        {val}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="viewport-internal-toolbar-right">
                    {/* View options */}
                    <button
                        className={`viewport-btn ${showGrid ? 'active' : ''}`}
                        onClick={() => setShowGrid(!showGrid)}
                        title={locale === 'zh' ? '显示网格' : 'Show Grid'}
                    >
                        <Grid3x3 size={14} />
                    </button>
                    <button
                        className={`viewport-btn ${showGizmos ? 'active' : ''}`}
                        onClick={() => setShowGizmos(!showGizmos)}
                        title={locale === 'zh' ? '显示辅助线' : 'Show Gizmos'}
                    >
                        {showGizmos ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>

                    <div className="viewport-divider" />

                    {/* Zoom display */}
                    <div className="viewport-zoom-display">
                        <ZoomIn size={12} />
                        <span>{Math.round(camera2DZoom * 100)}%</span>
                    </div>

                    <div className="viewport-divider" />

                    {/* Stats toggle */}
                    <button
                        className={`viewport-btn ${showStats ? 'active' : ''}`}
                        onClick={() => setShowStats(!showStats)}
                        title={locale === 'zh' ? '统计信息' : 'Stats'}
                    >
                        <Activity size={14} />
                    </button>

                    {/* Reset view */}
                    <button
                        className="viewport-btn"
                        onClick={handleReset}
                        title={locale === 'zh' ? '重置视图' : 'Reset View'}
                    >
                        <RotateCcw size={14} />
                    </button>

                    {/* Fullscreen */}
                    <button
                        className="viewport-btn"
                        onClick={handleFullscreen}
                        title={locale === 'zh' ? '全屏' : 'Fullscreen'}
                    >
                        <Maximize2 size={14} />
                    </button>

                    <div className="viewport-divider" />

                    {/* Run options */}
                    <div className="viewport-snap-dropdown" ref={runMenuRef}>
                        <button
                            className="viewport-snap-btn"
                            onClick={() => { closeAllSnapMenus(); setShowRunMenu(!showRunMenu); }}
                            title={locale === 'zh' ? '运行选项' : 'Run Options'}
                        >
                            <Globe size={14} />
                            <ChevronDown size={10} />
                        </button>
                        {showRunMenu && (
                            <div className="viewport-snap-menu viewport-snap-menu-right">
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
