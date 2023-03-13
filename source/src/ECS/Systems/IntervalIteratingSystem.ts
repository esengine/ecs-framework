///<reference path="./IntervalSystem.ts"/>
module es {
    /**
     * 定时遍历处理实体的系统，用于按指定的时间间隔遍历并处理感兴趣的实体。
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

        /**
         * 遍历处理实体。
         * @param entities 本系统感兴趣的实体列表
         */
        protected process(entities: Entity[]) {
            entities.forEach(entity => this.processEntity(entity));
        }
    }
}