module es {
    /**
    * `AbstractTweenable` 是一个抽象类，实现了 `ITweenable` 接口。
    * 这个类提供了 `start`、`pause`、`resume` 和 `stop` 等方法，
    * 并且具有判断动画是否运行的方法 `isRunning`。
    * 它还有一个 `tick` 方法，子类需要根据自己的需要实现这个方法。
    *
    * `AbstractTweenable` 在完成后往往会被保留下来， `_isCurrentlyManagedByTweenManager` 标志可以让它们知道自己当前是否被 `TweenManager` 监控着，
    * 以便在必要时可以重新添加自己。
    */
    export abstract class AbstractTweenable implements ITweenable {
        readonly discriminator = "ITweenable";
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