module es {
    export class EntityList{
        public scene: Scene;
        /**
         * 添加到场景中的实体列表
         */
        public _entities: Entity[] = [];
        /**
         * 添加到此框架的实体列表。用于对实体进行分组，以便我们可以同时处理它们
         */
        public _entitiesToAdded: Entity[] = [];
        /**
         * 标记要删除此框架的实体列表。用于对实体进行分组，以便我们可以同时处理它们
         */
        public _entitiesToRemove: Entity[] = [];
        /**
         * 用于确定是否需要在此框架中对实体进行排序的标志
         */
        public _isEntityListUnsorted: boolean;
        /**
         * 通过标签跟踪实体，便于检索
         */
        public _entityDict: Map<number, Entity[]> = new Map<number, Entity[]>();
        public _unsortedTags: number[] = [];
        /**
         * 在updateLists中用于双缓冲区，以便可以在其他地方修改原始列表
         */
        public _tempEntityList: Entity[] = [];

        constructor(scene: Scene){
            this.scene = scene;
        }

        public get count(){
            return this._entities.length;
        }

        public get buffer(){
            return this._entities;
        }

        public markEntityListUnsorted(){
            this._isEntityListUnsorted = true;
        }

        public markTagUnsorted(tag: number){
            this._unsortedTags.push(tag);
        }

        /**
         * 将实体添加到列表中。所有生命周期方法将在下一帧中被调用。
         * @param entity
         */
        public add(entity: Entity){
            if (this._entitiesToAdded.indexOf(entity) == -1)
                this._entitiesToAdded.push(entity);
        }

        /**
         * 从列表中删除一个实体。所有生命周期方法将在下一帧中被调用。
         * @param entity
         */
        public remove(entity: Entity){
            if (!this._entitiesToRemove.contains(entity)){
                console.warn(`You are trying to remove an entity (${entity.name}) that you already removed`);
                return;
            }

            // 防止在同一帧中添加或删除实体
            if (this._entitiesToAdded.contains(entity)){
                this._entitiesToAdded.remove(entity);
                return;
            }

            if (!this._entitiesToRemove.contains(entity))
                this._entitiesToRemove.push(entity);
        }

        /**
         * 从实体列表中删除所有实体
         */
        public removeAllEntities(){
            this._unsortedTags.length = 0;
            this._entitiesToAdded.length = 0;
            this._isEntityListUnsorted = false;

            // 为什么我们要在这里更新列表?主要用于处理场景切换前分离的实体。
            // 它们仍然在_entitiesToRemove列表中，该列表将由更新列表处理。
            this.updateLists();

            for (let i = 0; i < this._entities.length; i ++){
                this._entities[i]._isDestroyed = true;
                this._entities[i].onRemovedFromScene();
                this._entities[i].scene = null;
            }

            this._entities.length = 0;
            this._entityDict.clear();
        }

        /**
         * 检查该实体当前是否由此EntityList管理
         * @param entity
         */
        public contains(entity: Entity): boolean {
            return this._entities.contains(entity) || this._entitiesToAdded.contains(entity);
        }

        public getTagList(tag: number){
            let list = this._entityDict.get(tag);
            if (!list){
                list = [];
                this._entityDict.set(tag, list);
            }

            return this._entityDict.get(tag);
        }

        public addToTagList(entity: Entity){
            let list = this.getTagList(entity.tag);
            if (!list.contains(entity)){
                list.push(entity);
                this._unsortedTags.push(entity.tag);
            }
        }

        public removeFromTagList(entity: Entity){
            let list = this._entityDict.get(entity.tag);
            if (list){
                list.remove(entity);
            }
        }

        public update(){
            for (let i = 0; i < this._entities.length; i++){
                let entity = this._entities[i];
                if (entity.enabled && (entity.updateInterval == 1 || Time.frameCount % entity.updateInterval == 0))
                    entity.update();
            }
        }

