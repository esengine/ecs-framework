import type { Entity, IScene, IService } from '@esengine/ecs-framework';
import { TransformComponent } from '@esengine/engine-core';
import type { IChunkCoord, IChunkData, IChunkInfo, IChunkLoadRequest, IChunkBounds } from '../types';
import { EChunkState, EChunkPriority } from '../types';
import { SpatialHashGrid } from './SpatialHashGrid';
import type { IChunkSerializer } from './ChunkSerializer';
import { ChunkSerializer } from './ChunkSerializer';
import { ChunkComponent } from '../components/ChunkComponent';

/**
 * 区块数据提供者接口
 *
 * Interface for chunk data loading/saving.
 */
export interface IChunkDataProvider {
    loadChunkData(coord: IChunkCoord): Promise<IChunkData | null>;
    saveChunkData(data: IChunkData): Promise<void>;
}

/**
 * 区块管理器事件
 *
 * Events emitted by ChunkManager.
 */
export interface IChunkManagerEvents {
    onChunkLoaded?: (coord: IChunkCoord, entities: Entity[]) => void;
    onChunkUnloaded?: (coord: IChunkCoord) => void;
    onChunkLoadFailed?: (coord: IChunkCoord, error: Error) => void;
}

/**
 * 区块管理器
 *
 * Manages chunk lifecycle, loading queue, and spatial queries.
 *
 * 区块管理器负责区块生命周期、加载队列和空间查询。
 */
export class ChunkManager implements IService {
    private _chunkGrid: SpatialHashGrid<IChunkInfo>;
    private _loadQueue: IChunkLoadRequest[] = [];
    private _unloadQueue: Array<{ coord: IChunkCoord; scheduledTime: number }> = [];
    private _scene: IScene | null = null;
    private _dataProvider: IChunkDataProvider | null = null;
    private _serializer: IChunkSerializer;
    private _events: IChunkManagerEvents = {};
    private _chunkSize: number;

    constructor(chunkSize: number = 512, serializer?: IChunkSerializer) {
        this._chunkSize = chunkSize;
        this._chunkGrid = new SpatialHashGrid<IChunkInfo>(chunkSize);
        this._serializer = serializer ?? new ChunkSerializer();
    }

    get chunkSize(): number {
        return this._chunkSize;
    }

    get loadedChunkCount(): number {
        return this._chunkGrid.size;
    }

    get pendingLoadCount(): number {
        return this._loadQueue.length;
    }

    get pendingUnloadCount(): number {
        return this._unloadQueue.length;
    }

    /**
     * 设置场景
     *
     * Set the scene for entity creation.
     */
    setScene(scene: IScene): void {
        this._scene = scene;
    }

    /**
     * 设置数据提供者
     *
     * Set the chunk data provider.
     */
    setDataProvider(provider: IChunkDataProvider): void {
        this._dataProvider = provider;
    }

    /**
     * 设置事件回调
     *
     * Set event callbacks.
     */
    setEvents(events: IChunkManagerEvents): void {
        this._events = events;
    }

    /**
     * 请求加载区块
     *
     * Request a chunk to be loaded.
     */
    requestLoad(coord: IChunkCoord, priority: EChunkPriority = EChunkPriority.Normal): void {
        const existing = this._chunkGrid.get(coord);
        if (existing && existing.state !== EChunkState.Unloaded && existing.state !== EChunkState.Failed) {
            if (existing.state === EChunkState.Loaded) {
                existing.lastAccessTime = Date.now();
            }
            return;
        }

        const existingRequest = this._loadQueue.find(
            (r) => r.coord.x === coord.x && r.coord.y === coord.y
        );

        if (existingRequest) {
            if (priority < existingRequest.priority) {
                existingRequest.priority = priority;
            }
            return;
        }

        this._loadQueue.push({
            coord,
            priority,
            timestamp: Date.now()
        });

        this.sortLoadQueue();
    }

    /**
     * 请求卸载区块
     *
     * Request a chunk to be unloaded.
     */
    requestUnload(coord: IChunkCoord, delay: number = 0): void {
        const chunk = this._chunkGrid.get(coord);
        if (!chunk || chunk.state !== EChunkState.Loaded) {
            return;
        }

        const existingRequest = this._unloadQueue.find(
            (r) => r.coord.x === coord.x && r.coord.y === coord.y
        );

        if (!existingRequest) {
            this._unloadQueue.push({
                coord,
                scheduledTime: Date.now() + delay
            });
        }
    }

    /**
     * 取消卸载请求
     *
     * Cancel a pending unload request.
     */
    cancelUnload(coord: IChunkCoord): void {
        const index = this._unloadQueue.findIndex(
            (r) => r.coord.x === coord.x && r.coord.y === coord.y
        );

        if (index >= 0) {
            this._unloadQueue.splice(index, 1);
        }
    }

    /**
     * 处理加载队列
     *
     * Process pending load requests.
     */
    async processLoads(maxCount: number): Promise<void> {
        let processed = 0;

        while (processed < maxCount && this._loadQueue.length > 0) {
            const request = this._loadQueue.shift()!;
            await this.loadChunk(request.coord);
            processed++;
        }
    }

    /**
     * 处理卸载队列
     *
     * Process pending unload requests.
     */
    processUnloads(maxCount: number): void {
        const now = Date.now();
        let processed = 0;

        const readyToUnload = this._unloadQueue.filter((r) => r.scheduledTime <= now);

        for (const request of readyToUnload) {
            if (processed >= maxCount) break;

            this.unloadChunk(request.coord);
            processed++;

            const index = this._unloadQueue.indexOf(request);
            if (index >= 0) {
                this._unloadQueue.splice(index, 1);
            }
        }
    }

