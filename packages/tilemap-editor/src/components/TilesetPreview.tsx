/**
 * Tileset Preview Component - Display and select tiles from a tileset
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useTilemapEditorStore, type TileSelection } from '../stores/TilemapEditorStore';
import type { ITilesetData, ITileAnimation } from '@esengine/tilemap';

interface TilesetPreviewProps {
    imageUrl: string;
    tileWidth: number;
    tileHeight: number;
    columns: number;
    rows: number;
    tileset?: ITilesetData;
    animatedTileIds?: Set<number>;
    onSelectionChange?: (selection: TileSelection) => void;
    onEditAnimation?: (tileId: number) => void;
}

export const TilesetPreview: React.FC<TilesetPreviewProps> = ({
    imageUrl,
    tileWidth,
    tileHeight,
    columns,
    rows,
    tileset,
    animatedTileIds,
    onSelectionChange,
    onEditAnimation,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [image, setImage] = useState<HTMLImageElement | null>(null);
    const [isSelecting, setIsSelecting] = useState(false);
    const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null);
    const [selectionEnd, setSelectionEnd] = useState<{ x: number; y: number } | null>(null);
    const [zoom, setZoom] = useState(1);
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; tileId: number } | null>(null);

    const selectedTiles = useTilemapEditorStore(state => state.selectedTiles);
    const setSelectedTiles = useTilemapEditorStore(state => state.setSelectedTiles);

    // Load image
    useEffect(() => {
        const img = new Image();
        img.onload = () => setImage(img);
        img.src = imageUrl;
    }, [imageUrl]);

    // Draw tileset
    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas || !image) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size based on actual image size (+1 for border lines)
        canvas.width = image.width + 1;
        canvas.height = image.height + 1;

        // Draw image
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(image, 0, 0);

        // Draw grid only within the actual tileset area
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;

        for (let x = 0; x <= columns; x++) {
            ctx.beginPath();
            ctx.moveTo(x * tileWidth + 0.5, 0);
            ctx.lineTo(x * tileWidth + 0.5, image.height);
            ctx.stroke();
        }

        for (let y = 0; y <= rows; y++) {
            ctx.beginPath();
            ctx.moveTo(0, y * tileHeight + 0.5);
            ctx.lineTo(image.width, y * tileHeight + 0.5);
            ctx.stroke();
        }

        // Draw selection preview during drag
        if (isSelecting && selectionStart && selectionEnd) {
            const minX = Math.min(selectionStart.x, selectionEnd.x);
            const maxX = Math.max(selectionStart.x, selectionEnd.x);
            const minY = Math.min(selectionStart.y, selectionEnd.y);
            const maxY = Math.max(selectionStart.y, selectionEnd.y);

            ctx.fillStyle = 'rgba(0, 120, 212, 0.3)';
            ctx.fillRect(
                minX * tileWidth,
                minY * tileHeight,
                (maxX - minX + 1) * tileWidth,
                (maxY - minY + 1) * tileHeight
            );
        }

        // Draw current selection
        if (selectedTiles && !isSelecting) {
            ctx.strokeStyle = '#0078d4';
            ctx.lineWidth = 2;
            ctx.strokeRect(
                selectedTiles.x * tileWidth + 1,
                selectedTiles.y * tileHeight + 1,
                selectedTiles.width * tileWidth - 2,
                selectedTiles.height * tileHeight - 2
            );
        }

        // Draw animation indicators
        if (animatedTileIds && animatedTileIds.size > 0) {
            for (const tileId of animatedTileIds) {
                const x = (tileId % columns) * tileWidth;
                const y = Math.floor(tileId / columns) * tileHeight;

                // Draw small play icon in bottom-right corner
                ctx.fillStyle = 'rgba(0, 180, 0, 0.9)';
                ctx.beginPath();
                ctx.moveTo(x + tileWidth - 12, y + tileHeight - 10);
                ctx.lineTo(x + tileWidth - 12, y + tileHeight - 2);
                ctx.lineTo(x + tileWidth - 4, y + tileHeight - 6);
                ctx.closePath();
                ctx.fill();
            }
        }
    }, [image, columns, rows, tileWidth, tileHeight, selectedTiles, isSelecting, selectionStart, selectionEnd, animatedTileIds]);

    useEffect(() => {
        draw();
    }, [draw]);

    const getTileCoords = (e: React.MouseEvent): { x: number; y: number } => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };

        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = Math.floor((e.clientX - rect.left) * scaleX / tileWidth);
        const y = Math.floor((e.clientY - rect.top) * scaleY / tileHeight);

        return {
            x: Math.max(0, Math.min(columns - 1, x)),
            y: Math.max(0, Math.min(rows - 1, y)),
        };
    };

    const handleWheel = (e: React.WheelEvent) => {
        // Only zoom when Ctrl is pressed
        if (e.ctrlKey) {
            e.preventDefault();
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            setZoom(z => Math.max(0.5, Math.min(5, z * delta)));
        }
        // Otherwise let the default scroll behavior work
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        const coords = getTileCoords(e);
        setIsSelecting(true);
        setSelectionStart(coords);
        setSelectionEnd(coords);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isSelecting) return;
        const coords = getTileCoords(e);
        setSelectionEnd(coords);
    };

    const handleMouseUp = () => {
        if (!isSelecting || !selectionStart || !selectionEnd) {
            setIsSelecting(false);
            return;
        }

        const minX = Math.min(selectionStart.x, selectionEnd.x);
        const maxX = Math.max(selectionStart.x, selectionEnd.x);
        const minY = Math.min(selectionStart.y, selectionEnd.y);
        const maxY = Math.max(selectionStart.y, selectionEnd.y);

        const width = maxX - minX + 1;
        const height = maxY - minY + 1;
        const tiles: number[] = [];

        for (let y = minY; y <= maxY; y++) {
            for (let x = minX; x <= maxX; x++) {
                // Tile index = y * columns + x + 1 (0 is empty)
                tiles.push(y * columns + x + 1);
            }
        }

        const selection: TileSelection = {
            x: minX,
            y: minY,
            width,
            height,
            tiles,
        };

        setSelectedTiles(selection);
        onSelectionChange?.(selection);

        setIsSelecting(false);
        setSelectionStart(null);
        setSelectionEnd(null);
    };

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        if (!onEditAnimation) return;

        const coords = getTileCoords(e);
        const tileId = coords.y * columns + coords.x;

        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            tileId
        });
    };

    const _handleCloseContextMenu = () => {
        setContextMenu(null);
    };

    const handleEditAnimation = () => {
        if (contextMenu && onEditAnimation) {
            onEditAnimation(contextMenu.tileId);
        }
        setContextMenu(null);
    };

    // Close context menu when clicking outside
    useEffect(() => {
        const handleClick = () => setContextMenu(null);
        if (contextMenu) {
            document.addEventListener('click', handleClick);
            return () => document.removeEventListener('click', handleClick);
        }
    }, [contextMenu]);

    return (
        <div
            ref={containerRef}
            style={{
                width: '100%',
                height: '100%',
                position: 'relative',
            }}
            onWheel={handleWheel}
        >
            <canvas
                ref={canvasRef}
                className="tileset-canvas"
                style={{
                    transform: `scale(${zoom})`,
                    transformOrigin: 'top left',
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onContextMenu={handleContextMenu}
            />
            {contextMenu && (
                <div
                    className="tileset-context-menu"
                    style={{
                        position: 'fixed',
                        left: contextMenu.x,
                        top: contextMenu.y,
                        background: '#252526',
                        border: '1px solid #3c3c3c',
                        borderRadius: '4px',
                        padding: '4px 0',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                        zIndex: 1000,
                    }}
                >
                    <button
                        style={{
                            display: 'block',
                            width: '100%',
                            padding: '6px 16px',
                            background: 'none',
                            border: 'none',
                            color: '#e0e0e0',
                            fontSize: '12px',
                            textAlign: 'left',
                            cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#094771'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                        onClick={handleEditAnimation}
                    >
                        编辑动画... (瓦片 #{contextMenu.tileId})
                    </button>
                </div>
            )}
        </div>
    );
};
