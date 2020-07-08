///<reference path="./SpriteRenderer.ts" />
/**
 * 滚动由两张图片组合而成
 */
class TiledSpriteRenderer extends SpriteRenderer {
    protected sourceRect: Rectangle;
    protected leftTexture: egret.Bitmap;
    protected rightTexture: egret.Bitmap;

    public get scrollX() {
        return this.sourceRect.x;
    }
    public set scrollX(value: number) {
        this.sourceRect.x = value;
    }
    public get scrollY() {
        return this.sourceRect.y;
    }
    public set scrollY(value: number) {
        this.sourceRect.y = value;
    }

    constructor(sprite: Sprite) {
        super();

        this.leftTexture = new egret.Bitmap();
        this.rightTexture = new egret.Bitmap();
        this.leftTexture.texture = sprite.texture2D;
        this.rightTexture.texture = sprite.texture2D;
        
        this.setSprite(sprite);
        this.sourceRect = sprite.sourceRect;
    }

    public render(camera: Camera) {
        if (!this.sprite)
            return;

        super.render(camera);

        let renderTexture = new egret.RenderTexture();
        let cacheBitmap = new egret.DisplayObjectContainer();
        cacheBitmap.removeChildren();
        cacheBitmap.addChild(this.leftTexture);
        cacheBitmap.addChild(this.rightTexture);

        this.leftTexture.x = this.sourceRect.x;
        this.rightTexture.x = this.sourceRect.x - this.sourceRect.width;
        this.leftTexture.y = this.sourceRect.y;
        this.rightTexture.y = this.sourceRect.y;

        cacheBitmap.cacheAsBitmap = true;
        renderTexture.drawToTexture(cacheBitmap, new egret.Rectangle(0, 0, this.sourceRect.width, this.sourceRect.height));

        this.bitmap.texture = renderTexture;
    }
}