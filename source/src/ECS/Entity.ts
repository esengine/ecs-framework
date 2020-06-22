class Entity {
    private static _idGenerator: number;

    public name: string;
    public readonly id: number;
    /** 当前实体所属的场景 */
    public scene: Scene;
    /** 封装实体的位置/旋转/缩放，并允许设置一个高层结构 */
    public readonly transform: Transform;
    /** 当前附加到此实体的所有组件的列表 */
    public readonly components: ComponentList;
    private _updateOrder: number = 0;
    private _enabled: boolean = true;
    public _isDestoryed: boolean;
    private _tag: number = 0;

    public componentBits: BitSet;

    public get parent(){
        return this.transform.parent;
    }

    public set parent(value: Transform){
        this.transform.setParent(value);
    }

    public get position(){
        return this.transform.position;
    }

    public set position(value: Vector2){
        this.transform.setPosition(value);
    }

    public get localPosition(){
        return this.transform.localPosition;
    }

    public set localPosition(value: Vector2){
        this.transform.setLocalPosition(value);
    }

    public get rotation(){
        return this.transform.rotation;
    }

    public set rotation(value: number){
        this.transform.setRotation(value);
    }

    public get rotationDegrees(){
        return this.transform.rotationDegrees;
    }

    public set rotationDegrees(value: number){
        this.transform.setRotationDegrees(value);
    }

    public get localRotation(){
        return this.transform.localRotation;
    }

    public set localRotation(value: number){
        this.transform.setLocalRotation(value);
    }

    public get localRotationDegrees(){
        return this.transform.localRotationDegrees;
    }

    public set localRotationDegrees(value: number){
        this.transform.setLocalRotationDegrees(value);
    }

    public get scale(){
        return this.transform.scale;
    }

    public set scale(value: Vector2){
        this.transform.setScale(value);
    }

    public get localScale(){
        return this.transform.scale;
    }

    public set localScale(value: Vector2){
        this.transform.setScale(value);
    }

    public get worldInverseTransform(){
        return this.transform.worldInverseTransform;
    }

    public get localToWorldTransform(){
        return this.transform.localToWorldTransform;
    }

    public get worldToLocalTransform(){
        return this.transform.worldToLocalTransform;
    }

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
        this.name = name;
        this.transform = new Transform(this);
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