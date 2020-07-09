abstract class Component extends egret.DisplayObjectContainer {
    public entity: Entity;
    private _enabled: boolean = true;
    public updateInterval: number = 1;
    /** 允许用户为实体存入信息 */
    public userData: any;

    public get enabled(){
        return this.entity ? this.entity.enabled && this._enabled : this._enabled;
    }

    public set enabled(value: boolean){
        this.setEnabled(value);
    }

    public get localPosition(){
        return new Vector2(this.entity.x + this.x, this.entity.y + this.y);
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

    public initialize(){
    }

    public onAddedToEntity(){

    }

    public onRemovedFromEntity(){

    }

    public onEnabled(){

    }

    public onDisabled(){

    }

    public update(){

    }

    public debugRender(){
        
    }

    /**
     * 当实体的位置改变时调用。这允许组件知道它们由于父实体的移动而移动了。
     * @param comp 
     */
    public onEntityTransformChanged(comp: TransformComponent){

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