module es {
    /**
     * 执行顺序
     *  - onAddedToEntity
     *  - OnEnabled
     *
     *  删除执行顺序
     *      - onRemovedFromEntity
     */
    export abstract class Component {
        /**
         * 此组件附加的实体
         */
        public entity: Entity;
        /**
         * 更新该组件的时间间隔。这与实体的更新间隔无关。
         */
        public updateInterval: number = 1;

        /**
         * 快速访问 this.entity.transform
         */
        public get transform(): Transform {
            return this.entity.transform;
        }

        private _enabled: boolean = true;

        /**
         * 如果组件和实体都已启用，则为。当启用该组件时，将调用该组件的生命周期方法。状态的改变会导致调用onEnabled/onDisable。
         */
        public get enabled() {
            return this.entity ? this.entity.enabled && this._enabled : this._enabled;
        }

        /**
         * 如果组件和实体都已启用，则为。当启用该组件时，将调用该组件的生命周期方法。状态的改变会导致调用onEnabled/onDisable。
         * @param value
         */
        public set enabled(value: boolean) {
            this.setEnabled(value);
        }

        private _updateOrder = 0;

        /** 更新此实体上组件的顺序 */
        public get updateOrder() {
            return this._updateOrder;
        }

        /** 更新此实体上组件的顺序 */
        public set updateOrder(value: number) {
            this.setUpdateOrder(value);
        }

        /**
         * 当此组件已分配其实体，但尚未添加到实体的活动组件列表时调用。有用的东西，如物理组件，需要访问转换来修改碰撞体的属性。
         */
        public initialize() {
        }

        /**
         * 在提交所有挂起的组件更改后，将该组件添加到场景时调用。此时，设置了实体字段和实体。场景也设定好了。
         */
        public onAddedToEntity() {
        }

        /**
         * 当此组件从其实体中移除时调用。在这里做所有的清理工作。
         */
        public onRemovedFromEntity() {
        }

        /**
         * 当实体的位置改变时调用。这允许组件知道它们由于父实体的移动而移动了。
         * @param comp
         */
        public onEntityTransformChanged(comp: transform.Component) {
        }

        /**
         *当父实体或此组件启用时调用
         */
        public onEnabled() {
        }

        /**
         * 禁用父实体或此组件时调用
         */
        public onDisabled() {
        }

        public setEnabled(isEnabled: boolean) {
            if (this._enabled != isEnabled) {
                this._enabled = isEnabled;

                if (this._enabled) {
                    this.onEnabled();
                } else {
                    this.onDisabled();
                }
            }

            return this;
        }

        public setUpdateOrder(updateOrder: number) {
            if (this._updateOrder != updateOrder) {
                this._updateOrder = updateOrder;
            }

            return this;
        }
    }
}
