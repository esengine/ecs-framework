///<reference path="./EntitySystem.ts"/>
module es {
    /**
     * 这个类是一个实体系统的基类，其可以被子类继承并在子类中实现具体的实体处理逻辑。
     * 该类提供了实体的添加、删除、更新等基本操作，并支持设置系统的更新时序、检查系统是否需要处理实体、获取系统的场景等方法
     */
    export abstract class DelayedIteratingSystem extends EntitySystem {
        private delay = 0;
        private running = false;
        private acc = 0;

        constructor(matcher: Matcher) {
            super(matcher);
        }

        protected process(entities: Entity[]) {
            const processed = entities.length;

            if (processed === 0) {
                this.stop();
                return;
            }

            this.delay = Number.MAX_VALUE;

            for (let i = 0; i < processed; i++) {
                const entity = entities[i];
                this.processDelta(entity, this.acc);
                const remaining = this.getRemainingDelay(entity);

                if (remaining <= 0) {
                    this.processExpired(entity);
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
         * @param offeredDelay 提供的延迟时间，单位为秒
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

        /**
        * 处理给定实体的延迟时间的一部分，抽象出累积的 Delta 值。
        * @param entity 要处理的实体
        * @param accumulatedDelta 本系统最后一次执行后的累积 delta 时间
        */
        protected abstract processDelta(entity: Entity, accumulatedDelta: number);

        /**
         * 处理已到期的实体。
         * @param entity 要处理的实体
         */
        protected abstract processExpired(entity: Entity);

        /**
         * 获取给定实体剩余的延迟时间。
         * @param entity 要检查的实体
         * @returns 剩余的延迟时间（以秒为单位）
         */
        protected abstract getRemainingDelay(entity: Entity): number;
    }
}