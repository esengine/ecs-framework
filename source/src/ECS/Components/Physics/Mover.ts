class Mover extends Component {
    private _triggerHelper: ColliderTriggerHelper;

    public onAddedToEntity(){
        this._triggerHelper = new ColliderTriggerHelper(this.entity);
    }

    public calculateMovement(motion: Vector2){
        let collisionResult = new CollisionResult();

        if (!this.entity.getComponent(Collider) || !this._triggerHelper){
            return null;
        }

        let colliders: Collider[] = this.entity.getComponents(Collider);
        for (let i = 0; i < colliders.length; i ++){
            let collider = colliders[i];

            if (collider.isTrigger)
                continue;

            let bounds = collider.bounds;
            bounds.x += motion.x;
            bounds.y += motion.y;
            let neighbors = Physics.boxcastBroadphaseExcludingSelf(collider, bounds, collider.collidesWithLayers);

            for (let j = 0; j < neighbors.length; j ++){
                let neighbor = neighbors[j];
                if (neighbor.isTrigger)
                    continue;

                let _internalcollisionResult = collider.collidesWith(neighbor, motion);
                if (_internalcollisionResult){
                    motion = Vector2.subtract(motion, _internalcollisionResult.minimumTranslationVector);

                    if (_internalcollisionResult.collider){
                        collisionResult = _internalcollisionResult;
                    }
                }
            }
        }

        ListPool.free(colliders);

        return collisionResult;
    }

    public applyMovement(motion: Vector2){
        this.entity.position = Vector2.add(this.entity.position, motion);

        if (this._triggerHelper)
            this._triggerHelper.update();
    }

    public move(motion: Vector2){
        let collisionResult = this.calculateMovement(motion);

        this.applyMovement(motion);

        return collisionResult;
    }
}