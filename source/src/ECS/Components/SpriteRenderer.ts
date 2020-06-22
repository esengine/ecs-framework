class SpriteRenderer extends RenderableComponent {
    private _sprite: Sprite;
    private _origin: Vector2;
    private _bitmap: egret.Bitmap;

    public get bounds(){
        if (this._areBoundsDirty){
            if (this._sprite){
                this._bounds.calculateBounds(this.entity.transform.position, this._localOffset, this._origin,
                    this.entity.transform.scale, this.entity.transform.rotation, this._sprite.texture2D.textureWidth,
                    this._sprite.texture2D.textureHeight);
                this._areBoundsDirty = false;
            }
        }

        return this._bounds;
    }

    public get sprite(){
        return this._sprite;
    }

    public set sprite(value: Sprite){
        this.setSprite(value);
    }

    public setSprite(sprite: Sprite): SpriteRenderer{
        this._sprite = sprite;
        if (this._sprite)
            this._origin = sprite.origin;

        this._bitmap = new egret.Bitmap(sprite.texture2D);
        this.stage.addChild(this._bitmap);

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
        this._bitmap.filters = [colorFilter];
    }

    public isVisibleFromCamera(camera: Camera): boolean{
        let topLeft = camera.screenToWorldPoint(new Vector2(0, 0));
        this.isVisible = new Rectangle(topLeft.x, topLeft.y, this.stage.stageWidth, this.stage.stageHeight).intersects(this.bounds);
        this._bitmap.visible = this.isVisible;
        return this.isVisible;
    }

    public render(camera: Camera){
        if (!this.sprite)
            return;
        
        this._bitmap.x = this.entity.transform.position.x - camera.transform.position.x + camera.origin.x;
        this._bitmap.y = this.entity.transform.position.y - camera.transform.position.y + camera.origin.y;
        this._bitmap.rotation = this.entity.transform.rotation + camera.transform.rotation;
        this._bitmap.anchorOffsetX = this._origin.x;
        this._bitmap.anchorOffsetY = this._origin.y;
        this._bitmap.scaleX = this.entity.transform.scale.x * camera.transform.scale.x;
        this._bitmap.scaleY = this.entity.transform.scale.y * camera.transform.scale.y;
    }

    public onRemovedFromEntity(){
        if (this._bitmap)
            this.stage.removeChild(this._bitmap);
    }
}