import { Vector2 } from '../Vector2';
import { MathUtils } from '../MathUtils';

/**
 * 插值器类型定义
 */
export type InterpolatorFunction<T> = (from: T, to: T, t: number) => T;

/**
 * 关键帧数据结构
 */
export interface Keyframe<T> {
  time: number;
  value: T;
  easing?: (t: number) => number;
}

/**
 * 带缓存的插值器类
 * 用于需要重复插值相同起始和目标值的情况
 */
export class CachedInterpolator<T> {
    private from?: T;
    private to?: T;
    private interpolator: InterpolatorFunction<T>;
    private cache: Map<number, T> = new Map();

    constructor(interpolator: InterpolatorFunction<T>) {
        this.interpolator = interpolator;
    }

    /**
   * 设置插值范围
   * @param from 起始值
   * @param to 目标值
   */
    setRange(from: T, to: T): void {
        if (this.from !== from || this.to !== to) {
            this.from = from;
            this.to = to;
            this.cache.clear();
        }
    }

    /**
   * 获取插值结果
   * @param t 插值参数
   * @returns 插值结果
   */
    get(t: number): T {
        if (!this.from || !this.to) {
            throw new Error('插值范围未设置');
        }

        if (!this.cache.has(t)) {
            const result = this.interpolator(this.from, this.to, t);
            this.cache.set(t, result);
        }

        return this.cache.get(t)!;
    }

    /**
   * 清空缓存
   */
    clearCache(): void {
        this.cache.clear();
    }
}

/**
 * 插值工具类
 *
 * 提供各种类型的插值功能，用于创建平滑的数值变化
 */
export class Interpolation {

    // 基础插值

    /**
   * 数值线性插值
   * @param from 起始值
   * @param to 目标值
   * @param t 插值参数 (0-1)
   * @returns 插值结果
   */
    static number(from: number, to: number, t: number): number {
        return MathUtils.lerp(from, to, t);
    }

    /**
   * 向量线性插值
   * @param from 起始向量
   * @param to 目标向量
   * @param t 插值参数 (0-1)
   * @returns 插值结果向量
   */
    static vector2(from: Vector2, to: Vector2, t: number): Vector2 {
        return Vector2.lerp(from, to, t);
    }

    /**
   * 角度插值（处理角度环绕）
   * @param from 起始角度（弧度）
   * @param to 目标角度（弧度）
   * @param t 插值参数 (0-1)
   * @returns 插值结果角度
   */
    static angle(from: number, to: number, t: number): number {
        return MathUtils.lerpAngle(from, to, t);
    }

    /**
   * 颜色插值（RGB）
   * @param from 起始颜色 [r, g, b, a?]
   * @param to 目标颜色 [r, g, b, a?]
   * @param t 插值参数 (0-1)
   * @returns 插值结果颜色
   */
    static color(from: number[], to: number[], t: number): number[] {
        const result: number[] = [];
        const length = Math.max(from.length, to.length);

        for (let i = 0; i < length; i++) {
            const fromVal = from[i] ?? (i === 3 ? 1 : 0); // alpha默认为1
            const toVal = to[i] ?? (i === 3 ? 1 : 0);
            result[i] = MathUtils.lerp(fromVal, toVal, t);
        }

        return result;
    }

    // 高级插值

