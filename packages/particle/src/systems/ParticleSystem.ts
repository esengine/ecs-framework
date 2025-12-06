import { EntitySystem, Matcher, ECSSystem, Time, Entity } from '@esengine/ecs-framework';
import { ParticleSystemComponent } from '../ParticleSystemComponent';
import { ParticleRenderDataProvider } from '../rendering/ParticleRenderDataProvider';
import type { IEngineIntegration, IEngineBridge } from '../ParticleRuntimeModule';

/**
 * 默认粒子纹理 ID
 * Default particle texture ID
 */
const DEFAULT_PARTICLE_TEXTURE_ID = 99999;

/**
 * 生成默认粒子纹理的 Data URL（渐变圆形）
 * Generate default particle texture Data URL (gradient circle)
 */
function generateDefaultParticleTextureDataURL(): string {
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // 创建径向渐变 | Create radial gradient
    const gradient = ctx.createRadialGradient(
        size / 2, size / 2, 0,
        size / 2, size / 2, size / 2
    );
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.3)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.fill();

    return canvas.toDataURL('image/png');
}

/**
 * Transform 组件接口（避免直接依赖 engine-core）
 * Transform component interface (avoid direct dependency on engine-core)
 */
interface ITransformComponent {
    worldPosition?: { x: number; y: number; z: number };
    position: { x: number; y: number; z: number };
    /** 世界旋转（Vector3，z 分量为 2D 旋转弧度）| World rotation (Vector3, z component is 2D rotation in radians) */
    worldRotation?: { x: number; y: number; z: number };
    /** 本地旋转（Vector3）| Local rotation (Vector3) */
    rotation?: { x: number; y: number; z: number };
    /** 世界缩放 | World scale */
    worldScale?: { x: number; y: number; z: number };
    /** 本地缩放 | Local scale */
    scale?: { x: number; y: number; z: number };
}

/**
 * 粒子更新系统
 * Particle update system
 *
 * Updates all ParticleSystemComponents with their entity's world position.
 * 使用实体的世界坐标更新所有粒子系统组件。
 */
@ECSSystem('ParticleUpdate', { updateOrder: 100 })
export class ParticleUpdateSystem extends EntitySystem {
    private _transformType: (new (...args: any[]) => ITransformComponent) | null = null;
    private _renderDataProvider: ParticleRenderDataProvider;
    private _engineIntegration: IEngineIntegration | null = null;
    private _engineBridge: IEngineBridge | null = null;
    private _defaultTextureLoaded: boolean = false;
    private _defaultTextureLoading: boolean = false;
    /** 追踪每个粒子组件上次加载的资产 GUID | Track last loaded asset GUID for each particle component */
    private _lastLoadedGuids: WeakMap<ParticleSystemComponent, string> = new WeakMap();
    /** 正在加载资产的粒子组件 | Particle components currently loading assets */
    private _loadingComponents: WeakSet<ParticleSystemComponent> = new WeakSet();

    constructor() {
        super(Matcher.empty().all(ParticleSystemComponent));
        this._renderDataProvider = new ParticleRenderDataProvider();
    }

    /**
     * 设置 Transform 组件类型
     * Set Transform component type
     *
     * @param transformType - Transform component class | Transform 组件类
     */
    setTransformType(transformType: new (...args: any[]) => ITransformComponent): void {
        this._transformType = transformType;
    }

    /**
     * 设置引擎集成（用于加载纹理）
     * Set engine integration (for loading textures)
     */
    setEngineIntegration(integration: IEngineIntegration): void {
        this._engineIntegration = integration;
    }

    /**
     * 设置引擎桥接（用于加载默认纹理）
     * Set engine bridge (for loading default texture)
     */
    setEngineBridge(bridge: IEngineBridge): void {
        this._engineBridge = bridge;
    }

    /**
     * 获取渲染数据提供者
     * Get render data provider
     */
    getRenderDataProvider(): ParticleRenderDataProvider {
        return this._renderDataProvider;
    }

