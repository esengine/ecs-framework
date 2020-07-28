/** 用于协调其他系统的通用系统基类 */
module es {
    export abstract class ProcessingSystem extends EntitySystem {
        public onChanged(entity: Entity){

        }

        protected process(entities: Entity[]){
            this.begin();
            this.processSystem();
            this.end();
        }

        /** 处理我们的系统 每帧调用 */
        public abstract processSystem();
    }
}
