module es {
    /**
     * 移动器使用的帮助器类，用于管理触发器碰撞器交互并调用itriggerlistener
     */
    export class ColliderTriggerHelper {
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
                for (let j = 0; j < neighbors.length; j++) {
                    let neighbor = neighbors[j];
                    if (!collider.isTrigger && !neighbor.isTrigger)
                        continue;

                    if (collider.overlaps(neighbor)) {
                        let pair = new Pair<Collider>(collider, neighbor);
                        let shouldReportTriggerEvent = this._activeTriggerIntersections.findIndex(value => {
                            return value.first == pair.first && value.second == pair.second;
                        }) == -1 && this._previousTriggerIntersections.findIndex(value => {
                            return value.first == pair.first && value.second == pair.second;
                        }) == -1;

                        if (shouldReportTriggerEvent)
                            this.notifyTriggerListeners(pair, true);

                        if (!this._activeTriggerIntersections.contains(pair))
                            this._activeTriggerIntersections.push(pair);
                    }
                }
            }

            ListPool.free(colliders);

            this.checkForExitedColliders();
        }

        private checkForExitedColliders() {
            for (let i = 0; i < this._activeTriggerIntersections.length; i++) {
                let index = this._previousTriggerIntersections.findIndex(value => {
                    if (value.first == this._activeTriggerIntersections[i].first && value.second == this._activeTriggerIntersections[i].second)
                        return true;

                    return false;
                });
                if (index != -1)
                    this._previousTriggerIntersections.removeAt(index);
            }

            for (let i = 0; i < this._previousTriggerIntersections.length; i++) {
                this.notifyTriggerListeners(this._previousTriggerIntersections[i], false)
            }
            this._previousTriggerIntersections.length = 0;
            for (let i = 0; i < this._activeTriggerIntersections.length; i++) {
                if (!this._previousTriggerIntersections.contains(this._activeTriggerIntersections[i])) {
                    this._previousTriggerIntersections.push(this._activeTriggerIntersections[i]);
                }
            }
            this._activeTriggerIntersections.length = 0;
        }

        private notifyTriggerListeners(collisionPair: Pair<Collider>, isEntering: boolean) {
            collisionPair.first.entity.getComponents("ITriggerListener", this._tempTriggerList);
            for (let i = 0; i < this._tempTriggerList.length; i++) {
                if (isEntering) {
                    this._tempTriggerList[i].onTriggerEnter(collisionPair.second, collisionPair.first);
                } else {
                    this._tempTriggerList[i].onTriggerExit(collisionPair.second, collisionPair.first);
                }

                this._tempTriggerList.length = 0;

                if (collisionPair.second.entity) {
                    collisionPair.second.entity.getComponents("ITriggerListener", this._tempTriggerList);
                    for (let i = 0; i < this._tempTriggerList.length; i++) {
                        if (isEntering) {
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
}
