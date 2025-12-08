import { Component, ECSComponent, Property, Serializable, Serialize } from '@esengine/esengine';
import { assetManager } from '@esengine/asset-system';
import { ParticlePool, type Particle } from './Particle';
import { ParticleEmitter, EmissionShape, createDefaultEmitterConfig, type EmitterConfig, type ColorValue } from './ParticleEmitter';
import type { IParticleModule } from './modules/IParticleModule';
import { ColorOverLifetimeModule } from './modules/ColorOverLifetimeModule';
import { SizeOverLifetimeModule } from './modules/SizeOverLifetimeModule';
import { CollisionModule } from './modules/CollisionModule';
import { ForceFieldModule } from './modules/ForceFieldModule';
import { Physics2DCollisionModule } from './modules/Physics2DCollisionModule';
import type { IParticleAsset, IBurstConfig } from './loaders/ParticleLoader';

// Re-export for backward compatibility
// 为了向后兼容重新导出
export type { IBurstConfig };
/** @deprecated Use IBurstConfig instead */
export type BurstConfig = IBurstConfig;

/**
 * 粒子混合模式
 * Particle blend mode
 */
export enum ParticleBlendMode {
    /** 正常混合 | Normal blend */
    Normal = 'normal',
    /** 叠加 | Additive */
    Additive = 'additive',
    /** 正片叠底 | Multiply */
    Multiply = 'multiply'
}

/**
 * 模拟空间
 * Simulation space
 */
export enum SimulationSpace {
    /** 本地空间（粒子跟随发射器）| Local space (particles follow emitter) */
    Local = 'local',
    /** 世界空间（粒子不跟随发射器）| World space (particles don't follow emitter) */
    World = 'world'
}

/**
 * 运行时覆盖配置
 * Runtime override configuration
 *
 * 用于在游戏运行时动态修改粒子系统参数，而不影响原始资产配置。
 * Used to dynamically modify particle system parameters at runtime without affecting the original asset configuration.
 */
export interface ParticleRuntimeOverrides {
    /** 发射速率覆盖 | Emission rate override */
    emissionRate?: number;
    /** 播放速度覆盖 | Playback speed override */
    playbackSpeed?: number;
    /** 是否循环覆盖 | Looping override */
    looping?: boolean;
    /** 重力X覆盖 | Gravity X override */
    gravityX?: number;
    /** 重力Y覆盖 | Gravity Y override */
    gravityY?: number;
    /** 起始颜色覆盖 | Start color override */
    startColor?: ColorValue;
    /** 缩放乘数（应用于所有尺寸）| Scale multiplier (applied to all sizes) */
    scaleMultiplier?: number;
    /** 速度乘数 | Speed multiplier */
    speedMultiplier?: number;
}

/**
 * 粒子系统组件
 * Particle system component
 *
 * 基于资产的粒子系统组件。所有粒子配置从 .particle 文件读取，
 * 运行时可通过 runtimeOverrides 动态修改部分参数。
 *
 * Asset-based particle system component. All particle configuration is read from .particle files.
 * Runtime modifications can be made through runtimeOverrides.
 *
 * @example
 * ```typescript
 * // 在编辑器中设置 particleAssetGuid，运行时自动加载
 * // Set particleAssetGuid in editor, loads automatically at runtime
 *
 * // 运行时修改发射速率
 * // Modify emission rate at runtime
 * particle.setOverride('emissionRate', 50);
 *
 * // 或批量设置
 * // Or set multiple overrides
 * particle.setOverrides({ emissionRate: 50, playbackSpeed: 2 });
 *
 * // 清除覆盖，恢复原始值
 * // Clear overrides, restore original values
 * particle.clearOverrides();
 * ```
 */
@ECSComponent('ParticleSystem')
@Serializable({ version: 3, typeId: 'ParticleSystem' })
export class ParticleSystemComponent extends Component {
    // ============= 资产引用 | Asset Reference =============