    /**
   * 三次样条插值
   * @param p0 控制点0
   * @param p1 控制点1（起点）
   * @param p2 控制点2（终点）
   * @param p3 控制点3
   * @param t 插值参数 (0-1)
   * @returns 插值结果
   */
    static cubicSpline(p0: number, p1: number, p2: number, p3: number, t: number): number {
        const t2 = t * t;
        const t3 = t2 * t;

        return 0.5 * (
            (2 * p1) +
      (-p0 + p2) * t +
      (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
      (-p0 + 3 * p1 - 3 * p2 + p3) * t3
        );
    }

    /**
   * Hermite插值
   * @param p0 起始点
   * @param m0 起始切线
   * @param p1 结束点
   * @param m1 结束切线
   * @param t 插值参数 (0-1)
   * @returns 插值结果
   */
    static hermite(p0: number, m0: number, p1: number, m1: number, t: number): number {
        const t2 = t * t;
        const t3 = t2 * t;

        const h00 = 2 * t3 - 3 * t2 + 1;
        const h10 = t3 - 2 * t2 + t;
        const h01 = -2 * t3 + 3 * t2;
        const h11 = t3 - t2;

        return h00 * p0 + h10 * m0 + h01 * p1 + h11 * m1;
    }

    /**
   * 球面线性插值（适用于方向向量）
   * @param from 起始单位向量
   * @param to 目标单位向量
   * @param t 插值参数 (0-1)
   * @returns 插值结果向量
   */
    static slerp(from: Vector2, to: Vector2, t: number): Vector2 {
        let dot = Vector2.dot(from, to);

        // 如果点积为负，取反一个向量确保走最短路径
        let toVec = to;
        if (dot < 0) {
            dot = -dot;
            toVec = to.clone().negate();
        }

        // 如果向量几乎平行，使用线性插值
        if (dot > 0.9995) {
            return Vector2.lerp(from, toVec, t).normalize();
        }

        // 球面插值
        const theta = Math.acos(Math.abs(dot));
        const sinTheta = Math.sin(theta);

        const a = Math.sin((1 - t) * theta) / sinTheta;
        const b = Math.sin(t * theta) / sinTheta;

        return new Vector2(
            from.x * a + toVec.x * b,
            from.y * a + toVec.y * b
        );
    }

    // 缓存插值

    /**
   * 创建带缓存的插值器
   * 用于需要重复插值相同起始和目标值的情况
   * @param interpolator 插值函数
   * @returns 缓存插值器实例
   */
    static createCachedInterpolator<T>(interpolator: InterpolatorFunction<T>): CachedInterpolator<T> {
        return new CachedInterpolator(interpolator);
    }

    // 多点插值

    /**
   * 样条曲线插值（通过多个控制点）
   * @param points 控制点数组
   * @param t 插值参数 (0-1)
   * @returns 插值结果
   */
    static spline(points: number[], t: number): number {
        if (points.length === 0) return 0;
        if (points.length === 1) return points[0];
        if (points.length === 2) return MathUtils.lerp(points[0], points[1], t);

        const n = points.length - 1;
        const scaledT = t * n;
        const segment = Math.floor(scaledT);
        const localT = scaledT - segment;

        const i = Math.max(0, Math.min(n - 1, segment));

        const p0 = points[Math.max(0, i - 1)];
        const p1 = points[i];
        const p2 = points[Math.min(n, i + 1)];
        const p3 = points[Math.min(n, i + 2)];

        return Interpolation.cubicSpline(p0, p1, p2, p3, localT);
    }

    /**
   * 向量样条曲线插值
   * @param points 控制点数组
   * @param t 插值参数 (0-1)
   * @returns 插值结果向量
   */
    static vectorSpline(points: Vector2[], t: number): Vector2 {
        if (points.length === 0) return new Vector2();
        if (points.length === 1) return points[0].clone();
        if (points.length === 2) return Vector2.lerp(points[0], points[1], t);

        const xPoints = points.map((p) => p.x);
        const yPoints = points.map((p) => p.y);

        return new Vector2(
            Interpolation.spline(xPoints, t),
            Interpolation.spline(yPoints, t)
        );
    }

    // 时间轴插值

    /**
   * 关键帧动画插值
   * @param keyframes 关键帧数组（按时间排序）
   * @param time 当前时间
   * @param interpolator 插值函数
   * @returns 插值结果
   */
    static keyframe<T>(
        keyframes: Keyframe<T>[],
        time: number,
        interpolator: InterpolatorFunction<T>
    ): T {
        if (keyframes.length === 0) {
            throw new Error('至少需要一个关键帧');
        }

        if (keyframes.length === 1 || time <= keyframes[0].time) {
            return keyframes[0].value;
        }

        if (time >= keyframes[keyframes.length - 1].time) {
            return keyframes[keyframes.length - 1].value;
        }

        // 找到当前时间所在的区间
        for (let i = 0; i < keyframes.length - 1; i++) {
            const current = keyframes[i];
            const next = keyframes[i + 1];

            if (time >= current.time && time <= next.time) {
                const duration = next.time - current.time;
                const progress = duration > 0 ? (time - current.time) / duration : 0;

                // 应用缓动函数
                const easedProgress = current.easing ? current.easing(progress) : progress;

                return interpolator(current.value, next.value, easedProgress);
            }
        }

        return keyframes[keyframes.length - 1].value;
    }

    // 路径插值

    /**
   * 路径插值（沿着由点组成的路径）
   * @param path 路径点数组
   * @param t 插值参数 (0-1)
   * @param closed 是否为闭合路径
   * @returns 路径上的点
   */
    static pathInterpolation(path: Vector2[], t: number, closed: boolean = false): Vector2 {
        if (path.length === 0) return new Vector2();
        if (path.length === 1) return path[0].clone();

        const totalLength = Interpolation.getPathLength(path, closed);
        const targetDistance = t * totalLength;

        let accumulatedDistance = 0;
        const segments = closed ? path.length : path.length - 1;

        for (let i = 0; i < segments; i++) {
            const start = path[i];
            const end = path[(i + 1) % path.length];
            const segmentLength = Vector2.distance(start, end);

            if (accumulatedDistance + segmentLength >= targetDistance) {
                const segmentT = (targetDistance - accumulatedDistance) / segmentLength;
                return Vector2.lerp(start, end, segmentT);
            }

            accumulatedDistance += segmentLength;
        }

        return path[path.length - 1].clone();
    }

    /**
   * 计算路径总长度
   * @param path 路径点数组
   * @param closed 是否为闭合路径
   * @returns 路径总长度
   */
    static getPathLength(path: Vector2[], closed: boolean = false): number {
        if (path.length < 2) return 0;

        let totalLength = 0;
        const segments = closed ? path.length : path.length - 1;

        for (let i = 0; i < segments; i++) {
            const start = path[i];
            const end = path[(i + 1) % path.length];
            totalLength += Vector2.distance(start, end);
        }

        return totalLength;
    }

    // 实用工具

    /**
   * 创建数值插值器
   * @param from 起始值
   * @param to 目标值
   * @returns 插值器函数
   */
    static createNumberInterpolator(from: number, to: number): (t: number) => number {
        return (t: number) => Interpolation.number(from, to, t);
    }

    /**
   * 创建向量插值器
   * @param from 起始向量
   * @param to 目标向量
   * @returns 插值器函数
   */
    static createVectorInterpolator(from: Vector2, to: Vector2): (t: number) => Vector2 {
        return (t: number) => Interpolation.vector2(from, to, t);
    }

    /**
   * 创建组合插值器（插值多个值）
   * @param interpolators 插值器数组
   * @returns 组合插值器函数
   */
    static createCompositeInterpolator<T>(
        interpolators: InterpolatorFunction<T>[]
    ): (from: T[], to: T[], t: number) => T[] {
        return (from: T[], to: T[], t: number): T[] => {
            const result: T[] = [];
            for (let i = 0; i < Math.min(interpolators.length, from.length, to.length); i++) {
                result[i] = interpolators[i](from[i], to[i], t);
            }
            return result;
        };
    }
}
