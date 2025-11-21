/**
 * Render batcher for collecting sprite data.
 * 用于收集精灵数据的渲染批处理器。
 */

import type { SpriteRenderData } from '../types';

/**
 * Collects and sorts sprite render data for batch submission.
 * 收集和排序精灵渲染数据用于批量提交。
 *
 * This class is used to collect sprites during the ECS update loop
 * and then submit them all at once to the engine.
 * 此类用于在ECS更新循环中收集精灵，然后一次性提交到引擎。
 *
 * @example
 * ```typescript
 * const batcher = new RenderBatcher();
 *
 * // During ECS update | 在ECS更新期间
 * batcher.addSprite({
 *     x: 100, y: 200,
 *     rotation: 0,
 *     scaleX: 1, scaleY: 1,
 *     originX: 0.5, originY: 0.5,
 *     textureId: 1,
 *     uv: [0, 0, 1, 1],
 *     color: 0xFFFFFFFF
 * });
 *
 * // At end of frame | 在帧结束时
 * bridge.submitSprites(batcher.getSprites());
 * batcher.clear();
 * ```
 */
export class RenderBatcher {
    private sprites: SpriteRenderData[] = [];
    private sortByZ = false;

    /**
     * Create a new render batcher.
     * 创建新的渲染批处理器。
     *
     * @param sortByZ - Whether to sort sprites by Z order | 是否按Z顺序排序精灵
     */
    constructor(sortByZ = false) {
        this.sortByZ = sortByZ;
    }

    /**
     * Add a sprite to the batch.
     * 将精灵添加到批处理。
     *
     * @param sprite - Sprite render data | 精灵渲染数据
     */
    addSprite(sprite: SpriteRenderData): void {
        this.sprites.push(sprite);
    }

    /**
     * Add multiple sprites to the batch.
     * 将多个精灵添加到批处理。
     *
     * @param sprites - Array of sprite render data | 精灵渲染数据数组
     */
    addSprites(sprites: SpriteRenderData[]): void {
        this.sprites.push(...sprites);
    }

    /**
     * Get all sprites in the batch.
     * 获取批处理中的所有精灵。
     *
     * @returns Sorted array of sprites | 排序后的精灵数组
     */
    getSprites(): SpriteRenderData[] {
        // Sort by texture ID for better batching (fewer texture switches)
        // 按纹理ID排序以获得更好的批处理效果（减少纹理切换）
        if (!this.sortByZ) {
            this.sprites.sort((a, b) => a.textureId - b.textureId);
        }
        return this.sprites;
    }

    /**
     * Get sprite count.
     * 获取精灵数量。
     */
    get count(): number {
        return this.sprites.length;
    }

    /**
     * Clear all sprites from the batch.
     * 清除批处理中的所有精灵。
     */
    clear(): void {
        this.sprites.length = 0;
    }

    /**
     * Check if batch is empty.
     * 检查批处理是否为空。
     */
    get isEmpty(): boolean {
        return this.sprites.length === 0;
    }
}
