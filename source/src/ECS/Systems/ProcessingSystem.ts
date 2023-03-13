module es {
    /**
     * 定义一个处理实体的抽象类，继承自 EntitySystem 类。
     * 子类需要实现 processSystem 方法，用于实现具体的处理逻辑。
     */
    export abstract class ProcessingSystem extends EntitySystem {
        /**
         * 当实体发生变化时，不进行任何操作。
         * @param entity 发生变化的实体
         */
        public onChanged(entity: Entity) { }

        /**
         * 处理实体，每帧调用 processSystem 方法进行处理。
         * @param entities 实体数组，未被使用
         */
        protected process(entities: Entity[]) {
            // 调用 begin 和 end 方法，开始和结束计时
            this.begin();
            // 调用子类实现的 processSystem 方法进行实体处理
            this.processSystem();
            this.end();
        }

        /**
         * 处理实体的具体方法，由子类实现。
         */
        public abstract processSystem(): void;
    }
}
