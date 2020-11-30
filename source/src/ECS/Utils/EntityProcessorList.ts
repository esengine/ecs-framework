module es {
    export class EntityProcessorList {
        protected _processors: EntitySystem[] = [];

        public add(processor: EntitySystem) {
            this._processors.push(processor);
        }

        public remove(processor: EntitySystem) {
            new linq.List(this._processors).remove(processor);
        }

        public onComponentAdded(entity: Entity) {
            this.notifyEntityChanged(entity);
        }

        public onComponentRemoved(entity: Entity) {
            this.notifyEntityChanged(entity);
        }

        public onEntityAdded(entity: Entity) {
            this.notifyEntityChanged(entity);
        }

        public onEntityRemoved(entity: Entity) {
            this.removeFromProcessors(entity);
        }

        public begin() {

        }

        public update() {
            for (let i = 0; i < this._processors.length; i++) {
                this._processors[i].update();
            }
        }

        public lateUpdate() {
            for (let i = 0; i < this._processors.length; i++) {
                this._processors[i].lateUpdate();
            }
        }

        public end() {

        }

        public getProcessor<T extends EntitySystem>(): T {
            for (let i = 0; i < this._processors.length; i++) {
                let processor = this._processors[i];
                if (processor instanceof EntitySystem)
                    return processor as T;
            }

            return null;
        }

        protected notifyEntityChanged(entity: Entity) {
            for (let i = 0; i < this._processors.length; i++) {
                this._processors[i].onChanged(entity);
            }
        }

        protected removeFromProcessors(entity: Entity) {
            for (let i = 0; i < this._processors.length; i++) {
                this._processors[i].remove(entity);
            }
        }
    }
}
