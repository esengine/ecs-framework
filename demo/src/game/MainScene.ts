class MainScene extends Scene {
    constructor(displayContent: egret.DisplayObject){
        super(displayContent);

        this.addEntityProcessor(new SpawnerSystem(new Matcher()));
    }
}