    /**
     * 粒子效果资产 GUID
     * Particle effect asset GUID
     *
     * 必须设置此属性才能使用粒子系统。所有配置从 .particle 文件读取。
     * Must be set to use the particle system. All configuration is read from .particle file.
     */
    @Serialize()
    @Property({ type: 'asset', label: 'Particle Asset', extensions: ['.particle', '.particle.json'] })
    public particleAssetGuid: string = '';

    // ============= 播放控制 | Playback Control =============

    /**
     * 是否自动播放
     * Whether to auto-play on start
     *
     * 默认为 false，在编辑器中需要手动点击播放按钮。
     * 运行时场景中如需自动播放，请设置为 true。
     *
     * Default is false, manual play button click is required in editor.
     * Set to true for auto-play in runtime scenes.
     */
    @Serialize()
    @Property({ type: 'boolean', label: 'Auto Play' })
    public autoPlay: boolean = false;

    /**
     * 模拟空间
     * Simulation space
     *
     * Local: 粒子跟随发射器移动
     * World: 粒子在世界空间独立运动
     */
    @Serialize()
    @Property({
        type: 'enum',
        label: 'Simulation Space',
        options: [
            { label: 'Local', value: SimulationSpace.Local },
            { label: 'World', value: SimulationSpace.World }
        ]
    })
    public simulationSpace: SimulationSpace = SimulationSpace.World;

    // ============= 运行时覆盖 | Runtime Overrides =============

    /**
     * 运行时参数覆盖
     * Runtime parameter overrides
     *
     * 这些值会覆盖资产中的对应配置。不会被序列化保存。
     * These values override corresponding asset configuration. Not serialized.
     */
    private _runtimeOverrides: ParticleRuntimeOverrides = {};

    // ============= 运行时状态 | Runtime State =============

    private _pool: ParticlePool | null = null;
    private _emitter: ParticleEmitter | null = null;
    private _modules: IParticleModule[] = [];
    private _isPlaying: boolean = false;
    private _elapsedTime: number = 0;
    private _needsRebuild: boolean = true;
    /** 爆发状态追踪 | Burst state tracking */
    private _burstStates: { firedCount: number; lastFireTime: number }[] = [];
    /** 上一帧发射器位置（本地空间用）| Last frame emitter position (for local space) */
    private _lastEmitterX: number = 0;
    private _lastEmitterY: number = 0;
    /** 当前世界旋转（弧度）| Current world rotation (radians) */
    private _worldRotation: number = 0;
    /** 当前世界缩放X | Current world scale X */
    private _worldScaleX: number = 1;
    /** 当前世界缩放Y | Current world scale Y */
    private _worldScaleY: number = 1;
    /** 已加载的粒子资产数据 | Loaded particle asset data */
    private _loadedAsset: IParticleAsset | null = null;
    /** 上次加载的资产 GUID（用于检测变化）| Last loaded asset GUID (for change detection) */
    private _lastLoadedGuid: string = '';

    /** 纹理ID（运行时）| Texture ID (runtime) */
    public textureId: number = 0;

    // ============= 公开属性访问器 | Public Property Accessors =============

    /** 是否正在播放 | Whether playing */
    get isPlaying(): boolean {
        return this._isPlaying;
    }

    /** 已播放时间 | Elapsed time */
    get elapsedTime(): number {
        return this._elapsedTime;
    }

    /** 活跃粒子数 | Active particle count */
    get activeParticleCount(): number {
        return this._pool?.activeCount ?? 0;
    }

    /** 粒子池 | Particle pool */
    get pool(): ParticlePool | null {
        return this._pool;
    }

    /** 粒子模块列表 | Particle modules */
    get modules(): IParticleModule[] {
        return this._modules;
    }

    /** 已加载的资产数据 | Loaded asset data */
    get loadedAsset(): IParticleAsset | null {
        return this._loadedAsset;
    }

    /**
     * 获取当前运行时覆盖配置
     * Get current runtime overrides
     */
    get runtimeOverrides(): Readonly<ParticleRuntimeOverrides> {
        return this._runtimeOverrides;
    }

