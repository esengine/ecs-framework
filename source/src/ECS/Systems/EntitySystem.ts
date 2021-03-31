module es {
    /**
     * 追踪实体的子集，但不实现任何排序或迭代。
     */
    export abstract class EntitySystem {
        private _entities: Entity[] = [];

        constructor(matcher?: Matcher) {
            this._matcher = matcher ? matcher : Matcher.empty();
            this.initialize();
        }

        private _scene: Scene;

        /**
         * 这个系统所属的场景
         */
        public get scene() {
            return this._scene;
        }

        public set scene(value: Scene) {
            this._scene = value;
            this._entities = [];
        }

        private _matcher: Matcher;

        public get matcher() {
            return this._matcher;
        }

        public initialize() {

        }

        public onChanged(entity: Entity) {
            let contains = new es.List(this._entities).contains(entity);
            let interest = this._matcher.isInterestedEntity(entity);

            if (interest && !contains)
                this.add(entity);
            else if (!interest && contains)
                this.remove(entity);
        }

        public add(entity: Entity) {
            this._entities.push(entity);
            this.onAdded(entity);
        }

        public onAdded(entity: Entity) { }

        public remove(entity: Entity) {
            new es.List(this._entities).remove(entity);
            this.onRemoved(entity);
        }

        public onRemoved(entity: Entity) { }

        public update() {
            if (this.checkProcessing()) {
                this.begin();
                this.process(this._entities);
            }
        }

        public lateUpdate() {
            if (this.checkProcessing()) {
                this.lateProcess(this._entities);
                this.end();
            }
        }

        /**
         * 在系统处理开始前调用
         * 在下一个系统开始处理或新的处理回合开始之前（以先到者为准），使用此方法创建的任何实体都不会激活
         */
        protected begin() { }

        protected process(entities: Entity[]) { }

        protected lateProcess(entities: Entity[]) { }

        /**
         * 系统处理完毕后调用
         */
        protected end() { }

        /**
         * 系统是否需要处理
         * 
         * 在启用系统时有用，但仅偶尔需要处理
         * 这只影响处理，不影响事件或订阅列表
         * @returns 如果系统应该处理，则为true，如果不处理则为false。
         */
        protected checkProcessing() {
            return true;
        }
    }
}
