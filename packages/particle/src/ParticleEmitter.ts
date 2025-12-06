import type { Particle, ParticlePool } from './Particle';

/**
 * 发射形状类型
 * Emission shape type
 */
export enum EmissionShape {
    /** 点发射 | Point emission */
    Point = 'point',
    /** 圆形发射（填充）| Circle emission (filled) */
    Circle = 'circle',
    /** 矩形发射 | Rectangle emission */
    Rectangle = 'rectangle',
    /** 线段发射 | Line emission */
    Line = 'line',
    /** 圆锥/扇形发射 | Cone/fan emission */
    Cone = 'cone',
    /** 圆环发射（边缘）| Ring emission (edge only) */
    Ring = 'ring',
    /** 矩形边缘发射 | Rectangle edge emission */
    Edge = 'edge'
}

/**
 * 数值范围
 * Value range for randomization
 */
export interface ValueRange {
    min: number;
    max: number;
}

/**
 * 颜色值
 * Color value (RGBA)
 */
export interface ColorValue {
    r: number;
    g: number;
    b: number;
    a: number;
}

/**
 * 发射器配置
 * Emitter configuration
 */
export interface EmitterConfig {
    /** 每秒发射数量 | Particles per second */
    emissionRate: number;

    /** 单次爆发数量（0表示持续发射）| Burst count (0 for continuous) */
    burstCount: number;

    /** 粒子生命时间范围（秒）| Particle lifetime range (seconds) */
    lifetime: ValueRange;

    /** 发射形状 | Emission shape */
    shape: EmissionShape;

    /** 形状半径（用于圆形/圆锥）| Shape radius (for circle/cone) */
    shapeRadius: number;

    /** 形状宽度（用于矩形/线段）| Shape width (for rectangle/line) */
    shapeWidth: number;

    /** 形状高度（用于矩形）| Shape height (for rectangle) */
    shapeHeight: number;

    /** 圆锥角度（弧度，用于圆锥发射）| Cone angle (radians, for cone shape) */
    coneAngle: number;

    /** 发射方向（弧度，0=右）| Emission direction (radians, 0=right) */
    direction: number;

    /** 发射方向随机范围（弧度）| Direction random spread (radians) */
    directionSpread: number;

    /** 初始速度范围 | Initial speed range */
    speed: ValueRange;

    /** 初始角速度范围 | Initial angular velocity range */
    angularVelocity: ValueRange;

    /** 初始缩放范围 | Initial scale range */
    startScale: ValueRange;

    /** 初始旋转范围（弧度）| Initial rotation range (radians) */
    startRotation: ValueRange;

    /** 初始颜色 | Initial color */
    startColor: ColorValue;

    /** 初始颜色变化范围 | Initial color variance */
    startColorVariance: ColorValue;

    /** 重力X | Gravity X */
    gravityX: number;

    /** 重力Y | Gravity Y */
    gravityY: number;
}

/**
 * 创建默认发射器配置
 * Create default emitter configuration
 */
export function createDefaultEmitterConfig(): EmitterConfig {
    return {
        emissionRate: 10,
        burstCount: 0,
        lifetime: { min: 1, max: 2 },
        shape: EmissionShape.Point,
        shapeRadius: 0,
        shapeWidth: 0,
        shapeHeight: 0,
        coneAngle: Math.PI / 6,
        direction: -Math.PI / 2,
        directionSpread: 0,
        speed: { min: 50, max: 100 },
        angularVelocity: { min: 0, max: 0 },
        startScale: { min: 1, max: 1 },
        startRotation: { min: 0, max: 0 },
        startColor: { r: 1, g: 1, b: 1, a: 1 },
        startColorVariance: { r: 0, g: 0, b: 0, a: 0 },
        gravityX: 0,
        gravityY: 0
    };
}

/**
 * 粒子发射器
 * Particle emitter - handles particle spawning
 */
export class ParticleEmitter {
    public config: EmitterConfig;

    private _emissionAccumulator: number = 0;
    private _isEmitting: boolean = true;

    constructor(config?: Partial<EmitterConfig>) {
        this.config = { ...createDefaultEmitterConfig(), ...config };
    }

