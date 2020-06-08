abstract class Component {
    public entity: Entity;
    public displayRender: egret.DisplayObject;

    public abstract initialize();

    public update(){
        
    }

    /** 绑定显示对象 */
    public bind(displayRender: egret.DisplayObject){
        this.displayRender = displayRender;

        return this;
    }
}