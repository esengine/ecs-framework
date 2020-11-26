module es {
    /**
     * 只向itriggerlistener报告冲突的移动器
     * 该对象将始终移动完整的距离
     */
    export class ProjectileMover extends Component {
        private _tempTriggerList: ITriggerListener[] = [];
        private _collider: Collider;

        public onAddedToEntity() {
            this._collider = this.entity.getComponent<Collider>(Collider);
            if (!this._collider)
                console.warn("ProjectileMover has no Collider. ProjectilMover requires a Collider!");
        }

        /**
         * 移动考虑碰撞的实体
         * @param motion
         */
        public move(motion: Vector2): boolean {
            if (!this._collider)
                return false;

            let didCollide = false;

            // 获取我们在新位置可能发生碰撞的任何东西
            this.entity.position.add(motion);

            // 获取任何可能在新位置发生碰撞的东西
            let neighbors = Physics.boxcastBroadphase(this._collider.bounds, this._collider.collidesWithLayers.value);
            for (let i = 0; i < neighbors.size; i ++){
                let neighbor = neighbors[i];
                if (this._collider.overlaps(neighbor) && neighbor.enabled){
                    didCollide = true;
                    this.notifyTriggerListeners(this._collider, neighbor);
                }
            }

            return didCollide;
        }

        private notifyTriggerListeners(self: Collider, other: Collider) {
            // 通知我们重叠的碰撞器实体上的任何侦听器
            TriggerListenerHelper.getITriggerListener(other.entity, this._tempTriggerList);
            for (let i = 0; i < this._tempTriggerList.length; i++) {
                this._tempTriggerList[i].onTriggerEnter(self, other);
            }
            this._tempTriggerList.length = 0;

            // 通知此实体上的任何侦听器
            TriggerListenerHelper.getITriggerListener(this.entity, this._tempTriggerList);
            for (let i = 0; i < this._tempTriggerList.length; i++) {
                this._tempTriggerList[i].onTriggerEnter(other, self);
            }
            this._tempTriggerList.length = 0;
        }
    }
}
