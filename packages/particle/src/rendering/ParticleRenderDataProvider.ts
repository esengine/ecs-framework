import type { ParticleSystemComponent } from '../ParticleSystemComponent';
import { Color } from '@esengine/ecs-framework-math';
import { sortingLayerManager, SortingLayers } from '@esengine/engine-core';

/**
 * 粒子渲染数据（与 EngineRenderSystem 兼容）
 * Particle render data (compatible with EngineRenderSystem)
 *
 * This interface is compatible with ProviderRenderData from EngineRenderSystem.
 * 此接口与 EngineRenderSystem 的 ProviderRenderData 兼容。
 */
export interface ParticleProviderRenderData {
    transforms: Float32Array;
    textureIds: Uint32Array;
    uvs: Float32Array;
    colors: Uint32Array;
    tileCount: number;
    /**
     * 排序层名称
     * Sorting layer name
     */
    sortingLayer: string;
    /**
     * 层内排序顺序
     * Order within the sorting layer
     */
    orderInLayer: number;
    /** 纹理 GUID | Texture GUID */
    textureGuid?: string;
}

/**
 * Transform 接口（避免直接依赖 engine-core）
 * Transform interface (avoid direct dependency on engine-core)
 */
interface ITransformLike {
    worldPosition?: { x: number; y: number };
    position: { x: number; y: number };
}

/**
 * 渲染数据提供者接口（与 EngineRenderSystem 兼容）
 * Render data provider interface (compatible with EngineRenderSystem)
 *
 * This interface matches IRenderDataProvider from @esengine/ecs-engine-bindgen.
 * 此接口与 @esengine/ecs-engine-bindgen 的 IRenderDataProvider 匹配。
 */
export interface IRenderDataProvider {
    getRenderData(): readonly ParticleProviderRenderData[];
}

/**
 * 粒子渲染数据提供者
 * Particle render data provider
 *
 * Collects render data from all active particle systems.
 * 从所有活跃的粒子系统收集渲染数据。
 *
 * Implements IRenderDataProvider for integration with EngineRenderSystem.
 * 实现 IRenderDataProvider 以便与 EngineRenderSystem 集成。
 */
export class ParticleRenderDataProvider implements IRenderDataProvider {
    private _particleSystems: Map<ParticleSystemComponent, ITransformLike> = new Map();
    private _renderDataCache: ParticleProviderRenderData[] = [];
    private _dirty: boolean = true;

    // 预分配的缓冲区 | Pre-allocated buffers
    private _maxParticles: number = 0;
    private _transforms: Float32Array = new Float32Array(0);
    private _textureIds: Uint32Array = new Uint32Array(0);
    private _uvs: Float32Array = new Float32Array(0);
    private _colors: Uint32Array = new Uint32Array(0);

    /**
     * 注册粒子系统
     * Register particle system
     */
    register(component: ParticleSystemComponent, transform: ITransformLike): void {
        this._particleSystems.set(component, transform);
        this._dirty = true;
    }

    /**
     * 注销粒子系统
     * Unregister particle system
     */
    unregister(component: ParticleSystemComponent): void {
        this._particleSystems.delete(component);
        this._dirty = true;
    }

    /**
     * 标记为脏
     * Mark as dirty
     */
    markDirty(): void {
        this._dirty = true;
    }

    /**
     * 获取渲染数据
     * Get render data
     */
    getRenderData(): readonly ParticleProviderRenderData[] {
        this._updateRenderData();
        return this._renderDataCache;
    }

