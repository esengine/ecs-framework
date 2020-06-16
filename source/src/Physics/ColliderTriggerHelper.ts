class ColliderTriggerHelper {
    private _entity: Entity;
    /** 存储当前帧中发生的所有活动交集对 */
    private _activeTriggerIntersections: Pair<Collider>[] = [];
    /** 存储前一帧的交叉对，以便我们可以在移动该帧后检测出口 */
    private _previousTriggerIntersections: Pair<Collider>[] = [];
    private _tempTriggerList: ITriggerListener[] = [];
    
    constructor(entity: Entity) {
        this._entity = entity;
    }

    /**
     * 实体被移动后，应该调用更新。它会处理碰撞器重叠的任何itriggerlistener。
     */
    public update() {
        let colliders = this._entity.getComponents(Collider);
        for (let i = 0; i < colliders.length; i++) {
            let collider = colliders[i];

            let neighbors = Physics.boxcastBroadphase(collider.bounds, collider.collidesWithLayers);
            for (let i = 0; i < neighbors.length; i++) {
                let neighbor = neighbors[i];
                if (!collider.isTrigger && !neighbor.isTrigger)
                    continue;

                if (collider.overlaps(neighbor)) {
                    let pair = new Pair<Collider>(collider, neighbor);
                    let shouldReportTriggerEvent = !this._activeTriggerIntersections.contains(pair) &&
                        !this._previousTriggerIntersections.contains(pair);

                    if (shouldReportTriggerEvent)
                        this.notifyTriggerListeners(pair, true);

                    this._activeTriggerIntersections.push(pair);
                }
            }
        }

        ListPool.free(colliders);

        this.checkForExitedColliders();
    }

    private checkForExitedColliders(){
        let tempIntersections = [];
        this._previousTriggerIntersections = this._previousTriggerIntersections.filter(value => {
            for (let i = 0; i < this._activeTriggerIntersections.length; i ++){
                if (value == this._activeTriggerIntersections[i]){
                    tempIntersections.push(value);
                    return true;
                }
            }

            return false;
        });

        this._previousTriggerIntersections.forEach(pair => this.notifyTriggerListeners(pair, false));
        this._previousTriggerIntersections.length = 0;
        tempIntersections.forEach(value => this._previousTriggerIntersections.push(value));
        this._activeTriggerIntersections.length = 0;
    }

    private notifyTriggerListeners(collisionPair: Pair<Collider>, isEntering: boolean) {
        collisionPair.first.entity.getComponents("ITriggerListener", this._tempTriggerList);
        for (let i = 0; i < this._tempTriggerList.length; i ++){
            if (isEntering){
                this._tempTriggerList[i].onTriggerEnter(collisionPair.second, collisionPair.first);
            } else {
                this._tempTriggerList[i].onTriggerExit(collisionPair.second, collisionPair.first);
            }

            this._tempTriggerList.length = 0;

            if (collisionPair.second.entity){
                collisionPair.second.entity.getComponents("ITriggerListener", this._tempTriggerList);
                for (let i = 0; i < this._tempTriggerList.length; i ++){
                    if (isEntering){
                        this._tempTriggerList[i].onTriggerEnter(collisionPair.first, collisionPair.second);
                    } else {
                        this._tempTriggerList[i].onTriggerExit(collisionPair.first, collisionPair.second);
                    }
                }

                this._tempTriggerList.length = 0;
            }
        }
    }
}