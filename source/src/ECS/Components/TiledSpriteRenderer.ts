class TiledSpriteRenderer extends SpriteRenderer {
    protected sourceRect: Rectangle;

    public get scrollX(){
        return this.sourceRect.x;
    }
    public set scrollX(value: number){
        this.sourceRect.x = value;
    }
    public get scrollY(){
        return this.sourceRect.y;
    }
    public set scrollY(value: number){
        this.sourceRect.y = value;
    }

    constructor(sprite: Sprite){
        super();

        this.setSprite(sprite);
        this.sourceRect = sprite.sourceRect;
    }

    public render(camera: Camera){
        if (!this.sprite)
            return;

        super.render(camera);

        let renderTexture = new egret.RenderTexture();
        let targetTexture = new egret.Bitmap(this.sprite.texture2D);
        let clipBounds = new egret.Rectangle(this.sourceRect.x, this.sourceRect.y, this.sourceRect.width, this.sourceRect.height);
        renderTexture.drawToTexture(targetTexture, clipBounds);
        this.bitmap.texture = renderTexture;
    }
}