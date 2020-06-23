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
        scene.addChild(this.shape);
    }

    public process(source: egret.DisplayObject){
        this.drawFullscreenQuad(source, this.effect);
    }

    public onSceneBackBufferSizeChanged(newWidth: number, newHeight: number){}

    protected drawFullscreenQuad(texture: egret.DisplayObject, effect: egret.CustomFilter = null){
        texture.filters = [effect];
    }

    public unload(){
        if (this.effect){
            this.effect = null;
        }

        this.scene.removeChild(this.shape);
        this.scene = null;
    }
}