    /** 当前世界旋转（弧度）| Current world rotation (radians) */
    get worldRotation(): number {
        return this._worldRotation;
    }

    /** 当前世界缩放X | Current world scale X */
    get worldScaleX(): number {
        return this._worldScaleX;
    }

    /** 当前世界缩放Y | Current world scale Y */
    get worldScaleY(): number {
        return this._worldScaleY;
    }

    // ============= 从资产或覆盖读取的属性 | Properties from Asset or Overrides =============

    /** 最大粒子数（从资产读取）| Maximum particles (from asset) */
    get maxParticles(): number {
        return this._loadedAsset?.maxParticles ?? 1000;
    }

    /** 是否循环 | Whether looping */
    get looping(): boolean {
        return this._runtimeOverrides.looping ?? this._loadedAsset?.looping ?? true;
    }

    /** 持续时间（秒）| Duration in seconds */
    get duration(): number {
        return this._loadedAsset?.duration ?? 5;
    }

    /** 播放速度 | Playback speed */
    get playbackSpeed(): number {
        return this._runtimeOverrides.playbackSpeed ?? this._loadedAsset?.playbackSpeed ?? 1;
    }

    /** 发射速率 | Emission rate */
    get emissionRate(): number {
        return this._runtimeOverrides.emissionRate ?? this._loadedAsset?.emissionRate ?? 10;
    }

    /** 混合模式（从资产读取）| Blend mode (from asset) */
    get blendMode(): ParticleBlendMode {
        return this._loadedAsset?.blendMode ?? ParticleBlendMode.Additive;
    }

    /** 粒子尺寸（从资产读取）| Particle size (from asset) */
    get particleSize(): number {
        return this._loadedAsset?.particleSize ?? 8;
    }

    /** 纹理 GUID（从资产读取）| Texture GUID (from asset) */
    get textureGuid(): string {
        return this._loadedAsset?.textureGuid ?? '';
    }

    /** 排序顺序（从资产读取）| Sorting order (from asset) */
    get sortingOrder(): number {
        return this._loadedAsset?.sortingOrder ?? 0;
    }

    /** 爆发列表（从资产读取）| Burst list (from asset) */
    get bursts(): IBurstConfig[] {
        return this._loadedAsset?.bursts ?? [];
    }

    // ============= 运行时覆盖方法 | Runtime Override Methods =============

    /**
     * 设置单个运行时覆盖参数
     * Set a single runtime override parameter
     *
     * @param key 参数名 | Parameter name
     * @param value 参数值 | Parameter value
     */
    setOverride<K extends keyof ParticleRuntimeOverrides>(key: K, value: ParticleRuntimeOverrides[K]): void {
        this._runtimeOverrides[key] = value;
        this._needsRebuild = true;
    }

    /**
     * 批量设置运行时覆盖参数
     * Set multiple runtime override parameters
     *
     * @param overrides 覆盖配置 | Override configuration
     */
    setOverrides(overrides: Partial<ParticleRuntimeOverrides>): void {
        Object.assign(this._runtimeOverrides, overrides);
        this._needsRebuild = true;
    }

    /**
     * 清除所有运行时覆盖，恢复资产原始值
     * Clear all runtime overrides, restore asset original values
     */
    clearOverrides(): void {
        this._runtimeOverrides = {};
        this._needsRebuild = true;
    }

    /**
     * 清除指定的运行时覆盖参数
     * Clear specific runtime override parameter
     *
     * @param key 参数名 | Parameter name
     */
    clearOverride<K extends keyof ParticleRuntimeOverrides>(key: K): void {
        delete this._runtimeOverrides[key];
        this._needsRebuild = true;
    }

    // ============= 生命周期方法 | Lifecycle Methods =============

    /**
     * 初始化粒子系统
     * Initialize particle system
     */
    initialize(): void {
        this._rebuildIfNeeded();

        // 自动播放 | Auto play
        if (this.autoPlay && !this._isPlaying) {
            this.play();
        }
    }

