class VerletDemo extends RenderableComponent {
    private _world: VerletWorld;
    private _stage: egret.Stage;

    protected getWidth(){
        return this.entity.scene.stage.stageWidth;
    }

    protected getHeight(){
        return this.entity.scene.stage.stageHeight;
    }

    public onAddedToEntity(){
        this._stage = this.entity.scene.stage;
        this._world = new VerletWorld(new Rectangle(0, 0, this.width, this.height));

        this._world.addComposite(new Box(new Vector2(100, 100), 50, 20));
        this._world.addComposite(new Box(new Vector2(10, 10), 200, 100));
    }

    public update(){
        this._world.update();
        this._world.debugRender(this._stage);
    }

    initialize() {
    }

}