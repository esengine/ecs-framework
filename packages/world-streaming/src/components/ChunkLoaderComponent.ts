import { Component, ECSComponent, Serializable, Serialize, Property } from '@esengine/ecs-framework';
import type { IChunkCoord, IStreamingConfig } from '../types';
import { DEFAULT_STREAMING_CONFIG } from '../types';

/**
 * 区块加载器组件
 *
 * Singleton component that manages streaming configuration.
 * Attach to a manager entity in the scene.
 *
 * 单例组件，管理流式加载配置。挂载在场景管理实体上。
 */
@ECSComponent('ChunkLoader')
@Serializable({ version: 1, typeId: 'ChunkLoader' })
export class ChunkLoaderComponent extends Component {
    @Serialize()
    @Property({ type: 'integer', label: 'Chunk Size', min: 64, max: 4096 })
    private _chunkSize: number = DEFAULT_STREAMING_CONFIG.chunkSize;

    @Serialize()
    @Property({ type: 'integer', label: 'Load Radius', min: 1, max: 10 })
    private _loadRadius: number = DEFAULT_STREAMING_CONFIG.loadRadius;

    @Serialize()
    @Property({ type: 'integer', label: 'Unload Radius', min: 2, max: 20 })
    private _unloadRadius: number = DEFAULT_STREAMING_CONFIG.unloadRadius;

    @Serialize()
    @Property({ type: 'integer', label: 'Max Loads Per Frame', min: 1, max: 10 })
    private _maxLoadsPerFrame: number = DEFAULT_STREAMING_CONFIG.maxLoadsPerFrame;

    @Serialize()
    @Property({ type: 'integer', label: 'Max Unloads Per Frame', min: 1, max: 10 })
    private _maxUnloadsPerFrame: number = DEFAULT_STREAMING_CONFIG.maxUnloadsPerFrame;

    @Serialize()
    @Property({ type: 'integer', label: 'Unload Delay (ms)', min: 0, max: 30000 })
    private _unloadDelay: number = DEFAULT_STREAMING_CONFIG.unloadDelay;

    @Serialize()
    @Property({ type: 'boolean', label: 'Enable Prefetch' })
    private _bEnablePrefetch: boolean = DEFAULT_STREAMING_CONFIG.bEnablePrefetch;

    @Serialize()
    @Property({ type: 'integer', label: 'Prefetch Radius', min: 0, max: 5 })
    private _prefetchRadius: number = DEFAULT_STREAMING_CONFIG.prefetchRadius;

    get chunkSize(): number {
        return this._chunkSize;
    }

    get loadRadius(): number {
        return this._loadRadius;
    }

    get unloadRadius(): number {
        return this._unloadRadius;
    }

    get maxLoadsPerFrame(): number {
        return this._maxLoadsPerFrame;
    }

    get maxUnloadsPerFrame(): number {
        return this._maxUnloadsPerFrame;
    }

    get unloadDelay(): number {
        return this._unloadDelay;
    }

    get bEnablePrefetch(): boolean {
        return this._bEnablePrefetch;
    }

    get prefetchRadius(): number {
        return this._prefetchRadius;
    }

    /**
     * 应用配置
     *
     * Apply streaming configuration.
     */
    applyConfig(config: Partial<IStreamingConfig>): void {
        if (config.chunkSize !== undefined) this._chunkSize = config.chunkSize;
        if (config.loadRadius !== undefined) this._loadRadius = config.loadRadius;
        if (config.unloadRadius !== undefined) this._unloadRadius = config.unloadRadius;
        if (config.maxLoadsPerFrame !== undefined) this._maxLoadsPerFrame = config.maxLoadsPerFrame;
        if (config.maxUnloadsPerFrame !== undefined) this._maxUnloadsPerFrame = config.maxUnloadsPerFrame;
        if (config.unloadDelay !== undefined) this._unloadDelay = config.unloadDelay;
        if (config.bEnablePrefetch !== undefined) this._bEnablePrefetch = config.bEnablePrefetch;
        if (config.prefetchRadius !== undefined) this._prefetchRadius = config.prefetchRadius;
    }

    /**
     * 世界坐标转区块坐标
     *
     * Convert world position to chunk coordinates.
     */
    worldToChunk(worldX: number, worldY: number): IChunkCoord {
        return {
            x: Math.floor(worldX / this._chunkSize),
            y: Math.floor(worldY / this._chunkSize)
        };
    }

    /**
     * 区块坐标转世界坐标（返回区块中心）
     *
     * Convert chunk coordinates to world position (chunk center).
     */
    chunkToWorld(coord: IChunkCoord): { x: number; y: number } {
        return {
            x: coord.x * this._chunkSize + this._chunkSize * 0.5,
            y: coord.y * this._chunkSize + this._chunkSize * 0.5
        };
    }

    /**
     * 获取区块边界
     *
     * Get chunk world-space bounds.
     */
    getChunkBounds(coord: IChunkCoord): { minX: number; minY: number; maxX: number; maxY: number } {
        return {
            minX: coord.x * this._chunkSize,
            minY: coord.y * this._chunkSize,
            maxX: (coord.x + 1) * this._chunkSize,
            maxY: (coord.y + 1) * this._chunkSize
        };
    }
}
