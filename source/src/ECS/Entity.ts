class Entity {
    public name: string;
    /** 当前实体所属的场景 */
    public scene: Scene;
    /** 封装实体的位置/旋转/缩放，并允许设置一个高层结构 */
    public readonly transform: Transform;
    /** 当前附加到此实体的所有组件的列表 */
    public readonly components: Component[];
    private _updateOrder: number = 0;
    private _enabled: boolean = true;

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
        this.components = [];
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
        newScene.entities.push(this);

        for (let i = 0; i < this.transform.childCount; i ++){
            this.transform.getChild(i).entity.attachToScene(newScene);
        }
    }

    public addComponent<T extends Component>(component: T): T{
        component.entity = this;
        this.components.push(component);
        component.initialize();
        return component;
    }

    public getComponent<T extends Component>(): T{
        return this.components.firstOrDefault(component => component instanceof Component) as T;
    }

    public update(){
        this.components.forEach(component => component.update());
        this.transform.updateTransform();
    }

    public destory(){
        this.scene.entities.remove(this);
        this.transform.parent = null;

        for (let i = this.transform.childCount - 1; i >= 0; i --){
            let child = this.transform.getChild(i);
            child.entity.destory();
        }
    }
}