    /**
     * 加载粒子资产
     * Load particle asset
     *
     * @param guid - Asset GUID to load | 要加载的资产 GUID
     * @returns Promise that resolves when asset is loaded | 资产加载完成时解析的 Promise
     */
    async loadAsset(guid: string, bForceReload: boolean = false): Promise<boolean> {
        if (!guid) {
            this._loadedAsset = null;
            this._lastLoadedGuid = '';
            this._needsRebuild = true;
            return true;
        }

        // 如果是同一个资产且不强制重新加载，不需要重新加载
        // If same asset and not force reload, no need to reload
        if (guid === this._lastLoadedGuid && this._loadedAsset && !bForceReload) {
            return true;
        }

        try {
            console.log(`[ParticleSystem] Loading asset: ${guid}${bForceReload ? ' (force reload)' : ''}`);
            const result = await assetManager.loadAsset<IParticleAsset>(guid, { forceReload: bForceReload });
            const asset = result?.asset;

            if (asset) {
                this._loadedAsset = asset;
                this._lastLoadedGuid = guid;
                this._needsRebuild = true;
                console.log(`[ParticleSystem] Asset loaded successfully:`, asset.name);
                return true;
            } else {
                console.warn(`[ParticleSystem] Failed to load asset: ${guid}`);
                return false;
            }
        } catch (error) {
            console.error(`[ParticleSystem] Error loading asset ${guid}:`, error);
            return false;
        }
    }

    /**
     * 强制重新加载资产
     * Force reload the asset
     *
     * 当资产文件内容变化时调用此方法，强制从文件系统重新加载。
     * Call this method when asset file content changes, forcing a reload from filesystem.
     */
    async reloadAsset(): Promise<boolean> {
        if (!this.particleAssetGuid) return false;
        return this.loadAsset(this.particleAssetGuid, true);
    }

    /**
     * 设置资产数据（由加载器调用）
     * Set asset data (called by loader)
     *
     * @param asset 粒子资产数据 | Particle asset data
     */
    setAssetData(asset: IParticleAsset | null): void {
        this._loadedAsset = asset;
        this._needsRebuild = true;
    }

    // ============= 播放控制 | Playback Control =============

    /**
     * 播放粒子系统
     * Play the particle system
     */
    play(): void {
        this._rebuildIfNeeded();

        if (this._emitter) {
            this._emitter.isEmitting = true;
        }
        this._isPlaying = true;
        this._elapsedTime = 0;

        // 重置爆发状态 | Reset burst states
        this._burstStates = this.bursts.map(() => ({ firedCount: 0, lastFireTime: -Infinity }));
    }

    /**
     * 暂停粒子系统
     * Pause the particle system
     */
    pause(): void {
        if (this._emitter) {
            this._emitter.isEmitting = false;
        }
        this._isPlaying = false;
    }

    /**
     * 停止粒子系统
     * Stop the particle system
     *
     * @param clear 是否立即清除所有粒子 | Whether to immediately clear all particles
     */
    stop(clear: boolean = false): void {
        if (this._emitter) {
            this._emitter.isEmitting = false;
        }
        this._isPlaying = false;
        this._elapsedTime = 0;

        if (clear && this._pool) {
            this._pool.recycleAll();
        }

        // 重置爆发状态 | Reset burst states
        this._burstStates = [];
    }

    /**
     * 清除所有粒子
     * Clear all particles
     */
    clear(): void {
        this._pool?.recycleAll();
    }

    /**
     * 触发一次爆发
     * Trigger a burst emission
     *
     * @param count 发射数量 | Number of particles to emit
     */
    emit(count: number): void {
        if (this._pool && this._emitter) {
            this._emitter.burst(this._pool, count, this._lastEmitterX, this._lastEmitterY);
        }
    }

