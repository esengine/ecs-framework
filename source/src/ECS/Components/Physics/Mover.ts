/**
 * 辅助类说明了一种处理移动的方法，它考虑了包括触发器在内的所有冲突。
 * ITriggerListener接口用于管理对移动过程中违反的任何触发器的回调。
 * 一个物体只能通过移动器移动。要正确报告触发器的move方法。
 * 
 * 请注意，多个移动者相互交互将多次调用ITriggerListener。
 */
class Mover extends Component {
    private _triggerHelper: ColliderTriggerHelper;

    public onAddedToEntity(){
        this._triggerHelper = new ColliderTriggerHelper(this.entity);
    }

    /**
     * 计算修改运动矢量的运动，以考虑移动时可能发生的碰撞
     * @param motion 
     */
    public calculateMovement(motion: Vector2){
        let collisionResult = new CollisionResult();

        if (!this.entity.getComponent(Collider) || !this._triggerHelper){
            return null;
        }

        let colliders: Collider[] = this.entity.getComponents(Collider);
        for (let i = 0; i < colliders.length; i ++){
            let collider = colliders[i];

            // 不检测触发器
            if (collider.isTrigger)
                continue;

            // 获取我们在新位置可能发生碰撞的任何东西
            let bounds = collider.bounds;
            bounds.x += motion.x;
            bounds.y += motion.y;
            let boxcastResult = Physics.boxcastBroadphaseExcludingSelf(collider, bounds, collider.collidesWithLayers);
            bounds = boxcastResult.bounds;
            let neighbors = boxcastResult.tempHashSet;

            for (let j = 0; j < neighbors.length; j ++){
                let neighbor = neighbors[j];
                // 不检测触发器
                if (neighbor.isTrigger)
                    continue;

                let _internalcollisionResult = collider.collidesWith(neighbor, motion);
                if (_internalcollisionResult){
                    // 如果碰撞 则退回之前的移动量
                    motion = Vector2.subtract(motion, _internalcollisionResult.minimumTranslationVector);

                    // 如果我们碰到多个对象，为了简单起见，只取第一个。
                    if (_internalcollisionResult.collider){
                        collisionResult = _internalcollisionResult;
                    }
                }
            }
        }

        ListPool.free(colliders);

        return {collisionResult: collisionResult, motion: motion};
    }

    public applyMovement(motion: Vector2){
        this.entity.position = Vector2.add(this.entity.position, motion);

        if (this._triggerHelper)
            this._triggerHelper.update();
    }

    public move(motion: Vector2){
        let movementResult = this.calculateMovement(motion);
        let collisionResult = movementResult.collisionResult;
        motion = movementResult.motion;

        this.applyMovement(motion);

        return collisionResult;
    }
}