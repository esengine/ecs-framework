import type { Entity } from '@esengine/ecs-framework';
import { EChunkState, EChunkPriority } from './ChunkState';

/**
 * 区块坐标
 *
 * Chunk grid coordinates in world space.
 */
export interface IChunkCoord {
    /** X 轴区块索引 | Chunk index on X axis */
    readonly x: number;
    /** Y 轴区块索引 | Chunk index on Y axis */
    readonly y: number;
}

/**
 * 区块边界
 *
 * World-space bounds of a chunk.
 */
export interface IChunkBounds {
    /** 最小 X 坐标 | Minimum X coordinate */
    readonly minX: number;
    /** 最小 Y 坐标 | Minimum Y coordinate */
    readonly minY: number;
    /** 最大 X 坐标 | Maximum X coordinate */
    readonly maxX: number;
    /** 最大 Y 坐标 | Maximum Y coordinate */
    readonly maxY: number;
}

/**
 * 区块数据
 *
 * Serializable chunk data for storage and streaming.
 */
export interface IChunkData {
    /** 区块坐标 | Chunk coordinates */
    readonly coord: IChunkCoord;
    /** 实体数据列表 | Serialized entity data */
    readonly entities: ISerializedEntity[];
    /** 区块元数据 | Chunk metadata */
    readonly metadata?: Record<string, unknown>;
    /** 数据版本 | Data version for migration */
    readonly version: number;
}

/**
 * 序列化实体数据
 *
 * Serialized entity format for chunk storage.
 */
export interface ISerializedEntity {
    /** 实体名称 | Entity name */
    name: string;
    /** 组件数据 | Component data map */
    components: Record<string, unknown>;
    /** 相对于区块的局部位置 | Local position relative to chunk */
    localPosition: { x: number; y: number };
}

/**
 * 运行时区块信息
 *
 * Runtime chunk state and references.
 */
export interface IChunkInfo {
    /** 区块坐标 | Chunk coordinates */
    coord: IChunkCoord;
    /** 当前状态 | Current state */
    state: EChunkState;
    /** 加载优先级 | Loading priority */
    priority: EChunkPriority;
    /** 区块内实体列表 | Entities within this chunk */
    entities: Entity[];
    /** 世界空间边界 | World-space bounds */
    bounds: IChunkBounds;
    /** 上次访问时间戳 | Last access timestamp for LRU */
    lastAccessTime: number;
    /** 距锚点的距离平方 | Squared distance to nearest anchor */
    distanceSq: number;
}

/**
 * 区块加载请求
 *
 * Request to load a chunk with priority.
 */
export interface IChunkLoadRequest {
    /** 区块坐标 | Chunk coordinates */
    coord: IChunkCoord;
    /** 加载优先级 | Loading priority */
    priority: EChunkPriority;
    /** 请求时间戳 | Request timestamp */
    timestamp: number;
}
