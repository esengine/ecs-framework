///<reference path="./EntitySystem.ts" />
module es {
    /**
     * 定义一个处理实体的抽象类，继承自 EntitySystem 类。
     * 子类需要实现 processEntity 方法，用于实现具体的实体处理逻辑。
     */
    export abstract class EntityProcessingSystem extends EntitySystem {
        /**
         * 是否启用系统，默认为启用。
         */
        public enabled: boolean = true;

        /**
         * 构造函数，初始化实体匹配器。
         * @param matcher 实体匹配器
         */
        constructor(matcher: Matcher) {
            super(matcher);
        }

        /**
         * 处理单个实体，由子类实现。
         * @param entity 待处理的实体
         */
        public abstract processEntity(entity: Entity): void;

        /**
         * 在晚于 update 的时间更新实体，由子类实现。
         * @param entity 待处理的实体
         */
        public lateProcessEntity(entity: Entity): void {
            // do nothing
        }

        /**
         * 遍历系统的所有实体，逐个进行实体处理。
         * @param entities 实体数组
         */
        protected process(entities: Entity[]) {
            // 如果实体数组为空，则直接返回
            if (entities.length === 0) {
                return;
            }

            // 遍历实体数组，逐个进行实体处理
            for (let i = 0, len = entities.length; i < len; i++) {
                const entity = entities[i];
                this.processEntity(entity);
            }
        }

        /**
         * 在晚于 update 的时间更新实体。
         * @param entities 实体数组
         */
        protected lateProcess(entities: Entity[]) {
            // 如果实体数组为空，则直接返回
            if (entities.length === 0) {
                return;
            }

            // 遍历实体数组，逐个进行实体处理
            for (let i = 0, len = entities.length; i < len; i++) {
                const entity = entities[i];
                this.lateProcessEntity(entity);
            }
        }

        /**
         * 判断系统是否需要进行实体处理。
         * 如果启用了系统，则需要进行实体处理，返回 true；
         * 否则不需要进行实体处理，返回 false。
         */
        protected checkProcessing(): boolean {
            return this.enabled;
        }
    }
}
