module es {
    /**
     * 时间管理器，用于管理游戏中的时间相关属性
     */
    export class Time {
        /** 游戏运行的总时间，单位为秒 */
        public static totalTime: number = 0;

        /** deltaTime 的未缩放版本，不受时间尺度的影响 */
        public static unscaledDeltaTime: number = 0;

        /** 前一帧到当前帧的时间增量，按时间刻度进行缩放 */
        public static deltaTime: number = 0;

        /** 时间刻度缩放，可以加快或减慢游戏时间 */
        public static timeScale = 1;

        /** DeltaTime 可以为的最大值，避免游戏出现卡顿情况 */
        public static maxDeltaTime = Number.MAX_VALUE;

        /** 已传递的帧总数 */
        public static frameCount = 0;

        /** 自场景加载以来的总时间，单位为秒 */
        public static timeSinceSceneLoad: number = 0;

        /** 上一次记录的时间，用于计算两次调用 update 之间的时间差 */
        private static _lastTime = -1;

        /**
         * 更新时间管理器
         * @param currentTime 当前时间
         * @param useEngineTime 是否使用引擎时间
         */
        public static update(currentTime: number, useEngineTime: boolean) {
            let dt = 0;

            if (useEngineTime) {
                dt = currentTime;
            } else {
                // 如果当前时间为 -1，则表示使用系统时间
                if (currentTime === -1) {
                    currentTime = Date.now();
                }

                // 如果上一次记录的时间为 -1，则表示当前为第一次调用 update
                if (this._lastTime === -1) {
                    this._lastTime = currentTime;
                }

                // 计算两次调用 update 之间的时间差，并将其转换为秒
                dt = (currentTime - this._lastTime) / 1000;
            }

            // 如果计算得到的时间差超过了最大时间步长，则将其限制为最大时间步长
            if (dt > this.maxDeltaTime) {
                dt = this.maxDeltaTime;
            }

            // 更新时间管理器的各个属性
            this.totalTime += dt;
            this.deltaTime = dt * this.timeScale;
            this.unscaledDeltaTime = dt;
            this.timeSinceSceneLoad += dt;
            this.frameCount++;

            // 记录当前时间，以备下一次调用 update 使用
            this._lastTime = currentTime;
        }


        public static sceneChanged() {
            this.timeSinceSceneLoad = 0;
        }

        /**
         * 检查指定时间间隔是否已过去
         * @param interval 指定时间间隔
         * @returns 是否已过去指定时间间隔
         */
        public static checkEvery(interval: number): boolean {
            // 计算当前时刻所经过的完整时间间隔个数（向下取整）
            const passedIntervals = Math.floor(this.timeSinceSceneLoad / interval);

            // 计算上一帧到当前帧经过的时间所包含的时间间隔个数（向下取整）
            const deltaIntervals = Math.floor(this.deltaTime / interval);

            // 如果当前时刻所经过的时间间隔数比上一帧所经过的时间间隔数多，则说明时间间隔已过去
            return passedIntervals > deltaIntervals;
        }
    }
}
