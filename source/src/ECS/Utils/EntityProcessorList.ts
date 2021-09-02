module es {
    export class EntityProcessorList {
        private _processors: EntitySystem[] = [];
        private _orderDirty: boolean = false;
        /** 获取系统列表 */
        public get processors() {
            return this._processors;
        }

        /** 系统数量 */
        public get count() {
            return this._processors.length;
        }

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

            if (this._orderDirty) {
                // 进行排序
                this._processors = this._processors.sort((a, b) => a.updateOrder - b.updateOrder);
                for (let i = 0, s = this._processors.length; i < s; ++ i) {
                    const processor = this._processors[i];
                    processor.setUpdateOrder(i);
                }
                this.clearDirty();
            }

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

        public setDirty() {
            this._orderDirty = true;
        }

        public clearDirty() {
            this._orderDirty = false;
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
