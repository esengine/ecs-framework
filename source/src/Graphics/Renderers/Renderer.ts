/**
 * 渲染器被添加到场景中并处理所有对RenderableComponent的实际调用
 */
abstract class Renderer {
    /** 
     * 渲染器用于渲染的摄像机(实际上是用于剔除的变换矩阵和边界)
     * 不是必须的
     * Renderer子类可以选择调用beginRender时使用的摄像头
     */
    public camera: Camera;

    /**
     * 当渲染器被添加到场景时调用
     * @param scene 
     */
    public onAddedToScene(scene: Scene){}

    protected beginRender(cam: Camera){
        cam.transform.updateTransform();
        
        let entities = SceneManager.scene.entities;
        for (let i = 0; i < entities.buffer.length; i ++){
            entities.buffer[i].transform.updateTransform();
        }
    }

    /**
     * 
     * @param scene 
     */
    public abstract render(scene: Scene);
    
    /**
     * 
     * @param renderable 
     * @param cam 
     */
    protected renderAfterStateCheck(renderable: IRenderable, cam: Camera){
        renderable.render(cam);
    }
}