    /** 是否正在发射 | Whether emitter is active */
    get isEmitting(): boolean {
        return this._isEmitting;
    }

    set isEmitting(value: boolean) {
        this._isEmitting = value;
    }

    /**
     * 发射粒子
     * Emit particles
     *
     * @param pool - Particle pool
     * @param dt - Delta time in seconds
     * @param worldX - World position X
     * @param worldY - World position Y
     * @param worldRotation - World rotation in radians (applied to emission direction)
     * @param worldScaleX - World scale X (applied to emission offset and speed)
     * @param worldScaleY - World scale Y (applied to emission offset and speed)
     * @returns Number of particles emitted
     */
    emit(
        pool: ParticlePool,
        dt: number,
        worldX: number,
        worldY: number,
        worldRotation: number = 0,
        worldScaleX: number = 1,
        worldScaleY: number = 1
    ): number {
        if (!this._isEmitting) return 0;

        let emitted = 0;

        if (this.config.burstCount > 0) {
            // 爆发模式 | Burst mode
            for (let i = 0; i < this.config.burstCount; i++) {
                const p = pool.spawn();
                if (p) {
                    this._initParticle(p, worldX, worldY, worldRotation, worldScaleX, worldScaleY);
                    emitted++;
                }
            }
            this._isEmitting = false;
        } else {
            // 持续发射 | Continuous emission
            this._emissionAccumulator += this.config.emissionRate * dt;
            while (this._emissionAccumulator >= 1) {
                const p = pool.spawn();
                if (p) {
                    this._initParticle(p, worldX, worldY, worldRotation, worldScaleX, worldScaleY);
                    emitted++;
                }
                this._emissionAccumulator -= 1;
            }
        }

        return emitted;
    }

    /**
     * 立即爆发发射
     * Burst emit immediately
     *
     * @param pool - Particle pool
     * @param count - Number of particles to emit
     * @param worldX - World position X
     * @param worldY - World position Y
     * @param worldRotation - World rotation in radians
     * @param worldScaleX - World scale X
     * @param worldScaleY - World scale Y
     */
    burst(
        pool: ParticlePool,
        count: number,
        worldX: number,
        worldY: number,
        worldRotation: number = 0,
        worldScaleX: number = 1,
        worldScaleY: number = 1
    ): number {
        let emitted = 0;
        for (let i = 0; i < count; i++) {
            const p = pool.spawn();
            if (p) {
                this._initParticle(p, worldX, worldY, worldRotation, worldScaleX, worldScaleY);
                emitted++;
            }
        }
        return emitted;
    }

    /**
     * 重置发射器
     * Reset emitter
     */
    reset(): void {
        this._emissionAccumulator = 0;
        this._isEmitting = true;
    }

