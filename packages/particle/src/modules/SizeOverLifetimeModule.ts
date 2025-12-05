import type { Particle } from '../Particle';
import type { IParticleModule } from './IParticleModule';

/**
 * 缩放关键帧
 * Scale keyframe
 */
export interface ScaleKey {
    /** 时间点 (0-1) | Time (0-1) */
    time: number;
    /** 缩放值 | Scale value */
    scale: number;
}

/**
 * 缩放曲线类型
 * Scale curve type
 */
export enum ScaleCurveType {
    /** 线性 | Linear */
    Linear = 'linear',
    /** 缓入 | Ease in */
    EaseIn = 'easeIn',
    /** 缓出 | Ease out */
    EaseOut = 'easeOut',
    /** 缓入缓出 | Ease in out */
    EaseInOut = 'easeInOut',
    /** 自定义关键帧 | Custom keyframes */
    Custom = 'custom'
}

/**
 * 缩放随生命周期变化模块
 * Size over lifetime module
 */
export class SizeOverLifetimeModule implements IParticleModule {
    readonly name = 'SizeOverLifetime';
    enabled = true;

    /** 曲线类型 | Curve type */
    curveType: ScaleCurveType = ScaleCurveType.Linear;

    /** 起始缩放乘数 | Start scale multiplier */
    startMultiplier: number = 1;

    /** 结束缩放乘数 | End scale multiplier */
    endMultiplier: number = 0;

    /** 自定义关键帧（当 curveType 为 Custom 时使用）| Custom keyframes */
    customCurve: ScaleKey[] = [];

    /** X/Y 分离缩放 | Separate X/Y scaling */
    separateAxes: boolean = false;

    /** X轴结束缩放乘数 | End scale multiplier for X axis */
    endMultiplierX: number = 0;

    /** Y轴结束缩放乘数 | End scale multiplier for Y axis */
    endMultiplierY: number = 0;

    update(p: Particle, _dt: number, normalizedAge: number): void {
        let t: number;

        switch (this.curveType) {
            case ScaleCurveType.Linear:
                t = normalizedAge;
                break;
            case ScaleCurveType.EaseIn:
                t = normalizedAge * normalizedAge;
                break;
            case ScaleCurveType.EaseOut:
                t = 1 - (1 - normalizedAge) * (1 - normalizedAge);
                break;
            case ScaleCurveType.EaseInOut:
                t = normalizedAge < 0.5
                    ? 2 * normalizedAge * normalizedAge
                    : 1 - Math.pow(-2 * normalizedAge + 2, 2) / 2;
                break;
            case ScaleCurveType.Custom:
                t = this._evaluateCustomCurve(normalizedAge);
                break;
            default:
                t = normalizedAge;
        }

        if (this.separateAxes) {
            p.scaleX = p.startScaleX * lerp(this.startMultiplier, this.endMultiplierX, t);
            p.scaleY = p.startScaleY * lerp(this.startMultiplier, this.endMultiplierY, t);
        } else {
            const scale = lerp(this.startMultiplier, this.endMultiplier, t);
            p.scaleX = p.startScaleX * scale;
            p.scaleY = p.startScaleY * scale;
        }
    }

    private _evaluateCustomCurve(normalizedAge: number): number {
        if (this.customCurve.length === 0) return normalizedAge;
        if (this.customCurve.length === 1) return this.customCurve[0].scale;

        let startKey = this.customCurve[0];
        let endKey = this.customCurve[this.customCurve.length - 1];

        for (let i = 0; i < this.customCurve.length - 1; i++) {
            if (normalizedAge >= this.customCurve[i].time && normalizedAge <= this.customCurve[i + 1].time) {
                startKey = this.customCurve[i];
                endKey = this.customCurve[i + 1];
                break;
            }
        }

        const range = endKey.time - startKey.time;
        const t = range > 0 ? (normalizedAge - startKey.time) / range : 0;
        return lerp(startKey.scale, endKey.scale, t);
    }
}

function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
}