    /**
     * 加载区块
     *
     * Load a single chunk.
     */
    private async loadChunk(coord: IChunkCoord): Promise<void> {
        if (!this._scene) {
            console.warn('[ChunkManager] No scene set');
            return;
        }

        const bounds = this.getChunkBounds(coord);
        const chunkInfo: IChunkInfo = {
            coord,
            state: EChunkState.Loading,
            priority: EChunkPriority.Normal,
            entities: [],
            bounds,
            lastAccessTime: Date.now(),
            distanceSq: 0
        };

        this._chunkGrid.set(coord, chunkInfo);

        try {
            let entities: Entity[];

            if (this._dataProvider) {
                const data = await this._dataProvider.loadChunkData(coord);
                if (data) {
                    entities = this._serializer.deserialize(data, this._scene);
                } else {
                    entities = this.createEmptyChunk(coord, bounds);
                }
            } else {
                entities = this.createEmptyChunk(coord, bounds);
            }

            chunkInfo.entities = entities;
            chunkInfo.state = EChunkState.Loaded;
            chunkInfo.lastAccessTime = Date.now();

            this._events.onChunkLoaded?.(coord, entities);
        } catch (error) {
            chunkInfo.state = EChunkState.Failed;
            this._events.onChunkLoadFailed?.(coord, error as Error);
        }
    }

    /**
     * 卸载区块
     *
     * Unload a single chunk.
     */
    private unloadChunk(coord: IChunkCoord): void {
        const chunk = this._chunkGrid.get(coord);
        if (!chunk) return;

        chunk.state = EChunkState.Unloading;

        for (const entity of chunk.entities) {
            entity.destroy();
        }

        this._chunkGrid.delete(coord);
        this._events.onChunkUnloaded?.(coord);
    }

    /**
     * 创建空区块
     *
     * Create an empty chunk entity.
     */
    private createEmptyChunk(coord: IChunkCoord, bounds: IChunkBounds): Entity[] {
        if (!this._scene) return [];

        const chunkEntity = this._scene.createEntity(`Chunk_${coord.x}_${coord.y}`);
        const chunkComponent = chunkEntity.addComponent(new ChunkComponent());
        chunkComponent.initialize(coord, bounds);
        chunkComponent.setState(EChunkState.Loaded);

        const transform = chunkEntity.getComponent(TransformComponent);
        if (transform) {
            transform.setPosition(bounds.minX, bounds.minY);
        }

        return [chunkEntity];
    }

    /**
     * 获取区块边界
     *
     * Get world-space bounds for a chunk.
     */
    getChunkBounds(coord: IChunkCoord): IChunkBounds {
        return {
            minX: coord.x * this._chunkSize,
            minY: coord.y * this._chunkSize,
            maxX: (coord.x + 1) * this._chunkSize,
            maxY: (coord.y + 1) * this._chunkSize
        };
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
     * 获取区块信息
     *
     * Get chunk info by coordinates.
     */
    getChunk(coord: IChunkCoord): IChunkInfo | undefined {
        return this._chunkGrid.get(coord);
    }

    /**
     * 检查区块是否已加载
     *
     * Check if a chunk is loaded.
     */
    isChunkLoaded(coord: IChunkCoord): boolean {
        const chunk = this._chunkGrid.get(coord);
        return chunk !== undefined && chunk.state === EChunkState.Loaded;
    }

    /**
     * 获取需要加载的区块坐标
     *
     * Get chunk coordinates that need to be loaded within radius.
     */
    getMissingChunks(centerCoord: IChunkCoord, radius: number): IChunkCoord[] {
        const missing: IChunkCoord[] = [];

        for (let dx = -radius; dx <= radius; dx++) {
            for (let dy = -radius; dy <= radius; dy++) {
                const coord = { x: centerCoord.x + dx, y: centerCoord.y + dy };
                if (!this.isChunkLoaded(coord)) {
                    missing.push(coord);
                }
            }
        }

        return missing;
    }

    /**
     * 遍历所有已加载区块
     * Iterate over all loaded chunks
     *
     * @param callback 回调函数 | Callback function
     */
    forEachChunk(callback: (info: IChunkInfo, coord: IChunkCoord) => void): void {
        this._chunkGrid.forEach(callback);
    }

    /**
     * 获取超出范围的已加载区块
     *
     * Get loaded chunks outside the given radius.
     */
    getChunksOutsideRadius(centerCoord: IChunkCoord, radius: number): IChunkCoord[] {
        const outside: IChunkCoord[] = [];

        this._chunkGrid.forEach((_info, coord) => {
            const dx = Math.abs(coord.x - centerCoord.x);
            const dy = Math.abs(coord.y - centerCoord.y);

            if (dx > radius || dy > radius) {
                outside.push(coord);
            }
        });

        return outside;
    }

    /**
     * 排序加载队列
     *
     * Sort load queue by priority and timestamp.
     */
    private sortLoadQueue(): void {
        this._loadQueue.sort((a, b) => {
            if (a.priority !== b.priority) {
                return a.priority - b.priority;
            }
            return a.timestamp - b.timestamp;
        });
    }

    /**
     * 清空所有区块
     *
     * Unload all chunks.
     */
    clear(): void {
        this._chunkGrid.forEach((_info, coord) => {
            this.unloadChunk(coord);
        });

        this._loadQueue = [];
        this._unloadQueue = [];
    }

    /**
     * 释放资源
     *
     * Dispose resources (IService interface).
     */
    dispose(): void {
        this.clear();
        this._scene = null;
        this._dataProvider = null;
        this._events = {};
    }
}
