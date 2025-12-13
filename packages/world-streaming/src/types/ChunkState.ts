/**
 * 区块状态枚举
 *
 * Chunk lifecycle states for streaming management.
 */
export enum EChunkState {
    /** 未加载 | Not loaded */
    Unloaded = 'unloaded',
    /** 加载中 | Loading in progress */
    Loading = 'loading',
    /** 已加载 | Fully loaded and ready */
    Loaded = 'loaded',
    /** 卸载中 | Unloading in progress */
    Unloading = 'unloading',
    /** 加载失败 | Failed to load */
    Failed = 'failed'
}

/**
 * 区块优先级
 *
 * Priority levels for chunk loading queue.
 */
export enum EChunkPriority {
    /** 立即加载 | Immediate loading required */
    Immediate = 0,
    /** 高优先级 | High priority */
    High = 1,
    /** 普通优先级 | Normal priority */
    Normal = 2,
    /** 低优先级 | Low priority */
    Low = 3,
    /** 预加载 | Prefetch for future use */
    Prefetch = 4
}
