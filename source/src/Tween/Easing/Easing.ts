module es {
    /**
     * 标准缓和方程通过将b和c参数（起始值和变化值）用0和1替换，然后进行简化。
     * 这样做的目的是为了让我们可以得到一个0 - 1之间的原始值（除了弹性/反弹故意超过界限），然后用这个值来lerp任何东西
     */
    export module Easing {
        export class Linear {
            /**
             * 线性缓动，等同于t / d
             * @param t 当前时间
             * @param d 持续时间
             */
            public static easeNone(t: number, d: number) {
                return t / d;
            }
        }

        export class Quadratic {
            /**
             * 平方缓动进入，加速运动
             * @param t 当前时间
             * @param d 持续时间
             */
            public static easeIn(t: number, d: number) {
                return (t /= d) * t;
            }

            /**
             * 平方缓动退出，减速运动
             * @param t 当前时间
             * @param d 持续时间
             */
            public static easeOut(t: number, d: number) {
                return -1 * (t /= d) * (t - 2);
            }

            /**
             * 平方缓动进出，加速减速运动
             * @param t 当前时间
             * @param d 持续时间
             */
            public static easeInOut(t: number, d: number) {
                if ((t /= d / 2) < 1) return 0.5 * t * t;
                return -0.5 * ((--t) * (t - 2) - 1);
            }
        }

        export class Back {
            /**
             * Back.easeIn(t, d) 函数将会返回 Back 缓动进入算法的结果
             *
             * @param t 当前时间，从0开始递增
             * @param d 持续时间
             * @param s 回弹的距离，默认值为 1.70158，可以省略该参数
             * @return 缓动后的值
             */
            public static easeIn(t: number, d: number, s: number = 1.70158) {
                // 根据公式计算缓动结果
                return (t /= d) * t * ((s + 1) * t - s);
            }

            /**
             * Back.easeOut(t, d) 函数将会返回 Back 缓动退出算法的结果
             *
             * @param t 当前时间，从0开始递增
             * @param d 持续时间
             * @param s 回弹的距离，默认值为 1.70158，可以省略该参数
             * @return 缓动后的值
             */
            public static easeOut(t: number, d: number, s: number = 1.70158) {
                // 根据公式计算缓动结果
                return ((t = t / d - 1) * t * ((s + 1) * t + s) + 1);
            }

            /**
             * Back.easeInOut(t, d) 函数将会返回 Back 缓动进入/退出算法的结果
             *
             * @param t 当前时间，从0开始递增
             * @param d 持续时间
             * @param s 回弹的距离，默认值为 1.70158，可以省略该参数
             * @return 缓动后的值
             */
            public static easeInOut(t: number, d: number, s: number = 1.70158) {
                // 根据公式计算缓动结果
                if ((t /= d / 2) < 1) {
                    s *= (1.525);
                    return 0.5 * (t * t * (((s + 1) * t) - s));
                }
                s *= (1.525);
                return 0.5 * ((t -= 2) * t * (((s + 1) * t) + s) + 2);
            }
        }

        export class Bounce {
            /**
             * 从0到目标值的反弹动画
             * @param t 当前时间
             * @param d 持续时间
             * @returns 反弹动画进度
             */
            public static easeOut(t: number, d: number) {
                if ((t /= d) < (1 / 2.75)) {
                    return (7.5625 * t * t);
                } else if (t < (2 / 2.75)) {
                    return (7.5625 * (t -= (1.5 / 2.75)) * t + 0.75);
                } else if (t < (2.5 / 2.75)) {
                    return (7.5625 * (t -= (2.25 / 2.75)) * t + 0.9375);
                } else {
                    return (7.5625 * (t -= (2.625 / 2.75)) * t + 0.984375);
                }
            }

            /**
             * 从目标值到0的反弹动画
             * @param t 当前时间
             * @param d 持续时间
             * @returns 反弹动画进度
             */
            public static easeIn(t: number, d: number) {
                return 1 - this.easeOut(d - t, d);
            }

            /**
             * 从0到目标值再到0的反弹动画
             * @param t 当前时间
             * @param d 持续时间
             * @returns 反弹动画进度
             */
            public static easeInOut(t: number, d: number) {
                if (t < d / 2)
                    return this.easeIn(t * 2, d) * 0.5;
                else
                    return this.easeOut(t * 2 - d, d) * 0.5 + 1 * 0.5;
            }
        }

        export class Circular {
            /**
             * 缓动函数入口，表示从 0 到最大值的缓动（开始慢加速，后面变快）
             * @param t 当前时间
             * @param d 缓动总时间
             */
            public static easeIn(t: number, d: number) {
                return -(Math.sqrt(1 - (t /= d) * t) - 1);
            }

            /**
             * 缓动函数出口，表示从最大值到 0 的缓动（开始快减速，后面变慢）
             * @param t 当前时间
             * @param d 缓动总时间
             */
            public static easeOut(t: number, d: number) {
                return Math.sqrt(1 - (t = t / d - 1) * t);
            }

            /**
             * 缓动函数入口和出口，表示从 0 到最大值再到 0 的缓动（先慢加速，后面快减速）
             * @param t 当前时间
             * @param d 缓动总时间
             */
            public static easeInOut(t: number, d: number) {
                if ((t /= d / 2) < 1)
                    return -0.5 * (Math.sqrt(1 - t * t) - 1);
                return 0.5 * (Math.sqrt(1 - (t -= 2) * t) + 1);
            }
        }

        export class Cubic {
            /**
             * easeIn方法提供了一个以慢速开始，然后逐渐加速的缓动函数。
             * @param t 当前时间，动画已经持续的时间，范围在0到d之间，其中d是动画的总时间。
             * @param d 动画的总时间，即动画将从开始到结束的持续时间。
             * @returns 根据动画的当前时间计算出的位置值，该位置值在0到1之间。
             */
            public static easeIn(t: number, d: number) {
                return (t /= d) * t * t;
            }

            /**
             * easeOut方法提供了一个以快速开始，然后逐渐减速的缓动函数。
             * @param t 当前时间，动画已经持续的时间，范围在0到d之间，其中d是动画的总时间。
             * @param d 动画的总时间，即动画将从开始到结束的持续时间。
             * @returns 根据动画的当前时间计算出的位置值，该位置值在0到1之间。
             */
            public static easeOut(t: number, d: number) {
                return ((t = t / d - 1) * t * t + 1);
            }

            /**
             * easeInOut方法提供了一个慢速开始，然后加速，然后减速的缓动函数。
             * @param t 当前时间，动画已经持续的时间，范围在0到d之间，其中d是动画的总时间。
             * @param d 动画的总时间，即动画将从开始到结束的持续时间。
             * @returns 根据动画的当前时间计算出的位置值，该位置值在0到1之间。
             */
            public static easeInOut(t: number, d: number) {
                if ((t /= d / 2) < 1)
                    return 0.5 * t * t * t;
                return 0.5 * ((t -= 2) * t * t + 2);
            }
        }

        export class Elastic {
            /**
             * 弹性函数的 easeIn 版本
             * @param t - 已经经过的时间
             * @param d - 动画的总时间
             * @returns 经过缓动函数计算后的值
             */
            public static easeIn(t: number, d: number): number {
                if (t === 0) return 0;
                if ((t /= d) === 1) return 1;
                const p = d * 0.3;
                const s = p / 4;
                return -1 * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p);
            }

            /**
             * 弹性函数的 easeOut 版本
             * @param t - 已经经过的时间
             * @param d - 动画的总时间
             * @returns 经过缓动函数计算后的值
             */
            public static easeOut(t: number, d: number): number {
                if (t === 0) return 0;
                if ((t /= d) === 1) return 1;
                const p = d * 0.3;
                const s = p / 4;
                return 1 * Math.pow(2, -10 * t) * Math.sin((t * d - s) * (2 * Math.PI) / p) + 1;
            }

            /**
             * 弹性函数的 easeInOut 版本
             * @param t - 已经经过的时间
             * @param d - 动画的总时间
             * @returns 经过缓动函数计算后的值
             */
            public static easeInOut(t: number, d: number): number {
                if (t === 0) return 0;
                if ((t /= d / 2) === 2) return 1;
                const p = d * (0.3 * 1.5);
                const s = p / 4;
                if (t < 1) {
                    return (
                        -0.5 *
                        Math.pow(2, 10 * (t -= 1)) *
                        Math.sin((t * d - s) * (2 * Math.PI) / p)
                    );
                }
                return (
                    Math.pow(2, -10 * (t -= 1)) *
                    Math.sin((t * d - s) * (2 * Math.PI) / p) *
                    0.5 +
                    1
                );
            }

            /**
             * 弹性函数的 punch 版本
             * @param t - 已经经过的时间
             * @param d - 动画的总时间
             * @returns 经过缓动函数计算后的值
             */
            public static punch(t: number, d: number): number {
                if (t === 0) return 0;
                if ((t /= d) === 1) return 0;
                const p = 0.3;
                return Math.pow(2, -10 * t) * Math.sin(t * (2 * Math.PI) / p);
            }
        }


        export class Exponential {
            /**
             * Exponential 缓动函数 - easeIn
             * @param t 当前时间
             * @param d 持续时间
             * @returns 缓动值
             */
            public static easeIn(t: number, d: number) {
                return (t == 0) ? 0 : Math.pow(2, 10 * (t / d - 1));
            }

            /**
             * Exponential 缓动函数 - easeOut
             * @param t 当前时间
             * @param d 持续时间
             * @returns 缓动值
             */
            public static easeOut(t: number, d: number) {
                return t == d ? 1 : (-Math.pow(2, -10 * t / d) + 1);
            }

            /**
             * Exponential 缓动函数 - easeInOut
             * @param t 当前时间
             * @param d 持续时间
             * @returns 缓动值
             */
            public static easeInOut(t: number, d: number) {
                if (t == 0)
                    return 0;

                if (t == d)
                    return 1;

                if ((t /= d / 2) < 1) {
                    return 0.5 * Math.pow(2, 10 * (t - 1));
                }
                return 0.5 * (-Math.pow(2, -10 * --t) + 2);
            }
        }


        export class Quartic {
            /**
             * Quartic 缓动函数的 easeIn 版本
             * @param t 当前时间
             * @param d 持续时间
             * @returns 根据当前时间计算出的值
             */
            public static easeIn(t: number, d: number): number {
                t /= d;
                return t * t * t * t;
            }

            /**
             * Quartic 缓动函数的 easeOut 版本
             * @param t 当前时间
             * @param d 持续时间
             * @returns 根据当前时间计算出的值
             */
            public static easeOut(t: number, d: number): number {
                t = t / d - 1;
                return -1 * (t * t * t * t - 1);
            }

            /**
             * Quartic 缓动函数的 easeInOut 版本
             * @param t 当前时间
             * @param d 持续时间
             * @returns 根据当前时间计算出的值
             */
            public static easeInOut(t: number, d: number): number {
                t /= d / 2;
                if (t < 1)
                    return 0.5 * t * t * t * t;

                t -= 2;
                return -0.5 * (t * t * t * t - 2);
            }
        }

        /**
         * Quintic 类提供了三种 Quintic 缓动函数
         */
        export class Quintic {
            /**
             * 缓动函数，具有 Quintic easeIn 效果
             * @param t 当前时间（单位：毫秒）
             * @param d 持续时间（单位：毫秒）
             * @returns 缓动值
             */
            public static easeIn(t: number, d: number): number {
                return (t /= d) * t * t * t * t;
            }

            /**
             * 缓动函数，具有 Quintic easeOut 效果
             * @param t 当前时间（单位：毫秒）
             * @param d 持续时间（单位：毫秒）
             * @returns 缓动值
             */
            public static easeOut(t: number, d: number): number {
                return ((t = t / d - 1) * t * t * t * t + 1);
            }

            /**
             * 缓动函数，具有 Quintic easeInOut 效果
             * @param t 当前时间（单位：毫秒）
             * @param d 持续时间（单位：毫秒）
             * @returns 缓动值
             */
            public static easeInOut(t: number, d: number): number {
                if ((t /= d / 2) < 1) {
                    return 0.5 * t * t * t * t * t;
                } else {
                    return 0.5 * ((t -= 2) * t * t * t * t + 2);
                }
            }
        }


        export class Sinusoidal {
            /**
             * Sinusoidal 类的缓动入方法。
             * @param t 当前时间（单位：毫秒）
             * @param d 持续时间（单位：毫秒）
             * @returns 介于 0 和 1 之间的数字，表示当前时间的值
             */
            public static easeIn(t: number, d: number) {
                // 通过 cos 函数计算出当前时间对应的值
                return -1 * Math.cos(t / d * (Math.PI / 2)) + 1;
            }

            /**
             * Sinusoidal 类的缓动出方法。
             * @param t 当前时间（单位：毫秒）
             * @param d 持续时间（单位：毫秒）
             * @returns 介于 0 和 1 之间的数字，表示当前时间的值
             */
            public static easeOut(t: number, d: number) {
                // 通过 sin 函数计算出当前时间对应的值
                return Math.sin(t / d * (Math.PI / 2));
            }

            /**
             * Sinusoidal 类的缓动入出方法。
             * @param t 当前时间（单位：毫秒）
             * @param d 持续时间（单位：毫秒）
             * @returns 介于 0 和 1 之间的数字，表示当前时间的值
             */
            public static easeInOut(t: number, d: number) {
                // 通过 cos 函数计算出当前时间对应的值
                return -0.5 * (Math.cos(Math.PI * t / d) - 1);
            }
        }

    }
}