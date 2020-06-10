class SpriteRenderer extends RenderableComponent {
    private _sprite: egret.DisplayObject;
    private _origin: Vector2;

    public get sprite(){
        return this._sprite;
    }

    public set sprite(value: egret.DisplayObject){
        this.setSprite(value);
    }

    public setSprite(sprite: egret.DisplayObject): SpriteRenderer{
        this._sprite = sprite;
        if (this._sprite)
            this._origin = new Vector2(this._sprite.anchorOffsetX, this._sprite.anchorOffsetY);

        return this;
    }

    public initialize() {

    }
}