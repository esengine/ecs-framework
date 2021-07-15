///<reference path="./Tweens.ts"/>
module es {
    /**
     * 对任何与Transform相关的属性tweens都是有用的枚举
     */
    export enum TransformTargetType {
        position,
        localPosition,
        scale,
        localScale,
        rotationDegrees,
        localRotationDegrees,
    }

    /**
     * 这是一个特殊的情况，因为Transform是迄今为止最被ween的对象。
     * 我们将Tween和ITweenTarget封装在一个单一的、可缓存的类中
     */
    export class TransformVector2Tween extends Vector2Tween implements ITweenTarget<Vector2> {
        private _transform: Transform;
        private _targetType: TransformTargetType;

        public setTweenedValue(value: Vector2) {
            switch (this._targetType) {
                case TransformTargetType.position:
                    this._transform.position = value;
                    break;
                case TransformTargetType.localPosition:
                    this._transform.localPosition = value;
                    break;
                case TransformTargetType.scale:
                    this._transform.scale = value;
                    break;
                case TransformTargetType.localScale:
                    this._transform.localScale = value;
                    break;
                case TransformTargetType.rotationDegrees:
                    this._transform.rotationDegrees = value.x;
                case TransformTargetType.localRotationDegrees:
                    this._transform.localRotationDegrees = value.x;
                    break;
            }
        }

        public getTweenedValue(): Vector2 {
            switch (this._targetType) {
                case TransformTargetType.position:
                    return this._transform.position;
                case TransformTargetType.localPosition:
                    return this._transform.localPosition;
                case TransformTargetType.scale:
                    return this._transform.scale;
                case TransformTargetType.localScale:
                    return this._transform.localScale;
                case TransformTargetType.rotationDegrees:
                    return new Vector2(this._transform.rotationDegrees, this._transform.rotationDegrees);
                case TransformTargetType.localRotationDegrees:
                    return new Vector2(this._transform.localRotationDegrees, 0);
            }
        }

        public getTargetObject() {
            return this._transform;
        }

        public setTargetAndType(transform: Transform, targetType: TransformTargetType) {
            this._transform = transform;
            this._targetType = targetType;
        }

        protected updateValue() {
            // 非相对角勒普的特殊情况，使他们采取尽可能短的旋转
            if ((this._targetType == TransformTargetType.rotationDegrees ||
                this._targetType == TransformTargetType.localRotationDegrees) && !this._isRelative) {
                this.setTweenedValue(Lerps.easeAngle(this._easeType, this._fromValue, this._toValue, this._elapsedTime, this._duration));
            } else {
                this.setTweenedValue(Lerps.ease(this._easeType, this._fromValue, this._toValue, this._elapsedTime, this._duration));
            }
        }

        public recycleSelf() {
            if (this._shouldRecycleTween) {
                this._target = null;
                this._nextTween = null;
                this._transform = null;
                Pool.free(this);
            }
        }
    }
}