    /**
     * 更新粒子系统
     * Update particle system
     *
     * @param dt - Delta time in seconds | 时间增量（秒）
     * @param worldX - World position X for emission | 发射位置世界坐标X
     * @param worldY - World position Y for emission | 发射位置世界坐标Y
     * @param worldRotation - World rotation in radians | 世界旋转（弧度）
     * @param worldScaleX - World scale X | 世界缩放X
     * @param worldScaleY - World scale Y | 世界缩放Y
     */
    update(
        dt: number,
        worldX: number = 0,
        worldY: number = 0,
        worldRotation: number = 0,
        worldScaleX: number = 1,
        worldScaleY: number = 1
    ): void {
        if (!this._isPlaying || !this._pool || !this._emitter) return;

        const scaledDt = dt * this.playbackSpeed;
        this._simulate(scaledDt, worldX, worldY, worldRotation, worldScaleX, worldScaleY);
        this._elapsedTime += scaledDt;

        // 检查持续时间 | Check duration
        if (!this.looping && this._elapsedTime >= this.duration) {
            this._emitter.isEmitting = false;
            if (this._pool.activeCount === 0) {
                this._isPlaying = false;
            }
        }
    }

    // ============= 模块管理 | Module Management =============

    /**
     * 添加模块
     * Add module
     */
    addModule<T extends IParticleModule>(module: T): T {
        this._modules.push(module);
        return module;
    }

    /**
     * 获取模块
     * Get module by type
     */
    getModule<T extends IParticleModule>(name: string): T | undefined {
        return this._modules.find(m => m.name === name) as T | undefined;
    }

    /**
     * 移除模块
     * Remove module
     */
    removeModule(module: IParticleModule): boolean {
        const index = this._modules.indexOf(module);
        if (index >= 0) {
            this._modules.splice(index, 1);
            return true;
        }
        return false;
    }

    // ============= 重建与标记 | Rebuild and Marking =============

    /**
     * 标记需要重建
     * Mark for rebuild
     */
    markDirty(): void {
        this._needsRebuild = true;
    }

    /**
     * 检查并重建粒子系统（如果需要）
     * Check and rebuild particle system if needed
     *
     * This method is called by ParticleUpdateSystem to ensure the particle system
     * is built even when not playing. This allows property changes to take effect
     * immediately in the editor.
     *
     * 此方法由 ParticleUpdateSystem 调用，确保即使未播放时也能重建粒子系统。
     * 这使得编辑器中的属性更改能够立即生效。
     */
    ensureBuilt(): void {
        this._rebuildIfNeeded();
    }

