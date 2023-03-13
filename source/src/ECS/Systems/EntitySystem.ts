///<reference path="../../Utils/Collections/HashMap.ts"/>
module es {
    /**
     * 实体系统的基类，用于处理一组实体。
     */
    export abstract class EntitySystem {
        private _entities: Entity[] = [];
        private _updateOrder: number = 0;
        private _startTime = 0;
        private _endTime = 0;
        private _useTime = 0;

        /** 获取系统在当前帧所消耗的时间 仅在debug模式下生效 */
        public get useTime() {
            return this._useTime;
        }

        /**
         * 获取系统的更新时序
         */
        public get updateOrder() {
            return this._updateOrder;
        }

        public set updateOrder(value: number) {
            this.setUpdateOrder(value);
        }

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

        /**
         * 设置更新时序
         * @param order 更新时序
         */
        public setUpdateOrder(order: number) {
            this._updateOrder = order;
            this.scene.entityProcessors.setDirty();
        }

        public initialize() {

        }

        public onChanged(entity: Entity) {
            let contains = !!this._entities.find(e => e.id == entity.id);
            let interest = this._matcher.isInterestedEntity(entity);

            if (interest && !contains)
                this.add(entity);
            else if (!interest && contains)
                this.remove(entity);
        }

        public add(entity: Entity) {
            if (!this._entities.find(e => e.id == entity.id))
                this._entities.push(entity);
            this.onAdded(entity);
        }

        public onAdded(entity: Entity) {
        }

        public remove(entity: Entity) {
            new es.List(this._entities).remove(entity);
            this.onRemoved(entity);
        }

        public onRemoved(entity: Entity) {
        }

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
        protected begin() {
            if (!Core.Instance.debug)
                return;

            this._startTime = Date.now();
        }

        protected process(entities: Entity[]) {
        }

        protected lateProcess(entities: Entity[]) {
        }

        /**
         * 系统处理完毕后调用
         */
        protected end() {
            if (!Core.Instance.debug)
                return;

            this._endTime = Date.now();
            this._useTime = this._endTime - this._startTime;
        }

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
