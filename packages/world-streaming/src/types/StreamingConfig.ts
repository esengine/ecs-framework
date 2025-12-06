/**
 * 世界流式加载配置
 *
 * Configuration for world streaming behavior.
 */
export interface IStreamingConfig {
    /** 区块大小（世界单位）| Chunk size in world units */
    chunkSize: number;

    /**
     * 加载半径（区块数）
     *
     * How many chunks to load around each anchor.
     */
    loadRadius: number;

    /**
     * 卸载半径（区块数）
     *
     * Chunks beyond this radius will be unloaded.
     * Should be greater than loadRadius to prevent thrashing.
     */
    unloadRadius: number;

    /**
     * 每帧最大加载数
     *
     * Maximum chunks to load per frame to avoid stutter.
     */
    maxLoadsPerFrame: number;

    /**
     * 每帧最大卸载数
     *
     * Maximum chunks to unload per frame.
     */
    maxUnloadsPerFrame: number;

    /**
     * 最小卸载延迟（毫秒）
     *
     * Minimum time a chunk must be out of range before unloading.
     * Prevents rapid load/unload cycles.
     */
    unloadDelay: number;

    /**
     * 是否启用预加载
     *
     * Enable prefetching chunks in movement direction.
     */
    bEnablePrefetch: boolean;

    /**
     * 预加载半径（区块数）
     *
     * Additional chunks to prefetch ahead of movement.
     */
    prefetchRadius: number;
}

/**
 * 默认流式加载配置
 *
 * Default streaming configuration values.
 */
export const DEFAULT_STREAMING_CONFIG: Readonly<IStreamingConfig> = {
    chunkSize: 512,
    loadRadius: 2,
    unloadRadius: 4,
    maxLoadsPerFrame: 2,
    maxUnloadsPerFrame: 1,
    unloadDelay: 3000,
    bEnablePrefetch: true,
    prefetchRadius: 1
};
