///<reference path="./SpriteRenderer.ts" />
module es {
    import Bitmap = egret.Bitmap;
    import RenderTexture = egret.RenderTexture;

    /**
     * 滚动由两张图片组合而成
     */
    export class TiledSpriteRenderer extends SpriteRenderer {
        public get bounds(): Rectangle {
            if (this._areBoundsDirty){
                if (this._sprite){
                    this._bounds.calculateBounds(this.entity.transform.position, this._localOffset, this._origin,
                        this.entity.transform.scale, this.entity.transform.rotation, this.width, this.height);
                    this._areBoundsDirty = false;
                }
            }

            return this._bounds;
        }

        /**
         * 纹理滚动的x值
         */
        public get scrollX() {
            return this._sourceRect.x;
        }

        /**
         * 纹理滚动的x值
         * @param value
         */
        public set scrollX(value: number) {
            this._sourceRect.x = value;
        }

        /**
         * 纹理滚动的y值
         */
        public get scrollY() {
            return this._sourceRect.y;
        }

        /**
         * 纹理滚动的y值
         * @param value
         */
        public set scrollY(value: number) {
            this._sourceRect.y = value;
        }

        /**
         * 纹理比例尺
         */
        public get textureScale(): Vector2 {
            return this._textureScale;
        }

        /**
         * 纹理比例尺
         * @param value
         */
        public set textureScale(value: Vector2) {
            this._textureScale = value;

            // 重新计算我们的inverseTextureScale和源矩形大小
            this._inverseTexScale = new Vector2(1 / this._textureScale.x, 1 / this._textureScale.y);
            this._sourceRect.width = Math.floor(this._sprite.sourceRect.width * this._inverseTexScale.x);
            this._sourceRect.height = Math.floor(this._sprite.sourceRect.height * this._inverseTexScale.y);
        }

        /**
         * 覆盖宽度值，这样TiledSprite可以有一个独立于其纹理的宽度
         */
        public get width(): number{
            return this._sourceRect.width;
        }

        public set width(value: number) {
            this._areBoundsDirty = true;
            this._sourceRect.width = value;
        }

        public get height(): number {
            return this._sourceRect.height;
        }

        public set height(value: number) {
            this._areBoundsDirty = true;
            this._sourceRect.height = value;
        }

        public get gapXY(): Vector2{
            return new Vector2(this._gapX, this._gapY);
        }

        public set gapXY(value: Vector2){
            this._gapX = value.x;
            this._gapY = value.y;

            let renderTexture = new RenderTexture();
            let newRectangle = this.sprite.sourceRect;
            newRectangle.x = 0;
            newRectangle.y = 0;
            newRectangle.width += this._gapX;
            newRectangle.height += this._gapY;
            renderTexture.drawToTexture(this.displayObject, newRectangle);

            if (!this.displayObject){
                this.displayObject = new Bitmap(renderTexture);
            }else{
                (this.displayObject as Bitmap).texture = renderTexture;
            }
        }

        protected _sourceRect: Rectangle;
        protected _textureScale = Vector2.one;
        protected _inverseTexScale = Vector2.one;
        private _gapX = 0;
        private _gapY = 0;

        constructor(sprite: Sprite) {
            super(sprite);

            this._sourceRect = sprite.sourceRect;
            let bitmap = this.displayObject as Bitmap;
            bitmap.$fillMode = egret.BitmapFillMode.REPEAT;
        }

        /**
         * 设置间隔
         * @param value
         */
        public setGapXY(value: Vector2): TiledSpriteRenderer {
            this.gapXY = value;
            return this;
        }

        public render(camera: es.Camera) {
            super.render(camera);

            let bitmap = this.displayObject as Bitmap;
            bitmap.width = this.width;
            bitmap.height = this.height;
            bitmap.scrollRect = this._sourceRect;
        }
    }
}
