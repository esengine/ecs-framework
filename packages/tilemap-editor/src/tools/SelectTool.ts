/**
 * Select Tool - Select rectangular regions of tiles for copy/move operations
 */

import type { ITilemapTool, ToolContext } from './ITilemapTool';
import { useTilemapEditorStore } from '../stores/TilemapEditorStore';

export class SelectTool implements ITilemapTool {
    readonly id = 'select';
    readonly name = 'Select';
    readonly icon = 'BoxSelect';
    readonly cursor = 'crosshair';

    private _isSelecting = false;
    private _startX = -1;
    private _startY = -1;
    private _currentX = -1;
    private _currentY = -1;

    onMouseDown(tileX: number, tileY: number, _ctx: ToolContext): void {
        this._isSelecting = true;
        this._startX = tileX;
        this._startY = tileY;
        this._currentX = tileX;
        this._currentY = tileY;
    }

    onMouseMove(tileX: number, tileY: number, _ctx: ToolContext): void {
        if (!this._isSelecting) return;
        this._currentX = tileX;
        this._currentY = tileY;
    }

    onMouseUp(tileX: number, tileY: number, ctx: ToolContext): void {
        if (!this._isSelecting) return;

        this._currentX = tileX;
        this._currentY = tileY;

        const minX = Math.max(0, Math.min(this._startX, this._currentX));
        const maxX = Math.min(ctx.tilemap.width - 1, Math.max(this._startX, this._currentX));
        const minY = Math.max(0, Math.min(this._startY, this._currentY));
        const maxY = Math.min(ctx.tilemap.height - 1, Math.max(this._startY, this._currentY));

        const width = maxX - minX + 1;
        const height = maxY - minY + 1;

        const tiles: number[] = [];
        for (let y = minY; y <= maxY; y++) {
            for (let x = minX; x <= maxX; x++) {
                const tileIndex = ctx.tilemap.getTile(ctx.currentLayer, x, y);
                tiles.push(tileIndex);
            }
        }

        useTilemapEditorStore.getState().setSelectedTiles({
            x: minX,
            y: minY,
            width,
            height,
            tiles
        });

        this.reset();
    }

    getPreviewTiles(tileX: number, tileY: number, _ctx: ToolContext): { x: number; y: number }[] {
        if (!this._isSelecting) {
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

    private reset(): void {
        this._isSelecting = false;
        this._startX = -1;
        this._startY = -1;
        this._currentX = -1;
        this._currentY = -1;
    }
}
