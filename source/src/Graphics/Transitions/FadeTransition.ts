///<reference path="./SceneTransition.ts"/>
class FadeTransition extends SceneTransition {
    public fadeToColor: number = 0x000000;
    public fadeOutDuration = 0.4;
    private _color: number = 0xFFFFFF;
    private _toColor: number = 0xFFFFFF;
    private _destinationRect: Rectangle;
    private _overlayTexture: egret.RenderTexture;
    
    constructor(sceneLoadAction: Function){
        super(sceneLoadAction, true);
        this._destinationRect = new Rectangle(0, 0, this.previousSceneRender.textureWidth, this.previousSceneRender.textureHeight);
    }

    // public onBeginTransition(){
    //     this._overlayTexture = new egret.RenderTexture();
    //     let shape = new egret.Shape();
    //     shape.graphics.beginFill(0xFFFFFF, 1);
    //     shape.graphics.drawRect(0, 0, 1, 1);
    //     shape.graphics.endFill();
    //     this._overlayTexture.drawToTexture(shape);

    //     let elapsed = 0;
    //     let _toColor;
    //     while (elapsed < this.fadeOutDuration){
    //         elapsed += Time.deltaTime;
            
    //         // egret.Tween.get(this).to({_color: this._toColor, })
    //     }

        
    // }
}