    protected override process(entities: readonly Entity[]): void {
        const deltaTime = Time.deltaTime;

        for (const entity of entities) {
            if (!entity.enabled) continue;

            const particle = entity.getComponent(ParticleSystemComponent) as ParticleSystemComponent | null;
            if (!particle) continue;

            let worldX = 0;
            let worldY = 0;
            let worldRotation = 0;
            let worldScaleX = 1;
            let worldScaleY = 1;
            let transform: ITransformComponent | null = null;

            // 获取 Transform 位置、旋转、缩放 | Get Transform position, rotation, scale
            if (this._transformType) {
                transform = entity.getComponent(this._transformType as any) as ITransformComponent | null;
                if (transform) {
                    const pos = transform.worldPosition ?? transform.position;
                    worldX = pos.x;
                    worldY = pos.y;

                    // 获取旋转（2D 使用 z 分量）| Get rotation (2D uses z component)
                    const rot = transform.worldRotation ?? transform.rotation;
                    if (rot) {
                        worldRotation = rot.z;
                    }

                    // 获取缩放 | Get scale
                    const scale = transform.worldScale ?? transform.scale;
                    if (scale) {
                        worldScaleX = scale.x;
                        worldScaleY = scale.y;
                    }
                }
            }

            // 检测资产 GUID 变化并重新加载 | Detect asset GUID change and reload
            // 这使得编辑器中选择新的粒子资产时能够立即切换
            // This allows immediate switching when selecting a new particle asset in the editor
            this._checkAndReloadAsset(particle);

            // 确保粒子系统已构建（即使未播放）| Ensure particle system is built (even when not playing)
            // 这使得编辑器中的属性更改能够立即生效
            // This allows property changes to take effect immediately in the editor
            particle.ensureBuilt();

            // 更新粒子系统 | Update particle system
            if (particle.isPlaying) {
                particle.update(deltaTime, worldX, worldY, worldRotation, worldScaleX, worldScaleY);
            }

            // 尝试加载纹理（如果还没有加载）| Try to load texture if not loaded yet
            if (particle.textureId === 0) {
                this.loadParticleTexture(particle);
            }

            // 更新渲染数据提供者的 Transform 引用 | Update render data provider's Transform reference
            // 确保粒子系统始终被注册 | Ensure particle system is always registered
            if (transform) {
                this._renderDataProvider.register(particle, transform);
            } else {
                // 使用默认 Transform | Use default transform
                this._renderDataProvider.register(particle, { position: { x: worldX, y: worldY } });
            }
        }

        // 标记渲染数据需要更新 | Mark render data as dirty
        this._renderDataProvider.markDirty();
    }

    protected override onAdded(entity: Entity): void {
        const particle = entity.getComponent(ParticleSystemComponent) as ParticleSystemComponent | null;
        if (particle) {
            // 异步初始化粒子系统 | Async initialize particle system
            this._initializeParticle(entity, particle);
        }
    }

    /**
     * 异步初始化粒子系统
     * Async initialize particle system
     */
    private async _initializeParticle(entity: Entity, particle: ParticleSystemComponent): Promise<void> {
        // 如果有资产 GUID，先加载资产 | Load asset first if GUID is set
        if (particle.particleAssetGuid) {
            await particle.loadAsset(particle.particleAssetGuid);
        }

        // 初始化粒子系统（不自动播放，由下面的逻辑控制）
        // Initialize particle system (don't auto play, controlled by logic below)
        particle.ensureBuilt();

        // 加载纹理 | Load texture
        await this.loadParticleTexture(particle);

        // 注册到渲染数据提供者 | Register to render data provider
        // 尝试获取 Transform，如果没有则使用默认位置 | Try to get Transform, use default position if not available
        let transform: ITransformComponent | null = null;
        if (this._transformType) {
            transform = entity.getComponent(this._transformType as any) as ITransformComponent | null;
        }
        // 即使没有 Transform，也要注册粒子系统（使用原点位置） | Register particle system even without Transform (use origin position)
        if (transform) {
            this._renderDataProvider.register(particle, transform);
        } else {
            this._renderDataProvider.register(particle, { position: { x: 0, y: 0 } });
        }

        // 记录已加载的资产 GUID | Record loaded asset GUID
        this._lastLoadedGuids.set(particle, particle.particleAssetGuid);

        // 决定是否自动播放 | Decide whether to auto play
        // 编辑器模式：有资产时自动播放预览 | Editor mode: auto play preview if has asset
        // 运行时模式：根据 autoPlay 设置 | Runtime mode: based on autoPlay setting
        const isEditorMode = this.scene?.isEditorMode ?? false;
        if (particle.particleAssetGuid && particle.loadedAsset) {
            if (isEditorMode) {
                // 编辑器模式：始终播放预览 | Editor mode: always play preview
                particle.play();
            } else if (particle.autoPlay) {
                // 运行时模式：根据 autoPlay 设置 | Runtime mode: based on autoPlay
                particle.play();
            }
        }
    }

