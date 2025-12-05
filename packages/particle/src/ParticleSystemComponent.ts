import { Component, ECSComponent, Property, Serializable, Serialize } from '@esengine/ecs-framework';
import { ParticlePool } from './Particle';
import { ParticleEmitter, EmissionShape, createDefaultEmitterConfig, type EmitterConfig, type ValueRange, type ColorValue } from './ParticleEmitter';
import type { IParticleModule } from './modules/IParticleModule';
import { ColorOverLifetimeModule } from './modules/ColorOverLifetimeModule';
import { SizeOverLifetimeModule } from './modules/SizeOverLifetimeModule';

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
 * 粒子系统组件
 * Particle system component
 *
 * Manages particle emission, simulation, and provides data for rendering.
 * 管理粒子发射、模拟，并为渲染提供数据。
 */
@ECSComponent('ParticleSystem')
@Serializable({ version: 1, typeId: 'ParticleSystem' })
export class ParticleSystemComponent extends Component {
    // ============= 基础属性 | Basic Properties =============

    /** 最大粒子数量 | Maximum particle count */
    @Serialize()
    @Property({ type: 'integer', label: 'Max Particles', min: 1, max: 10000 })
    public maxParticles: number = 1000;

    /** 是否循环播放 | Whether to loop */
    @Serialize()
    @Property({ type: 'boolean', label: 'Looping' })
    public looping: boolean = true;

    /** 预热时间（秒）| Prewarm time (seconds) */
    @Serialize()
    @Property({ type: 'number', label: 'Prewarm Time', min: 0 })
    public prewarmTime: number = 0;

    /** 持续时间（秒，非循环时使用）| Duration (seconds, for non-looping) */
    @Serialize()
    @Property({ type: 'number', label: 'Duration', min: 0.1 })
    public duration: number = 5;

    /** 播放速度倍率 | Playback speed multiplier */
    @Serialize()
    @Property({ type: 'number', label: 'Playback Speed', min: 0.01, max: 10 })
    public playbackSpeed: number = 1;

    // ============= 发射器属性 | Emitter Properties =============

    /** 每秒发射数量 | Emission rate (particles per second) */
    @Serialize()
    @Property({ type: 'number', label: 'Emission Rate', min: 0 })
    public emissionRate: number = 10;

    /** 发射形状 | Emission shape */
    @Serialize()
    @Property({ type: 'enum', label: 'Shape', options: [
        { value: 'point', label: 'Point' },
        { value: 'circle', label: 'Circle' },
        { value: 'rectangle', label: 'Rectangle' },
        { value: 'line', label: 'Line' },
        { value: 'cone', label: 'Cone' }
    ]})
    public emissionShape: EmissionShape = EmissionShape.Point;

    /** 形状半径 | Shape radius */
    @Serialize()
    @Property({ type: 'number', label: 'Shape Radius', min: 0 })
    public shapeRadius: number = 0;

    /** 形状宽度 | Shape width */
    @Serialize()
    @Property({ type: 'number', label: 'Shape Width', min: 0 })
    public shapeWidth: number = 0;

    /** 形状高度 | Shape height */
    @Serialize()
    @Property({ type: 'number', label: 'Shape Height', min: 0 })
    public shapeHeight: number = 0;

    // ============= 粒子属性 | Particle Properties =============

    /** 粒子生命时间最小值（秒）| Particle lifetime min (seconds) */
    @Serialize()
    @Property({ type: 'number', label: 'Lifetime Min', min: 0.01 })
    public lifetimeMin: number = 1;

    /** 粒子生命时间最大值（秒）| Particle lifetime max (seconds) */
    @Serialize()
    @Property({ type: 'number', label: 'Lifetime Max', min: 0.01 })
    public lifetimeMax: number = 2;

    /** 初始速度最小值 | Initial speed min */
    @Serialize()
    @Property({ type: 'number', label: 'Speed Min', min: 0 })
    public speedMin: number = 50;

    /** 初始速度最大值 | Initial speed max */
    @Serialize()
    @Property({ type: 'number', label: 'Speed Max', min: 0 })
    public speedMax: number = 100;

    /** 发射方向（角度）| Emission direction (degrees) */
    @Serialize()
    @Property({ type: 'number', label: 'Direction', min: -180, max: 180 })
    public direction: number = -90;

