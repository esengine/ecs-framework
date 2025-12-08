import type { Particle } from '../Particle';
import type { IParticleModule } from './IParticleModule';

/**
 * 速度关键帧
 * Velocity keyframe
 */
export interface VelocityKey {
    /** 时间点 (0-1) | Time (0-1) */
    time: number;
    /** 速度乘数 | Velocity multiplier */
    multiplier: number;
}

/**
 * 速度曲线类型
 * Velocity curve type
 */
export enum VelocityCurveType {
    /** 常量（无变化）| Constant (no change) */
    Constant = 'constant',
    /** 线性 | Linear */
    Linear = 'linear',
    /** 缓入（先慢后快）| Ease in (slow then fast) */
    EaseIn = 'easeIn',
    /** 缓出（先快后慢）| Ease out (fast then slow) */
    EaseOut = 'easeOut',
    /** 缓入缓出 | Ease in out */
    EaseInOut = 'easeInOut',
    /** 自定义关键帧 | Custom keyframes */
    Custom = 'custom'
}

/**
 * 速度随生命周期变化模块
 * Velocity over lifetime module
 */
export class VelocityOverLifetimeModule implements IParticleModule {
    readonly name = 'VelocityOverLifetime';
    enabled = true;

    // ============= 速度曲线 | Velocity Curve =============

    /** 速度曲线类型 | Velocity curve type */
    curveType: VelocityCurveType = VelocityCurveType.Constant;

    /** 起始速度乘数 | Start velocity multiplier */
    startMultiplier: number = 1;

    /** 结束速度乘数 | End velocity multiplier */
    endMultiplier: number = 1;

    /** 自定义关键帧（当 curveType 为 Custom 时使用）| Custom keyframes */
    customCurve: VelocityKey[] = [];

    // ============= 阻力 | Drag =============

    /** 线性阻力 (0-1)，每秒速度衰减比例 | Linear drag (0-1), velocity decay per second */
    linearDrag: number = 0;

    // ============= 额外速度 | Additional Velocity =============

    /** 轨道速度（绕发射点旋转）| Orbital velocity (rotation around emitter) */
    orbitalVelocity: number = 0;

    /** 径向速度（向外/向内扩散）| Radial velocity (expand/contract) */
    radialVelocity: number = 0;

    /** 附加 X 速度 | Additional X velocity */
    additionalVelocityX: number = 0;

    /** 附加 Y 速度 | Additional Y velocity */
    additionalVelocityY: number = 0;

    update(p: Particle, dt: number, normalizedAge: number): void {
        // 计算速度乘数 | Calculate velocity multiplier
        const multiplier = this._evaluateMultiplier(normalizedAge);

        // 应用速度乘数到当前速度 | Apply multiplier to current velocity
        // 我们需要存储初始速度来正确应用曲线 | We need to store initial velocity to properly apply curve
        if (p.startVx === undefined) {
            p.startVx = p.vx;
            p.startVy = p.vy;
        }

        const startVx = p.startVx!;
        const startVy = p.startVy!;

        // 应用曲线乘数 | Apply curve multiplier
        p.vx = startVx * multiplier;
        p.vy = startVy * multiplier;

        // 应用阻力（在曲线乘数之后）| Apply drag (after curve multiplier)
        if (this.linearDrag > 0) {
            const dragFactor = Math.pow(1 - this.linearDrag, dt);
            p.vx *= dragFactor;
            p.vy *= dragFactor;
            // 更新存储的起始速度以反映阻力 | Update stored start velocity to reflect drag
            p.startVx = startVx * dragFactor;
            p.startVy = startVy * dragFactor;
        }

        // 附加速度 | Additional velocity
        if (this.additionalVelocityX !== 0 || this.additionalVelocityY !== 0) {
            p.vx += this.additionalVelocityX * dt;
            p.vy += this.additionalVelocityY * dt;
        }

        // 轨道速度 | Orbital velocity
        if (this.orbitalVelocity !== 0) {
            const angle = Math.atan2(p.y, p.x) + this.orbitalVelocity * dt;
            const dist = Math.sqrt(p.x * p.x + p.y * p.y);
            p.x = Math.cos(angle) * dist;
            p.y = Math.sin(angle) * dist;
        }

        // 径向速度 | Radial velocity
        if (this.radialVelocity !== 0) {
            const dist = Math.sqrt(p.x * p.x + p.y * p.y);
            if (dist > 0.001) {
                const nx = p.x / dist;
                const ny = p.y / dist;
                p.vx += nx * this.radialVelocity * dt;
                p.vy += ny * this.radialVelocity * dt;
            }
        }
    }

    /**
     * 计算速度乘数
     * Evaluate velocity multiplier
     */
    private _evaluateMultiplier(normalizedAge: number): number {
        let t: number;

        switch (this.curveType) {
            case VelocityCurveType.Constant:
                return this.startMultiplier;

            case VelocityCurveType.Linear:
                t = normalizedAge;
                break;

            case VelocityCurveType.EaseIn:
                t = normalizedAge * normalizedAge;
                break;

            case VelocityCurveType.EaseOut:
                t = 1 - (1 - normalizedAge) * (1 - normalizedAge);
                break;

            case VelocityCurveType.EaseInOut:
                t = normalizedAge < 0.5
                    ? 2 * normalizedAge * normalizedAge
                    : 1 - Math.pow(-2 * normalizedAge + 2, 2) / 2;
                break;

            case VelocityCurveType.Custom:
                return this._evaluateCustomCurve(normalizedAge);

            default:
                t = normalizedAge;
        }

        return lerp(this.startMultiplier, this.endMultiplier, t);
    }

    /**
     * 计算自定义曲线值
     * Evaluate custom curve value
     */
    private _evaluateCustomCurve(normalizedAge: number): number {
        if (this.customCurve.length === 0) return this.startMultiplier;
        if (this.customCurve.length === 1) return this.customCurve[0].multiplier;

        // 在边界外返回边界值 | Return boundary values outside range
        if (normalizedAge <= this.customCurve[0].time) {
            return this.customCurve[0].multiplier;
        }
        if (normalizedAge >= this.customCurve[this.customCurve.length - 1].time) {
            return this.customCurve[this.customCurve.length - 1].multiplier;
        }

        // 找到相邻关键帧 | Find adjacent keyframes
        for (let i = 0; i < this.customCurve.length - 1; i++) {
            const start = this.customCurve[i];
            const end = this.customCurve[i + 1];
            if (normalizedAge >= start.time && normalizedAge <= end.time) {
                const range = end.time - start.time;
                const t = range > 0 ? (normalizedAge - start.time) / range : 0;
                return lerp(start.multiplier, end.multiplier, t);
            }
        }

        return this.startMultiplier;
    }
}

function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
}
