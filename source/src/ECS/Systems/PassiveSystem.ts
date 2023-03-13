module es {
    /**
     * 定义一个被动的实体系统，继承自 EntitySystem 类。
     * 被动的实体系统不会对实体进行任何修改，只会被动地接收实体的变化事件。
     */
    export abstract class PassiveSystem extends EntitySystem {
        /**
         * 当实体发生变化时，不进行任何操作。
         * @param entity 发生变化的实体
         */
        public onChanged(entity: Entity) { }

        /**
         * 不进行任何处理，只进行开始和结束计时。
         * @param entities 实体数组，未被使用
         */
        protected process(entities: Entity[]) {
            // 调用 begin 和 end 方法，开始和结束计时
            this.begin();
            this.end();
        }
    }
}
