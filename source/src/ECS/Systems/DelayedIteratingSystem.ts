///<reference path="./EntitySystem.ts"/>
module es {
    /**
     * 追踪每个实体的冷却时间，当实体的计时器耗尽时进行处理
     * 
     * 一个示例系统将是ExpirationSystem，该系统将在特定生存期后删除实体。 
     * 你不必运行会为每个实体递减timeLeft值的系统
     * 而只需使用此系统在寿命最短的实体时在将来执行
     * 然后重置系统在未来的某一个最短命实体的时间运行
     * 
     * 另一个例子是一个动画系统
     * 你知道什么时候你必须对某个实体进行动画制作，比如300毫秒内。
     * 所以你可以设置系统以300毫秒为单位运行来执行动画
     * 
     * 这将在某些情况下节省CPU周期
     */
    export abstract class DelayedIteratingSystem extends EntitySystem {
        /**
         * 一个实体应被处理的时间
         */
        private delay: number = 0;
        /**
         * 如果系统正在运行，并倒计时延迟
         */
        private running: boolean = false;
        /**
         * 倒计时
         */
        private acc: number = 0;

        constructor(matcher: Matcher) {
            super(matcher);
        }

        protected process(entities: Entity[]) {
            let processed = entities.length;
            if (processed == 0) {
                this.stop();
                return;
            }

            this.delay = Number.MAX_VALUE;
            for (let i = 0; processed > i; i++) {
                let e = entities[i];
                this.processDelta(e, this.acc);
                let remaining = this.getRemainingDelay(e);
                if (remaining <= 0) {
                    this.processExpired(e);
                } else {
                    this.offerDelay(remaining);
                }
            }

            this.acc = 0;
        }

        protected checkProcessing() {
            if (this.running) {
                this.acc += Time.deltaTime;
                return this.acc >= this.delay;
            }
            return false;
        }

        /**
         * 只有当提供的延迟比系统当前计划执行的时间短时，才会重新启动系统。
         * 如果系统已经停止（不运行），那么提供的延迟将被用来重新启动系统，无论其值如何
         * 如果系统已经在倒计时，并且提供的延迟大于剩余时间，系统将忽略它。
         * 如果提供的延迟时间短于剩余时间，系统将重新启动，以提供的延迟时间运行。
         * @param offeredDelay 
         */
        public offerDelay(offeredDelay: number) {
            if (!this.running) {
                this.running = true;
                this.delay = offeredDelay;
            } else {
                this.delay = Math.min(this.delay, offeredDelay);
            }
        }

        /**
         * 处理本系统感兴趣的实体
         * 从实体定义的延迟中抽象出accumulativeDelta
         * @param entity 
         * @param accumulatedDelta 本系统最后一次执行后的delta时间
         */
        protected abstract processDelta(entity: Entity, accumulatedDelta: number);

        protected abstract processExpired(entity: Entity);

        /**
         * 返回该实体处理前的延迟时间
         * @param entity 
         */
        protected abstract getRemainingDelay(entity: Entity): number;

        /**
         * 获取系统被命令处理实体后的初始延迟
         */
        public getInitialTimeDelay() {
            return this.delay;
        }

        /**
         * 获取系统计划运行前的时间
         * 如果系统没有运行，则返回零
         */
        public getRemainingTimeUntilProcessing(): number {
            if (this.running) {
                return this.delay - this.acc;
            }

            return 0;
        }

        /**
         * 检查系统是否正在倒计时处理
         */
        public isRunning(): boolean {
            return this.running;
        }

        /**
         * 停止系统运行，中止当前倒计时
         */
        public stop() {
            this.running = false;
            this.acc = 0;
        }
    }
}