class EntityList{
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