    /** 发射方向扩散（角度）| Direction spread (degrees) */
    @Serialize()
    @Property({ type: 'number', label: 'Direction Spread', min: 0, max: 360 })
    public directionSpread: number = 0;

    /** 初始缩放最小值 | Initial scale min */
    @Serialize()
    @Property({ type: 'number', label: 'Scale Min', min: 0.01 })
    public scaleMin: number = 1;

    /** 初始缩放最大值 | Initial scale max */
    @Serialize()
    @Property({ type: 'number', label: 'Scale Max', min: 0.01 })
    public scaleMax: number = 1;

    /** 重力X | Gravity X */
    @Serialize()
    @Property({ type: 'number', label: 'Gravity X' })
    public gravityX: number = 0;

    /** 重力Y | Gravity Y */
    @Serialize()
    @Property({ type: 'number', label: 'Gravity Y' })
    public gravityY: number = 0;

    // ============= 颜色属性 | Color Properties =============

    /** 起始颜色 | Start color */
    @Serialize()
    @Property({ type: 'color', label: 'Start Color' })
    public startColor: string = '#ffffff';

    /** 起始透明度 | Start alpha */
    @Serialize()
    @Property({ type: 'number', label: 'Start Alpha', min: 0, max: 1, step: 0.01 })
    public startAlpha: number = 1;

    /** 结束透明度（淡出）| End alpha (fade out) */
    @Serialize()
    @Property({ type: 'number', label: 'End Alpha', min: 0, max: 1, step: 0.01 })
    public endAlpha: number = 0;

    /** 结束缩放乘数 | End scale multiplier */
    @Serialize()
    @Property({ type: 'number', label: 'End Scale', min: 0 })
    public endScale: number = 0;

    // ============= 渲染属性 | Rendering Properties =============

    /** 粒子纹理 | Particle texture */
    @Serialize()
    @Property({ type: 'asset', label: 'Texture', assetType: 'texture' })
    public texture: string = '';

    /** 粒子尺寸（像素）| Particle size (pixels) */
    @Serialize()
    @Property({ type: 'number', label: 'Particle Size', min: 1 })
    public particleSize: number = 8;

    /** 混合模式 | Blend mode */
    @Serialize()
    @Property({ type: 'enum', label: 'Blend Mode', options: [
        { value: 'normal', label: 'Normal' },
        { value: 'additive', label: 'Additive' },
        { value: 'multiply', label: 'Multiply' }
    ]})
    public blendMode: ParticleBlendMode = ParticleBlendMode.Additive;

    /** 排序顺序 | Sorting order */
    @Serialize()
    @Property({ type: 'integer', label: 'Sorting Order' })
    public sortingOrder: number = 0;

    // ============= 运行时状态 | Runtime State =============

    private _pool: ParticlePool | null = null;
    private _emitter: ParticleEmitter | null = null;
    private _modules: IParticleModule[] = [];
    private _isPlaying: boolean = false;
    private _elapsedTime: number = 0;
    private _needsRebuild: boolean = true;

    /** 纹理ID（运行时）| Texture ID (runtime) */
    public textureId: number = 0;

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

    /**
     * 初始化粒子系统
     * Initialize particle system
     */
    initialize(): void {
        this._rebuildIfNeeded();
    }

    /**
     * 播放粒子系统
     * Play particle system
     *
     * @param worldX - Initial world position X for prewarm | 预热时的初始世界坐标X
     * @param worldY - Initial world position Y for prewarm | 预热时的初始世界坐标Y
     */
    play(worldX: number = 0, worldY: number = 0): void {
        this._rebuildIfNeeded();
        this._isPlaying = true;
        this._emitter!.isEmitting = true;

        if (this.prewarmTime > 0) {
            this._simulate(this.prewarmTime, worldX, worldY);
        }
    }

    /**
     * 停止粒子系统
     * Stop particle system
     */
    stop(clearParticles: boolean = false): void {
        this._isPlaying = false;
        this._emitter!.isEmitting = false;
        this._elapsedTime = 0;

        if (clearParticles) {
            this._pool?.recycleAll();
        }
    }

    /**
     * 暂停粒子系统
     * Pause particle system
     */
    pause(): void {
        this._isPlaying = false;
    }

