import type { Particle } from '../Particle';
import type { IParticleModule } from './IParticleModule';

/**
 * 值噪声哈希函数
 * Value noise hash function
 *
 * 使用经典的整数哈希算法生成伪随机值
 * Uses classic integer hash algorithm to generate pseudo-random values
 */
export function noiseHash(x: number, y: number): number {
    const n = x + y * 57;
    const shifted = (n << 13) ^ n;
    return ((shifted * (shifted * shifted * 15731 + 789221) + 1376312589) & 0x7fffffff) / 0x7fffffff;
}

/**
 * 2D 值噪声函数
 * 2D value noise function
 *
 * 基于双线性插值的简化值噪声实现，返回 [-1, 1] 范围的值
 * Simplified value noise using bilinear interpolation, returns value in [-1, 1] range
 */
export function valueNoise2D(x: number, y: number): number {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const fx = x - ix;
    const fy = y - iy;

    const n00 = noiseHash(ix, iy);
    const n10 = noiseHash(ix + 1, iy);
    const n01 = noiseHash(ix, iy + 1);
    const n11 = noiseHash(ix + 1, iy + 1);

    // 双线性插值 | Bilinear interpolation
    const nx0 = n00 + (n10 - n00) * fx;
    const nx1 = n01 + (n11 - n01) * fx;
    return (nx0 + (nx1 - nx0) * fy) * 2 - 1;
}

/**
 * 噪声模块 - 添加随机扰动
 * Noise module - adds random perturbation
 */
export class NoiseModule implements IParticleModule {
    readonly name = 'Noise';
    enabled = true;

    /** 位置噪声强度 | Position noise strength */
    positionAmount: number = 0;

    /** 速度噪声强度 | Velocity noise strength */
    velocityAmount: number = 0;

    /** 旋转噪声强度 | Rotation noise strength */
    rotationAmount: number = 0;

    /** 缩放噪声强度 | Scale noise strength */
    scaleAmount: number = 0;

    /** 噪声频率 | Noise frequency */
    frequency: number = 1;

    /** 噪声滚动速度 | Noise scroll speed */
    scrollSpeed: number = 1;

    private _time: number = 0;

    update(p: Particle, dt: number, _normalizedAge: number): void {
        this._time += dt * this.scrollSpeed;

        // 基于粒子位置和时间的噪声 | Noise based on particle position and time
        const noiseX = valueNoise2D(p.x * this.frequency + this._time, p.y * this.frequency);
        const noiseY = valueNoise2D(p.x * this.frequency, p.y * this.frequency + this._time);

        // 位置噪声 | Position noise
        if (this.positionAmount !== 0) {
            p.x += noiseX * this.positionAmount * dt;
            p.y += noiseY * this.positionAmount * dt;
        }

        // 速度噪声 | Velocity noise
        if (this.velocityAmount !== 0) {
            p.vx += noiseX * this.velocityAmount * dt;
            p.vy += noiseY * this.velocityAmount * dt;
        }

        // 旋转噪声 | Rotation noise
        if (this.rotationAmount !== 0) {
            p.rotation += noiseX * this.rotationAmount * dt;
        }

        // 缩放噪声 | Scale noise
        if (this.scaleAmount !== 0) {
            const scaleDelta = noiseX * this.scaleAmount * dt;
            p.scaleX += scaleDelta;
            p.scaleY += scaleDelta;
        }
    }
}
