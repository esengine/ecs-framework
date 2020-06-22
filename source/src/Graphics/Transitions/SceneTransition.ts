/**
 * SceneTransition用于从一个场景过渡到另一个场景或在一个有效果的场景中过渡
 */
abstract class SceneTransition {
    private _hasPreviousSceneRender: boolean;
    /** 是否加载新场景的标志 */
    public loadsNewScene: boolean;
    /** 
     * 将此用于两个部分的转换。例如，淡出会先淡出到黑色，然后当isNewSceneLoaded为true，它会淡出。
     * 对于场景过渡，isNewSceneLoaded应该在中点设置为true，这就标识一个新的场景被加载了。
     */
    public isNewSceneLoaded: boolean;
    /** 返回新加载场景的函数 */
    protected sceneLoadAction: Function;
    /** 在loadNextScene执行时调用。这在进行场景间过渡时很有用，这样你就知道什么时候可以更多地使用相机或者重置任何实体 */
    public onScreenObscured: Function;
    /** 当转换完成执行时调用，以便可以调用其他工作，比如启动另一个转换。 */
    public onTransitionCompleted: Function;

    public get hasPreviousSceneRender(){
        if (!this._hasPreviousSceneRender){
            this._hasPreviousSceneRender = true;
            return false;
        }

        return true;
    }

    constructor(sceneLoadAction: Function) {
        this.sceneLoadAction = sceneLoadAction;
        this.loadsNewScene = sceneLoadAction != null;
    }

    public preRender() { }

    public render() {

    }

    public onBeginTransition() {
        this.loadNextScene();
        this.transitionComplete();
    }

    protected transitionComplete() {
        SceneManager.sceneTransition = null;

        if (this.onTransitionCompleted) {
            this.onTransitionCompleted();
        }
    }

    protected loadNextScene() {
        if (this.onScreenObscured)
            this.onScreenObscured();

        if (!this.loadsNewScene) {
            this.isNewSceneLoaded = true;
        }

        SceneManager.scene = this.sceneLoadAction();
        this.isNewSceneLoaded = true;
    }

    public tickEffectProgressProperty(filter: egret.CustomFilter, duration: number, easeType: Function, reverseDirection = false){
        return new Promise((resolve)=>{
            let start = reverseDirection ? 1 : 0;
            let end = reverseDirection ? 0 : 1;

            egret.Tween.get(filter.uniforms).set({_progress: start}).to({_progress: end}, duration * 1000, easeType).call(()=>{
                resolve();
            });
        });
    }
}