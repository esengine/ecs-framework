module es {
    class PropertyTarget<T> implements ITweenTarget<T> {
        protected _target: any; // 属性动画的目标对象
        protected _propertyName: string; // 属性名

        /**
         * @param target 属性动画的目标对象
         * @param propertyName 属性名
         */
        constructor(target: any, propertyName: string) {
            this._target = target;
            this._propertyName = propertyName;
        }

        public getTargetObject(): any {
            return this._target;
        }

        public setTweenedValue(value: T) {
            // 将属性动画的目标对象的属性值设置为动画的当前值
            this._target[this._propertyName] = value;
        }

        public getTweenedValue(): T {
            // 获取属性动画的目标对象的属性值
            return this._target[this._propertyName];
        }
    }

    /**
     * 属性动画工具类
     */
    export class PropertyTweens {
        /**
         * 创建一个属性为number类型的动画对象
         * @param self 属性动画的目标对象
         * @param memberName 属性名
         * @param to 动画结束时的属性值
         * @param duration 动画时长
         */
        public static NumberPropertyTo(self: any, memberName: string, to: number, duration: number): ITween<number> {
            let tweenTarget = new PropertyTarget<number>(self, memberName);
            let tween = TweenManager.cacheNumberTweens ? Pool.obtain<NumberTween>(NumberTween) : new NumberTween();
            tween.initialize(tweenTarget, to, duration);

            return tween;
        }

        /**
         * 创建一个属性为Vector2类型的动画对象
         * @param self 属性动画的目标对象
         * @param memberName 属性名
         * @param to 动画结束时的属性值
         * @param duration 动画时长
         */
        public static Vector2PropertyTo(self: any, memberName: string, to: Vector2, duration: number): ITween<Vector2> {
            let tweenTarget = new PropertyTarget<Vector2>(self, memberName);
            let tween = TweenManager.cacheVector2Tweens ? Pool.obtain<Vector2Tween>(Vector2Tween) : new Vector2Tween();
            tween.initialize(tweenTarget, to, duration);

            return tween;
        }
    }
}