    private _rebuildIfNeeded(): void {
        if (!this._needsRebuild && this._pool && this._emitter) return;

        // 必须有加载的资产才能构建
        // Must have loaded asset to build
        const asset = this._loadedAsset;
        if (!asset) {
            // 没有资产时使用默认值创建最小系统
            // Create minimal system with defaults when no asset
            if (!this._pool) {
                this._pool = new ParticlePool(100);
            }
            if (!this._emitter) {
                this._emitter = new ParticleEmitter(createDefaultEmitterConfig());
            }
            this._needsRebuild = false;
            return;
        }

        // 应用运行时覆盖 | Apply runtime overrides
        const overrides = this._runtimeOverrides;
        const scaleMultiplier = overrides.scaleMultiplier ?? 1;
        const speedMultiplier = overrides.speedMultiplier ?? 1;

        const maxParticles = asset.maxParticles;
        const emissionRate = overrides.emissionRate ?? asset.emissionRate;
        const emissionShape = asset.emissionShape;
        const shapeRadius = asset.shapeRadius;
        const shapeWidth = asset.shapeWidth;
        const shapeHeight = asset.shapeHeight;
        const lifetimeMin = asset.lifetimeMin;
        const lifetimeMax = asset.lifetimeMax;
        const speedMin = (asset.speedMin ?? 50) * speedMultiplier;
        const speedMax = (asset.speedMax ?? 100) * speedMultiplier;
        const direction = asset.direction ?? 90;
        const directionSpread = asset.directionSpread ?? 0;
        const scaleMin = (asset.scaleMin ?? 1) * scaleMultiplier;
        const scaleMax = (asset.scaleMax ?? 1) * scaleMultiplier;
        const gravityX = overrides.gravityX ?? asset.gravityX ?? 0;
        const gravityY = overrides.gravityY ?? asset.gravityY ?? 0;
        const startAlpha = asset.startAlpha ?? 1;
        const endAlpha = asset.endAlpha ?? 0;
        const endScale = asset.endScale ?? 0;

        // 解析颜色 | Parse color
        let color: { r: number; g: number; b: number };
        if (overrides.startColor) {
            color = { r: overrides.startColor.r, g: overrides.startColor.g, b: overrides.startColor.b };
        } else if (asset.startColor) {
            color = { r: asset.startColor.r, g: asset.startColor.g, b: asset.startColor.b };
        } else {
            color = { r: 1, g: 1, b: 1 };
        }

        // 创建/调整粒子池 | Create/resize particle pool
        if (!this._pool) {
            this._pool = new ParticlePool(maxParticles);
        } else if (this._pool.capacity !== maxParticles) {
            this._pool.resize(maxParticles);
        }

        // 创建发射器配置 | Create emitter config
        const directionRad = (direction - 90) * Math.PI / 180;

        const config: EmitterConfig = {
            ...createDefaultEmitterConfig(),
            emissionRate,
            burstCount: 0,
            lifetime: { min: lifetimeMin, max: lifetimeMax },
            shape: emissionShape,
            shapeRadius,
            shapeWidth,
            shapeHeight,
            coneAngle: Math.PI / 6,
            direction: directionRad,
            directionSpread: directionSpread * Math.PI / 180,
            speed: { min: speedMin, max: speedMax },
            angularVelocity: { min: 0, max: 0 },
            startScale: { min: scaleMin, max: scaleMax },
            startRotation: { min: 0, max: 0 },
            startColor: { ...color, a: startAlpha },
            startColorVariance: { r: 0, g: 0, b: 0, a: 0 },
            gravityX,
            gravityY: -gravityY
        };

        if (!this._emitter) {
            this._emitter = new ParticleEmitter(config);
        } else {
            this._emitter.config = config;
        }

        // 设置默认模块 | Setup default modules
        if (this._modules.length === 0) {
            // 颜色模块（淡出）| Color module (fade out)
            const colorModule = new ColorOverLifetimeModule();
            colorModule.gradient = [
                { time: 0, r: 1, g: 1, b: 1, a: 1 },
                { time: 1, r: 1, g: 1, b: 1, a: endAlpha }
            ];
            this._modules.push(colorModule);

            // 缩放模块 | Size module
            const sizeModule = new SizeOverLifetimeModule();
            sizeModule.startMultiplier = 1;
            sizeModule.endMultiplier = endScale;
            this._modules.push(sizeModule);
        }

        this._needsRebuild = false;
    }

