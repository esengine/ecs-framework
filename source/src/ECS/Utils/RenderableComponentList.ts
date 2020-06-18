class RenderableComponentList {
    private _components: IRenderable[] = [];
    public get count(){
        return this._components.length;
    }

    public get buffer(){
        return this._components;
    }

    public add(component: IRenderable){
        this._components.push(component);
    }

    public remove(component: IRenderable){
        this._components.remove(component);
    }

    public updateList(){

    }
}