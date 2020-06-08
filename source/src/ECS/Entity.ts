class Entity {
    public name: string;
    /** 当前实体所属的场景 */
    public scene: Scene;
    /** 封装实体的位置/旋转/缩放，并允许设置一个高层结构 */
    public readonly transform: Transform;

    constructor(name: string){
        this.name = name;
        this.transform = new Transform(this);
    }

    public attachToScene(newScene: Scene){
        this.scene = newScene;
        newScene.entities.push(this);

        for (let i = 0; i < this.transform.childCount; i ++){
            this.transform.getChild(i).entity.attachToScene(newScene);
        }
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