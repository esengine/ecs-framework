/**
 * Tilemap Animation System
 * 瓦片地图动画系统
 *
 * Manages tile animation playback for all animated tiles in tilesets.
 * 管理图块集中所有动画瓦片的动画播放。
 */

import type { ITilesetData, ITileMetadata } from './TilemapComponent';

/**
 * Animation state for a single animated tile
 * 单个动画瓦片的动画状态
 */
interface TileAnimationState {
    /** Current frame index | 当前帧索引 */
    currentFrame: number;
    /** Elapsed time since last frame change (ms) | 自上次帧变化以来的时间（毫秒） */
    elapsedTime: number;
}

/**
 * Tilemap Animation System
 * 瓦片地图动画系统
 */
export class TilemapAnimationSystem {
    /** Animation states keyed by "tilesetIndex:tileId" | 按"图块集索引:瓦片ID"索引的动画状态 */
    private animationStates: Map<string, TileAnimationState> = new Map();

    /** Cached animated tile metadata for quick lookup | 缓存的动画瓦片元数据用于快速查找 */
    private animatedTiles: Map<string, ITileMetadata> = new Map();

    /** Whether animations are playing | 动画是否正在播放 */
    private _isPlaying: boolean = true;

    /**
     * Register a tileset's animated tiles
     * 注册图块集的动画瓦片
     */
    registerTileset(tilesetIndex: number, tileset: ITilesetData): void {
        if (!tileset.tiles) return;

        for (const tile of tileset.tiles) {
            if (tile.animation && tile.animation.frames.length > 0) {
                const key = `${tilesetIndex}:${tile.id}`;
                this.animatedTiles.set(key, tile);
                this.animationStates.set(key, {
                    currentFrame: 0,
                    elapsedTime: 0
                });
            }
        }
    }

    /**
     * Unregister a tileset
     * 注销图块集
     */
    unregisterTileset(tilesetIndex: number): void {
        const keysToRemove: string[] = [];
        for (const key of this.animationStates.keys()) {
            if (key.startsWith(`${tilesetIndex}:`)) {
                keysToRemove.push(key);
            }
        }
        for (const key of keysToRemove) {
            this.animationStates.delete(key);
            this.animatedTiles.delete(key);
        }
    }

    /**
     * Clear all animation states
     * 清除所有动画状态
     */
    clear(): void {
        this.animationStates.clear();
        this.animatedTiles.clear();
    }

    /**
     * Update all animations
     * 更新所有动画
     * @param deltaTime Time since last update in milliseconds | 自上次更新以来的时间（毫秒）
     */
    update(deltaTime: number): void {
        if (!this._isPlaying) return;

        for (const [key, state] of this.animationStates) {
            const tile = this.animatedTiles.get(key);
            if (!tile?.animation) continue;

            const frames = tile.animation.frames;
            const currentFrame = frames[state.currentFrame];
            if (!currentFrame) continue;

            state.elapsedTime += deltaTime;

            // Advance frames while elapsed time exceeds frame duration
            while (state.elapsedTime >= currentFrame.duration) {
                state.elapsedTime -= currentFrame.duration;
                state.currentFrame = (state.currentFrame + 1) % frames.length;
            }
        }
    }

    /**
     * Get the current display tile ID for an animated tile
     * 获取动画瓦片的当前显示瓦片ID
     * @param tilesetIndex Tileset index | 图块集索引
     * @param tileId Original tile ID | 原始瓦片ID
     * @returns Current frame's tile ID, or original if not animated | 当前帧的瓦片ID，如果不是动画则返回原始ID
     */
    getCurrentTileId(tilesetIndex: number, tileId: number): number {
        const key = `${tilesetIndex}:${tileId}`;
        const tile = this.animatedTiles.get(key);
        const state = this.animationStates.get(key);

        if (!tile?.animation || !state) {
            return tileId;
        }

        const frame = tile.animation.frames[state.currentFrame];
        return frame?.tileId ?? tileId;
    }

    /**
     * Check if a tile has animation
     * 检查瓦片是否有动画
     */
    hasAnimation(tilesetIndex: number, tileId: number): boolean {
        const key = `${tilesetIndex}:${tileId}`;
        return this.animatedTiles.has(key);
    }

    /**
     * Get animation metadata for a tile
     * 获取瓦片的动画元数据
     */
    getAnimation(tilesetIndex: number, tileId: number): ITileMetadata | undefined {
        const key = `${tilesetIndex}:${tileId}`;
        return this.animatedTiles.get(key);
    }

    /**
     * Reset animation to first frame
     * 重置动画到第一帧
     */
    resetAnimation(tilesetIndex: number, tileId: number): void {
        const key = `${tilesetIndex}:${tileId}`;
        const state = this.animationStates.get(key);
        if (state) {
            state.currentFrame = 0;
            state.elapsedTime = 0;
        }
    }

    /**
     * Reset all animations to first frame
     * 重置所有动画到第一帧
     */
    resetAll(): void {
        for (const state of this.animationStates.values()) {
            state.currentFrame = 0;
            state.elapsedTime = 0;
        }
    }

    /**
     * Play/pause animations
     * 播放/暂停动画
     */
    get isPlaying(): boolean {
        return this._isPlaying;
    }

    set isPlaying(value: boolean) {
        this._isPlaying = value;
    }

    /**
     * Toggle play/pause
     * 切换播放/暂停
     */
    togglePlayback(): boolean {
        this._isPlaying = !this._isPlaying;
        return this._isPlaying;
    }

    /**
     * Get all animated tile IDs for a tileset
     * 获取图块集的所有动画瓦片ID
     */
    getAnimatedTileIds(tilesetIndex: number): number[] {
        const ids: number[] = [];
        for (const key of this.animatedTiles.keys()) {
            if (key.startsWith(`${tilesetIndex}:`)) {
                const tileId = parseInt(key.split(':')[1], 10);
                ids.push(tileId);
            }
        }
        return ids;
    }
}

/** Global animation system instance | 全局动画系统实例 */
export const tilemapAnimationSystem = new TilemapAnimationSystem();
