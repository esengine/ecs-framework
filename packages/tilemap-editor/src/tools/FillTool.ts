/**
 * Fill Tool - Flood fill tiles on the tilemap
 */

import type { ITilemapTool, ToolContext } from './ITilemapTool';

export class FillTool implements ITilemapTool {
    readonly id = 'fill';
    readonly name = 'Fill';
    readonly icon = 'PaintBucket';
    readonly cursor = 'crosshair';

    onMouseDown(tileX: number, tileY: number, ctx: ToolContext): void {
        if (ctx.layerLocked && !ctx.editingCollision) return;
        this.floodFill(tileX, tileY, ctx);
    }

    onMouseMove(_tileX: number, _tileY: number, _ctx: ToolContext): void {
        // No action on move
    }

    onMouseUp(_tileX: number, _tileY: number, _ctx: ToolContext): void {
        // No action on up
    }

    getPreviewTiles(tileX: number, tileY: number, ctx: ToolContext): { x: number; y: number }[] {
        const { tilemap, editingCollision, currentLayer } = ctx;

        if (tileX < 0 || tileX >= tilemap.width || tileY < 0 || tileY >= tilemap.height) {
            return [];
        }

        const tiles: { x: number; y: number }[] = [];
        const maxPreviewTiles = 500;

        if (editingCollision) {
            const targetCollision = tilemap.hasCollision(tileX, tileY);
            const stack: [number, number][] = [[tileX, tileY]];
            const visited = new Set<string>();

            while (stack.length > 0 && tiles.length < maxPreviewTiles) {
                const [x, y] = stack.pop()!;
                const key = `${x},${y}`;

                if (visited.has(key)) continue;
                if (x < 0 || x >= tilemap.width || y < 0 || y >= tilemap.height) continue;
                if (tilemap.hasCollision(x, y) !== targetCollision) continue;

                visited.add(key);
                tiles.push({ x, y });

                stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
            }
        } else {
            const targetTile = tilemap.getTile(currentLayer, tileX, tileY);
            const stack: [number, number][] = [[tileX, tileY]];
            const visited = new Set<string>();

            while (stack.length > 0 && tiles.length < maxPreviewTiles) {
                const [x, y] = stack.pop()!;
                const key = `${x},${y}`;

                if (visited.has(key)) continue;
                if (x < 0 || x >= tilemap.width || y < 0 || y >= tilemap.height) continue;
                if (tilemap.getTile(currentLayer, x, y) !== targetTile) continue;

                visited.add(key);
                tiles.push({ x, y });

                stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
            }
        }

        return tiles;
    }

    private floodFill(startX: number, startY: number, ctx: ToolContext): void {
        const { tilemap, selectedTiles, editingCollision, currentLayer } = ctx;

        if (startX < 0 || startX >= tilemap.width || startY < 0 || startY >= tilemap.height) {
            return;
        }

        if (editingCollision) {
            // Flood fill collision
            const targetCollision = tilemap.hasCollision(startX, startY);
            const newCollision = targetCollision ? 0 : 1;

            const stack: [number, number][] = [[startX, startY]];
            const visited = new Set<string>();

            while (stack.length > 0) {
                const [x, y] = stack.pop()!;
                const key = `${x},${y}`;

                if (visited.has(key)) continue;
                if (x < 0 || x >= tilemap.width || y < 0 || y >= tilemap.height) continue;
                if (tilemap.hasCollision(x, y) !== targetCollision) continue;

                visited.add(key);
                tilemap.setCollision(x, y, newCollision);

                stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
            }
        } else {
            // Flood fill tiles
            const targetTile = tilemap.getTile(currentLayer, startX, startY);
            const newTile = selectedTiles ? (selectedTiles.tiles[0] ?? 1) : 1;

            if (targetTile === newTile) return;

            const stack: [number, number][] = [[startX, startY]];
            const visited = new Set<string>();

            while (stack.length > 0) {
                const [x, y] = stack.pop()!;
                const key = `${x},${y}`;

                if (visited.has(key)) continue;
                if (x < 0 || x >= tilemap.width || y < 0 || y >= tilemap.height) continue;
                if (tilemap.getTile(currentLayer, x, y) !== targetTile) continue;

                visited.add(key);
                tilemap.setTile(currentLayer, x, y, newTile);

                stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
            }
        }
    }
}
