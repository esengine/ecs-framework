class Entity extends egret.DisplayObjectContainer {
    private static _idGenerator: number;

    private _position: Vector2 = Vector2.zero;
    public name: string;
    public readonly id: number;
    /** 当前实体所属的场景 */
    public scene: Scene;
    /** 当前附加到此实体的所有组件的列表 */
    public readonly components: ComponentList;
    private _updateOrder: number = 0;
    private _enabled: boolean = true;
    public _isDestoryed: boolean;
    private _tag: number = 0;

    public componentBits: BitSet;

    public get isDestoryed(){
        return this._isDestoryed;
    }

    public get position(){
        return this._position;
    }

    public set position(value: Vector2){
        this._position = value;
    }

    public get scale(){
        return new Vector2(this.scaleX, this.scaleY);
    }

    public set scale(value: Vector2){
        this.scaleX = value.x;
        this.scaleY = value.y;
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

    public get tag(){
        return this._tag;
    }

    public set tag(value: number){
        this.setTag(value);
    }

    public get stage(){
        if (!this.scene)
            return null;
        
        return this.scene.stage;
    }

    constructor(name: string){
        super();
        this.name = name;
        this.components = new ComponentList(this);
        this.id = Entity._idGenerator ++;

        this.componentBits = new BitSet();
    }

    public get updateOrder(){
        return this._updateOrder;
    }

    public set updateOrder(value: number){
        this.setUpdateOrder(value);
    }

    public roundPosition(){
        this.position = Vector2Ext.round(this.position);
    }

    public setUpdateOrder(updateOrder: number){
        if (this._updateOrder != updateOrder){
            this._updateOrder = updateOrder;
            if (this.scene){
                
            }

            return this;
        }
    }

    public setTag(tag: number): Entity{
        if (this._tag != tag){
            if (this.scene){
                this.scene.entities.removeFromTagList(this);
            }
            this._tag = tag;
            if (this.scene){
                this.scene.entities.addToTagList(this);
            }
        }

        return this;
    }

    public attachToScene(newScene: Scene){
        this.scene = newScene;
        newScene.entities.add(this);
        this.components.registerAllComponents();

        for (let i = 0; i < this.numChildren; i ++){
            (this.getChildAt(i) as Component).entity.attachToScene(newScene);
        }
    }

    public detachFromScene(){
        this.scene.entities.remove(this);
        this.components.deregisterAllComponents();

        for (let i = 0; i < this.numChildren; i ++)
            (this.getChildAt(i) as Component).entity.detachFromScene();
    }

    public addComponent<T extends Component>(component: T): T{
        component.entity = this;
        this.components.add(component);
        this.addChild(component);
        component.initialize();
        return component;
    }

    public hasComponent<T extends Component>(type){
        return this.components.getComponent<T>(type, false) != null;
    }

    public getOrCreateComponent<T extends Component>(type: T){
        let comp = this.components.getComponent<T>(type, true);
        if (!comp){
            comp = this.addComponent<T>(type);
        }

        return comp;
    }

    public getComponent<T extends Component>(type): T{
        return this.components.getComponent(type, false) as T;
    }

    public getComponents(typeName: string | any, componentList?){
        return this.components.getComponents(typeName, componentList);
    }

    public removeComponentForType<T extends Component>(type){
        let comp = this.getComponent<T>(type);
        if (comp){
            this.removeComponent(comp);
            return true;
        }

        return false;
    }

    public removeComponent(component: Component){
        this.components.remove(component);
    }

    public removeAllComponents(){
        for (let i = 0; i < this.components.count; i ++){
            this.removeComponent(this.components.buffer[i]);
        }
    }

    public update(){
        this.components.update();
    }

    public onAddedToScene(){

    }

    public onRemovedFromScene(){
        if (this._isDestoryed)
            this.components.removeAllComponents();
    }

    public onTransformChanged(comp: ComponentTransform){
        this.components.onEntityTransformChanged(comp);
    }

    public destroy(){
        this._isDestoryed = true;
        this.scene.entities.remove(this);
        this.removeChildren();

        for (let i = this.numChildren - 1; i >= 0; i --){
            let child = this.getChildAt(i);
            (child as Component).entity.destroy();
        }
    }
}