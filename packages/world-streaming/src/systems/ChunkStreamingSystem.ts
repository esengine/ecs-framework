import { EntitySystem, Matcher, Time, ECSSystem } from '@esengine/ecs-framework';
import type { Entity, Scene } from '@esengine/ecs-framework';
import { TransformComponent } from '@esengine/engine-core';
import { StreamingAnchorComponent } from '../components/StreamingAnchorComponent';
import { ChunkLoaderComponent } from '../components/ChunkLoaderComponent';
import { ChunkManager } from '../services/ChunkManager';
import { EChunkPriority } from '../types';
import type { IChunkCoord } from '../types';

/**
 * 区块流式加载系统
 *
 * Manages chunk loading/unloading based on streaming anchors.
 *
 * 根据流式锚点位置管理区块的加载和卸载。
 */
@ECSSystem('ChunkStreaming', { updateOrder: -50 })
export class ChunkStreamingSystem extends EntitySystem {
    private _chunkManager: ChunkManager | null = null;
    private _loaderEntity: Entity | null = null;
    private _lastAnchorChunks: Map<Entity, IChunkCoord> = new Map();

    constructor() {
        super(Matcher.all(StreamingAnchorComponent, TransformComponent));
    }

    /**
     * 设置区块管理器
     *
     * Set the chunk manager instance.
     */
    setChunkManager(manager: ChunkManager): void {
        this._chunkManager = manager;
    }

    /**
     * 获取区块管理器
     *
     * Get the chunk manager instance.
     */
    get chunkManager(): ChunkManager | null {
        return this._chunkManager;
    }

    initialize(): void {
        super.initialize();

        if (!this._chunkManager) {
            this._chunkManager = new ChunkManager();
        }

        const scene = this.scene;
        if (scene) {
            this._chunkManager.setScene(scene);
            this.findLoaderEntity(scene);
        }
    }

    protected process(entities: readonly Entity[]): void {
        if (!this._chunkManager) {
            return;
        }

        const loader = this.getLoaderComponent();
        if (!loader) {
            return;
        }

        const deltaTime = Time.deltaTime;

        this.updateAnchors(entities, deltaTime);
        this.updateChunkRequests(entities, loader);

        this._chunkManager.processLoads(loader.maxLoadsPerFrame);
        this._chunkManager.processUnloads(loader.maxUnloadsPerFrame);
    }

    /**
     * 更新锚点速度
     *
     * Update anchor velocities.
     */
    private updateAnchors(entities: readonly Entity[], deltaTime: number): void {
        for (const entity of entities) {
            const anchor = entity.getComponent(StreamingAnchorComponent);
            const transform = entity.getComponent(TransformComponent);

            if (!anchor || !transform) continue;

            const currentX = transform.position.x;
            const currentY = transform.position.y;

            if (deltaTime > 0) {
                anchor.velocityX = (currentX - anchor.previousX) / deltaTime;
                anchor.velocityY = (currentY - anchor.previousY) / deltaTime;
            }

            anchor.previousX = currentX;
            anchor.previousY = currentY;
        }
    }

    /**
     * 更新区块加载/卸载请求
     *
     * Update chunk load/unload requests based on anchor positions.
     */
    private updateChunkRequests(entities: readonly Entity[], loader: ChunkLoaderComponent): void {
        if (!this._chunkManager) return;

        const centerCoords: IChunkCoord[] = [];

        for (const entity of entities) {
            const transform = entity.getComponent(TransformComponent);
            if (!transform) continue;

            const coord = loader.worldToChunk(transform.position.x, transform.position.y);
            centerCoords.push(coord);

            const lastCoord = this._lastAnchorChunks.get(entity);
            const hasMovedChunk = !lastCoord || lastCoord.x !== coord.x || lastCoord.y !== coord.y;

            if (hasMovedChunk) {
                this._lastAnchorChunks.set(entity, coord);
            }

            this.requestChunksForAnchor(entity, coord, loader);
        }

        this.requestUnloadsOutsideRange(centerCoords, loader);
    }

