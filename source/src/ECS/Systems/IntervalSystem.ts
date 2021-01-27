module es {
    /**
     * 实体系统以一定的时间间隔进行处理
     */
    export abstract class IntervalSystem extends EntitySystem {
        /**
         * 累积增量以跟踪间隔 
         */
        protected acc: number = 0;
        /**
         * 更新之间需要等待多长时间
         */
        private readonly interval: number = 0;
        private intervalDelta: number = 0;

        constructor(matcher: Matcher, interval: number) {
            super(matcher);
            this.interval = interval;
        }

        protected checkProcessing() {
            this.acc += Time.deltaTime;
            if (this.acc >= this.interval) {
                this.acc -= this.interval;
                this.intervalDelta = (this.acc - this.intervalDelta);

                return true;
            }

            return false;
        }

        /**
         * 获取本系统上次处理后的实际delta值
         */
        protected getIntervalDelta() {
            return this.interval + this.intervalDelta;
        }
    }
}