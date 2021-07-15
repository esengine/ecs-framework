///<reference path="./Tween.ts"/>
module es {
    export class NumberTween extends Tween<number> {
        public static create(): NumberTween {
            return TweenManager.cacheNumberTweens ? Pool.obtain(NumberTween) : new NumberTween();
        }

        constructor(target?: ITweenTarget<number>, to?: number, duration?: number) {
            super();
            this.initialize(target, to, duration);
        }

        public setIsRelative(): ITween<number> {
            this._isRelative = true;
            this._toValue += this._fromValue;
            return this;
        }

        protected updateValue() {
            this._target.setTweenedValue(Lerps.ease(this._easeType, this._fromValue, this._toValue, this._elapsedTime, this._duration));
        }

        public recycleSelf() {
            super.recycleSelf();

            if (this._shouldRecycleTween && TweenManager.cacheNumberTweens)
                Pool.free(this);
        }
    }

    export class Vector2Tween extends Tween<Vector2> {
        public static create(): Vector2Tween {
            return TweenManager.cacheVector2Tweens ? Pool.obtain(Vector2Tween) : new Vector2Tween();
        }

        constructor(target?: ITweenTarget<Vector2>, to?: Vector2, duration?: number) {
            super();
            this.initialize(target, to, duration);
        }

        public setIsRelative(): ITween<Vector2> {
            this._isRelative = true;
            this._toValue.add(this._fromValue);
            return this;
        }

        protected updateValue() {
            this._target.setTweenedValue(Lerps.ease(this._easeType, this._fromValue, this._toValue, this._elapsedTime, this._duration));
        }

        public recycleSelf() {
            super.recycleSelf();

            if (this._shouldRecycleTween && TweenManager.cacheVector2Tweens)
                Pool.free(this);
        }
    }

    export class RectangleTween extends Tween<Rectangle> {
        public static create(): RectangleTween {
            return TweenManager.cacheRectTweens ? Pool.obtain(RectangleTween) : new RectangleTween();
        }

        constructor(target?: ITweenTarget<Rectangle>, to?: Rectangle, duration?: number) {
            super();
            this.initialize(target, to, duration);
        }

        public setIsRelative(): ITween<Rectangle> {
            this._isRelative = true;
            this._toValue = new Rectangle(
                this._toValue.x + this._fromValue.x,
                this._toValue.y + this._fromValue.y,
                this._toValue.width + this._fromValue.width,
                this._toValue.height + this._fromValue.height);

            return this;
        }

        protected updateValue() {
            this._target.setTweenedValue(Lerps.ease(this._easeType, this._fromValue, this._toValue, this._elapsedTime, this._duration));
        }

        public recycleSelf() {
            super.recycleSelf();

            if (this._shouldRecycleTween && TweenManager.cacheRectTweens)
                Pool.free(this);
        }
    }

    export class ColorTween extends Tween<Color> {
        public static create() : ColorTween {
            return TweenManager.cacheColorTweens ? Pool.obtain(ColorTween) : new ColorTween();

        }

        constructor(target?: ITweenTarget<Color>, to?: Color, duration?: number) {
            super();

            this.initialize(target, to, duration);
        }

        public setIsRelative() {
            this._isRelative = true;
            this._toValue.r += this._fromValue.r;
            this._toValue.g += this._fromValue.g;
            this._toValue.b += this._fromValue.b;
            this._toValue.a += this._fromValue.a;
            return this;
        }

        protected updateValue() {
            this._target.setTweenedValue(Lerps.ease(this._easeType, this._fromValue as any, this._toValue as any, this._elapsedTime, this._duration));
        }
    }
}