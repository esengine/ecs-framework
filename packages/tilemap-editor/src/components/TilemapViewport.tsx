/**
 * Tilemap Viewport - Engine-based rendering for tilemap editor
 * Tilemap 视口 - 基于引擎的瓦片地图编辑器渲染
 *
 * Uses the same rendering pipeline as the main editor viewport.
 * 使用与主编辑器视口相同的渲染管线。
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Core } from '@esengine/ecs-framework';
import { IViewportService_ID, type IViewportService } from '@esengine/editor-core';
import type { TilemapComponent } from '@esengine/tilemap';
import { useTilemapEditorStore } from '../stores/TilemapEditorStore';
import type { ITilemapTool, ToolContext } from '../tools/ITilemapTool';
import { BrushTool } from '../tools/BrushTool';
import { EraserTool } from '../tools/EraserTool';
import { FillTool } from '../tools/FillTool';

interface TilemapViewportProps {
    tilemap: TilemapComponent;
    onTilemapChange?: () => void;
}

const VIEWPORT_ID = 'tilemap-editor-viewport';
const CANVAS_ID = 'tilemap-editor-canvas';

const tools: Record<string, ITilemapTool> = {
    brush: new BrushTool(),
    eraser: new EraserTool(),
    fill: new FillTool(),
};

export const TilemapViewport: React.FC<TilemapViewportProps> = ({
    tilemap,
    onTilemapChange,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const viewportServiceRef = useRef<IViewportService | null>(null);
    const registeredRef = useRef(false);

    const {
        currentTool,
        zoom,
        panX,
        panY,
        showGrid,
        showCollision: _showCollision,
        selectedTiles,
        brushSize,
        currentLayer,
        editingCollision,
        tileWidth,
        tileHeight,
        layers,
        setPan,
        setZoom,
        pushUndo,
    } = useTilemapEditorStore();

    // Get layer locked state
    const layerLocked = layers[currentLayer]?.locked ?? false;

    const [isPanning, setIsPanning] = useState(false);
    const [lastPanPos, setLastPanPos] = useState({ x: 0, y: 0 });
    const [_mousePos, setMousePos] = useState<{ tileX: number; tileY: number } | null>(null);
    const [spacePressed, setSpacePressed] = useState(false);

    // Get canvas size (reserved for future virtual scrolling)
    const _canvasWidth = tilemap.width * tileWidth;
    const _canvasHeight = tilemap.height * tileHeight;

    // Initialize viewport service
    useEffect(() => {
        const service = Core.services.tryResolve<IViewportService>(IViewportService_ID);
        viewportServiceRef.current = service ?? null;

        if (!service) {
            console.warn('[TilemapViewport] ViewportService not available');
        }
    }, []);

    // Register viewport when canvas is ready
    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        const service = viewportServiceRef.current;

        if (!canvas || !container || !service) return;

        // Wait for engine to be initialized
        if (!service.isInitialized()) {
            const checkInit = setInterval(() => {
                if (service.isInitialized() && !registeredRef.current) {
                    clearInterval(checkInit);
                    setupViewport();
                }
            }, 100);
            return () => clearInterval(checkInit);
        }

        setupViewport();

        function setupViewport() {
            if (registeredRef.current || !canvas || !container || !service) return;

            // Set canvas size
            const dpr = window.devicePixelRatio || 1;
            const rect = container.getBoundingClientRect();
            canvas.width = Math.floor(rect.width * dpr);
            canvas.height = Math.floor(rect.height * dpr);
            canvas.style.width = `${rect.width}px`;
            canvas.style.height = `${rect.height}px`;

            // Register viewport
            service.registerViewport(VIEWPORT_ID, CANVAS_ID);
            service.setViewportConfig(VIEWPORT_ID, showGrid, false); // No gizmos in tilemap editor
            service.resizeViewport(VIEWPORT_ID, canvas.width, canvas.height);

            registeredRef.current = true;
        }

        return () => {
            if (registeredRef.current && service) {
                service.unregisterViewport(VIEWPORT_ID);
                registeredRef.current = false;
            }
        };
    }, [showGrid]);

    // Handle resize
    useEffect(() => {
        const container = containerRef.current;
        const canvas = canvasRef.current;
        const service = viewportServiceRef.current;

        if (!container || !canvas || !service || !registeredRef.current) return;

        let rafId: number | null = null;

        const resizeObserver = new ResizeObserver(() => {
            if (rafId !== null) {
                cancelAnimationFrame(rafId);
            }
            rafId = requestAnimationFrame(() => {
                const dpr = window.devicePixelRatio || 1;
                const rect = container.getBoundingClientRect();
                const newWidth = Math.floor(rect.width * dpr);
                const newHeight = Math.floor(rect.height * dpr);

                if (canvas.width !== newWidth || canvas.height !== newHeight) {
                    canvas.width = newWidth;
                    canvas.height = newHeight;
                    canvas.style.width = `${rect.width}px`;
                    canvas.style.height = `${rect.height}px`;
                    service.resizeViewport(VIEWPORT_ID, newWidth, newHeight);
                }
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
    }, []);

    // Update camera when pan/zoom changes
    useEffect(() => {
        const service = viewportServiceRef.current;
        if (!service || !registeredRef.current) return;

        // Convert pan to camera position
        // In engine, camera position is the center of view
        const canvas = canvasRef.current;
        if (!canvas) return;

        const centerX = (canvas.width / 2 - panX) / zoom;
        const centerY = (canvas.height / 2 - panY) / zoom;

        service.setViewportCamera(VIEWPORT_ID, {
            x: centerX,
            y: -centerY, // Y is flipped
            zoom: zoom
        });
    }, [panX, panY, zoom]);

    // Update grid visibility
    useEffect(() => {
        const service = viewportServiceRef.current;
        if (!service || !registeredRef.current) return;

        service.setViewportConfig(VIEWPORT_ID, showGrid, false);
    }, [showGrid]);

    // Space key for panning mode
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space' && !e.repeat) {
                e.preventDefault();
                setSpacePressed(true);
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                setSpacePressed(false);
                setIsPanning(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    // Convert screen coordinates to tile coordinates
    const screenToTile = useCallback((screenX: number, screenY: number) => {
        const x = (screenX - panX) / zoom;
        const y = (screenY - panY) / zoom;
        return {
            tileX: Math.floor(x / tileWidth),
            tileY: Math.floor(y / tileHeight),
        };
    }, [panX, panY, zoom, tileWidth, tileHeight]);

    // Mouse handlers
    const handleMouseDown = (e: React.MouseEvent) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Middle mouse button, Alt+left click, or Space+left click for panning
        if (e.button === 1 || (e.button === 0 && (e.altKey || spacePressed))) {
            setIsPanning(true);
            setLastPanPos({ x: e.clientX, y: e.clientY });
            return;
        }

        // Save undo state
        const layerData = tilemap.getLayerData(currentLayer);
        if (layerData) {
            pushUndo(layerData.slice());
        }

        const { tileX, tileY } = screenToTile(x, y);
        const tool = tools[currentTool];
        if (tool) {
            const toolContext: ToolContext = {
                tilemap,
                selectedTiles,
                currentLayer,
                layerLocked,
                brushSize,
                editingCollision,
                tileWidth,
                tileHeight,
            };
            tool.onMouseDown(tileX, tileY, toolContext);
            onTilemapChange?.();
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Handle panning
        if (isPanning) {
            const dx = e.clientX - lastPanPos.x;
            const dy = e.clientY - lastPanPos.y;
            const state = useTilemapEditorStore.getState();
            setPan(state.panX + dx, state.panY + dy);
            setLastPanPos({ x: e.clientX, y: e.clientY });
            return;
        }

        const { tileX, tileY } = screenToTile(x, y);
        setMousePos({ tileX, tileY });

        // Handle tool drag
        if (e.buttons === 1) {
            const tool = tools[currentTool];
            if (tool) {
                const toolContext: ToolContext = {
                    tilemap,
                    selectedTiles,
                    currentLayer,
                    layerLocked,
                    brushSize,
                    editingCollision,
                    tileWidth,
                    tileHeight,
                };
                tool.onMouseMove(tileX, tileY, toolContext);
                onTilemapChange?.();
            }
        }
    };

    const handleMouseUp = (e: React.MouseEvent) => {
        if (isPanning) {
            setIsPanning(false);
            return;
        }

        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const { tileX, tileY } = screenToTile(x, y);

        const tool = tools[currentTool];
        if (tool) {
            const toolContext: ToolContext = {
                tilemap,
                selectedTiles,
                currentLayer,
                layerLocked,
                brushSize,
                editingCollision,
                tileWidth,
                tileHeight,
            };
            tool.onMouseUp(tileX, tileY, toolContext);
        }
    };

    const handleMouseLeave = () => {
        setMousePos(null);
    };

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        const newZoom = Math.max(0.1, Math.min(10, zoom * delta));

        // Zoom towards mouse position
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            const newPanX = mouseX - (mouseX - panX) * (newZoom / zoom);
            const newPanY = mouseY - (mouseY - panY) * (newZoom / zoom);
            setPan(newPanX, newPanY);
        }

        setZoom(newZoom);
    };

    // Determine cursor style
    const getCursor = () => {
        if (isPanning) return 'grabbing';
        if (spacePressed) return 'grab';
        return tools[currentTool]?.cursor || 'crosshair';
    };

    return (
        <div ref={containerRef} className="tilemap-canvas-container">
            <canvas
                ref={canvasRef}
                id={CANVAS_ID}
                className="tilemap-canvas"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
                onWheel={handleWheel}
                onContextMenu={(e) => e.preventDefault()}
                style={{ cursor: getCursor() }}
            />
        </div>
    );
};