    /**
     * 请求锚点周围的区块
     *
     * Request chunks around an anchor point.
     */
    private requestChunksForAnchor(
        entity: Entity,
        centerCoord: IChunkCoord,
        loader: ChunkLoaderComponent
    ): void {
        if (!this._chunkManager) return;

        const anchor = entity.getComponent(StreamingAnchorComponent);
        if (!anchor) return;

        const effectiveRadius = Math.ceil(loader.loadRadius * anchor.weight);

        for (let dx = -effectiveRadius; dx <= effectiveRadius; dx++) {
            for (let dy = -effectiveRadius; dy <= effectiveRadius; dy++) {
                const coord = { x: centerCoord.x + dx, y: centerCoord.y + dy };
                const distSq = dx * dx + dy * dy;

                let priority: EChunkPriority;
                if (distSq === 0) {
                    priority = EChunkPriority.Immediate;
                } else if (distSq <= 1) {
                    priority = EChunkPriority.High;
                } else if (distSq <= 4) {
                    priority = EChunkPriority.Normal;
                } else {
                    priority = EChunkPriority.Low;
                }

                this._chunkManager.requestLoad(coord, priority);
                this._chunkManager.cancelUnload(coord);
            }
        }

        if (loader.bEnablePrefetch && anchor.bEnablePrefetch) {
            this.requestPrefetchChunks(anchor, centerCoord, loader);
        }
    }

    /**
     * 请求预加载区块
     *
     * Request prefetch chunks based on movement direction.
     */
    private requestPrefetchChunks(
        anchor: StreamingAnchorComponent,
        centerCoord: IChunkCoord,
        loader: ChunkLoaderComponent
    ): void {
        if (!this._chunkManager) return;

        const velocityMagnitude = Math.sqrt(
            anchor.velocityX * anchor.velocityX + anchor.velocityY * anchor.velocityY
        );

        if (velocityMagnitude < 10) return;

        const dirX = anchor.velocityX / velocityMagnitude;
        const dirY = anchor.velocityY / velocityMagnitude;

        const chunkDirX = Math.round(dirX);
        const chunkDirY = Math.round(dirY);

        if (chunkDirX === 0 && chunkDirY === 0) return;

        for (let i = 1; i <= loader.prefetchRadius; i++) {
            const coord = {
                x: centerCoord.x + chunkDirX * (loader.loadRadius + i),
                y: centerCoord.y + chunkDirY * (loader.loadRadius + i)
            };

            this._chunkManager.requestLoad(coord, EChunkPriority.Prefetch);
        }
    }

    /**
     * 请求卸载超出范围的区块
     *
     * Request unload for chunks outside all anchors' ranges.
     */
    private requestUnloadsOutsideRange(
        centerCoords: IChunkCoord[],
        loader: ChunkLoaderComponent
    ): void {
        if (!this._chunkManager || centerCoords.length === 0) return;

        // 使用公共接口遍历区块 | Use public interface to iterate chunks
        this._chunkManager.forEachChunk((_info, coord) => {
            let isInRange = false;

            for (const center of centerCoords) {
                const dx = Math.abs(coord.x - center.x);
                const dy = Math.abs(coord.y - center.y);

                if (dx <= loader.unloadRadius && dy <= loader.unloadRadius) {
                    isInRange = true;
                    break;
                }
            }

            if (!isInRange) {
                this._chunkManager!.requestUnload(coord, loader.unloadDelay);
            }
        });
    }

    /**
     * 查找 ChunkLoader 实体
     *
     * Find the chunk loader entity.
     */
    private findLoaderEntity(scene: Scene): void {
        const result = scene.queryAll(ChunkLoaderComponent);
        if (result.entities.length > 0) {
            this._loaderEntity = result.entities[0] as Entity;
        }
    }

    /**
     * 获取 ChunkLoaderComponent
     *
     * Get the chunk loader component.
     */
    private getLoaderComponent(): ChunkLoaderComponent | null {
        if (this._loaderEntity && !this._loaderEntity.isDestroyed) {
            return this._loaderEntity.getComponent(ChunkLoaderComponent);
        }

        const scene = this.scene;
        if (!scene) return null;

        this.findLoaderEntity(scene);
        return this._loaderEntity?.getComponent(ChunkLoaderComponent) ?? null;
    }
}
