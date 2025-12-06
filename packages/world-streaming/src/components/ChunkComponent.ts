import { Component, ECSComponent, Serializable, Serialize, Property } from '@esengine/ecs-framework';
import type { IChunkCoord, IChunkBounds } from '../types';
import { EChunkState } from '../types';

/**
 * 区块组件
 *
 * Attached to chunk root entities. Tracks chunk state and bounds.
 *
 * 区块组件挂载在区块根实体上，用于管理区块状态和边界信息。
 */
@ECSComponent('Chunk')
@Serializable({ version: 1, typeId: 'Chunk' })
export class ChunkComponent extends Component {
    @Serialize()
    @Property({ type: 'integer', label: 'Coord X', readOnly: true })
    private _coordX: number = 0;

    @Serialize()
    @Property({ type: 'integer', label: 'Coord Y', readOnly: true })
    private _coordY: number = 0;

    @Serialize()
    @Property({ type: 'string', label: 'State', readOnly: true })
    private _state: EChunkState = EChunkState.Unloaded;

    @Serialize()
    private _minX: number = 0;

    @Serialize()
    private _minY: number = 0;

    @Serialize()
    private _maxX: number = 0;

    @Serialize()
    private _maxY: number = 0;

    private _lastAccessTime: number = 0;

    get coord(): IChunkCoord {
        return { x: this._coordX, y: this._coordY };
    }

    get bounds(): IChunkBounds {
        return {
            minX: this._minX,
            minY: this._minY,
            maxX: this._maxX,
            maxY: this._maxY
        };
    }

    get state(): EChunkState {
        return this._state;
    }

    get lastAccessTime(): number {
        return this._lastAccessTime;
    }

    /**
     * 初始化区块
     *
     * Initialize chunk with coordinates and bounds.
     */
    initialize(coord: IChunkCoord, bounds: IChunkBounds): void {
        this._coordX = coord.x;
        this._coordY = coord.y;
        this._minX = bounds.minX;
        this._minY = bounds.minY;
        this._maxX = bounds.maxX;
        this._maxY = bounds.maxY;
        this._lastAccessTime = Date.now();
    }

    /**
     * 设置区块状态
     *
     * Set chunk state.
     */
    setState(state: EChunkState): void {
        this._state = state;
    }

    /**
     * 更新访问时间
     *
     * Update last access time for LRU tracking.
     */
    touch(): void {
        this._lastAccessTime = Date.now();
    }

    /**
     * 检查点是否在区块内
     *
     * Check if a point is within chunk bounds.
     */
    containsPoint(x: number, y: number): boolean {
        return x >= this._minX && x < this._maxX && y >= this._minY && y < this._maxY;
    }
}
