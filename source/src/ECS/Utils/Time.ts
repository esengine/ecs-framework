module es {
    /** 提供帧定时信息 */
    export class Time {
        /** 游戏运行的总时间 */
        public static totalTime: number = 0;
        /** deltaTime的未缩放版本。不受时间尺度的影响 */
        public static unscaledDeltaTime: number = 0;
        /** 前一帧到当前帧的时间增量，按时间刻度进行缩放 */
        public static deltaTime: number = 0;
        /** 时间刻度缩放 */
        public static timeScale = 1;
        /** DeltaTime可以为的最大值 */
        public static maxDeltaTime = Number.MAX_VALUE;
        /** 已传递的帧总数 */
        public static frameCount = 0;
        /** 自场景加载以来的总时间 */
        public static timeSinceSceneLoad: number = 0;
        private static _lastTime = -1;
        private static _useEngineTime: boolean = false;

        public static update(currentTime: number, useEngineTime: boolean) {
            let dt = 0;
            this._useEngineTime = useEngineTime;
            if (useEngineTime) {
                dt = currentTime;
            } else {
                if (currentTime == -1) {
                    currentTime = Date.now();
                }

                if (this._lastTime == -1)
                    this._lastTime = currentTime;

                dt = (currentTime - this._lastTime) / 1000;
            }
            
            if (dt > this.maxDeltaTime)
                dt = this.maxDeltaTime;
            this.totalTime += dt;
            this.deltaTime = dt * this.timeScale;
            this.unscaledDeltaTime = dt;
            this.timeSinceSceneLoad += dt;
            this.frameCount++;

            this._lastTime = currentTime;
        }

        public static sceneChanged() {
            this.timeSinceSceneLoad = 0;
        }

        /**
         * 用于暂停切换至继续状态
         * 需要将上一次时间重置并重置dt
         */
        public static pauseToResume() {
            if (!this._useEngineTime)
                return;

            this._lastTime = Date.now();
            this.deltaTime = 0;
        }

        /**
         * 允许在间隔检查。只应该使用高于delta的间隔值，否则它将始终返回true。
         * @param interval
         */
        public static checkEvery(interval: number) {
            // 我们减去了delta，因为timeSinceSceneLoad已经包含了这个update ticks delta
            return this.timeSinceSceneLoad / interval > (this.timeSinceSceneLoad - this.deltaTime) / interval;
        }
    }
}
