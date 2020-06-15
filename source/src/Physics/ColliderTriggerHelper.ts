class ColliderTriggerHelper {
    private _entity: Entity;

    public update(){
        let colliders = this._entity.getComponents<Collider>(Collider);
        for (let i = 0; i < colliders.length; i ++){
            let collider = colliders[i];

            let neighbors = Physics.boxcastBroadphase(collider.bounds, collider.collidesWithLayers);
            for (let i = 0; i < neighbors.length; i ++){
                let neighbor = neighbors[i];
                if (!collider.isTrigger && !neighbor.isTrigger)
                    continue;

                if (collider.overlaps(neighbor)){
                    
                }
            }
        }
    }
}