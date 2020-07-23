module es {
    export class EntityList{
        public scene: Scene;
        private _entitiesToRemove: Entity[] = [];
        private _entitiesToAdded: Entity[] = [];
        private _tempEntityList: Entity[] = [];
        private _entities: Entity[] = [];
        private _entityDict: Map<number, Entity[]> = new Map<number, Entity[]>();
        private _unsortedTags: number[] = [];

        constructor(scene: Scene){
            this.scene = scene;
        }

        public get count(){
            return this._entities.length;
        }

        public get buffer(){
            return this._entities;
        }

        public add(entity: Entity){
            if (this._entitiesToAdded.indexOf(entity) == -1)
                this._entitiesToAdded.push(entity);
        }

        public remove(entity: Entity){
            if (this._entitiesToAdded.contains(entity)){
                this._entitiesToAdded.remove(entity);
                return;
            }

            if (!this._entitiesToRemove.contains(entity))
                this._entitiesToRemove.push(entity);
        }

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
                if (entity.enabled)
                    entity.update();
            }
        }

        public removeAllEntities(){
            this._entitiesToAdded.length = 0;

            this.updateLists();

            for (let i = 0; i < this._entities.length; i ++){
                this._entities[i]._isDestroyed = true;
                this._entities[i].onRemovedFromScene();
                this._entities[i].scene = null;
            }

            this._entities.length = 0;
            this._entityDict.clear();
        }

        public updateLists(){
            if (this._entitiesToRemove.length > 0){
                let temp = this._entitiesToRemove;
                this._entitiesToRemove = this._tempEntityList;
                this._tempEntityList = temp;
                this._tempEntityList.forEach(entity => {
                    this._entities.remove(entity);
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

                        this.scene.entityProcessors.onEntityAdded(entity)
                    }
                });

                this._tempEntityList.forEach(entity => entity.onAddedToScene());
                this._tempEntityList.length = 0;
            }

            if (this._unsortedTags.length > 0){
                this._unsortedTags.forEach(tag => {
                    this._entityDict.get(tag).sort();
                });

                this._unsortedTags.length = 0;
            }
        }
    }
}
