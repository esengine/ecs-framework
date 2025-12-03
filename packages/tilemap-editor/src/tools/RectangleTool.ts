/**
 * Rectangle Tool - Draw rectangular areas of tiles
 */

import type { ITilemapTool, ToolContext } from './ITilemapTool';

export class RectangleTool implements ITilemapTool {
    readonly id = 'rectangle';
    readonly name = 'Rectangle';
    readonly icon = 'Square';
    readonly cursor = 'crosshair';

    private _isDrawing = false;
    private _startX = -1;
    private _startY = -1;
    private _currentX = -1;
    private _currentY = -1;

    onMouseDown(tileX: number, tileY: number, ctx: ToolContext): void {
        if (ctx.layerLocked && !ctx.editingCollision) return;
        this._isDrawing = true;
        this._startX = tileX;
        this._startY = tileY;
        this._currentX = tileX;
        this._currentY = tileY;
    }

    onMouseMove(tileX: number, tileY: number, _ctx: ToolContext): void {
        if (!this._isDrawing) return;
        this._currentX = tileX;
        this._currentY = tileY;
    }

    onMouseUp(tileX: number, tileY: number, ctx: ToolContext): void {
        if (!this._isDrawing) return;
        if (ctx.layerLocked && !ctx.editingCollision) {
            this.reset();
            return;
        }

        this._currentX = tileX;
        this._currentY = tileY;
        this.fillRectangle(ctx);
        this.reset();
    }

    getPreviewTiles(tileX: number, tileY: number, _ctx: ToolContext): { x: number; y: number }[] {
        if (!this._isDrawing) {
            return [{ x: tileX, y: tileY }];
        }

        const tiles: { x: number; y: number }[] = [];
        const minX = Math.min(this._startX, tileX);
        const maxX = Math.max(this._startX, tileX);
        const minY = Math.min(this._startY, tileY);
        const maxY = Math.max(this._startY, tileY);

        for (let y = minY; y <= maxY; y++) {
            for (let x = minX; x <= maxX; x++) {
                tiles.push({ x, y });
            }
        }

        return tiles;
    }

    private fillRectangle(ctx: ToolContext): void {
        const { tilemap, selectedTiles, editingCollision, currentLayer } = ctx;

        const minX = Math.min(this._startX, this._currentX);
        const maxX = Math.max(this._startX, this._currentX);
        const minY = Math.min(this._startY, this._currentY);
        const maxY = Math.max(this._startY, this._currentY);

        for (let y = minY; y <= maxY; y++) {
            for (let x = minX; x <= maxX; x++) {
                if (x < 0 || x >= tilemap.width || y < 0 || y >= tilemap.height) continue;

                if (editingCollision) {
                    tilemap.setCollision(x, y, 1);
                } else if (selectedTiles) {
                    const localX = (x - minX) % selectedTiles.width;
                    const localY = (y - minY) % selectedTiles.height;
                    const tileIndex = selectedTiles.tiles[localY * selectedTiles.width + localX] ?? 0;
                    tilemap.setTile(currentLayer, x, y, tileIndex);
                } else {
                    tilemap.setTile(currentLayer, x, y, 1);
                }
            }
        }
    }

    private reset(): void {
        this._isDrawing = false;
        this._startX = -1;
        this._startY = -1;
        this._currentX = -1;
        this._currentY = -1;
    }
}
