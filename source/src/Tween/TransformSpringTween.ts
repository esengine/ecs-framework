module es {
    export class TransformSpringTween extends AbstractTweenable {
        public get targetType() {
            return this._targetType;
        }

        private _transform: Transform;
        private _targetType: TransformTargetType;
        private _targetValue: Vector2;
        private _velocity: Vector2;

        // 阻尼比（dampingRatio）和角频率（angularFrequency）的配置是公开的，以便于在设计时进行调整

        /**
         * 值越低，阻尼越小，值越高，阻尼越大，导致弹簧度越小，应在0.01-1之间，以避免系统不稳定
         */
        public dampingRatio: number = 0.23;
        /**
         * 角频率为2pi(弧度/秒)意味着振荡在一秒钟内完成一个完整的周期，即1Hz.应小于35左右才能保持稳定角频率
         */
        public angularFrequency: number = 25;

        constructor(transform: Transform, targetType: TransformTargetType, targetValue: Vector2) {
            super();
            this._transform = transform;
            this._targetType = targetType;
            this.setTargetValue(targetValue);
        }

        /**
         * 你可以在任何时候调用setTargetValue来重置目标值到一个新的Vector2。
         * 如果你没有调用start来添加spring tween，它会为你调用
         * @param targetValue 
         */
        public setTargetValue(targetValue: Vector2) {
            this._velocity = Vector2.zero;
            this._targetValue = targetValue;

            if (!this._isCurrentlyManagedByTweenManager)
                this.start();
        }

        /**
         * lambda应该是振荡幅度减少50%时的理想持续时间
         * @param lambda 
         */
        public updateDampingRatioWithHalfLife(lambda: number) {
            this.dampingRatio = (-lambda / this.angularFrequency) * Math.log(0.5);
        }

        public tick() {
            if (!this._isPaused)
                this.setTweenedValue(Lerps.fastSpring(this.getCurrentValueOfTweenedTargetType(), this._targetValue, this._velocity,
                    this.dampingRatio, this.angularFrequency));

            return false;
        }

        private setTweenedValue(value: Vector2) {
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

        private getCurrentValueOfTweenedTargetType() {
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
                    return new Vector2(this._transform.rotationDegrees);
                case TransformTargetType.localRotationDegrees:
                    return new Vector2(this._transform.localRotationDegrees, 0);
                default:
                    return Vector2.zero;
            }
        }
    }
}