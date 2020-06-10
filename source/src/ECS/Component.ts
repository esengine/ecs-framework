abstract class Component {
    public entity: Entity;
    private _enabled: boolean = true;
    public updateInterval: number = 1;

    public get transform(){
        return this.entity.transform;
    }

    public get enabled(){
        return this.entity ? this.entity.enabled && this._enabled : this._enabled;
    }

    public set enabled(value: boolean){
        this.setEnabled(value);
    }

    public setEnabled(isEnabled: boolean){
        if (this._enabled != isEnabled){
            this._enabled = isEnabled;

            if (this._enabled){
                this.onEnabled();
            }else{
                this.onDisabled();
            }
        }

        return this;
    }

    public abstract initialize();

    public onAddedToEntity(){

    }

    public onRemovedFromEntity(){

    }

    public onEnabled(){

    }

    public onDisabled(){

    }

    public onEntityTransformChanged(comp: ComponentTransform){
        
    }

    public update(){

    }

    /** 内部使用 运行时不应该调用 */
    public registerComponent(){
        this.entity.componentBits.set(ComponentTypeManager.getIndexFor(this), false);
        this.entity.scene.entityProcessors.onComponentAdded(this.entity);
    }

    public deregisterComponent(){
        this.entity.componentBits.set(ComponentTypeManager.getIndexFor(this));
        this.entity.scene.entityProcessors.onComponentRemoved(this.entity);
    }
}