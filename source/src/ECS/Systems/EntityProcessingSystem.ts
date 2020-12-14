///<reference path="./EntitySystem.ts" />
module es {
    /**
     * 基本实体处理系统。将其用作处理具有特定组件的许多实体的基础
     * 
     * 按实体引用遍历实体订阅成员实体的系统
     * 当你需要处理与Matcher相匹配的实体，并且你更喜欢使用Entity的时候，可以使用这个功能。
     */
    export abstract class EntityProcessingSystem extends EntitySystem {
        constructor(matcher: Matcher) {
            super(matcher);
        }


        /**
         * 处理特定的实体
         * @param entity
         */
        public abstract processEntity(entity: Entity);

        public lateProcessEntity(entity: Entity) {

        }

        /**
         * 遍历这个系统的所有实体并逐个处理它们
         * @param entities
         */
        protected process(entities: Entity[]) {
            entities.forEach(entity => this.processEntity(entity));
        }

        protected lateProcess(entities: Entity[]) {
            entities.forEach(entity => this.lateProcessEntity(entity));
        }
    }
}
