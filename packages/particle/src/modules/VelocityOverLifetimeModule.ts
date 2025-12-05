import type { Particle } from '../Particle';
import type { IParticleModule } from './IParticleModule';

/**
 * 速度随生命周期变化模块
 * Velocity over lifetime module
 */
export class VelocityOverLifetimeModule implements IParticleModule {
    readonly name = 'VelocityOverLifetime';
    enabled = true;

    /** 线性阻力 (0-1)，每秒速度衰减比例 | Linear drag (0-1), velocity decay per second */
    linearDrag: number = 0;

    /** 速度乘数曲线起点 | Velocity multiplier curve start */
    speedMultiplierStart: number = 1;

    /** 速度乘数曲线终点 | Velocity multiplier curve end */
    speedMultiplierEnd: number = 1;

    /** 轨道速度（绕发射点旋转）| Orbital velocity (rotation around emitter) */
    orbitalVelocity: number = 0;

    /** 径向速度（向外/向内扩散）| Radial velocity (expand/contract) */
    radialVelocity: number = 0;

    update(p: Particle, dt: number, normalizedAge: number): void {
        // 应用阻力 | Apply drag
        if (this.linearDrag > 0) {
            const dragFactor = 1 - this.linearDrag * dt;
            p.vx *= dragFactor;
            p.vy *= dragFactor;
        }

        // 应用速度乘数 | Apply speed multiplier
        if (this.speedMultiplierStart !== 1 || this.speedMultiplierEnd !== 1) {
            const multiplier = lerp(this.speedMultiplierStart, this.speedMultiplierEnd, normalizedAge);
            // 只在第一帧应用乘数变化 | Only apply multiplier change on first frame
            if (p.age <= dt) {
                p.vx *= multiplier;
                p.vy *= multiplier;
            }
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
}

function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
}
