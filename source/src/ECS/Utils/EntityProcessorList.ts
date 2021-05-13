module es {
    export class EntityProcessorList {
        public _processors: EntitySystem[] = [];

        public add(processor: EntitySystem) {
            this._processors.push(processor);
        }

        public remove(processor: EntitySystem) {
            new es.List(this._processors).remove(processor);
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
            if (this._processors.length == 0)
                return;

            for (let i = 0, s = this._processors.length; i < s; ++ i) {
                this._processors[i].update();
            }
        }

        public lateUpdate() {
            if (this._processors.length == 0)
                return;

            for (let i = 0, s = this._processors.length; i < s; ++ i) {
                this._processors[i].lateUpdate();
            }
        }

        public end() {

        }

        public getProcessor<T extends EntitySystem>(type: new (...args: any[]) => T): T {
            if (this._processors.length == 0)
                return null;

            for (let i = 0, s = this._processors.length; i < s; ++ i) {
                let processor = this._processors[i];
                if (processor instanceof type)
                    return processor as T;
            }

            return null;
        }

        protected notifyEntityChanged(entity: Entity) {
            if (this._processors.length == 0) 
                return;
            
            for (let i = 0, s = this._processors.length; i < s; ++ i) {
                this._processors[i].onChanged(entity);
            }
        }

        protected removeFromProcessors(entity: Entity) {
            if (this._processors.length == 0) 
                return;
            
            for (let i = 0, s = this._processors.length; i < s; ++ i) {
                this._processors[i].remove(entity);
            }
        }
    }
}
