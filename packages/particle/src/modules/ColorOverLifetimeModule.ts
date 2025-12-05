import type { Particle } from '../Particle';
import type { IParticleModule } from './IParticleModule';

/**
 * 颜色关键帧
 * Color keyframe
 */
export interface ColorKey {
    /** 时间点 (0-1) | Time (0-1) */
    time: number;
    /** 颜色R (0-1) | Color R (0-1) */
    r: number;
    /** 颜色G (0-1) | Color G (0-1) */
    g: number;
    /** 颜色B (0-1) | Color B (0-1) */
    b: number;
    /** 透明度 (0-1) | Alpha (0-1) */
    a: number;
}

/**
 * 颜色随生命周期变化模块
 * Color over lifetime module
 */
export class ColorOverLifetimeModule implements IParticleModule {
    readonly name = 'ColorOverLifetime';
    enabled = true;

    /** 颜色渐变关键帧 | Color gradient keyframes */
    gradient: ColorKey[] = [
        { time: 0, r: 1, g: 1, b: 1, a: 1 },
        { time: 1, r: 1, g: 1, b: 1, a: 0 }
    ];

    update(p: Particle, _dt: number, normalizedAge: number): void {
        if (this.gradient.length === 0) return;

        // 找到当前时间点的两个关键帧 | Find the two keyframes around current time
        let startKey = this.gradient[0];
        let endKey = this.gradient[this.gradient.length - 1];

        for (let i = 0; i < this.gradient.length - 1; i++) {
            if (normalizedAge >= this.gradient[i].time && normalizedAge <= this.gradient[i + 1].time) {
                startKey = this.gradient[i];
                endKey = this.gradient[i + 1];
                break;
            }
        }

        // 在两个关键帧之间插值 | Interpolate between keyframes
        const range = endKey.time - startKey.time;
        const t = range > 0 ? (normalizedAge - startKey.time) / range : 0;

        p.r = p.startR * lerp(startKey.r, endKey.r, t);
        p.g = p.startG * lerp(startKey.g, endKey.g, t);
        p.b = p.startB * lerp(startKey.b, endKey.b, t);
        p.alpha = p.startAlpha * lerp(startKey.a, endKey.a, t);
    }
}

function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
}
