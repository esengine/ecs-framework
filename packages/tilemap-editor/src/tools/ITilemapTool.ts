/**
 * Tilemap Tool Interface
 */

import type { TilemapComponent } from '@esengine/tilemap';
import type { TileSelection } from '../stores/TilemapEditorStore';

export interface ToolContext {
    tilemap: TilemapComponent;
    selectedTiles: TileSelection | null;
    currentLayer: number;
    layerLocked: boolean;
    brushSize: number;
    editingCollision: boolean;
    tileWidth: number;
    tileHeight: number;
}

export interface ITilemapTool {
    readonly id: string;
    readonly name: string;
    readonly icon: string;
    readonly cursor: string;

    onMouseDown(tileX: number, tileY: number, ctx: ToolContext): void;
    onMouseMove(tileX: number, tileY: number, ctx: ToolContext): void;
    onMouseUp(tileX: number, tileY: number, ctx: ToolContext): void;

    // Preview tiles to highlight during drag
    getPreviewTiles?(tileX: number, tileY: number, ctx: ToolContext): { x: number; y: number }[];
}