    private _simulate(
        dt: number,
        worldX: number,
        worldY: number,
        worldRotation: number = 0,
        worldScaleX: number = 1,
        worldScaleY: number = 1
    ): void {
        if (!this._pool || !this._emitter) return;

        // 本地空间：计算发射器移动量 | Local space: calculate emitter movement
        const isLocalSpace = this.simulationSpace === SimulationSpace.Local;
        const emitterDeltaX = worldX - this._lastEmitterX;
        const emitterDeltaY = worldY - this._lastEmitterY;
        this._lastEmitterX = worldX;
        this._lastEmitterY = worldY;

        // 保存当前的变换参数，供渲染使用 | Save current transform params for rendering
        this._worldRotation = worldRotation;
        this._worldScaleX = worldScaleX;
        this._worldScaleY = worldScaleY;

        // 发射新粒子（应用旋转到发射方向）| Emit new particles (apply rotation to emission direction)
        this._emitter.emit(this._pool, dt, worldX, worldY, worldRotation, worldScaleX, worldScaleY);

        // 处理爆发 | Process bursts
        this._processBursts(worldX, worldY, worldRotation, worldScaleX, worldScaleY);

        // 更新现有粒子 | Update existing particles
        const particles = this._pool.particles;
        const particlesToRecycle: Particle[] = [];

        for (const p of particles) {
            if (!p.alive) continue;

            p.age += dt;

            if (p.age >= p.lifetime) {
                particlesToRecycle.push(p);
                continue;
            }

            // 应用重力 | Apply gravity
            const config = this._emitter.config;
            p.vx += config.gravityX * dt;
            p.vy += config.gravityY * dt;

            // 更新位置 | Update position
            p.x += p.vx * dt;
            p.y += p.vy * dt;

            // 本地空间：粒子跟随发射器 | Local space: particles follow emitter
            if (isLocalSpace) {
                p.x += emitterDeltaX;
                p.y += emitterDeltaY;
            }

            // 更新旋转 | Update rotation
            p.rotation += p.angularVelocity * dt;

            // 应用模块 | Apply modules
            const normalizedAge = p.age / p.lifetime;
            for (const module of this._modules) {
                if (module.enabled) {
                    module.update(p, dt, normalizedAge);
                }
            }
        }

        // 处理碰撞模块标记的需销毁粒子 | Process particles marked for death by collision modules
        for (const module of this._modules) {
            if (module.enabled) {
                // 处理边界碰撞模块 | Handle boundary collision module
                if (module instanceof CollisionModule) {
                    const toKill = module.getParticlesToKill();
                    for (const p of toKill) {
                        if (p.alive) {
                            particlesToRecycle.push(p);
                        }
                    }
                    module.clearDeathFlags();
                }
                // 处理物理碰撞模块 | Handle physics collision module
                if (module instanceof Physics2DCollisionModule) {
                    const toKill = module.getParticlesToKill();
                    for (const p of toKill) {
                        if (p.alive) {
                            particlesToRecycle.push(p);
                        }
                    }
                    module.clearDeathFlags();
                }
            }
        }

        // 回收已过期的粒子 | Recycle expired particles
        for (const p of particlesToRecycle) {
            this._pool.recycle(p);
        }
    }

    private _processBursts(
        worldX: number,
        worldY: number,
        worldRotation: number = 0,
        worldScaleX: number = 1,
        worldScaleY: number = 1
    ): void {
        const bursts = this.bursts;
        if (!bursts || bursts.length === 0 || !this._pool || !this._emitter) return;

        // 初始化爆发状态 | Initialize burst states
        while (this._burstStates.length < bursts.length) {
            this._burstStates.push({ firedCount: 0, lastFireTime: -Infinity });
        }

        for (let i = 0; i < bursts.length; i++) {
            const burst = bursts[i];
            const state = this._burstStates[i];

            // 检查是否达到触发时间 | Check if trigger time reached
            if (this._elapsedTime >= burst.time) {
                // 检查循环次数 | Check cycle count
                const maxCycles = burst.cycles === 0 ? Infinity : burst.cycles;
                if (state.firedCount >= maxCycles) continue;

                // 检查间隔 | Check interval
                const timeSinceLastFire = this._elapsedTime - state.lastFireTime;
                const interval = state.firedCount === 0 ? 0 : burst.interval;

                if (timeSinceLastFire >= interval) {
                    this._emitter.burst(this._pool, burst.count, worldX, worldY, worldRotation, worldScaleX, worldScaleY);
                    state.firedCount++;
                    state.lastFireTime = this._elapsedTime;
                }
            }
        }
    }

    // ============= 清理 | Cleanup =============

    /**
     * 重置粒子系统到初始状态
     * Reset particle system to initial state
     */
    resetSystem(): void {
        this.stop(true);
        this._pool = null;
        this._emitter = null;
        this._modules = [];
        this._needsRebuild = true;
        this._loadedAsset = null;
        this._lastLoadedGuid = '';
        this._runtimeOverrides = {};
        this.textureId = 0;
    }

    /**
     * 组件从实体移除时的回调
     * Called when component is removed from entity
     */
    override onRemovedFromEntity(): void {
        this.resetSystem();
    }
}
