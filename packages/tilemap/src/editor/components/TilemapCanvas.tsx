/**
 * Tilemap Canvas - Main editing canvas
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { TilemapComponent } from '../../TilemapComponent';
import { useTilemapEditorStore } from '../stores/TilemapEditorStore';
import type { ITilemapTool, ToolContext } from '../tools/ITilemapTool';
import { BrushTool } from '../tools/BrushTool';
import { EraserTool } from '../tools/EraserTool';
import { FillTool } from '../tools/FillTool';

interface TilemapCanvasProps {
    tilemap: TilemapComponent;
    tilesetImage: HTMLImageElement | null;
    onTilemapChange?: () => void;
}

const tools: Record<string, ITilemapTool> = {
    brush: new BrushTool(),
    eraser: new EraserTool(),
    fill: new FillTool(),
};

export const TilemapCanvas: React.FC<TilemapCanvasProps> = ({
    tilemap,
    tilesetImage,
    onTilemapChange,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const {
        currentTool,
        zoom,
        panX,
        panY,
        showGrid,
        showCollision,
        selectedTiles,
        brushSize,
        currentLayer,
        editingCollision,
        tileWidth,
        tileHeight,
        tilesetColumns,
        layers,
        setPan,
        setZoom,
        pushUndo,
    } = useTilemapEditorStore();

    // Get layer locked state
    const layerLocked = layers[currentLayer]?.locked ?? false;

    // Create a dependency key from layers state to trigger redraw when visibility/opacity changes
    const layersKey = layers.map(l => `${l.visible}-${l.opacity}`).join(',');

    const [isPanning, setIsPanning] = useState(false);
    const [lastPanPos, setLastPanPos] = useState({ x: 0, y: 0 });
    const [mousePos, setMousePos] = useState<{ tileX: number; tileY: number } | null>(null);

    // Get canvas size
    const canvasWidth = tilemap.width * tileWidth;
    const canvasHeight = tilemap.height * tileHeight;

    // Draw the tilemap
    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear
        ctx.fillStyle = '#2d2d2d';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.save();
        ctx.translate(panX, panY);
        ctx.scale(zoom, zoom);

        // Draw tilemap background
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // Draw tiles from all visible layers (from bottom to top)
        if (tilesetImage) {
            ctx.imageSmoothingEnabled = false;

            // Draw all layers from tilemap component, respecting visibility and opacity
            const tilemapLayers = tilemap.layers;

            for (let layerIndex = tilemapLayers.length - 1; layerIndex >= 0; layerIndex--) {
                const tilemapLayer = tilemapLayers[layerIndex];
                if (!tilemapLayer || !tilemapLayer.visible) continue; // Skip undefined or invisible layers

                // Apply layer opacity
                const savedAlpha = ctx.globalAlpha;
                ctx.globalAlpha = tilemapLayer.opacity ?? 1;

                for (let y = 0; y < tilemap.height; y++) {
                    for (let x = 0; x < tilemap.width; x++) {
                        const tileIndex = tilemap.getTile(layerIndex, x, y);
                        if (tileIndex > 0) {
                            // Calculate source position in tileset
                            const srcX = ((tileIndex - 1) % tilesetColumns) * tileWidth;
                            const srcY = Math.floor((tileIndex - 1) / tilesetColumns) * tileHeight;

                            // Only draw if tile is within tileset bounds
                            if (srcX + tileWidth <= tilesetImage.width && srcY + tileHeight <= tilesetImage.height) {
                                ctx.drawImage(
                                    tilesetImage,
                                    srcX, srcY, tileWidth, tileHeight,
                                    x * tileWidth, y * tileHeight, tileWidth, tileHeight
                                );
                            }
                        }
                    }
                }

                // Restore opacity
                ctx.globalAlpha = savedAlpha;
            }
        }

        // Draw collision overlay
        if (showCollision) {
            ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
            for (let y = 0; y < tilemap.height; y++) {
                for (let x = 0; x < tilemap.width; x++) {
                    if (tilemap.hasCollision(x, y)) {
                        ctx.fillRect(x * tileWidth, y * tileHeight, tileWidth, tileHeight);
                    }
                }
            }
        }

        // Draw grid
        if (showGrid) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 1 / zoom;

            for (let x = 0; x <= tilemap.width; x++) {
                ctx.beginPath();
                ctx.moveTo(x * tileWidth, 0);
                ctx.lineTo(x * tileWidth, canvasHeight);
                ctx.stroke();
            }

            for (let y = 0; y <= tilemap.height; y++) {
                ctx.beginPath();
                ctx.moveTo(0, y * tileHeight);
                ctx.lineTo(canvasWidth, y * tileHeight);
                ctx.stroke();
            }
        }

        // Draw tool preview
        if (mousePos && tools[currentTool]?.getPreviewTiles) {
            const tool = tools[currentTool];
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

            const previewTiles = tool.getPreviewTiles!(mousePos.tileX, mousePos.tileY, toolContext);

            ctx.fillStyle = editingCollision ? 'rgba(255, 0, 0, 0.3)' : 'rgba(0, 120, 212, 0.3)';
            for (const tile of previewTiles) {
                if (tile.x >= 0 && tile.x < tilemap.width && tile.y >= 0 && tile.y < tilemap.height) {
                    ctx.fillRect(tile.x * tileWidth, tile.y * tileHeight, tileWidth, tileHeight);
                }
            }
        }

        ctx.restore();
    }, [tilemap, tilesetImage, zoom, panX, panY, showGrid, showCollision, mousePos, currentTool, selectedTiles, brushSize, currentLayer, layerLocked, editingCollision, tileWidth, tileHeight, tilesetColumns, canvasWidth, canvasHeight, layersKey]);

    // Update canvas size
    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        let rafId: number | null = null;

        const resizeObserver = new ResizeObserver(() => {
            // 使用 requestAnimationFrame 避免 ResizeObserver loop 错误
            // Use requestAnimationFrame to avoid ResizeObserver loop errors
            if (rafId !== null) {
                cancelAnimationFrame(rafId);
            }
            rafId = requestAnimationFrame(() => {
                const newWidth = container.clientWidth;
                const newHeight = container.clientHeight;
                if (canvas.width !== newWidth || canvas.height !== newHeight) {
                    canvas.width = newWidth;
                    canvas.height = newHeight;
                    draw();
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
    }, [draw]);

    useEffect(() => {
        draw();
    }, [draw]);

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

        // Middle mouse button or space+left click for panning
        if (e.button === 1 || (e.button === 0 && e.altKey)) {
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
            draw();
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
            setPan(panX + dx, panY + dy);
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

        draw();
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
        draw();
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

    return (
        <div ref={containerRef} className="tilemap-canvas-container">
            <canvas
                ref={canvasRef}
                className="tilemap-canvas"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
                onWheel={handleWheel}
                onContextMenu={(e) => e.preventDefault()}
                style={{ cursor: isPanning ? 'grabbing' : tools[currentTool]?.cursor || 'default' }}
            />
        </div>
    );
};
