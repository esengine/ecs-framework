/**
 * Brush Tool - Paint tiles on the tilemap
 */

import type { ITilemapTool, ToolContext } from './ITilemapTool';

export class BrushTool implements ITilemapTool {
    readonly id = 'brush';
    readonly name = 'Brush';
    readonly icon = 'Paintbrush';
    readonly cursor = 'crosshair';

    private _isDrawing = false;
    private _lastTileX = -1;
    private _lastTileY = -1;

    onMouseDown(tileX: number, tileY: number, ctx: ToolContext): void {
        if (ctx.layerLocked && !ctx.editingCollision) return;
        this._isDrawing = true;
        this._lastTileX = tileX;
        this._lastTileY = tileY;
        this.paint(tileX, tileY, ctx);
    }

    onMouseMove(tileX: number, tileY: number, ctx: ToolContext): void {
        if (!this._isDrawing || (ctx.layerLocked && !ctx.editingCollision)) return;
        if (tileX === this._lastTileX && tileY === this._lastTileY) return;

        // Line drawing between last and current position
        this.drawLine(this._lastTileX, this._lastTileY, tileX, tileY, ctx);
        this._lastTileX = tileX;
        this._lastTileY = tileY;
    }

    onMouseUp(_tileX: number, _tileY: number, _ctx: ToolContext): void {
        this._isDrawing = false;
        this._lastTileX = -1;
        this._lastTileY = -1;
    }

    getPreviewTiles(tileX: number, tileY: number, ctx: ToolContext): { x: number; y: number }[] {
        const tiles: { x: number; y: number }[] = [];
        const selection = ctx.selectedTiles;

        if (!selection) {
            // Single tile brush
            const halfSize = Math.floor(ctx.brushSize / 2);
            for (let dy = -halfSize; dy <= halfSize; dy++) {
                for (let dx = -halfSize; dx <= halfSize; dx++) {
                    tiles.push({ x: tileX + dx, y: tileY + dy });
                }
            }
        } else {
            // Multi-tile brush
            for (let dy = 0; dy < selection.height; dy++) {
                for (let dx = 0; dx < selection.width; dx++) {
                    tiles.push({ x: tileX + dx, y: tileY + dy });
                }
            }
        }

        return tiles;
    }

    private paint(tileX: number, tileY: number, ctx: ToolContext): void {
        const { tilemap, selectedTiles, brushSize, editingCollision, currentLayer } = ctx;

        if (editingCollision) {
            // Paint collision
            const halfSize = Math.floor(brushSize / 2);
            for (let dy = -halfSize; dy <= halfSize; dy++) {
                for (let dx = -halfSize; dx <= halfSize; dx++) {
                    const x = tileX + dx;
                    const y = tileY + dy;
                    if (x >= 0 && x < tilemap.width && y >= 0 && y < tilemap.height) {
                        tilemap.setCollision(x, y, 1);
                    }
                }
            }
        } else if (selectedTiles) {
            // Paint selected tiles
            for (let dy = 0; dy < selectedTiles.height; dy++) {
                for (let dx = 0; dx < selectedTiles.width; dx++) {
                    const x = tileX + dx;
                    const y = tileY + dy;
                    if (x >= 0 && x < tilemap.width && y >= 0 && y < tilemap.height) {
                        const tileIndex = selectedTiles.tiles[dy * selectedTiles.width + dx] ?? 0;
                        tilemap.setTile(currentLayer, x, y, tileIndex);
                    }
                }
            }
        } else {
            // No selection, paint tile 0 with brush size
            const halfSize = Math.floor(brushSize / 2);
            for (let dy = -halfSize; dy <= halfSize; dy++) {
                for (let dx = -halfSize; dx <= halfSize; dx++) {
                    const x = tileX + dx;
                    const y = tileY + dy;
                    if (x >= 0 && x < tilemap.width && y >= 0 && y < tilemap.height) {
                        tilemap.setTile(currentLayer, x, y, 1);
                    }
                }
            }
        }
    }

    private drawLine(x0: number, y0: number, x1: number, y1: number, ctx: ToolContext): void {
        // Bresenham's line algorithm
        const dx = Math.abs(x1 - x0);
        const dy = Math.abs(y1 - y0);
        const sx = x0 < x1 ? 1 : -1;
        const sy = y0 < y1 ? 1 : -1;
        let err = dx - dy;

        let x = x0;
        let y = y0;

        while (true) {
            this.paint(x, y, ctx);

            if (x === x1 && y === y1) break;

            const e2 = 2 * err;
            if (e2 > -dy) {
                err -= dy;
                x += sx;
            }
            if (e2 < dx) {
                err += dx;
                y += sy;
            }
        }
    }
}