    /**
     * 检测资产 GUID 变化并重新加载
     * Check for asset GUID change and reload if necessary
     *
     * 当编辑器中修改 particleAssetGuid 属性时，此方法会检测变化并触发重新加载。
     * 加载完成后会自动开始播放预览，让用户立即看到效果。
     *
     * When particleAssetGuid property is modified in editor, this method detects the change and triggers reload.
     * After loading, it automatically starts playback for preview so user can see the effect immediately.
     */
    private _checkAndReloadAsset(particle: ParticleSystemComponent): void {
        const currentGuid = particle.particleAssetGuid;
        const lastGuid = this._lastLoadedGuids.get(particle);

        // 如果 GUID 没有变化，或者正在加载中，跳过
        // Skip if GUID hasn't changed or already loading
        if (currentGuid === lastGuid || this._loadingComponents.has(particle)) {
            return;
        }

        // 标记为正在加载 | Mark as loading
        this._loadingComponents.add(particle);
        this._lastLoadedGuids.set(particle, currentGuid);

        // 停止当前播放并清除粒子 | Stop current playback and clear particles
        particle.stop(true);

        // 重置纹理 ID，以便重新加载纹理 | Reset texture ID for texture reload
        particle.textureId = 0;

        // 异步加载新资产 | Async load new asset
        (async () => {
            try {
                if (currentGuid) {
                    await particle.loadAsset(currentGuid);
                    // 加载纹理 | Load texture
                    await this.loadParticleTexture(particle);

                    // 标记需要重建 | Mark for rebuild
                    particle.markDirty();

                    // 在编辑器中自动播放预览，让用户立即看到效果
                    // Auto play preview in editor so user can see the effect immediately
                    particle.play();

                    console.log(`[ParticleUpdateSystem] Asset loaded and playing: ${currentGuid}`);
                } else {
                    // 清空资产时，设置为 null | Clear asset when GUID is empty
                    particle.setAssetData(null);
                    particle.markDirty();
                    console.log(`[ParticleUpdateSystem] Asset cleared`);
                }
            } catch (error) {
                console.error('[ParticleUpdateSystem] Failed to reload asset:', error);
            } finally {
                // 取消加载标记 | Remove loading mark
                this._loadingComponents.delete(particle);
            }
        })();
    }

    /**
     * 加载粒子纹理
     * Load particle texture
     */
    async loadParticleTexture(particle: ParticleSystemComponent): Promise<void> {
        if (!this._engineIntegration) {
            return;
        }

        // 已经加载过就跳过 | Skip if already loaded
        if (particle.textureId > 0) return;

        // 从已加载的资产获取纹理路径 | Get texture path from loaded asset
        // 支持 textureGuid 和 texturePath（编辑器可能使用后者）
        // Support both textureGuid and texturePath (editor may use the latter)
        const asset = particle.loadedAsset;
        const texturePath = asset?.textureGuid || asset?.texturePath || particle.textureGuid;

        if (texturePath) {
            try {
                const textureId = await this._engineIntegration.loadTextureForComponent(texturePath);
                particle.textureId = textureId;
            } catch (error) {
                console.error('[ParticleUpdateSystem] Failed to load texture:', texturePath, error);
                // 加载失败时使用默认纹理 | Use default texture on load failure
                await this._ensureDefaultTexture();
                particle.textureId = DEFAULT_PARTICLE_TEXTURE_ID;
            }
        } else {
            // 没有纹理路径时使用默认粒子纹理 | Use default particle texture when no path
            await this._ensureDefaultTexture();
            particle.textureId = DEFAULT_PARTICLE_TEXTURE_ID;
        }
    }

    /**
     * 确保默认粒子纹理已加载
     * Ensure default particle texture is loaded
     */
    private async _ensureDefaultTexture(): Promise<void> {
        if (this._defaultTextureLoaded || this._defaultTextureLoading) return;
        if (!this._engineBridge) return;

        this._defaultTextureLoading = true;
        try {
            const dataUrl = generateDefaultParticleTextureDataURL();
            if (dataUrl) {
                await this._engineBridge.loadTexture(DEFAULT_PARTICLE_TEXTURE_ID, dataUrl);
                this._defaultTextureLoaded = true;
            }
        } catch (error) {
            console.error('[ParticleUpdateSystem] Failed to create default particle texture:', error);
        }
        this._defaultTextureLoading = false;
    }

    protected override onRemoved(entity: Entity): void {
        const particle = entity.getComponent(ParticleSystemComponent) as ParticleSystemComponent | null;
        if (particle) {
            // 从渲染数据提供者注销 | Unregister from render data provider
            this._renderDataProvider.unregister(particle);
        }
    }

    /**
     * 系统销毁时清理
     * Cleanup on system destroy
     */
    public override destroy(): void {
        super.destroy();
        this._renderDataProvider.dispose();
    }
}
