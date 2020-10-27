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
        public _entitiesToAdded: Entity[] = [];
        /**
         * 本帧被标记为删除的实体列表。用于对实体进行分组，以便我们可以同时处理它们
         */
        public _entitiesToRemove: Entity[] = [];
        /**
         * 标志，用于确定我们是否需要在这一帧中对实体进行排序
         */
        public _isEntityListUnsorted: boolean;
        /**
         * 通过标签跟踪实体，便于检索
         */
        public _entityDict: Map<number, Entity[]> = new Map<number, Entity[]>();
        public _unsortedTags: Set<number> = new Set<number>();
        public _addToSceneEntityList: Entity[] = [];
        /** 是否使用分帧处理 */
        public frameAllocate: boolean = false;
        /** 每帧最大处理数量 */
        public maxAllocate: number = 10;

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
            if (this._entitiesToAdded.indexOf(entity) == -1)
                this._entitiesToAdded.push(entity);
        }

        /**
         * 从列表中删除一个实体。所有的生命周期方法将在下一帧中被调用
         * @param entity
         */
        public remove(entity: Entity) {
            if (!this._entitiesToRemove.contains(entity)) {
                console.warn(`您正在尝试删除已经删除的实体(${entity.name})`);
                return;
            }

            // 防止在同一帧中添加或删除实体
            if (this._entitiesToAdded.contains(entity)) {
                this._entitiesToAdded.remove(entity);
                return;
            }

            if (!this._entitiesToRemove.contains(entity))
                this._entitiesToRemove.push(entity);
        }

        /**
         * 从实体列表中删除所有实体
         */
        public removeAllEntities() {
            this._unsortedTags.clear();
            this._entitiesToAdded.length = 0;
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
            return this._entities.findIndex(e => e.id == entity.id) != -1 ||
                this._entitiesToAdded.findIndex(e => e.id == entity.id) != -1;
        }

        public getTagList(tag: number) {
            let list = this._entityDict.get(tag);
            if (!list) {
                list = [];
                this._entityDict.set(tag, list);
            }

            return list;
        }

        public addToTagList(entity: Entity) {
            let list = this.getTagList(entity.tag);
            if (list.findIndex(e => e.id == entity.id) == -1) {
                list.push(entity);
                this._unsortedTags.add(entity.tag);
            }
        }

        public removeFromTagList(entity: Entity) {
            let list = this._entityDict.get(entity.tag);
            if (list) {
                list.remove(entity);
            }
        }

        public update() {
            for (let i = 0; i < this._entities.length; i++) {
                let entity = this._entities[i];
                if (entity.enabled && (entity.updateInterval == 1 || Time.frameCount % entity.updateInterval == 0))
                    entity.update();
            }
        }

        public updateLists() {
            if (this._entitiesToRemove.length > 0) {
                for (const entity of this._entitiesToRemove) {
                    this.removeFromTagList(entity);

                    this._entities.remove(entity);
                    entity.onRemovedFromScene();
                    entity.scene = null;

                    this.scene.entityProcessors.onEntityRemoved(entity);
                }

                this._entitiesToRemove.length = 0;
            }

            // 现在所有的实体都被添加到场景中，我们再次循环并调用onAddedToScene
            while (this._addToSceneEntityList.length > 0){
                let entity = this._addToSceneEntityList.shift();
                entity.onAddedToScene();
            }

            if (this._entitiesToAdded.length > 0) {
                if (this.frameAllocate && this._entitiesToAdded.length > this.maxAllocate){
                    // 启用分帧处理
                    for (let i = 0; i < this.maxAllocate; i ++){
                        this.perEntityAddToScene();
                    }

                    if (this._entitiesToAdded.length == 0) this._isEntityListUnsorted = true;
                }else{
                    while (this._entitiesToAdded.length > 0){
                        this.perEntityAddToScene();
                    }

                    this._isEntityListUnsorted = true;
                }
            }

            if (this._isEntityListUnsorted) {
                this._entities.sort((a, b)=>{
                    return a.compareTo(b);
                });
                this._isEntityListUnsorted = false;
            }

            // 根据需要对标签列表进行排序
            if (this._addToSceneEntityList.length == 0 && this._unsortedTags.size > 0) {
                this._unsortedTags.forEach((tag)=>{
                    this._entityDict.get(tag).sort((a, b) => {
                        return a.compareTo(b);
                    });
                });
                    
                this._unsortedTags.clear();
            }
        }

        /** 每次添加一个实体到场景 */
        private perEntityAddToScene(){
            let entity = this._entitiesToAdded.shift();
            this._addToSceneEntityList.push(entity);

            if (this._entities.findIndex(e => e.id == entity.id) == -1) {
                this._entities.push(entity);
                entity.scene = this.scene;

                this.addToTagList(entity);

                this.scene.entityProcessors.onEntityAdded(entity);
            }
        }

        /**
         * 返回第一个找到的名字为name的实体。如果没有找到则返回null
         * @param name
         */
        public findEntity(name: string) {
            for (let i = 0; i < this._entities.length; i++) {
                if (this._entities[i].name == name)
                    return this._entities[i];
            }

            return this._entitiesToAdded.firstOrDefault(entity => entity.name == name);
        }

        /**
         * 返回带有标签的所有实体的列表。如果没有实体有标签，则返回一个空列表。
         * 返回的List可以通过ListPool.free放回池中
         * @param tag
         */
        public entitiesWithTag(tag: number) {
            let list = this.getTagList(tag);

            let returnList = ListPool.obtain<Entity>();
            returnList.length = this._entities.length;
            for (let i = 0; i < list.length; i++)
                returnList.push(list[i]);

            return returnList;
        }

        /**
         * 返回一个T类型的所有实体的列表。
         * 返回的List可以通过ListPool.free放回池中。
         * @param type
         */
        public entitiesOfType<T extends Entity>(type): T[] {
            let list = ListPool.obtain<T>();
            for (let i = 0; i < this._entities.length; i++) {
                if (this._entities[i] instanceof type)
                    list.push(this._entities[i] as T);
            }
            for (const entity of this._entitiesToAdded) {
                if (entity instanceof type)
                    list.push(entity as T);
            }

            return list;
        }

        /**
         * 返回在场景中找到的第一个T类型的组件。
         * @param type
         */
        public findComponentOfType<T extends Component>(type): T {
            for (let i = 0; i < this._entities.length; i++) {
                if (this._entities[i].enabled) {
                    let comp = this._entities[i].getComponent<T>(type);
                    if (comp)
                        return comp;
                }
            }

            for (let i = 0; i < this._entitiesToAdded.length; i++) {
                let entity = this._entitiesToAdded[i];
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

            for (let i = 0; i < this._entitiesToAdded.length; i++) {
                let entity = this._entitiesToAdded[i];
                if (entity.enabled)
                    entity.getComponents(type, comps);
            }

            return comps;
        }
    }
}