    private _updateRenderData(): void {
        this._renderDataCache.length = 0;

        // 计算总粒子数 | Calculate total particle count
        let totalParticles = 0;
        for (const [component] of this._particleSystems) {
            if (component.isPlaying && component.pool) {
                totalParticles += component.pool.activeCount;
            }
        }


        if (totalParticles === 0) return;

        // 确保缓冲区足够大 | Ensure buffers are large enough
        if (totalParticles > this._maxParticles) {
            this._maxParticles = Math.max(totalParticles, this._maxParticles * 2, 1000);
            this._transforms = new Float32Array(this._maxParticles * 7);
            this._textureIds = new Uint32Array(this._maxParticles);
            this._uvs = new Float32Array(this._maxParticles * 4);
            this._colors = new Uint32Array(this._maxParticles);
        }

        // 按 sortKey 分组（sortingLayer + orderInLayer）
        // Group by sortKey (sortingLayer + orderInLayer)
        const groups = new Map<number, {
            component: ParticleSystemComponent;
            transform: ITransformLike;
            sortingLayer: string;
            orderInLayer: number;
        }[]>();

        for (const [component, transform] of this._particleSystems) {
            if (!component.isPlaying || !component.pool || component.pool.activeCount === 0) {
                continue;
            }

            const sortingLayer = component.sortingLayer ?? SortingLayers.Default;
            const orderInLayer = component.orderInLayer ?? 0;
            const sortKey = sortingLayerManager.getSortKey(sortingLayer, orderInLayer);

            if (!groups.has(sortKey)) {
                groups.set(sortKey, []);
            }
            groups.get(sortKey)!.push({ component, transform, sortingLayer, orderInLayer });
        }

        // 按 sortKey 排序后生成渲染数据
        // Generate render data sorted by sortKey
        const sortedKeys = [...groups.keys()].sort((a, b) => a - b);
        for (const sortKey of sortedKeys) {
            const systems = groups.get(sortKey)!;
            let particleIndex = 0;

            for (const { component } of systems) {
                const pool = component.pool!;
                const size = component.particleSize;
                const textureId = component.textureId;

                // 世界偏移 | World offset (particles are already in world space after emission)
                // 不需要额外偏移，因为粒子发射时已经使用了世界坐标
                // No additional offset needed since particles use world coords at emission

                pool.forEachActive((p) => {
                    const tOffset = particleIndex * 7;
                    const uvOffset = particleIndex * 4;

                    // Transform: x, y, rotation, scaleX, scaleY, originX, originY
                    this._transforms[tOffset] = p.x;
                    this._transforms[tOffset + 1] = p.y;
                    this._transforms[tOffset + 2] = p.rotation;
                    this._transforms[tOffset + 3] = size * p.scaleX;
                    this._transforms[tOffset + 4] = size * p.scaleY;
                    this._transforms[tOffset + 5] = 0.5; // originX
                    this._transforms[tOffset + 6] = 0.5; // originY

                    // Texture ID
                    this._textureIds[particleIndex] = textureId;

                    // UV (full texture)
                    this._uvs[uvOffset] = 0;
                    this._uvs[uvOffset + 1] = 0;
                    this._uvs[uvOffset + 2] = 1;
                    this._uvs[uvOffset + 3] = 1;

                    // Color (packed ABGR for WebGL)
                    this._colors[particleIndex] = Color.packABGR(
                        Math.round(p.r * 255),
                        Math.round(p.g * 255),
                        Math.round(p.b * 255),
                        p.alpha
                    );

                    particleIndex++;
                });
            }

            if (particleIndex > 0) {
                // 获取纹理 GUID | Get texture GUID
                const firstSystem = systems[0];
                const firstComponent = firstSystem?.component;
                const asset = firstComponent?.loadedAsset as { textureGuid?: string } | null;
                const textureGuid = asset?.textureGuid || firstComponent?.textureGuid || undefined;

                // 创建当前组的渲染数据 | Create render data for current group
                const renderData: ParticleProviderRenderData = {
                    transforms: this._transforms.subarray(0, particleIndex * 7),
                    textureIds: this._textureIds.subarray(0, particleIndex),
                    uvs: this._uvs.subarray(0, particleIndex * 4),
                    colors: this._colors.subarray(0, particleIndex),
                    tileCount: particleIndex,
                    sortingLayer: firstSystem?.sortingLayer ?? SortingLayers.Default,
                    orderInLayer: firstSystem?.orderInLayer ?? 0,
                    textureGuid
                };

                this._renderDataCache.push(renderData);
            }
        }

        this._dirty = false;
    }

    /**
     * 清理
     * Cleanup
     */
    dispose(): void {
        this._particleSystems.clear();
        this._renderDataCache.length = 0;
    }
}
