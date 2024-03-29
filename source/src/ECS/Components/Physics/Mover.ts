module es {
    /**
     * 辅助类说明了一种处理移动的方法，它考虑了包括触发器在内的所有冲突。
     * ITriggerListener接口用于管理对移动过程中违反的任何触发器的回调。
     * 一个物体只能通过移动器移动。要正确报告触发器的move方法。
     *
     * 请注意，多个移动者相互交互将多次调用ITriggerListener。
     */
    export class Mover extends Component {
        private _triggerHelper: ColliderTriggerHelper;

        public onAddedToEntity() {
            this._triggerHelper = new ColliderTriggerHelper(this.entity);
        }

        /**
         * 计算修改运动矢量的运动，以考虑移动时可能发生的碰撞
         * @param motion
         * @param collisionResult
         */
        public calculateMovement(motion: Vector2, collisionResult: Out<CollisionResult>): boolean {
            collisionResult.value = new CollisionResult();

            let collider = null;
            if (this.entity.components.buffer.length > 0)
                for (let i = 0; i < this.entity.components.buffer.length; i++) {
                    let component = this.entity.components.buffer[i];
                    if (component instanceof Collider) {
                        collider = component;
                        break;
                    }
                }

            if (collider == null || this._triggerHelper == null) {
                return false;
            }

            // 移动所有的非触发碰撞器并获得最近的碰撞
            let colliders: Collider[] = [];
            if (this.entity.components.buffer.length > 0)
                for (let i = 0; i < this.entity.components.buffer.length; i ++) {
                    let component = this.entity.components.buffer[i];
                    if (component instanceof Collider) {
                        colliders.push(component);
                    }
                }


            if (colliders.length > 0) {
                for (let i = 0; i < colliders.length; i++) {
                    let collider = colliders[i];
    
                    // 不检测触发器 在我们移动后会重新访问它
                    if (collider.isTrigger)
                        continue;
    
                    // 获取我们在新位置可能发生碰撞的任何东西
                    let bounds = collider.bounds;
                    bounds.x += motion.x;
                    bounds.y += motion.y;
                    let neighbors = Physics.boxcastBroadphaseExcludingSelf(collider, bounds, collider.collidesWithLayers.value);
    
                    if (neighbors.length > 0) {
                        for (let i = 0; i < neighbors.length; i ++) {
                            const neighbor = neighbors[i];
                            // 不检测触发器
                            if (neighbor.isTrigger)
                                return;
        
                            let _internalcollisionResult = new Out<CollisionResult>();
                            if (collider.collidesWith(neighbor, motion, _internalcollisionResult)) {
                                // 如果碰撞 则退回之前的移动量
                                motion.subEqual(_internalcollisionResult.value.minimumTranslationVector);
                                // 如果我们碰到多个对象，为了简单起见，只取第一个。
                                if (_internalcollisionResult.value.collider != null) {
                                    collisionResult.value.collider = _internalcollisionResult.value.collider;
                                    collisionResult.value.minimumTranslationVector = _internalcollisionResult.value.minimumTranslationVector;
                                    collisionResult.value.normal = _internalcollisionResult.value.normal;
                                    collisionResult.value.point = _internalcollisionResult.value.point;
                                }
                            }
                        }
                    }
                }
            }
            ListPool.free(Collider, colliders);

            return collisionResult.value.collider != null;
        }

        /**
         *  将calculatemomovement应用到实体并更新triggerHelper
         * @param motion
         */
        public applyMovement(motion: Vector2) {
            // 移动实体到它的新位置，如果我们有一个碰撞，否则移动全部数量。当碰撞发生时，运动被更新
            this.entity.position = Vector2.add(this.entity.position, motion);

            // 对所有是触发器的碰撞器与所有宽相位碰撞器进行重叠检查。任何重叠都会导致触发事件。
            if (this._triggerHelper)
                this._triggerHelper.update();
        }

        /**
         * 通过调用calculateMovement和applyMovement来移动考虑碰撞的实体;
         * @param motion
         * @param collisionResult
         */
        public move(motion: Vector2, collisionResult: Out<CollisionResult>) {
            this.calculateMovement(motion, collisionResult);
            this.applyMovement(motion);
            return collisionResult.value.collider != null;
        }
    }
}
