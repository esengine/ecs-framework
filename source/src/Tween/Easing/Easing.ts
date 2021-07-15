module es {
    /**
     * 标准缓和方程通过将b和c参数（起始值和变化值）用0和1替换，然后进行简化。
     * 这样做的目的是为了让我们可以得到一个0 - 1之间的原始值（除了弹性/反弹故意超过界限），然后用这个值来lerp任何东西
     */
    export module Easing {
        export class Linear {
            public static easeNone(t: number, d: number) {
                return t / d;
            }
        }

        export class Quadratic {
            public static easeIn(t: number, d: number) {
                return (t /= d) * t;
            }

            public static easeOut(t: number, d: number) {
                return -1 * (t /= d) * (t - 2);
            }

            public static easeInOut(t: number, d: number) {
                if ((t /= d / 2) < 1)
                    return 0.5 * t * t;
                return -0.5 * ((--t) * (t - 2) - 1);
            }
        }

        export class Back {
            public static easeIn(t: number, d: number) {
                return (t /= d) * t * ((1.70158 + 1) * t - 1.70158);
            }

            public static easeOut(t: number, d: number) {
                return ((t = t / d - 1) * t * ((1.70158 + 1) * t + 1.70158) + 1);
            }

            public static easeInOut(t: number, d: number) {
                let s = 1.70158;
                if ((t /= d / 2) < 1) {
                    return 0.5 * (t * t * (((s *= (1.525)) + 1) * t - s));
                }

                return 0.5 * ((t -= 2) * t * (((s *= (1.525)) + 1) * t + s) + 2);
            }
        }

        export class Bounce {
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

            public static easeIn(t: number, d: number) {
                return 1 - this.easeOut(d - t, d);
            }

            public static easeInOut(t: number, d: number) {
                if (t < d / 2)
                    return this.easeIn(t * 2, d) * 0.5;
                else
                    return this.easeOut(t * 2 - d, d) * 0.5 + 1 * 0.5;
            }
        }

        export class Circular {
            public static easeIn(t: number, d: number) {
                return -(Math.sqrt(1 - (t /= d) * t) - 1);
            }

            public static easeOut(t: number, d: number) {
                return Math.sqrt(1 - (t = t / d - 1) * t);
            }

            public static easeInOut(t: number, d: number) {
                if ((t /= d / 2) < 1)
                    return -0.5 * (Math.sqrt(1 - t * t) - 1);
                return 0.5 * (Math.sqrt(1 - (t -= 2) * t) + 1);
            }
        }

        export class Cubic {
            public static easeIn(t: number, d: number) {
                return (t /= d) * t * t;
            }

            public static easeOut(t: number, d: number) {
                return ((t = t / d - 1) * t * t + 1);
            }

            public static easeInOut(t: number, d: number) {
                if ((t /= d / 2) < 1)
                    return 0.5 * t * t * t;
                return 0.5 * ((t -= 2) * t * t + 2);
            }
        }

        export class Elastic {
            public static easeIn(t: number, d: number) {
                if (t == 0)
                    return 0;

                if ((t /= d) == 1)
                    return 1;

                let p = d * 0.3;
                let s = p / 4;
                return -(1 * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p));
            }

            public static easeOut(t: number, d: number) {
                if (t == 0)
                    return 0;

                if ((t /= d) == 1)
                    return 1;

                let p = d * 0.3;
                let s = p / 4;
                return (1 * Math.pow(2, -10 * t) * Math.sin((t * d - s) * (2 * Math.PI) / p) + 1);
            }

            public static easeInOut(t: number, d: number) {
                if (t == 0)
                    return 0;

                if ((t /= d / 2) == 2)
                    return 1;

                let p = d * (0.3 * 1.5);
                let s = p / 4;
                if (t < 1)
                    return -0.5 * (Math.pow(2, 10 * (t -= 1)) * Math.sin(t * d - s) * (2 * Math.PI) / p);

                return (Math.pow(2, -10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p) * 0.5 + 1);
            }

            public static punch(t: number, d: number) {
                if (t == 0)
                    return 0;

                if ((t /= d) == 1)
                    return 0;

                const p = 0.3;
                return (Math.pow(2, -10 * t) * Math.sin(t * (2 * Math.PI) / p));
            }
        }

        export class Exponential {
            public static easeIn(t: number, d: number) {
                return (t == 0) ? 0 : Math.pow(2, 10 * (t / d - 1));
            }

            public static easeOut(t: number, d: number) {
                return t == d ? 1 : (-Math.pow(2, -10 * t / d) + 1);
            }

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
            public static easeIn(t: number, d: number) {
                return (t /= d) * t * t * t;
            }

            public static easeOut(t: number, d: number) {
                return -1 * ((t = t / d - 1) * t * t * t - 1);
            }

            public static easeInOut(t: number, d: number) {
                t /= d / 2;
                if (t < 1)
                    return 0.5 * t * t * t * t;

                t -= 2;
                return -0.5 * (t * t * t * t - 2);
            }
        }

        export class Quintic {
            public static easeIn(t: number, d: number) {
                return (t /= d) * t * t * t * t;
            }

            public static easeOut(t: number, d: number) {
                return ((t = t / d - 1) * t * t * t * t + 1);
            }

            public static easeInOut(t: number, d: number) {
                if ((t /= d / 2) < 1)
                    return 0.5 * t * t * t * t * t;

                return 0.5 * ((t -= 2) * t * t * t * t + 2);
            }
        }

        export class Sinusoidal {
            public static easeIn(t: number, d: number) {
                return -1 * Math.cos(t / d * (Math.PI / 2)) + 1;
            }

            public static easeOut(t: number, d: number) {
                return Math.sin(t / d * (Math.PI / 2));
            }

            public static easeInOut(t: number, d: number) {
                return -0.5 * (Math.cos(Math.PI * t / d) - 1);
            }
        }
    }
}