class ComponentList {
    private _entity: Entity;
    private _components: Component[] = [];
    private _componentsToAdd: Component[] = [];
    private _componentsToRemove: Component[] = [];
    private _tempBufferList: Component[] = [];

    constructor(entity: Entity){
        this._entity = entity;
    }

    public get count(){
        return this._components.length;
    }

    public get buffer(){
        return this._components;
    }

    public add(component: Component){
        this._componentsToAdd.push(component);
    }

    public remove(component: Component){
        if (this._componentsToAdd.contains(component)){
            this._componentsToAdd.remove(component);
            return;
        }

        this._componentsToRemove.push(component);
    }

    public removeAllComponents(){
        for (let i = 0; i < this._components.length; i ++){
            this.handleRemove(this._components[i]);
        }

        this._components.length = 0;
        this._componentsToAdd.length = 0;
        this._componentsToRemove.length = 0;
    }

    public deregisterAllComponents(){
        for (let i = 0; i < this._components.length; i ++){
            let component = this._components[i];

            this._entity.componentBits.set(ComponentTypeManager.getIndexFor(component), false);
            this._entity.scene.entityProcessors.onComponentRemoved(this._entity);
        }
    }

    public registerAllComponents(){
        for (let i = 0; i < this._components.length; i ++){
            let component = this._components[i];

            this._entity.componentBits.set(ComponentTypeManager.getIndexFor(component));
            this._entity.scene.entityProcessors.onComponentAdded(this._entity);
        }
    }

    public updateLists(){
        if (this._componentsToRemove.length > 0){
            for (let i = 0; i < this._componentsToRemove.length; i ++){
                this.handleRemove(this._componentsToRemove[i]);
                this._components.remove(this._componentsToRemove[i]);
            }

            this._componentsToRemove.length = 0;
        }

        if (this._componentsToAdd.length > 0){
            for (let i = 0, count = this._componentsToAdd.length; i < count; i ++){
                let component = this._componentsToAdd[i];

                this._entity.componentBits.set(ComponentTypeManager.getIndexFor(component));
                this._entity.scene.entityProcessors.onComponentAdded(this._entity);

                this._components.push(component);
                this._tempBufferList.push(component);
            }

            this._componentsToAdd.length = 0;

            for (let i = 0; i < this._tempBufferList.length; i++){
                let component = this._tempBufferList[i];
                component.onAddedToEntity();

                if (component.enabled){
                    component.onEnabled();
                }
            }

            this._tempBufferList.length = 0;
        }
    }

    private handleRemove(component: Component){
        this._entity.componentBits.set(ComponentTypeManager.getIndexFor(component), false);
        this._entity.scene.entityProcessors.onComponentRemoved(this._entity);

        component.onRemovedFromEntity();
        component.entity = null;
    }

    public getComponent<T extends Component>(type, onlyReturnInitializedComponents: boolean): T{
        for (let i = 0; i < this._components.length; i ++){
            let component = this._components[i];
            if (component instanceof type)
                return component as T;
        }

        if (!onlyReturnInitializedComponents){
            for (let i = 0; i < this._componentsToAdd.length; i ++){
                let component = this._componentsToAdd[i];
                if (component instanceof type)
                    return component as T;
            }
        }

        return null;
    }

    public update(){
        this.updateLists();
        for (let i = 0; i < this._components.length; i ++){
            let component = this._components[i];
            if (component.enabled && (component.updateInterval == 1 || Time.frameCount % component.updateInterval == 0))
                component.update();
        }
    }

    public onEntityTransformChanged(comp){
        for (let i = 0; i < this._components.length; i++){
            if (this._components[i].enabled)
                this._components[i].onEntityTransformChanged(comp);
        }

        for (let i = 0; i < this._componentsToAdd.length; i ++){
            if (this._componentsToAdd[i].enabled)
                this._componentsToAdd[i].onEntityTransformChanged(comp);
        }
    }
}