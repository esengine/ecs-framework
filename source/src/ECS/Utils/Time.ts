module es {
    /** 提供帧定时信息 */
    export class Time {
        /** deltaTime的未缩放版本。不受时间尺度的影响 */
        public static unscaledDeltaTime;
        /** 前一帧到当前帧的时间增量，按时间刻度进行缩放 */
        public static deltaTime: number = 0;
        /** 时间刻度缩放 */
        public static timeScale = 1;
        /** 已传递的帧总数 */
        public static frameCount = 0;

        private static _lastTime = 0;
        /** 自场景加载以来的总时间 */
        public static _timeSinceSceneLoad;

        public static update(currentTime: number){
            let dt = (currentTime - this._lastTime) / 1000;
            this.deltaTime = dt * this.timeScale;
            this.unscaledDeltaTime = dt;
            this._timeSinceSceneLoad += dt;
            this.frameCount ++;

            this._lastTime = currentTime;
        }

        public static sceneChanged(){
            this._timeSinceSceneLoad = 0;
        }

        /**
         * 允许在间隔检查。只应该使用高于delta的间隔值，否则它将始终返回true。
         * @param interval
         */
        public static checkEvery(interval: number){
            // 我们减去了delta，因为timeSinceSceneLoad已经包含了这个update ticks delta
            return (this._timeSinceSceneLoad / interval) > ((this._timeSinceSceneLoad - this.deltaTime) / interval);
        }
    }
}
