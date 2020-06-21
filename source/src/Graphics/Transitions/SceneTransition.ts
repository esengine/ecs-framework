/**
 * SceneTransition用于从一个场景过渡到另一个场景或在一个有效果的场景中过渡
 */
abstract class SceneTransition {
    /** 是否加载新场景的标志 */
    public loadsNewScene: boolean;
    /** 
     * 将此用于两个部分的转换。例如，淡出会先淡出到黑色，然后当isNewSceneLoaded为true，它会淡出。
     * 对于场景过渡，isNewSceneLoaded应该在中点设置为true，这就标识一个新的场景被加载了。
     */
    public isNewSceneLoaded: boolean;
    /** 
     * 如果为true
     * 会将之前的场景渲染到previousSceneRender中，这样你就可以在转换时使用它 
     */
    public wantsPreviousSceneRender: boolean;
    /** 返回新加载场景的函数 */
    protected sceneLoadAction: Function;
    /** 包含上一个场景的最后渲染。可以用来在加载新场景时模糊屏幕。 */
    public previousSceneRender: egret.RenderTexture;
    /** 在loadNextScene执行时调用。这在进行场景间过渡时很有用，这样你就知道什么时候可以更多地使用相机或者重置任何实体 */
    public onScreenObscured: Function;
    /** 当转换完成执行时调用，以便可以调用其他工作，比如启动另一个转换。 */
    public onTransitionCompleted: Function;
    public progress: number = 0;

    constructor(sceneLoadAction: Function, wantsPreviousSceneRender: boolean = true) {
        this.sceneLoadAction = sceneLoadAction;
        this.wantsPreviousSceneRender = wantsPreviousSceneRender;
        this.loadsNewScene = sceneLoadAction != null;

        if (wantsPreviousSceneRender)
            this.previousSceneRender = new egret.RenderTexture();
    }

    private _hasPreviousSceneRender;
    public get hasPreviousSceneRender() {
        if (!this._hasPreviousSceneRender) {
            this._hasPreviousSceneRender = true;
            return false;
        }

        return true;
    }

    public preRender() { }

    public render(){
        
    }

    public onBeginTransition(): Promise<any> {
        return new Promise((resolve) => {
            resolve(this.loadScene());
            this.transitionComplete();
        });
    }

    protected transitionComplete() {
        SceneManager.sceneTransition = null;

        if (this.previousSceneRender){
            this.previousSceneRender.dispose();
            this.previousSceneRender = null;
        }

        if (this.onTransitionCompleted){
            this.onTransitionCompleted();
        }
    }

    protected loadScene(): Promise<any> {
        return new Promise(async (resolve) => {
            if (this.onScreenObscured)
                this.onScreenObscured();

            if (!this.loadsNewScene) {
                this.isNewSceneLoaded = true;
                resolve();
            }

            SceneManager.scene = await this.sceneLoadAction();
            this.isNewSceneLoaded = true;
        });
    }
}