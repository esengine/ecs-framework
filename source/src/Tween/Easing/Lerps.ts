module es {
    /**
     * 一系列静态方法来处理所有常见的tween类型结构，以及它们的unclamped lerps.unclamped lerps对于超过0-1范围的bounce、elastic或其他tweens是必需的
     */
    export class Lerps {
        public static lerp(from: Color, to: Color, t: number);
        public static lerp(from: number, to: number, t: number);
        public static lerp(from: Rectangle, to: Rectangle, t: number);
        public static lerp(from: Vector2, to: Vector2, t: number);
        public static lerp(from: any, to: any, t: number) {
            if (typeof(from) == "number" && typeof(to) == "number") {
                return from + (to - from) * t;
            }

            if (from instanceof Color && to instanceof Color) {
                const t255 = t * 255;
                return new Color(from.r + (to.r - from.r) * t255 / 255, from.g + (to.g - from.g) * t255 / 255,
				    from.b + (to.b - from.b) * t255 / 255, from.a + (to.a - from.a) * t255 / 255)
            }

            if (from instanceof Rectangle && to instanceof Rectangle) {
                return new Rectangle(
                    (from.x + (to.x - from.x) * t),
                    (from.y + (to.x - from.y) * t),
                    (from.width + (to.width - from.width) * t),
                    (from.height + (to.height - from.height) * t)
                );
            }

            if (from instanceof Vector2 && to instanceof Vector2) {
                return new Vector2(from.x + (to.x - from.x) * t, from.y + (to.y - from.y) * t);
            }
        }

        public static angleLerp(from: Vector2, to: Vector2, t: number) {
            // 我们计算这个lerp的最短角差
            let toMinusFrom = new Vector2(MathHelper.deltaAngle(from.x, to.x), MathHelper.deltaAngle(from.y, to.y));
            return new Vector2(from.x + toMinusFrom.x * t, from.y + toMinusFrom.y * t);
        }

        public static ease(easeType: EaseType, from: Rectangle, to: Rectangle, t: number, duration: number);
        public static ease(easeType: EaseType, from: Vector2, to: Vector2, t: number, duration: number);
        public static ease(easeType: EaseType, from: number, to: number, t: number, duration: number);
        public static ease(easeType: EaseType, from: Color, to: Color, t: number, duration: number);
        public static ease(easeType: EaseType, from: any, to: any, t: number, duration: number) {
            if (typeof(from) == 'number' && typeof(to) == "number") {
                return this.lerp(from, to, EaseHelper.ease(easeType, t, duration));
            }

            if (from instanceof Vector2 && to instanceof Vector2) {
                return this.lerp(from, to, EaseHelper.ease(easeType, t, duration));
            }

            if (from instanceof Rectangle && to instanceof Rectangle) {
                return this.lerp(from, to, EaseHelper.ease(easeType, t, duration));
            }

            if (from instanceof Color && to instanceof Color) {
                return this.lerp(from, to, EaseHelper.ease(easeType, t, duration));
            }
        }

        public static easeAngle(easeType: EaseType, from: Vector2, to: Vector2, t: number, duration: number) {
            return this.angleLerp(from, to, EaseHelper.ease(easeType, t, duration));
        }

        /**
         * 使用半隐式欧拉方法。速度较慢，但总是很稳定。见
         * http://allenchou.net/2015/04/game-math-more-on-numeric-springing/
         * @param currentValue 
         * @param targetValue 
         * @param velocity Velocity的引用。如果在两次调用之间改变targetValue，请务必将其重置为0
         * @param dampingRatio 值越低，阻尼越小，值越高，阻尼越大，导致弹簧度越小，应在0.01-1之间，以避免系统不稳定
         * @param angularFrequency 角频率为2pi(弧度/秒)意味着振荡在一秒钟内完成一个完整的周期，即1Hz.应小于35左右才能保持稳定
         */
        public static fastSpring(currentValue: Vector2, targetValue: Vector2, velocity: Vector2,
            dampingRatio: number, angularFrequency: number) {
            velocity.add(velocity.scale(-2 * Time.deltaTime * dampingRatio * angularFrequency)
                .add(targetValue.sub(currentValue).scale(Time.deltaTime * angularFrequency * angularFrequency)));
            currentValue.add(velocity.scale(Time.deltaTime));
            return currentValue;
        }
    }
}