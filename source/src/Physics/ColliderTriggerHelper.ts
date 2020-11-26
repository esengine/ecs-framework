module es {
    /**
     * 移动器使用的帮助器类，用于管理触发器碰撞器交互并调用itriggerlistener
     */
    export class ColliderTriggerHelper {
        private _entity: Entity;
        /** 存储当前帧中发生的所有活动交点对 */
        private _activeTriggerIntersections: Set<Pair<Collider>> = new Set();
        /** 存储前一帧的交点对，这样我们就可以在移动这一帧后检测到退出 */
        private _previousTriggerIntersections: Set<Pair<Collider>> = new Set();
        private _tempTriggerList: ITriggerListener[] = [];

        constructor(entity: Entity) {
            this._entity = entity;
        }

        /**
         * update应该在实体被移动后被调用，它将处理任何与Colllider重叠的ITriggerListeners。
         * 它将处理任何与Collider重叠的ITriggerListeners。
         */
        public update() {
            // 对所有实体.colliders进行重叠检查，这些实体.colliders是触发器，与所有宽相碰撞器，无论是否触发器。   
            // 任何重叠都会导致触发事件
            let colliders = this._entity.getComponents(Collider);
            for (let i = 0; i < colliders.length; i++) {
                let collider = colliders[i];

                let neighbors = Physics.boxcastBroadphase(collider.bounds, collider.collidesWithLayers);
                for (let j = 0; j < neighbors.size; j++) {
                    let neighbor = neighbors[j];
                    // 我们至少需要一个碰撞器作为触发器
                    if (!collider.isTrigger && !neighbor.isTrigger)
                        continue;

                    if (collider.overlaps(neighbor)) {
                        let pair = new Pair<Collider>(collider, neighbor);

                        // 如果我们的某一个集合中已经有了这个对子（前一个或当前的触发交叉点），就不要调用输入事件了
                        let shouldReportTriggerEvent = !this._activeTriggerIntersections.has(pair) &&
                            !this._previousTriggerIntersections.has(pair);

                        if (shouldReportTriggerEvent)
                            this.notifyTriggerListeners(pair, true);

                        this._activeTriggerIntersections.add(pair);
                    }
                }
            }

            ListPool.free(colliders);

            this.checkForExitedColliders();
        }

        private checkForExitedColliders() {
            // 删除所有与此帧交互的触发器，留下我们退出的触发器
            this.excepthWith(this._previousTriggerIntersections, this._activeTriggerIntersections);

            for (let i = 0; i < this._previousTriggerIntersections.size; i++) {
                this.notifyTriggerListeners(this._previousTriggerIntersections[i], false)
            }

            this._previousTriggerIntersections.clear();

            // 添加所有当前激活的触发器
            this.unionWith(this._previousTriggerIntersections, this._activeTriggerIntersections);

            // 清空活动集，为下一帧做准备
            this._activeTriggerIntersections.clear();
        }

        private excepthWith(previous: Set<Pair<Collider>>, active: Set<Pair<Collider>>){
            for (let i = 0; i < previous.size; i ++){
                let previousDATA: Pair<Collider> = previous[i];
                for (let j = 0; j < active.size; j ++){
                    let activeDATA: Pair<Collider> = active[j];
                    if (activeDATA.equals(previousDATA))
                        previous.delete(previousDATA);
                }
            }
        }

        private unionWith(previous: Set<Pair<Collider>>, active: Set<Pair<Collider>>) {
            for (let i = 0; i < this._activeTriggerIntersections.size; i ++) {
                if (!this._previousTriggerIntersections.has(this._activeTriggerIntersections[i]))
                    this._previousTriggerIntersections.add(this._activeTriggerIntersections[i]);
            }
        }

        private notifyTriggerListeners(collisionPair: Pair<Collider>, isEntering: boolean) {
            TriggerListenerHelper.getITriggerListener(collisionPair.first.entity, this._tempTriggerList);
            for (let i = 0; i < this._tempTriggerList.length; i++) {
                if (isEntering) {
                    this._tempTriggerList[i].onTriggerEnter(collisionPair.second, collisionPair.first);
                } else {
                    this._tempTriggerList[i].onTriggerExit(collisionPair.second, collisionPair.first);
                }

                this._tempTriggerList.length = 0;

                if (collisionPair.second.entity) {
                    TriggerListenerHelper.getITriggerListener(collisionPair.second.entity, this._tempTriggerList);
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
