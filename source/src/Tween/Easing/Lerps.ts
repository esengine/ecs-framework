module es {
    /**
     * 一系列静态方法来处理所有常见的tween类型结构，以及它们的unclamped lerps.unclamped lerps对于超过0-1范围的bounce、elastic或其他tweens是必需的
     */
    export class Lerps {
        /**
         * 提供通用的线性插值方法，支持数字、矩形和二维向量类型。
         * @param from 起点值
         * @param to 终点值
         * @param t 插值参数，取值范围[0, 1]
         * @returns 返回两个值的插值结果
         */
        public static lerp(from: number, to: number, t: number): number;
        public static lerp(from: Rectangle, to: Rectangle, t: number): Rectangle;
        public static lerp(from: Vector2, to: Vector2, t: number): Vector2;
        public static lerp(from: any, to: any, t: number) {
            // 判断传入的数据类型，并执行对应的插值逻辑
            if (typeof (from) == "number" && typeof (to) == "number") {
                return from + (to - from) * t;
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

        /**
         * 计算两个向量之间的角度差并使用线性插值函数进行插值
         * @param from 起始向量
         * @param to 目标向量
         * @param t 插值因子
         * @returns 插值后的向量
         */
        public static angleLerp(from: Vector2, to: Vector2, t: number): Vector2 {
            // 计算最短的角差，确保角度在[-180, 180]度之间
            let toMinusFrom = new Vector2(
                MathHelper.deltaAngle(from.x, to.x),
                MathHelper.deltaAngle(from.y, to.y)
            );
            // 使用线性插值函数计算插值后的向量
            return new Vector2(
                from.x + toMinusFrom.x * t,
                from.y + toMinusFrom.y * t
            );
        }

        /**
         * 根据不同类型的数据，使用指定的缓动类型对两个值进行插值
         * @param easeType 缓动类型
         * @param from 起始值
         * @param to 目标值
         * @param t 当前时间（相对于持续时间的百分比）
         * @param duration 持续时间
         * @returns 两个值之间的插值
         */
        public static ease(easeType: EaseType, from: Rectangle, to: Rectangle, t: number, duration: number);
        public static ease(easeType: EaseType, from: Vector2, to: Vector2, t: number, duration: number);
        public static ease(easeType: EaseType, from: number, to: number, t: number, duration: number);
        public static ease(easeType: EaseType, from: any, to: any, t: number, duration: number) {
            // 如果传入的值都是 number 类型，就直接返回两个值之间的线性插值
            if (typeof (from) == 'number' && typeof (to) == "number") {
                return this.lerp(from, to, EaseHelper.ease(easeType, t, duration));
            }

            // 如果传入的值都是 Vector2 类型，就返回两个 Vector2 之间的插值
            if (from instanceof Vector2 && to instanceof Vector2) {
                return this.lerp(from, to, EaseHelper.ease(easeType, t, duration));
            }

            // 如果传入的值都是 Rectangle 类型，就返回两个 Rectangle 之间的插值
            if (from instanceof Rectangle && to instanceof Rectangle) {
                return this.lerp(from, to, EaseHelper.ease(easeType, t, duration));
            }
        }

        /**
         * 通过提供的t值和持续时间使用给定的缓动类型在两个Vector2之间进行角度插值。
         * @param easeType 缓动类型
         * @param from 开始的向量
         * @param to 结束的向量
         * @param t 当前时间在持续时间内的比例
         * @param duration 持续时间
         * @returns 插值后的Vector2值
         */
        public static easeAngle(easeType: EaseType, from: Vector2, to: Vector2, t: number, duration: number): Vector2 {
            return this.angleLerp(from, to, EaseHelper.ease(easeType, t, duration));
        }


        /**
         * 使用快速弹簧算法来实现平滑过渡。返回经过弹簧计算后的当前值。
         * @param currentValue 当前值
         * @param targetValue 目标值
         * @param velocity 当前速度
         * @param dampingRatio 阻尼比例
         * @param angularFrequency 角频率
         */
        public static fastSpring(currentValue: Vector2, targetValue: Vector2, velocity: Vector2,
                                 dampingRatio: number, angularFrequency: number): Vector2 {
            // 计算下一帧的速度
            velocity.add(velocity.scale(-2 * Time.deltaTime * dampingRatio * angularFrequency)
                .add(targetValue.sub(currentValue).scale(Time.deltaTime * angularFrequency * angularFrequency)));
            // 计算下一帧的当前值
            currentValue.add(velocity.scale(Time.deltaTime));
            // 返回计算后的当前值
            return currentValue;
        }
    }
}