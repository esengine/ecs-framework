class SpriteRenderer extends RenderableComponent {
    private _sprite: egret.DisplayObject;
    private _origin: Vector2;

    public get bounds(){
        if (this._areBoundsDirty){
            if (this._sprite){
                this._bounds.calculateBounds(this.entity.transform.position, this._localOffset, this._origin,
                    this.entity.transform.scale, this.entity.transform.rotation, this._sprite.width,
                    this._sprite.height);
                this._areBoundsDirty = false;
            }

            return this.bounds;
        }
    }

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

    public render(camera: Camera) {
        if (!this.sprite)
            return;
        
        this.sprite.x = this.entity.transform.position.x;
        this.sprite.y = this.entity.transform.position.y;
        this.sprite.rotation = this.entity.transform.rotation;
        this.sprite.anchorOffsetX = this._origin.x;
        this.sprite.anchorOffsetY = this._origin.y;
        this.sprite.scaleX = this.entity.transform.scale.x;
        this.sprite.scaleY = this.entity.transform.scale.y;
    }
}