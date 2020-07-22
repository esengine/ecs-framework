class PostProcessor {
    public enabled: boolean;
    public effect: egret.Filter;
    public scene: Scene;
    public shape: egret.Shape;

    public static default_vert = "attribute vec2 aVertexPosition;\n" + 
        "attribute vec2 aTextureCoord;\n" + 
        "attribute vec2 aColor;\n" + 
        
        "uniform vec2 projectionVector;\n" + 
        //"uniform vec2 offsetVector;\n" + 

        "varying vec2 vTextureCoord;\n" + 
        "varying vec4 vColor;\n" + 

        "const vec2 center = vec2(-1.0, 1.0);\n" + 

        "void main(void) {\n" + 
        "gl_Position = vec4( (aVertexPosition / projectionVector) + center , 0.0, 1.0);\n" + 
        "vTextureCoord = aTextureCoord;\n" + 
        "vColor = vec4(aColor.x, aColor.x, aColor.x, aColor.x);\n" + 
        "}";

    constructor(effect: egret.Filter = null){
        this.enabled = true;
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
        this.scene.filters = [this.effect];
        // this.shape.filters = [this.effect];
    }

    public unload(){
        if (this.effect){
            this.effect = null;
        }

        this.scene.removeChild(this.shape);
        this.scene = null;
    }
}