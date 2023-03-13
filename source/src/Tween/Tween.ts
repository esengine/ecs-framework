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
        readonly discriminator: "ITweenControl";
        protected _target: ITweenTarget<T>; // 一个受Tween控制的对象
        protected _isFromValueOverridden: boolean; // 一个标志位，指示是否覆盖了FromValue
        protected _fromValue: T; // 起始值
        protected _toValue: T; // 结束值
        protected _easeType: EaseType; // 缓动类型
        protected _shouldRecycleTween: boolean = true; // 标志位，表示Tween执行完毕后是否要回收Tween实例
        protected _isRelative: boolean; // 标志位，表示Tween是否是相对值
        protected _completionHandler: (tween: ITween<T>) => void; // Tween完成时的回调函数
        protected _loopCompleteHandler: (tween: ITween<T>) => void; // Tween循环完成时的回调函数
        protected _nextTween: ITweenable; // 用于在Tween完成后启动下一个Tween的属性

        protected _tweenState: TweenState = TweenState.complete; // 当前Tween的状态
        private _isTimeScaleIndependent: boolean; // 标志位，表示Tween是否与TimeScale无关
        protected _delay: number; // 延迟时间
        protected _duration: number; // Tween执行时间
        protected _timeScale: number = 1; // 时间缩放系数
        protected _elapsedTime: number; // 经过的时间

        protected _loopType: LoopType; // 循环类型
        protected _loops: number; // 循环次数
        protected _delayBetweenLoops: number; // 循环之间的延迟时间
        private _isRunningInReverse: boolean; // 标志位，表示Tween是否以相反方向运行

        public context: any; // 任意类型的属性，用于存储Tween的上下文信息

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
            // 如果Tween处于暂停状态，则直接返回false
            if (this._tweenState == TweenState.paused)
                return false;

            // 计算多余的时间
            let elapsedTimeExcess = this.calculateElapsedTimeExcess();

            // 如果Tween处于有效时间范围内，则更新Tween值
            if (this._elapsedTime >= 0 && this._elapsedTime <= this._duration) {
                this.updateValue();
            }

            // 如果Tween已经完成，且需要进行循环，则处理循环
            if (this._loopType != LoopType.none && this._tweenState == TweenState.complete && this._loops != 0) {
                this.handleLooping(elapsedTimeExcess);
            }

            // 计算deltaTime并更新_elapsedTime
            let deltaTime = this.calculateDeltaTime();
            this.updateElapsedTime(deltaTime);

            // 如果Tween已经完成，则处理完成事件并启动下一个Tween（如果有的话）
            if (this._tweenState == TweenState.complete) {
                this.handleCompletion();

                return true;
            }

            return false;
        }

        // 计算多余的时间
        private calculateElapsedTimeExcess(): number {
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

            return elapsedTimeExcess;
        }

        // 计算deltaTime
        private calculateDeltaTime(): number {
            let deltaTime = this._isTimeScaleIndependent ? Time.unscaledDeltaTime : Time.deltaTime;
            deltaTime *= this._timeScale;

            // 如果Tween是运行在反向模式下，则需要将deltaTime取反
            if (this._isRunningInReverse)
                deltaTime = -deltaTime;

            return deltaTime;
        }

        // 更新_elapsedTime
        private updateElapsedTime(deltaTime: number) {
            this._elapsedTime += deltaTime;

            // 如果Tween处于反向模式下，则需要将_elapsedTime限制在0和_duration之间
            if (this._isRunningInReverse) {
                this._elapsedTime = Math.max(0, this._elapsedTime);
                this._elapsedTime = Math.min(this._elapsedTime, this._duration);
            }
            // 如果Tween处于正向模式下，则需要将_elapsedTime限制在0和_duration之间
            else {
                this._elapsedTime = Math.min(this._elapsedTime, this._duration);
            }
        }

        // 处理Tween完成事件并启动下一个Tween（如果有的话）
        private handleCompletion() {
            this._completionHandler && this._completionHandler(this);

            // 如果有下一个Tween，则启动它
            if (this._nextTween != null) {
                this._nextTween.start();
                this._nextTween = null;
            }
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
                this._fromValue = this._target.getTweenedValue();

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
        public* waitForCompletion() {
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