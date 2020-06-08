class Entity {
    public name: string;
    /** 当前实体所属的场景 */
    public scene: Scene;
    /** 封装实体的位置/旋转/缩放，并允许设置一个高层结构 */
    public readonly transform: Transform;
    /** 当前附加到此实体的所有组件的列表 */
    public readonly components: ComponentList;
    private _updateOrder: number = 0;
    private _enabled: boolean = true;
    private _isDestoryed: boolean;

    public componentBits: BitSet;

    public get isDestoryed(){
        return this._isDestoryed;
    }

    public get enabled(){
        return this._enabled;
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

    constructor(name: string){
        this.name = name;
        this.transform = new Transform(this);
        this.components = new ComponentList(this);
        this.componentBits = new BitSet();
    }

    public get updateOrder(){
        return this._updateOrder;
    }

    public set updateOrder(value: number){
        this.setUpdateOrder(value);
    }

    public setUpdateOrder(updateOrder: number){
        if (this._updateOrder != updateOrder){
            this._updateOrder = updateOrder;
            if (this.scene){
                
            }

            return this;
        }
    }

    public attachToScene(newScene: Scene){
        this.scene = newScene;
        newScene.entities.add(this);
        this.components.registerAllComponents();

        for (let i = 0; i < this.transform.childCount; i ++){
            this.transform.getChild(i).entity.attachToScene(newScene);
        }
    }

    public detachFromScene(){
        this.scene.entities.remove(this);
        this.components.deregisterAllComponents();

        for (let i = 0; i < this.transform.childCount; i ++)
            this.transform.getChild(i).entity.detachFromScene();
    }

    public addComponent<T extends Component>(component: T): T{
        component.entity = this;
        this.components.add(component);
        component.initialize();
        return component;
    }

    public getComponent<T extends Component>(type): T{
        return this.components.getComponent(type, false) as T;
    }

    public update(){
        this.components.update();
        this.transform.updateTransform();
    }

    public onAddedToScene(){

    }

    public onRemovedFromScene(){
        if (this._isDestoryed)
            this.components.remove
    }

    public onTransformChanged(comp: ComponentTransform){
        this.components.onEntityTransformChanged(comp);
    }

    public destory(){
        this._isDestoryed = true;
        this.scene.entities.remove(this);
        this.transform.parent = null;

        for (let i = this.transform.childCount - 1; i >= 0; i --){
            let child = this.transform.getChild(i);
            child.entity.destory();
        }
    }
}