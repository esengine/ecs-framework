/**
 * 缓动函数集合
 *
 * 提供各种常用的缓动函数，用于创建平滑的动画效果
 * 所有函数接受时间参数 t (0-1)，返回缓动后的值 (通常0-1)
 */
export class Easing {

    // 线性缓动

    /**
   * 线性缓动（无缓动）
   * @param t 时间参数 (0-1)
   * @returns 缓动值
   */
    static linear(t: number): number {
        return t;
    }

    // 二次方缓动 (Quadratic)

    /**
   * 二次方缓入
   * @param t 时间参数 (0-1)
   * @returns 缓动值
   */
    static quadIn(t: number): number {
        return t * t;
    }

    /**
   * 二次方缓出
   * @param t 时间参数 (0-1)
   * @returns 缓动值
   */
    static quadOut(t: number): number {
        return 1 - (1 - t) * (1 - t);
    }

    /**
   * 二次方缓入缓出
   * @param t 时间参数 (0-1)
   * @returns 缓动值
   */
    static quadInOut(t: number): number {
        return t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t);
    }

    // 三次方缓动 (Cubic)

    /**
   * 三次方缓入
   * @param t 时间参数 (0-1)
   * @returns 缓动值
   */
    static cubicIn(t: number): number {
        return t * t * t;
    }

    /**
   * 三次方缓出
   * @param t 时间参数 (0-1)
   * @returns 缓动值
   */
    static cubicOut(t: number): number {
        return 1 - Math.pow(1 - t, 3);
    }

    /**
   * 三次方缓入缓出
   * @param t 时间参数 (0-1)
   * @returns 缓动值
   */
    static cubicInOut(t: number): number {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    // 四次方缓动 (Quartic)

    /**
   * 四次方缓入
   * @param t 时间参数 (0-1)
   * @returns 缓动值
   */
    static quartIn(t: number): number {
        return t * t * t * t;
    }

    /**
   * 四次方缓出
   * @param t 时间参数 (0-1)
   * @returns 缓动值
   */
    static quartOut(t: number): number {
        return 1 - Math.pow(1 - t, 4);
    }

    /**
   * 四次方缓入缓出
   * @param t 时间参数 (0-1)
   * @returns 缓动值
   */
    static quartInOut(t: number): number {
        return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
    }

    // 五次方缓动 (Quintic)

    /**
   * 五次方缓入
   * @param t 时间参数 (0-1)
   * @returns 缓动值
   */
    static quintIn(t: number): number {
        return t * t * t * t * t;
    }

    /**
   * 五次方缓出
   * @param t 时间参数 (0-1)
   * @returns 缓动值
   */
    static quintOut(t: number): number {
        return 1 - Math.pow(1 - t, 5);
    }

    /**
   * 五次方缓入缓出
   * @param t 时间参数 (0-1)
   * @returns 缓动值
   */
    static quintInOut(t: number): number {
        return t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2;
    }

    // 正弦缓动 (Sine)

    /**
   * 正弦缓入
   * @param t 时间参数 (0-1)
   * @returns 缓动值
   */
    static sineIn(t: number): number {
        return 1 - Math.cos((t * Math.PI) / 2);
    }

    /**
   * 正弦缓出
   * @param t 时间参数 (0-1)
   * @returns 缓动值
   */
    static sineOut(t: number): number {
        return Math.sin((t * Math.PI) / 2);
    }

    /**
   * 正弦缓入缓出
   * @param t 时间参数 (0-1)
   * @returns 缓动值
   */
    static sineInOut(t: number): number {
        return -(Math.cos(Math.PI * t) - 1) / 2;
    }

    // 指数缓动 (Exponential)

    /**
   * 指数缓入
   * @param t 时间参数 (0-1)
   * @returns 缓动值
   */
    static expoIn(t: number): number {
        return t === 0 ? 0 : Math.pow(2, 10 * (t - 1));
    }

    /**
   * 指数缓出
   * @param t 时间参数 (0-1)
   * @returns 缓动值
   */
    static expoOut(t: number): number {
        return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    }

    /**
   * 指数缓入缓出
   * @param t 时间参数 (0-1)
   * @returns 缓动值
   */
    static expoInOut(t: number): number {
        if (t === 0) return 0;
        if (t === 1) return 1;

        return t < 0.5
            ? Math.pow(2, 20 * t - 10) / 2
            : (2 - Math.pow(2, -20 * t + 10)) / 2;
    }

    // 圆形缓动 (Circular)

    /**
   * 圆形缓入
   * @param t 时间参数 (0-1)
   * @returns 缓动值
   */
    static circIn(t: number): number {
        return 1 - Math.sqrt(1 - t * t);
    }

    /**
   * 圆形缓出
   * @param t 时间参数 (0-1)
   * @returns 缓动值
   */
    static circOut(t: number): number {
        return Math.sqrt(1 - (t - 1) * (t - 1));
    }

    /**
   * 圆形缓入缓出
   * @param t 时间参数 (0-1)
   * @returns 缓动值
   */
    static circInOut(t: number): number {
        return t < 0.5
            ? (1 - Math.sqrt(1 - 4 * t * t)) / 2
            : (Math.sqrt(1 - (-2 * t + 2) * (-2 * t + 2)) + 1) / 2;
    }

    // 回弹缓动 (Back)

    /**
   * 回弹缓入
   * @param t 时间参数 (0-1)
   * @param s 回弹强度，默认1.70158
   * @returns 缓动值
   */
    static backIn(t: number, s: number = 1.70158): number {
        const c1 = s;
        const c3 = c1 + 1;
        return c3 * t * t * t - c1 * t * t;
    }

    /**
   * 回弹缓出
   * @param t 时间参数 (0-1)
   * @param s 回弹强度，默认1.70158
   * @returns 缓动值
   */
    static backOut(t: number, s: number = 1.70158): number {
        const c1 = s;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    }

    /**
   * 回弹缓入缓出
   * @param t 时间参数 (0-1)
   * @param s 回弹强度，默认1.70158
   * @returns 缓动值
   */
    static backInOut(t: number, s: number = 1.70158): number {
        const c1 = s;
        const c2 = c1 * 1.525;

        return t < 0.5
            ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
            : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
    }

    // 弹性缓动 (Elastic)

    /**
   * 弹性缓入
   * @param t 时间参数 (0-1)
   * @param amplitude 振幅，默认1
   * @param period 周期，默认0.3
   * @returns 缓动值
   */
    static elasticIn(t: number, amplitude: number = 1, period: number = 0.3): number {
        if (t === 0) return 0;
        if (t === 1) return 1;

        const s = period / 4;
        return -(amplitude * Math.pow(2, 10 * (t - 1)) * Math.sin((t - 1 - s) * (2 * Math.PI) / period));
    }

    /**
   * 弹性缓出
   * @param t 时间参数 (0-1)
   * @param amplitude 振幅，默认1
   * @param period 周期，默认0.3
   * @returns 缓动值
   */
    static elasticOut(t: number, amplitude: number = 1, period: number = 0.3): number {
        if (t === 0) return 0;
        if (t === 1) return 1;

        const s = period / 4;
        return amplitude * Math.pow(2, -10 * t) * Math.sin((t - s) * (2 * Math.PI) / period) + 1;
    }

    /**
   * 弹性缓入缓出
   * @param t 时间参数 (0-1)
   * @param amplitude 振幅，默认1
   * @param period 周期，默认0.45
   * @returns 缓动值
   */
    static elasticInOut(t: number, amplitude: number = 1, period: number = 0.45): number {
        if (t === 0) return 0;
        if (t === 1) return 1;

        const s = period / 4;

        if (t < 0.5) {
            return -0.5 * (amplitude * Math.pow(2, 10 * (2 * t - 1)) * Math.sin((2 * t - 1 - s) * (2 * Math.PI) / period));
        }

        return amplitude * Math.pow(2, -10 * (2 * t - 1)) * Math.sin((2 * t - 1 - s) * (2 * Math.PI) / period) * 0.5 + 1;
    }

    // 跳跃缓动 (Bounce)

    /**
   * 跳跃缓入
   * @param t 时间参数 (0-1)
   * @returns 缓动值
   */
    static bounceIn(t: number): number {
        return 1 - Easing.bounceOut(1 - t);
    }

    /**
   * 跳跃缓出
   * @param t 时间参数 (0-1)
   * @returns 缓动值
   */
    static bounceOut(t: number): number {
        const n1 = 7.5625;
        const d1 = 2.75;

        if (t < 1 / d1) {
            return n1 * t * t;
        } else if (t < 2 / d1) {
            return n1 * (t -= 1.5 / d1) * t + 0.75;
        } else if (t < 2.5 / d1) {
            return n1 * (t -= 2.25 / d1) * t + 0.9375;
        } else {
            return n1 * (t -= 2.625 / d1) * t + 0.984375;
        }
    }

    /**
   * 跳跃缓入缓出
   * @param t 时间参数 (0-1)
   * @returns 缓动值
   */
    static bounceInOut(t: number): number {
        return t < 0.5
            ? (1 - Easing.bounceOut(1 - 2 * t)) / 2
            : (1 + Easing.bounceOut(2 * t - 1)) / 2;
    }

    // 组合缓动

    /**
   * 创建自定义缓动函数（组合多个缓动）
   * @param easingFunctions 缓动函数数组
   * @param weights 权重数组，默认均等
   * @returns 组合后的缓动函数
   */
    static combine(
        easingFunctions: ((t: number) => number)[],
        weights?: number[]
    ): (t: number) => number {
        if (!weights) {
            weights = new Array(easingFunctions.length).fill(1 / easingFunctions.length);
        }

        return (t: number): number => {
            let result = 0;
            for (let i = 0; i < easingFunctions.length; i++) {
                result += easingFunctions[i](t) * (weights![i] || 0);
            }
            return result;
        };
    }

    /**
   * 创建分段缓动函数
   * @param segments 分段配置数组，每段包含 {duration, easing}
   * @returns 分段缓动函数
   */
    static piecewise(segments: Array<{duration: number; easing: (t: number) => number}>): (t: number) => number {
    // 计算总持续时间
        const totalDuration = segments.reduce((sum, seg) => sum + seg.duration, 0);

        // 归一化持续时间
        const normalizedSegments = segments.map((seg) => ({
            ...seg,
            duration: seg.duration / totalDuration
        }));

        return (t: number): number => {
            let accumulatedTime = 0;

            for (const segment of normalizedSegments) {
                if (t <= accumulatedTime + segment.duration) {
                    const localT = (t - accumulatedTime) / segment.duration;
                    return segment.easing(Math.max(0, Math.min(1, localT)));
                }
                accumulatedTime += segment.duration;
            }

            // 如果超出范围，返回最后一段的结束值
            return normalizedSegments[normalizedSegments.length - 1].easing(1);
        };
    }

    /**
   * 创建反向缓动函数
   * @param easing 原缓动函数
   * @returns 反向缓动函数
   */
    static reverse(easing: (t: number) => number): (t: number) => number {
        return (t: number): number => 1 - easing(1 - t);
    }

    /**
   * 创建镜像缓动函数（先正向再反向）
   * @param easing 原缓动函数
   * @returns 镜像缓动函数
   */
    static mirror(easing: (t: number) => number): (t: number) => number {
        return (t: number): number => {
            if (t < 0.5) {
                return easing(t * 2);
            } else {
                return easing(2 - t * 2);
            }
        };
    }

    // 常用预设

    /** 平滑进入（常用于UI动画） */
    static readonly smoothIn = Easing.quadOut;

    /** 平滑退出（常用于UI动画） */
    static readonly smoothOut = Easing.quadIn;

    /** 快速进入（常用于出现动画） */
    static readonly quickIn = Easing.cubicOut;

    /** 快速退出（常用于消失动画） */
    static readonly quickOut = Easing.cubicIn;

    /** 自然运动（模拟物理） */
    static readonly natural = Easing.quartOut;

    /** 强调效果（吸引注意力） */
    static readonly emphasize = Easing.backOut;
}
