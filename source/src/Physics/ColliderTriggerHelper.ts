module es {
    /**
     * 移动器使用的帮助器类，用于管理触发器碰撞器交互并调用itriggerlistener
     */
    export class ColliderTriggerHelper {
        private _entity: Entity;
        /** 存储当前帧中发生的所有活动交点对 */
        private _activeTriggerIntersections: PairSet<Collider> = new PairSet<Collider>();
        /** 存储前一帧的交点对，这样我们就可以在移动这一帧后检测到退出 */
        private _previousTriggerIntersections: PairSet<Collider> = new PairSet<Collider>();
        private _tempTriggerList: ITriggerListener[] = [];

        constructor(entity: Entity) {
            this._entity = entity;
        }

        /**
         * update应该在实体被移动后被调用，它将处理任何与Colllider重叠的ITriggerListeners。
         * 它将处理任何与Collider重叠的ITriggerListeners。
         */
        public update() {
            const lateColliders = [];
            // 对所有实体.colliders进行重叠检查，这些实体.colliders是触发器，与所有宽相碰撞器，无论是否触发器。   
            // 任何重叠都会导致触发事件
            let colliders: Collider[] = this.getColliders();
            if (colliders.length > 0) {
                for (let i = 0; i < colliders.length; i++) {
                    let collider = colliders[i];
    
                    let neighbors = Physics.boxcastBroadphaseExcludingSelf(collider, collider.bounds, collider.collidesWithLayers.value);
                    for (let j = 0; j < neighbors.length; j++) {
                        let neighbor = neighbors[j];
                        // 我们至少需要一个碰撞器作为触发器
                        if (!collider.isTrigger && !neighbor.isTrigger)
                            continue;
    
                        if (collider.overlaps(neighbor)) {
                            const pair = new Pair<Collider>(collider, neighbor);
    
                            // 如果我们的某一个集合中已经有了这个对子（前一个或当前的触发交叉点），就不要调用输入事件了
                            const shouldReportTriggerEvent = !this._activeTriggerIntersections.has(pair) &&
                                !this._previousTriggerIntersections.has(pair);
    
                                if (shouldReportTriggerEvent) {
                                    if (neighbor.castSortOrder >= Collider.lateSortOrder) {
                                        lateColliders.push(pair);
                                    } else {
                                        this.notifyTriggerListeners(pair, true);
                                    }
                                }
    
                            this._activeTriggerIntersections.add(pair);
                        }
                    }
                }
            }
            

            if (lateColliders.length > 0) {
                for (let i = 0; i < lateColliders.length; i ++) {
                    const pair = lateColliders[i];
                    this.notifyTriggerListeners(pair, true);
                }
            }

            this.checkForExitedColliders();
        }

        private getColliders() {
            const colliders: Collider[] = [];
            if (this._entity.components.buffer.length > 0)
                for (let i = 0; i < this._entity.components.buffer.length; i ++) {
                    const component = this._entity.components.buffer[i];
                    if (component instanceof Collider) {
                        colliders.push(component);
                    }
                }

            return colliders;
        }

        private checkForExitedColliders() {
            // 删除所有与此帧交互的触发器，留下我们退出的触发器
            this._previousTriggerIntersections.except(this._activeTriggerIntersections);
            const all = this._previousTriggerIntersections.all;
            all.forEach(pair => {
              this.notifyTriggerListeners(pair, false);
            });

            this._previousTriggerIntersections.clear();

            // 添加所有当前激活的触发器
            this._previousTriggerIntersections.union(this._activeTriggerIntersections);

            // 清空活动集，为下一帧做准备
            this._activeTriggerIntersections.clear();
        }

        private notifyTriggerListeners(collisionPair: Pair<Collider>, isEntering: boolean) {
            TriggerListenerHelper.getITriggerListener(collisionPair.first.entity, this._tempTriggerList);
            if (this._tempTriggerList.length > 0)
                for (let i = 0; i < this._tempTriggerList.length; i++) {
                    const trigger = this._tempTriggerList[i];
                    if (isEntering) {
                        trigger.onTriggerEnter(collisionPair.second, collisionPair.first);
                    } else {
                        trigger.onTriggerExit(collisionPair.second, collisionPair.first);
                    }

                    this._tempTriggerList.length = 0;

                    if (collisionPair.second.entity) {
                        TriggerListenerHelper.getITriggerListener(collisionPair.second.entity, this._tempTriggerList);
                        if (this._tempTriggerList.length > 0)
                            for (let i = 0; i < this._tempTriggerList.length; i++) {
                                const trigger = this._tempTriggerList[i];
                                if (isEntering) {
                                    trigger.onTriggerEnter(collisionPair.first, collisionPair.second);
                                } else {
                                    trigger.onTriggerExit(collisionPair.first, collisionPair.second);
                                }
                            }

                        this._tempTriggerList.length = 0;
                    }
                }
        }
    }
}
