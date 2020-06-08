abstract class Component {
    public entity: Entity;
    public displayRender: egret.DisplayObject;
    private _enabled: boolean = true;
    public get enabled(){
        return this.entity ? this.entity.enabled && this._enabled : this._enabled;
    }

    public set enabled(value: boolean){
        this.setEnabled(value);
    }

    public setEnabled(isEnabled: boolean){
        if (this._enabled != isEnabled){
            this._enabled = isEnabled;
        }

        return this;
    }

    public abstract initialize();

    public update(){

    }

    /** 绑定显示对象 */
    public bind(displayRender: egret.DisplayObject){
        this.displayRender = displayRender;

        return this;
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