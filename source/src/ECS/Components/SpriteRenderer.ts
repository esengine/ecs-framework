class SpriteRenderer extends RenderableComponent {
    private _origin: Vector2;

    public get origin(){
        return this._origin;
    }
    public set origin(value: Vector2){
        this.setOrigin(value);
    }
    public setOrigin(origin: Vector2){
        if (this._origin != origin){
            this._origin = origin;
            this._areBoundsDirty = true;
        }
        return this;
    }

    public setSprite(sprite: Sprite){
        this.removeChildren();
        this.addChild(new egret.Bitmap(sprite.texture2D));
    }

    public setColor(color: number){
        let colorMatrix = [
            1, 0, 0, 0, 0,
            0, 1, 0, 0, 0,
            0, 0, 1, 0, 0,
            0, 0, 0, 1, 0
        ];
        colorMatrix[0] = Math.floor(color / 256 / 256) / 255;
        colorMatrix[6] = Math.floor(color / 256 % 256) / 255;
        colorMatrix[12] = color % 256 / 255;
        let colorFilter = new egret.ColorMatrixFilter(colorMatrix);
        this.filters = [colorFilter];
    }

    public isVisibleFromCamera(camera: Camera): boolean{
        let topLeft = camera.screenToWorldPoint(new Vector2(0, 0));
        this.isVisible = new Rectangle(topLeft.x, topLeft.y, this.stage.stageWidth, this.stage.stageHeight).intersects(this.bounds);
        this.visible = this.isVisible;
        return this.isVisible;
    }

    public render(camera: Camera){

    }

    public onRemovedFromEntity(){
        if (this.parent)
            this.parent.removeChild(this);
    }
}