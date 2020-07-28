module es {
    export abstract class PassiveSystem extends EntitySystem {
        public onChanged(entity: Entity) {

        }

        protected process(entities: Entity[]) {
            // 我们用我们自己的不考虑实体的基本实体系统来代替
            this.begin();
            this.end();
        }
    }
}