        public updateLists(){
            if (this._entitiesToRemove.length > 0){
                let temp = this._entitiesToRemove;
                this._entitiesToRemove = this._tempEntityList;
                this._tempEntityList = temp;
                this._tempEntityList.forEach(entity => {
                    this.removeFromTagList(entity);

                    this._entities.remove(entity);
                    entity.onRemovedFromScene();
                    entity.scene = null;

                    this.scene.entityProcessors.onEntityRemoved(entity);
                });

                this._tempEntityList.length = 0;
            }

            if (this._entitiesToAdded.length > 0){
                let temp = this._entitiesToAdded;
                this._entitiesToAdded = this._tempEntityList;
                this._tempEntityList = temp;
                this._tempEntityList.forEach(entity => {
                    if (!this._entities.contains(entity)){
                        this._entities.push(entity);
                        entity.scene = this.scene;

                        this.addToTagList(entity);

                        this.scene.entityProcessors.onEntityAdded(entity)
                    }
                });

                // 现在所有实体都被添加到场景中，我们再次循环并调用onAddedToScene
                this._tempEntityList.forEach(entity => entity.onAddedToScene());
                this._tempEntityList.length = 0;
                this._isEntityListUnsorted = true;
            }

            if (this._isEntityListUnsorted){
                this._entities.sort();
                this._isEntityListUnsorted = false;
            }

            if (this._unsortedTags.length > 0){
                this._unsortedTags.forEach(tag => {
                    this._entityDict.get(tag).sort();
                });

                this._unsortedTags.length = 0;
            }
        }

        /**
         * 返回找到的第一个实体的名称。如果没有找到，则返回null。
         * @param name
         */
        public findEntity(name: string){
            for (let i = 0; i < this._entities.length; i ++){
                if (this._entities[i].name == name)
                    return this._entities[i];
            }

            return this._entitiesToAdded.firstOrDefault(entity => entity.name == name);
        }

        /**
         * 返回带有标记的所有实体的列表。如果没有实体具有标记，则返回一个空列表。可以通过ListPool.free将返回的列表放回池中。
         * @param tag
         */
        public entitiesWithTag(tag: number){
            let list = this.getTagList(tag);

            let returnList = ListPool.obtain<Entity>();
            for (let i = 0; i < list.length; i ++)
                returnList.push(list[i]);

            return returnList;
        }

        /**
         * 返回t类型的所有实体的列表。返回的列表可以通过ListPool.free放回池中。
         * @param type
         */
        public entitiesOfType<T extends Entity>(type): T[]{
            let list = ListPool.obtain<T>();
            for (let i = 0; i < this._entities.length; i ++){
                if (this._entities[i] instanceof type)
                    list.push(this._entities[i] as T);
            }
            this._entitiesToAdded.forEach(entity => {
                if (entity instanceof type)
                    list.push(entity as T);
            });

            return list;
        }

        /**
         * 返回在类型为T的场景中找到的第一个组件
         * @param type
         */
        public findComponentOfType<T extends Component>(type): T {
            for (let i = 0; i < this._entities.length; i ++){
                if (this._entities[i].enabled){
                    let comp = this._entities[i].getComponent<T>(type);
                    if (comp)
                        return comp;
                }
            }

            for (let i = 0; i < this._entitiesToAdded.length; i ++){
                let entity = this._entitiesToAdded[i];
                if (entity.enabled){
                    let comp = entity.getComponent<T>(type);
                    if (comp)
                        return comp;
                }
            }

            return null;
        }

        /**
         * 返回在类型t的场景中找到的所有组件。返回的列表可以通过ListPool.free放回池中。
         * @param type
         */
        public findComponentsOfType<T extends Component>(type): T[]{
            let comps = ListPool.obtain<T>();
            for (let i = 0; i < this._entities.length; i ++){
                if (this._entities[i].enabled)
                    this._entities[i].getComponents(type, comps);
            }

            for (let i = 0; i < this._entitiesToAdded.length; i ++){
                let entity = this._entitiesToAdded[i];
                if (entity.enabled)
                    entity.getComponents(type,comps);
            }

            return comps;
        }
    }
}
