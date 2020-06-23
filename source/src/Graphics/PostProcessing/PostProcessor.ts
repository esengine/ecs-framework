class PostProcessor {
    public enable: boolean;
    public effect: egret.CustomFilter;
    public scene: Scene;
    public shape: egret.Shape;

    constructor(effect: egret.CustomFilter = null){
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

    protected drawFullscreenQuad(texture: egret.DisplayObject, effect: egret.CustomFilter = null){
        this.shape.graphics.clear();
        this.shape.graphics.beginFill(0x000000, 1);
        this.shape.graphics.drawRect(0, 0, texture.width, texture.height);
        this.shape.graphics.endFill();
        this.shape.filters = [effect];
    }

    public unload(){
        if (this.effect){
            this.effect = null;
        }

        this.scene = null;
        this.scene.removeChild(this.shape);
    }
}