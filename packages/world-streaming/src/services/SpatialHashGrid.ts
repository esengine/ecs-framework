import type { IChunkCoord } from '../types';

/**
 * 空间哈希网格
 *
 * Spatial hash grid for fast chunk lookups.
 *
 * 用于快速查询指定位置或范围内的区块。
 */
export class SpatialHashGrid<T> {
    private _cells: Map<string, T> = new Map();
    private _cellSize: number;

    constructor(cellSize: number) {
        this._cellSize = cellSize;
    }

    get cellSize(): number {
        return this._cellSize;
    }

    get size(): number {
        return this._cells.size;
    }

    /**
     * 生成网格键
     *
     * Generate hash key from coordinates.
     */
    private getKey(x: number, y: number): string {
        return `${x},${y}`;
    }

    /**
     * 设置单元格数据
     *
     * Set data at grid coordinates.
     */
    set(coord: IChunkCoord, value: T): void {
        this._cells.set(this.getKey(coord.x, coord.y), value);
    }

    /**
     * 获取单元格数据
     *
     * Get data at grid coordinates.
     */
    get(coord: IChunkCoord): T | undefined {
        return this._cells.get(this.getKey(coord.x, coord.y));
    }

    /**
     * 检查单元格是否存在
     *
     * Check if data exists at coordinates.
     */
    has(coord: IChunkCoord): boolean {
        return this._cells.has(this.getKey(coord.x, coord.y));
    }

    /**
     * 删除单元格
     *
     * Delete data at coordinates.
     */
    delete(coord: IChunkCoord): boolean {
        return this._cells.delete(this.getKey(coord.x, coord.y));
    }

    /**
     * 清空网格
     *
     * Clear all cells.
     */
    clear(): void {
        this._cells.clear();
    }

    /**
     * 世界坐标转网格坐标
     *
     * Convert world position to grid coordinates.
     */
    worldToGrid(worldX: number, worldY: number): IChunkCoord {
        return {
            x: Math.floor(worldX / this._cellSize),
            y: Math.floor(worldY / this._cellSize)
        };
    }

    /**
     * 查询范围内的所有单元格
     *
     * Query all cells within a range.
     */
    queryRange(centerCoord: IChunkCoord, radius: number): T[] {
        const results: T[] = [];

        for (let dx = -radius; dx <= radius; dx++) {
            for (let dy = -radius; dy <= radius; dy++) {
                const value = this.get({ x: centerCoord.x + dx, y: centerCoord.y + dy });
                if (value !== undefined) {
                    results.push(value);
                }
            }
        }

        return results;
    }

    /**
     * 获取范围内需要加载的坐标
     *
     * Get coordinates within range that need loading.
     */
    getMissingInRange(centerCoord: IChunkCoord, radius: number): IChunkCoord[] {
        const missing: IChunkCoord[] = [];

        for (let dx = -radius; dx <= radius; dx++) {
            for (let dy = -radius; dy <= radius; dy++) {
                const coord = { x: centerCoord.x + dx, y: centerCoord.y + dy };
                if (!this.has(coord)) {
                    missing.push(coord);
                }
            }
        }

        return missing;
    }

    /**
     * 获取范围外的所有单元格
     *
     * Get all cells outside a given range.
     */
    getOutsideRange(centerCoord: IChunkCoord, radius: number): Array<{ coord: IChunkCoord; value: T }> {
        const outside: Array<{ coord: IChunkCoord; value: T }> = [];

        for (const [key, value] of this._cells) {
            const [x, y] = key.split(',').map(Number);
            const dx = Math.abs(x - centerCoord.x);
            const dy = Math.abs(y - centerCoord.y);

            if (dx > radius || dy > radius) {
                outside.push({ coord: { x, y }, value });
            }
        }

        return outside;
    }

    /**
     * 遍历所有单元格
     *
     * Iterate over all cells.
     */
    forEach(callback: (value: T, coord: IChunkCoord) => void): void {
        for (const [key, value] of this._cells) {
            const [x, y] = key.split(',').map(Number);
            callback(value, { x, y });
        }
    }

    /**
     * 获取所有值
     *
     * Get all values.
     */
    values(): IterableIterator<T> {
        return this._cells.values();
    }
}
