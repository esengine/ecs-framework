import type { Particle } from '../Particle';
import type { IParticleModule } from './IParticleModule';

/**
 * 动画播放模式
 * Animation playback mode
 */
export enum AnimationPlayMode {
    /** 单次播放（生命周期内完成一次循环）| Single loop over lifetime */
    LifetimeLoop = 'lifetimeLoop',
    /** 固定帧率播放 | Fixed frame rate */
    FixedFPS = 'fixedFps',
    /** 随机选择帧 | Random frame selection */
    Random = 'random',
    /** 使用速度控制帧 | Speed-based frame */
    SpeedBased = 'speedBased',
}

/**
 * 动画循环模式
 * Animation loop mode
 */
export enum AnimationLoopMode {
    /** 不循环（停在最后一帧）| No loop (stop at last frame) */
    Once = 'once',
    /** 循环播放 | Loop continuously */
    Loop = 'loop',
    /** 往返循环 | Ping-pong loop */
    PingPong = 'pingPong',
}

/**
 * 纹理图集动画模块
 * Texture sheet animation module
 *
 * Animates particles through sprite sheet frames.
 * 通过精灵图帧动画化粒子。
 */
export class TextureSheetAnimationModule implements IParticleModule {
    readonly name = 'TextureSheetAnimation';
    enabled = false;

    // 图集配置 | Sheet configuration
    /** 水平帧数 | Number of columns */
    tilesX: number = 1;

    /** 垂直帧数 | Number of rows */
    tilesY: number = 1;

    /** 总帧数（0=自动计算为 tilesX * tilesY）| Total frames (0 = auto-calculate) */
    totalFrames: number = 0;

    /** 起始帧 | Start frame index */
    startFrame: number = 0;

    // 播放配置 | Playback configuration
    /** 播放模式 | Playback mode */
    playMode: AnimationPlayMode = AnimationPlayMode.LifetimeLoop;

    /** 循环模式 | Loop mode */
    loopMode: AnimationLoopMode = AnimationLoopMode.Loop;

    /** 固定帧率（FPS，用于 FixedFPS 模式）| Fixed frame rate (for FixedFPS mode) */
    frameRate: number = 30;

    /** 播放速度乘数 | Playback speed multiplier */
    speedMultiplier: number = 1;

    /** 循环次数（0=无限）| Number of loops (0 = infinite) */
    cycleCount: number = 0;

    // 内部状态 | Internal state
    private _cachedTotalFrames: number = 0;

    /**
     * 获取实际总帧数
     * Get actual total frames
     */
    get actualTotalFrames(): number {
        return this.totalFrames > 0 ? this.totalFrames : this.tilesX * this.tilesY;
    }

    /**
     * 更新粒子
     * Update particle
     *
     * @param p - 粒子 | Particle
     * @param dt - 增量时间 | Delta time
     * @param normalizedAge - 归一化年龄 (0-1) | Normalized age
     */
    update(p: Particle, dt: number, normalizedAge: number): void {
        const frameCount = this.actualTotalFrames;
        if (frameCount <= 1) return;

        let frameIndex: number;

        switch (this.playMode) {
            case AnimationPlayMode.LifetimeLoop:
                frameIndex = this._getLifetimeFrame(normalizedAge, frameCount);
                break;

            case AnimationPlayMode.FixedFPS:
                frameIndex = this._getFixedFPSFrame(p, dt, frameCount);
                break;

            case AnimationPlayMode.Random:
                frameIndex = this._getRandomFrame(p, frameCount);
                break;

            case AnimationPlayMode.SpeedBased:
                frameIndex = this._getSpeedBasedFrame(p, frameCount);
                break;

            default:
                frameIndex = this.startFrame;
        }

        // 设置粒子的 UV 坐标 | Set particle UV coordinates
        this._setParticleUV(p, frameIndex);
    }

    /**
     * 生命周期帧计算
     * Calculate frame based on lifetime
     */
    private _getLifetimeFrame(normalizedAge: number, frameCount: number): number {
        const progress = normalizedAge * this.speedMultiplier;
        return this._applyLoopMode(progress, frameCount);
    }

    /**
     * 固定帧率计算
     * Calculate frame based on fixed FPS
     */
    private _getFixedFPSFrame(p: Particle, dt: number, frameCount: number): number {
        // 使用粒子的 age 来计算当前帧 | Use particle age to calculate current frame
        const animTime = p.age * this.frameRate * this.speedMultiplier;
        const progress = animTime / frameCount;
        return this._applyLoopMode(progress, frameCount);
    }

    /**
     * 随机帧选择（每个粒子使用固定随机帧）
     * Random frame selection (each particle uses fixed random frame)
     */
    private _getRandomFrame(p: Particle, frameCount: number): number {
        // 使用粒子的起始位置作为随机种子（确保一致性）
        // Use particle's start position as random seed (for consistency)
        const seed = Math.abs(p.startR * 1000 + p.startG * 100 + p.startB * 10) % 1;
        return Math.floor(seed * frameCount);
    }

    /**
     * 基于速度的帧计算
     * Calculate frame based on particle speed
     */
    private _getSpeedBasedFrame(p: Particle, frameCount: number): number {
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        // 归一化速度（假设最大速度为 500）| Normalize speed (assume max 500)
        const normalizedSpeed = Math.min(speed / 500, 1);
        const frameIndex = Math.floor(normalizedSpeed * (frameCount - 1));
        return this.startFrame + frameIndex;
    }

    /**
     * 应用循环模式
     * Apply loop mode to progress
     */
    private _applyLoopMode(progress: number, frameCount: number): number {
        let loopProgress = progress;

        switch (this.loopMode) {
            case AnimationLoopMode.Once:
                // 停在最后一帧 | Stop at last frame
                loopProgress = Math.min(progress, 0.9999);
                break;

            case AnimationLoopMode.Loop:
                // 简单循环 | Simple loop
                loopProgress = progress % 1;
                break;

            case AnimationLoopMode.PingPong:
                // 往返循环 | Ping-pong
                const cycle = Math.floor(progress);
                const remainder = progress - cycle;
                loopProgress = (cycle % 2 === 0) ? remainder : (1 - remainder);
                break;
        }

        // 检查循环次数限制 | Check cycle count limit
        if (this.cycleCount > 0) {
            const currentCycle = Math.floor(progress);
            if (currentCycle >= this.cycleCount) {
                loopProgress = 0.9999; // 停在最后一帧 | Stop at last frame
            }
        }

        // 计算帧索引 | Calculate frame index
        const frameIndex = Math.floor(loopProgress * frameCount);
        return this.startFrame + Math.min(frameIndex, frameCount - 1);
    }

    /**
     * 设置粒子 UV 坐标
     * Set particle UV coordinates
     */
    private _setParticleUV(p: Particle, frameIndex: number): void {
        // 计算 UV 坐标 | Calculate UV coordinates
        const col = frameIndex % this.tilesX;
        const row = Math.floor(frameIndex / this.tilesX);

        const uWidth = 1 / this.tilesX;
        const vHeight = 1 / this.tilesY;

        // UV 坐标（左上角为原点）| UV coordinates (top-left origin)
        const u0 = col * uWidth;
        const v0 = row * vHeight;
        const u1 = u0 + uWidth;
        const v1 = v0 + vHeight;

        // 存储动画帧信息到粒子 | Store animation frame info to particle
        // 渲染数据提供者会使用这些值计算实际的 UV | Render data provider will use these to calculate actual UVs
        p._animFrame = frameIndex;
        p._animTilesX = this.tilesX;
        p._animTilesY = this.tilesY;
    }
}
