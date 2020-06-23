class PostProcessor {
    public enable: boolean;
    public effect: egret.CustomFilter;
    public scene: Scene;
    public shape: egret.Shape;

    constructor(effect: egret.CustomFilter = null){
        this.enable = true;
        this.effect = effect;
    }

    public onAddedToScene(scene: Scene){
        this.scene = scene;
        this.shape = new egret.Shape();
        this.shape.graphics.beginFill(0xFFFFFF, 1);
        this.shape.graphics.drawRect(0, 0, SceneManager.stage.stageWidth, SceneManager.stage.stageHeight);
        this.shape.graphics.endFill();
        scene.addChild(this.shape);
    }

    public process(){
        this.drawFullscreenQuad();
    }

    public onSceneBackBufferSizeChanged(newWidth: number, newHeight: number){}

    protected drawFullscreenQuad(){
        this.shape.filters = [this.effect];
    }

    public unload(){
        if (this.effect){
            this.effect = null;
        }

        this.scene.removeChild(this.shape);
        this.scene = null;
    }
}