    /**
     * 立即爆发发射
     * Burst emit
     *
     * @param count - Number of particles to emit | 发射的粒子数量
     * @param worldX - World position X | 世界坐标X
     * @param worldY - World position Y | 世界坐标Y
     */
    burst(count: number, worldX: number = 0, worldY: number = 0): void {
        this._rebuildIfNeeded();
        if (!this._emitter || !this._pool) return;

        this._emitter.burst(this._pool, count, worldX, worldY);
    }

    /**
     * 更新粒子系统
     * Update particle system
     *
     * @param dt - Delta time in seconds | 时间增量（秒）
     * @param worldX - World position X for emission | 发射位置世界坐标X
     * @param worldY - World position Y for emission | 发射位置世界坐标Y
     */
    update(dt: number, worldX: number = 0, worldY: number = 0): void {
        if (!this._isPlaying || !this._pool || !this._emitter) return;

        const scaledDt = dt * this.playbackSpeed;
        this._simulate(scaledDt, worldX, worldY);
        this._elapsedTime += scaledDt;

        // 检查持续时间 | Check duration
        if (!this.looping && this._elapsedTime >= this.duration) {
            this._emitter.isEmitting = false;
            if (this._pool.activeCount === 0) {
                this._isPlaying = false;
            }
        }
    }

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

    /**
     * 标记需要重建
     * Mark for rebuild
     */
    markDirty(): void {
        this._needsRebuild = true;
    }

    private _rebuildIfNeeded(): void {
        if (!this._needsRebuild && this._pool && this._emitter) return;

        // 创建/调整粒子池 | Create/resize particle pool
        if (!this._pool) {
            this._pool = new ParticlePool(this.maxParticles);
        } else if (this._pool.capacity !== this.maxParticles) {
            this._pool.resize(this.maxParticles);
        }

        // 解析颜色 | Parse color
        const color = this._parseColor(this.startColor);

        // 创建发射器配置 | Create emitter config
        const config: EmitterConfig = {
            ...createDefaultEmitterConfig(),
            emissionRate: this.emissionRate,
            burstCount: 0,
            lifetime: { min: this.lifetimeMin, max: this.lifetimeMax },
            shape: this.emissionShape,
            shapeRadius: this.shapeRadius,
            shapeWidth: this.shapeWidth,
            shapeHeight: this.shapeHeight,
            coneAngle: Math.PI / 6,
            direction: this.direction * Math.PI / 180,
            directionSpread: this.directionSpread * Math.PI / 180,
            speed: { min: this.speedMin, max: this.speedMax },
            angularVelocity: { min: 0, max: 0 },
            startScale: { min: this.scaleMin, max: this.scaleMax },
            startRotation: { min: 0, max: 0 },
            startColor: { ...color, a: this.startAlpha },
            startColorVariance: { r: 0, g: 0, b: 0, a: 0 },
            gravityX: this.gravityX,
            gravityY: this.gravityY
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
                { time: 1, r: 1, g: 1, b: 1, a: this.endAlpha }
            ];
            this._modules.push(colorModule);

            // 缩放模块 | Size module
            const sizeModule = new SizeOverLifetimeModule();
            sizeModule.startMultiplier = 1;
            sizeModule.endMultiplier = this.endScale;
            this._modules.push(sizeModule);
        }

        this._needsRebuild = false;
    }

    private _simulate(dt: number, worldX: number, worldY: number): void {
        if (!this._pool || !this._emitter) return;

        // 发射新粒子 | Emit new particles
        this._emitter.emit(this._pool, dt, worldX, worldY);

        // 更新粒子 | Update particles
        this._pool.forEachActive((p) => {
            // 物理更新 | Physics update
            p.vx += p.ax * dt;
            p.vy += p.ay * dt;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.age += dt;

            // 应用模块 | Apply modules
            const normalizedAge = p.age / p.lifetime;
            for (const module of this._modules) {
                if (module.enabled) {
                    module.update(p, dt, normalizedAge);
                }
            }

            // 检查生命周期 | Check lifetime
            if (p.age >= p.lifetime) {
                this._pool!.recycle(p);
            }
        });
    }

    private _parseColor(hex: string): { r: number; g: number; b: number } {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (result) {
            return {
                r: parseInt(result[1], 16) / 255,
                g: parseInt(result[2], 16) / 255,
                b: parseInt(result[3], 16) / 255
            };
        }
        return { r: 1, g: 1, b: 1 };
    }

    onDestroy(): void {
        this._pool?.recycleAll();
        this._pool = null;
        this._emitter = null;
        this._modules = [];
    }
}
