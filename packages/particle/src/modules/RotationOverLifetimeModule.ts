import type { Particle } from '../Particle';
import type { IParticleModule } from './IParticleModule';

/**
 * 旋转随生命周期变化模块
 * Rotation over lifetime module
 */
export class RotationOverLifetimeModule implements IParticleModule {
    readonly name = 'RotationOverLifetime';
    enabled = true;

    /** 角速度乘数起点 | Angular velocity multiplier start */
    angularVelocityMultiplierStart: number = 1;

    /** 角速度乘数终点 | Angular velocity multiplier end */
    angularVelocityMultiplierEnd: number = 1;

    /** 附加旋转（随生命周期累加的旋转量）| Additional rotation over lifetime */
    additionalRotation: number = 0;

    update(p: Particle, dt: number, normalizedAge: number): void {
        // 应用角速度乘数 | Apply angular velocity multiplier
        const multiplier = lerp(
            this.angularVelocityMultiplierStart,
            this.angularVelocityMultiplierEnd,
            normalizedAge
        );

        p.rotation += p.angularVelocity * multiplier * dt;

        // 附加旋转 | Additional rotation
        if (this.additionalRotation !== 0) {
            p.rotation += this.additionalRotation * dt;
        }
    }
}

function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
}
