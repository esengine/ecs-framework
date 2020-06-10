class VerletDemo extends RenderableComponent {
    private _world: VerletWorld;

    protected getWidth(){
        return 800;
    }

    protected getHeight(){
        return 600;
    }

    public onAddedToEntity(){
        this._world = new VerletWorld(new Rectangle(0, 0, 800, 600));

        this._world.addComposite(new Box(new Vector2(100, 100), 50, 20));
        this._world.addComposite(new Box(new Vector2(10, 10), 200, 100));
        this._world.debugRender(this.entity.scene.stage);
    }

    public update(){
        this._world.update();
    }

    initialize() {
    }

}