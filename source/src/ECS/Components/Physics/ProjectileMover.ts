module es {
    /**
     * 移动时考虑到碰撞，只用于向任何ITriggerListeners报告。
     * 物体总是会全量移动，所以如果需要的话，由调用者在撞击时销毁它。
     */
    export class ProjectileMover extends Component {
        private _tempTriggerList: ITriggerListener[] = [];
        private _collider: Collider;

        public onAddedToEntity() {
            let collider = null;
            for (let i = 0; i < this.entity.components.buffer.length; i++) {
                let component = this.entity.components.buffer[i];
                if (component instanceof Collider) {
                    collider = component;
                    break;
                }
            }
            this._collider = collider;
            Debug.warnIf(this._collider == null, "ProjectileMover没有Collider。ProjectilMover需要一个Collider!");
        }

        /**
         * 在考虑到碰撞的情况下移动实体
         * @param motion
         */
        public move(motion: Vector2): boolean {
            if (this._collider == null)
                return false;

            let didCollide = false;

            // 获取我们在新的位置上可能会碰撞到的任何东西
            this.entity.position = Vector2.add(this.entity.position, motion);

            // 获取任何可能在新位置发生碰撞的东西
            let neighbors = Physics.boxcastBroadphase(this._collider.bounds, this._collider.collidesWithLayers.value);
            if (neighbors.length > 0)
                for (let i = 0; i < neighbors.length; i ++) {
                    const neighbor = neighbors[i];
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
