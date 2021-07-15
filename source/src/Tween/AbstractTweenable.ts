module es {
    /**
     * AbstractTweenable作为你可能想做的任何可以执行的自定义类的基础。
     * 这些类不同于ITweens，因为他们没有实现ITweenT接口。
     * 它只是说一个AbstractTweenable不仅仅是将一个值从开始移动到结束。
     * 它可以做任何需要每帧执行的事情。
     */
    export abstract class AbstractTweenable implements ITweenable {
        protected _isPaused: boolean;

        /**
         * abstractTweenable在完成后往往会被保留下来。
         * 这个标志可以让它们在内部知道自己当前是否被TweenManager盯上了，以便在必要时可以重新添加自己。
         */
        protected _isCurrentlyManagedByTweenManager: boolean;

        public abstract tick(): boolean;

        public recycleSelf() {
        }

        public isRunning(): boolean {
            return this._isCurrentlyManagedByTweenManager && !this._isPaused;
        }

        public start() {
            if (this._isCurrentlyManagedByTweenManager) {
                this._isPaused = false;
                return;
            }

            TweenManager.addTween(this);
            this._isCurrentlyManagedByTweenManager = true;
            this._isPaused = false;
        }

        public pause() {
            this._isPaused = true;
        }

        public resume() {
            this._isPaused = false;
        }

        public stop(bringToCompletion: boolean = false) {
            TweenManager.removeTween(this);
            this._isCurrentlyManagedByTweenManager = false;
            this._isPaused = true;
        }
    }
}