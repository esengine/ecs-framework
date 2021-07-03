module es {
    export enum LoopType {
        none,
        restartFromBeginning,
        pingpong
    }

    export enum TweenState {
        running,
        paused,
        complete
    }

    export abstract class Tween<T> implements ITweenable, ITween<T> {
        protected _target: ITweenTarget<T>;
        protected _isFromValueOverridden: boolean;
        protected _fromValue: T;
        protected _toValue: T;
        protected _easeType: EaseType;
        protected _shouldRecycleTween: boolean = true;
        protected _isRelative: boolean;
        protected _completionHandler: (tween: ITween<T>) => void;
        protected _loopCompleteHandler: (tween: ITween<T>) => void;
        protected _nextTween: ITweenable;

        protected _tweenState: TweenState = TweenState.complete;
        private _isTimeScaleIndependent: boolean;
        protected _delay: number;
        protected _duration: number;
        protected _timeScale: number = 1;
        protected _elapsedTime: number;

        protected _loopType: LoopType;
        protected _loops: number;
        protected _delayBetweenLoops: number;
        private _isRunningInReverse: boolean;

        public context: any;

        public setEaseType(easeType: EaseType): ITween<T> {
            this._easeType = easeType;
            return this;
        }

        public setDelay(delay: number): ITween<T> {
            this._delay = delay;
            this._elapsedTime = -this._delay;
            return this;
        }

        public setDuration(duration: number): ITween<T> {
            this._duration = duration;
            return this;
        }

        public setTimeScale(timeSclae: number): ITween<T> {
            this._timeScale = timeSclae;
            return this;
        }

        public setIsTimeScaleIndependent(): ITween<T> {
            this._isTimeScaleIndependent = true;
            return this;
        }

        public setCompletionHandler(completeHandler: (tween: ITween<T>) => void): ITween<T> {
            this._completionHandler = completeHandler;
            return this;
        }

        public setLoops(loopType: LoopType, loops: number = 1, delayBetweenLoops: number = 0): ITween<T> {
            this._loopType = loopType;
            this._delayBetweenLoops = delayBetweenLoops;

            if (loops < 0)
                loops = -1;

            if (loopType == LoopType.pingpong)
                loops = loops * 2;

            this._loops = loops;
            return this;
        }

        public setLoopCompletionHanlder(loopCompleteHandler: (tween: ITween<T>) => void): ITween<T> {
            this._loopCompleteHandler = loopCompleteHandler;
            return this;
        }

        public setFrom(from: T): ITween<T> {
            this._isFromValueOverridden = true;
            this._fromValue = from;
            return this;
        }

        public prepareForReuse(from: T, to: T, duration: number): ITween<T> {
            this.initialize(this._target, to, duration);
            return this;
        }

        public setRecycleTween(shouldRecycleTween: boolean): ITween<T> {
            this._shouldRecycleTween = shouldRecycleTween;
            return this;
        }

        public abstract setIsRelative(): ITween<T>;

        public setContext(context): ITween<T> {
            this.context = context;
            return this;
        }

        public setNextTween(nextTween: ITweenable): ITween<T> {
            this._nextTween = nextTween;
            return this;
        }

        public tick(): boolean {
            if (this._tweenState == TweenState.paused)
                return false;

            // 当我们进行循环时，我们会在0和持续时间之间限制数值
            let elapsedTimeExcess = 0;
            if (!this._isRunningInReverse && this._elapsedTime >= this._duration) {
                elapsedTimeExcess = this._elapsedTime - this._duration;
                this._elapsedTime = this._duration;
                this._tweenState = TweenState.complete;
            } else if (this._isRunningInReverse && this._elapsedTime <= 0) {
                elapsedTimeExcess = 0 - this._elapsedTime;
                this._elapsedTime = 0;
                this._tweenState = TweenState.complete;
            }

            // 当我们延迟开始tween的时候，经过的时间会是负数，所以不要更新这个值。
            if (this._elapsedTime >= 0 && this._elapsedTime <= this._duration) {
                this.updateValue();
            }


            // 如果我们有一个loopType，并且我们是Complete（意味着我们达到了0或持续时间）处理循环。
            // handleLooping将采取任何多余的elapsedTime，并将其因子化，并在必要时调用udpateValue来保持tween的完美准确性
            if (this._loopType != LoopType.none && this._tweenState == TweenState.complete && this._loops != 0) {
                this.handleLooping(elapsedTimeExcess);
            }

            let deltaTime = this._isTimeScaleIndependent ? Time.unscaledDeltaTime : Time.deltaTime;
            deltaTime *= this._timeScale;

            // 我们需要减去deltaTime
            if (this._isRunningInReverse)
                this._elapsedTime -= deltaTime;
            else
                this._elapsedTime += deltaTime;

            if (this._tweenState == TweenState.complete) {
                this._completionHandler && this._completionHandler(this);

                // 如果我们有一个nextTween，把它添加到TweenManager中，这样它就可以开始运行了
                if (this._nextTween != null) {
                    this._nextTween.start();
                    this._nextTween = null;
                }

                return true;
            }

            return false;
        }

        public recycleSelf() {
            if (this._shouldRecycleTween) {
                this._target = null;
                this._nextTween = null;
            }
        }

        public isRunning(): boolean {
            return this._tweenState == TweenState.running;
        }

        public start() {
            if (!this._isFromValueOverridden)
                this._fromValue = this._target.getTargetObject();

            if (this._tweenState == TweenState.complete) {
                this._tweenState = TweenState.running;
                TweenManager.addTween(this);
            }
        }

        public pause() {
            this._tweenState = TweenState.paused;
        }

        public resume() {
            this._tweenState = TweenState.running;
        }

        public stop(bringToCompletion: boolean = false) {
            this._tweenState = TweenState.complete;

            if (bringToCompletion) {
                // 如果我们逆向运行，我们在0处结束，否则我们进入持续时间
                this._elapsedTime = this._isRunningInReverse ? 0 : this._duration;
                this._loopType = LoopType.none;
                this._loops = 0;

                // TweenManager将在下一个tick上进行删除处理
            } else {
                TweenManager.removeTween(this);
            }
        }

        public jumpToElapsedTime(elapsedTime) {
            this._elapsedTime = MathHelper.clamp(elapsedTime, 0, this._duration);
            this.updateValue();
        }

        /**
         * 反转当前的tween，如果是向前走，就会向后走，反之亦然
         */
        public reverseTween() {
            this._isRunningInReverse = !this._isRunningInReverse;
        }

        /**
         * 当通过StartCoroutine调用时，这将一直持续到tween完成
         */
        public * waitForCompletion() {
            while (this._tweenState != TweenState.complete)
                yield null;
        }

        public getTargetObject() {
            return this._target.getTargetObject();
        }

        private resetState() {
            this.context = null;
            this._completionHandler = this._loopCompleteHandler = null;
            this._isFromValueOverridden = false;
            this._isTimeScaleIndependent = false;
            this._tweenState = TweenState.complete;

            // TODO: 我认为在没有得到用户同意的情况下，我们绝对不应该从_shouldRecycleTween=false。需要研究和思考
            // this._shouldRecycleTween = true;
            this._isRelative = false;
            this._easeType = TweenManager.defaultEaseType;

            if (this._nextTween != null) {
                this._nextTween.recycleSelf();
                this._nextTween = null;
            }

            this._delay = 0;
            this._duration = 0;
            this._timeScale = 1;
            this._elapsedTime = 0;
            this._loopType = LoopType.none;
            this._delayBetweenLoops = 0;
            this._loops = 0;
            this._isRunningInReverse = false;
        }

        /**
         * 将所有状态重置为默认值，并根据传入的参数设置初始状态。
         * 这个方法作为一个切入点，这样Tween子类就可以调用它，这样tweens就可以被回收。
         * 当回收时，构造函数不会再被调用，所以这个方法封装了构造函数要做的事情
         * @param target 
         * @param to
         * @param duration 
         */
        public initialize(target: ITweenTarget<T>, to: T, duration: number) {
            // 重置状态，以防我们被回收
            this.resetState();

            this._target = target;
            this._toValue = to;
            this._duration = duration;
        }

        /**
         * 处理循环逻辑
         * @param elapsedTimeExcess 
         */
        private handleLooping(elapsedTimeExcess: number) {
            this._loops--;
            if (this._loopType == LoopType.pingpong) {
                this.reverseTween();
            }

            if (this._loopType == LoopType.restartFromBeginning || this._loops % 2 == 0) {
                this._loopCompleteHandler && this._completionHandler(this);
            }

            // 如果我们还有循环要处理，就把我们的状态重置为Running，这样我们就可以继续处理它们了
            if (this._loops != 0) {
                this._tweenState = TweenState.running;

                // 现在，我们需要设置我们的经过时间，并考虑到我们的elapsedTimeExcess
                if (this._loopType == LoopType.restartFromBeginning) {
                    this._elapsedTime = elapsedTimeExcess - this._delayBetweenLoops;
                } else {
                    if (this._isRunningInReverse)
                        this._elapsedTime += this._delayBetweenLoops - elapsedTimeExcess;
                    else
                        this._elapsedTime = elapsedTimeExcess - this._delayBetweenLoops;
                }

                // 如果我们有一个elapsedTimeExcess，并且没有delayBetweenLoops，则更新该值
                if (this._delayBetweenLoops == 0 && elapsedTimeExcess > 0) {
                    this.updateValue();
                }
            }
        }

        protected abstract updateValue();
    }
}