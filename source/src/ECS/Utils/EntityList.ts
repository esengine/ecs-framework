module es {
    export class EntityList {
        public scene: Scene;
        /**
         * 场景中添加的实体列表
         */
        public _entities: Entity[] = [];
        /**
         * 本帧添加的实体列表。用于对实体进行分组，以便我们可以同时处理它们
         */
        public _entitiesToAdded: {[index: number]: Entity} = {};
        /**
         * 本帧被标记为删除的实体列表。用于对实体进行分组，以便我们可以同时处理它们
         */
        public _entitiesToRemove: {[index: number]: Entity} = {};
        public _entitiesToAddedList: Entity[] = [];
        public _entitiesToRemoveList: Entity[] = [];
        /**
         * 标志，用于确定我们是否需要在这一帧中对实体进行排序
         */
        public _isEntityListUnsorted: boolean;
        /**
         * 通过标签跟踪实体，便于检索
         */
        public _entityDict: Map<number, Set<Entity>> = new Map<number, Set<Entity>>();
        public _unsortedTags: Set<number> = new Set<number>();

        constructor(scene: Scene) {
            this.scene = scene;
        }

        public get count() {
            return this._entities.length;
        }

        public get buffer() {
            return this._entities;
        }

        public markEntityListUnsorted() {
            this._isEntityListUnsorted = true;
        }

        public markTagUnsorted(tag: number) {
            this._unsortedTags.add(tag);
        }

        /**
         * 将一个实体添加到列表中。所有的生命周期方法将在下一帧中被调用
         * @param entity
         */
        public add(entity: Entity) {
            this._entitiesToAdded[entity.id] = entity;
            this._entitiesToAddedList.push(entity);
        }

        /**
         * 从列表中删除一个实体。所有的生命周期方法将在下一帧中被调用
         * @param entity
         */
        public remove(entity: Entity) {
            // 防止在同一帧中添加或删除实体
            if (this._entitiesToAdded[entity.id]) {
                let index = this._entitiesToAddedList.findIndex(e => e.id == entity.id);
                if (index != -1)
                    this._entitiesToAddedList.splice(index, 1);
                delete this._entitiesToAdded[entity.id];
                return;
            }

            this._entitiesToRemoveList.push(entity);
            if (!this._entitiesToRemove[entity.id])
                this._entitiesToRemove[entity.id] = entity;
        }

        /**
         * 从实体列表中删除所有实体
         */
        public removeAllEntities() {
            this._unsortedTags.clear();
            this._entitiesToAdded = {};
            this._entitiesToAddedList.length = 0;
            this._isEntityListUnsorted = false;

            // 为什么我们要在这里更新列表？主要是为了处理在场景切换前被分离的实体。
            // 它们仍然会在_entitiesToRemove列表中，这将由updateLists处理。
            this.updateLists();

            for (let i = 0; i < this._entities.length; i++) {
                this._entities[i]._isDestroyed = true;
                this._entities[i].onRemovedFromScene();
                this._entities[i].scene = null;
            }

            this._entities.length = 0;
            this._entityDict.clear();
        }

        /**
         * 检查实体目前是否由这个EntityList管理
         * @param entity
         */
        public contains(entity: Entity): boolean {
            return !!this._entitiesToAdded[entity.id];
        }

        public getTagList(tag: number) {
            let list = this._entityDict.get(tag);
            if (!list) {
                list = new Set();
                this._entityDict.set(tag, list);
            }

            return list;
        }

        public addToTagList(entity: Entity) {
            this.getTagList(entity.tag).add(entity);
            this._unsortedTags.add(entity.tag);
        }

        public removeFromTagList(entity: Entity) {
            let list = this._entityDict.get(entity.tag);
            if (list)
                list.delete(entity);
        }

        public update() {
            for (let i = 0, s = this._entities.length; i < s; ++ i) {
                let entity = this._entities[i];
                if (entity.enabled && (entity.updateInterval == 1 || Time.frameCount % entity.updateInterval == 0))
                    entity.update();
            }
        }

        public updateLists() {
            if (this._entitiesToRemoveList.length > 0) {
                for (let i = 0, s = this._entitiesToRemoveList.length; i < s; ++ i) {
                    let entity =  this._entitiesToRemoveList[i];
                    this.removeFromTagList(entity);
    
                    // 处理常规实体列表
                    let index = this._entities.findIndex(e => e.id == entity.id);
                    if (index != -1)
                        this._entities.splice(index, 1);
                    entity.onRemovedFromScene();
                    entity.scene = null;
    
                    this.scene.entityProcessors.onEntityRemoved(entity);
                }
    
                this._entitiesToRemove = {};
                this._entitiesToRemoveList.length = 0;
            }

            if (this._entitiesToAddedList.length > 0) {
                for (let i = 0, s = this._entitiesToAddedList.length; i < s; ++ i) {
                    let entity = this._entitiesToAddedList[i];
                    this._entities.push(entity);
                    entity.scene = this.scene;
    
                    this.addToTagList(entity);
    
                    this.scene.entityProcessors.onEntityAdded(entity);
                }
    
                for (let i = 0, s = this._entitiesToAddedList.length; i < s; ++ i) {
                    let entity = this._entitiesToAddedList[i];
                    entity.onAddedToScene();
                }

                this._entitiesToAdded = {};
                this._entitiesToAddedList.length = 0;
            }
        }

        /**
         * 返回第一个找到的名字为name的实体。如果没有找到则返回null
         * @param name
         */
        public findEntity(name: string) {
            for (let i = 0, s = this._entities.length; i < s; ++ i) {
                let entity = this._entities[i];
                if (entity[i].name == name)
                    return entity;
            }

            for (let i = 0, s = this._entitiesToAddedList.length; i < s; ++ i) {
                let entity = this._entitiesToAddedList[i];
                if (entity.name == name)
                    return entity;
            }

            return null;
        }

        /**
         * 
         * @param id 
         * @returns 
         */
        public findEntityById(id: number) {
            for (let i = 0, s = this._entities.length; i < s; ++ i) {
                let entity = this._entities[i];
                if (entity.id == id)
                    return entity;
            }

            return this._entitiesToAdded[id];
        }

        /**
         * 返回带有标签的所有实体的列表。如果没有实体有标签，则返回一个空列表。
         * 返回的List可以通过ListPool.free放回池中
         * @param tag
         */
        public entitiesWithTag(tag: number) {
            let list = this.getTagList(tag);

            let returnList = ListPool.obtain<Entity>();
            for (let entity of list) {
                returnList.push(entity);
            }

            return returnList;
        }

        /**
         * 返回第一个找到该tag的实体
         * @param tag 
         * @returns 
         */
        public entityWithTag(tag: number) {
            let list = this.getTagList(tag);

            for (let entity of list) {
                return entity;
            }

            return null;
        }

        /**
         * 返回在场景中找到的第一个T类型的组件。
         * @param type
         */
        public findComponentOfType<T extends Component>(type): T {
            for (let i = 0, s = this._entities.length; i < s; i++) {
                let entity = this._entities[i];
                if (entity.enabled) {
                    let comp = entity.getComponent<T>(type);
                    if (comp)
                        return comp;
                }
            }

            for (let i = 0; i < this._entitiesToAddedList.length; i++) {
                let entity = this._entitiesToAddedList[i];
                if (entity.enabled) {
                    let comp = entity.getComponent<T>(type);
                    if (comp)
                        return comp;
                }
            }

            return null;
        }

        /**
         * 返回在场景中找到的所有T类型的组件。
         * 返回的List可以通过ListPool.free放回池中。
         * @param type
         */
        public findComponentsOfType<T extends Component>(type): T[] {
            let comps = ListPool.obtain<T>();
            for (let i = 0; i < this._entities.length; i++) {
                if (this._entities[i].enabled)
                    this._entities[i].getComponents(type, comps);
            }

            for (let entity of this._entitiesToAddedList) {
                if (entity.enabled)
                    entity.getComponents(type, comps);
            }

            return comps;
        }

        /**
         * 返回场景中包含特定组件的实体列表
         * @param types 
         * @returns 
         */
        public findEntitesOfComponent(...types): Entity[] {
            let entities = [];
            for (let i = 0; i < this._entities.length; i++) {
                if (this._entities[i].enabled) {
                    let meet = true;
                    for (let type of types) {
                        let hasComp = this._entities[i].hasComponent(type);
                        if (!hasComp) {
                            meet = false;
                            break;
                        }
                    }

                    if (meet) {
                        entities.push(this._entities[i]);
                    }
                }
            }

            for (let entity of this._entitiesToAddedList) {
                if (entity.enabled) {
                    let meet = true;
                    for (let type of types) {
                        let hasComp = entity.hasComponent(type);
                        if (!hasComp) {
                            meet = false;
                            break;
                        }
                    }

                    if (meet) {
                        entities.push(entity);
                    }
                }
            }

            return entities;
        }
    }
}
