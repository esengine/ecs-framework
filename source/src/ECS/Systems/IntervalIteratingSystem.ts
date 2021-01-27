///<reference path="./IntervalSystem.ts"/>
module es {
    /**
     * 每x个ticks处理一个实体的子集
     * 
     * 典型的用法是每隔一定的时间间隔重新生成弹药或生命值
     * 而无需在每个游戏循环中都进行
     * 而是每100毫秒一次或每秒
     */
    export abstract class IntervalIteratingSystem extends IntervalSystem {
        constructor(matcher: Matcher, interval: number) {
            super(matcher, interval);
        }

        /**
         * 处理本系统感兴趣的实体
         * @param entity
         */
        public abstract processEntity(entity: Entity);

        protected process(entities: Entity[]) {
            entities.forEach(entity => this.processEntity(entity));
        }
    }
}