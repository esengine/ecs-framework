module es {
    /**
     * 通用ITweenTarget用于所有属性tweens。
     */
    class PropertyTarget<T> implements ITweenTarget<T> {
        protected _target;
        protected _propertyName;

        constructor(target, propertyName: string) {
            this._target = target;
            this._propertyName = propertyName;
        }

        public getTargetObject() {
            return this._target;
        }

        public setTweenedValue(value: T) {
            this._target[this._propertyName] = value;
        }

        public getTweenedValue(): T {
            return this._target[this._propertyName];
        }
    }

    export class PropertyTweens {
        public static NumberPropertyTo(self, memberName: string, to: number, duration: number): ITween<number> {
            let tweenTarget = new PropertyTarget<number>(self, memberName);
            let tween = TweenManager.cacheNumberTweens ? Pool.obtain<NumberTween>(NumberTween) : new NumberTween();
            tween.initialize(tweenTarget, to, duration);

            return tween;
        }

        public static Vector2PropertyTo(self, memeberName: string, to: Vector2, duration: number): ITween<Vector2> {
            let tweenTarget = new PropertyTarget<Vector2>(self, memeberName);
            let tween = TweenManager.cacheVector2Tweens ? Pool.obtain<Vector2Tween>(Vector2Tween) : new Vector2Tween();
            tween.initialize(tweenTarget, to, duration);

            return tween;
        }
    }
}