    private _initParticle(
        p: Particle,
        worldX: number,
        worldY: number,
        worldRotation: number = 0,
        worldScaleX: number = 1,
        worldScaleY: number = 1
    ): void {
        const config = this.config;

        // 获取形状偏移 | Get shape offset
        const [ox, oy] = this._getShapeOffset();

        // 应用旋转和缩放到发射偏移 | Apply rotation and scale to emission offset
        // 先缩放，再旋转 | Scale first, then rotate
        const scaledOx = ox * worldScaleX;
        const scaledOy = oy * worldScaleY;
        const cos = Math.cos(worldRotation);
        const sin = Math.sin(worldRotation);
        const rotatedOx = scaledOx * cos - scaledOy * sin;
        const rotatedOy = scaledOx * sin + scaledOy * cos;

        // 位置 | Position
        p.x = worldX + rotatedOx;
        p.y = worldY + rotatedOy;

        // 生命时间 | Lifetime
        p.lifetime = randomRange(config.lifetime.min, config.lifetime.max);
        p.age = 0;

        // 速度方向（应用世界旋转）| Velocity direction (apply world rotation)
        const baseDir = config.direction + randomRange(-config.directionSpread / 2, config.directionSpread / 2);
        const dir = baseDir + worldRotation;
        const speed = randomRange(config.speed.min, config.speed.max);

        // 速度也应用缩放（使用平均缩放）| Speed also applies scale (use average scale)
        const avgScale = (worldScaleX + worldScaleY) / 2;
        p.vx = Math.cos(dir) * speed * avgScale;
        p.vy = Math.sin(dir) * speed * avgScale;

        // 加速度（重力）| Acceleration (gravity)
        p.ax = config.gravityX;
        p.ay = config.gravityY;

        // 旋转 | Rotation
        p.rotation = randomRange(config.startRotation.min, config.startRotation.max);
        p.angularVelocity = randomRange(config.angularVelocity.min, config.angularVelocity.max);

        // 缩放（应用世界缩放）| Scale (apply world scale)
        const baseScale = randomRange(config.startScale.min, config.startScale.max);
        p.scaleX = baseScale * worldScaleX;
        p.scaleY = baseScale * worldScaleY;
        p.startScaleX = p.scaleX;
        p.startScaleY = p.scaleY;

        // 颜色 | Color
        p.r = clamp(config.startColor.r + randomRange(-config.startColorVariance.r, config.startColorVariance.r), 0, 1);
        p.g = clamp(config.startColor.g + randomRange(-config.startColorVariance.g, config.startColorVariance.g), 0, 1);
        p.b = clamp(config.startColor.b + randomRange(-config.startColorVariance.b, config.startColorVariance.b), 0, 1);
        p.alpha = clamp(config.startColor.a + randomRange(-config.startColorVariance.a, config.startColorVariance.a), 0, 1);
        p.startR = p.r;
        p.startG = p.g;
        p.startB = p.b;
        p.startAlpha = p.alpha;
    }

    private _getShapeOffset(): [number, number] {
        const config = this.config;

        switch (config.shape) {
            case EmissionShape.Point:
                return [0, 0];

            case EmissionShape.Circle: {
                // 填充圆形 | Filled circle
                const angle = Math.random() * Math.PI * 2;
                const radius = Math.random() * config.shapeRadius;
                return [Math.cos(angle) * radius, Math.sin(angle) * radius];
            }

            case EmissionShape.Ring: {
                // 圆环边缘 | Ring edge only
                const angle = Math.random() * Math.PI * 2;
                return [Math.cos(angle) * config.shapeRadius, Math.sin(angle) * config.shapeRadius];
            }

            case EmissionShape.Rectangle: {
                // 填充矩形 | Filled rectangle
                const x = randomRange(-config.shapeWidth / 2, config.shapeWidth / 2);
                const y = randomRange(-config.shapeHeight / 2, config.shapeHeight / 2);
                return [x, y];
            }

            case EmissionShape.Edge: {
                // 矩形边缘 | Rectangle edge only
                const perimeter = 2 * (config.shapeWidth + config.shapeHeight);
                const t = Math.random() * perimeter;

                const w = config.shapeWidth;
                const h = config.shapeHeight;

                if (t < w) {
                    // 上边 | Top edge
                    return [t - w / 2, h / 2];
                } else if (t < w + h) {
                    // 右边 | Right edge
                    return [w / 2, h / 2 - (t - w)];
                } else if (t < 2 * w + h) {
                    // 下边 | Bottom edge
                    return [w / 2 - (t - w - h), -h / 2];
                } else {
                    // 左边 | Left edge
                    return [-w / 2, -h / 2 + (t - 2 * w - h)];
                }
            }

            case EmissionShape.Line: {
                const t = Math.random() - 0.5;
                const cos = Math.cos(config.direction + Math.PI / 2);
                const sin = Math.sin(config.direction + Math.PI / 2);
                return [cos * config.shapeWidth * t, sin * config.shapeWidth * t];
            }

            case EmissionShape.Cone: {
                const angle = config.direction + randomRange(-config.coneAngle / 2, config.coneAngle / 2);
                const radius = Math.random() * config.shapeRadius;
                return [Math.cos(angle) * radius, Math.sin(angle) * radius];
            }

            default:
                return [0, 0];
        }
    }
}

function randomRange(min: number, max: number): number {
    return min + Math.random() * (max - min);
}

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}
