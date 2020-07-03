class SpriteRenderer extends RenderableComponent {
    private _origin: Vector2;
    private _bitmap: egret.Bitmap;
    private _sprite: Sprite;

    public get origin(){
        return this._origin;
    }
    public set origin(value: Vector2){
        this.setOrigin(value);
    }
    public setOrigin(origin: Vector2){
        if (this._origin != origin){
            this._origin = origin;
        }
        return this;
    }
    /** 应该由这个精灵显示的精灵。当设置时，精灵的原点也被设置为匹配精灵.origin。 */
    public get sprite(): Sprite{
        return this._sprite;
    }
    /** 应该由这个精灵显示的精灵。当设置时，精灵的原点也被设置为匹配精灵.origin。 */
    public set sprite(value: Sprite){
        this.setSprite(value);
    }

    public setSprite(sprite: Sprite): SpriteRenderer{
        this.removeChildren();
        this._sprite = sprite;
        if (this._sprite) this._origin = this._sprite.origin;
        this._bitmap = new egret.Bitmap(sprite.texture2D);
        this.addChild(this._bitmap);

        return this;
    }

    public setColor(color: number): SpriteRenderer{
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

        return this;
    }

    public isVisibleFromCamera(camera: Camera): boolean{
        this.isVisible = new Rectangle(0, 0, this.stage.stageWidth, this.stage.stageHeight).intersects(this.bounds);
        this.visible = this.isVisible;
        return this.isVisible;
    }

    /** 渲染处理 在每个模块中处理各自的渲染逻辑 */
    public render(camera: Camera){
        this.x = this.entity.position.x - this.origin.x - camera.position.x + camera.origin.x;
        this.y = this.entity.position.y - this.origin.y - camera.position.y + camera.origin.y;
    }

    public onRemovedFromEntity(){
        if (this.parent)
            this.parent.removeChild(this);
    }

    public reset(){
    }
}
