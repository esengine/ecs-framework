/**
 * Eraser Tool - Remove tiles from the tilemap
 */

import type { ITilemapTool, ToolContext } from './ITilemapTool';

export class EraserTool implements ITilemapTool {
    readonly id = 'eraser';
    readonly name = 'Eraser';
    readonly icon = 'Eraser';
    readonly cursor = 'crosshair';

    private _isErasing = false;
    private _lastTileX = -1;
    private _lastTileY = -1;

    onMouseDown(tileX: number, tileY: number, ctx: ToolContext): void {
        if (ctx.layerLocked && !ctx.editingCollision) return;
        this._isErasing = true;
        this._lastTileX = tileX;
        this._lastTileY = tileY;
        this.erase(tileX, tileY, ctx);
    }

    onMouseMove(tileX: number, tileY: number, ctx: ToolContext): void {
        if (!this._isErasing || (ctx.layerLocked && !ctx.editingCollision)) return;
        if (tileX === this._lastTileX && tileY === this._lastTileY) return;

        this.drawLine(this._lastTileX, this._lastTileY, tileX, tileY, ctx);
        this._lastTileX = tileX;
        this._lastTileY = tileY;
    }

    onMouseUp(_tileX: number, _tileY: number, _ctx: ToolContext): void {
        this._isErasing = false;
        this._lastTileX = -1;
        this._lastTileY = -1;
    }

    getPreviewTiles(tileX: number, tileY: number, ctx: ToolContext): { x: number; y: number }[] {
        const tiles: { x: number; y: number }[] = [];
        const halfSize = Math.floor(ctx.brushSize / 2);

        for (let dy = -halfSize; dy <= halfSize; dy++) {
            for (let dx = -halfSize; dx <= halfSize; dx++) {
                tiles.push({ x: tileX + dx, y: tileY + dy });
            }
        }

        return tiles;
    }

    private erase(tileX: number, tileY: number, ctx: ToolContext): void {
        const { tilemap, brushSize, editingCollision, currentLayer } = ctx;
        const halfSize = Math.floor(brushSize / 2);

        for (let dy = -halfSize; dy <= halfSize; dy++) {
            for (let dx = -halfSize; dx <= halfSize; dx++) {
                const x = tileX + dx;
                const y = tileY + dy;
                if (x >= 0 && x < tilemap.width && y >= 0 && y < tilemap.height) {
                    if (editingCollision) {
                        tilemap.setCollision(x, y, 0);
                    } else {
                        tilemap.setTile(currentLayer, x, y, 0);
                    }
                }
            }
        }
    }

    private drawLine(x0: number, y0: number, x1: number, y1: number, ctx: ToolContext): void {
        const dx = Math.abs(x1 - x0);
        const dy = Math.abs(y1 - y0);
        const sx = x0 < x1 ? 1 : -1;
        const sy = y0 < y1 ? 1 : -1;
        let err = dx - dy;

        let x = x0;
        let y = y0;

        while (true) {
            this.erase(x, y, ctx);

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
