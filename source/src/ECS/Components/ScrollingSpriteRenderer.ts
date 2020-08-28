///<reference path="./TiledSpriteRenderer.ts"/>
module es {
    import Bitmap = egret.Bitmap;

    export class ScrollingSpriteRenderer extends TiledSpriteRenderer {
        /**
         *  x自动滚动速度(以像素/s为单位)
         */
        public scrollSpeedX = 15;
        /**
         * 自动滚动的y速度(以像素/s为单位)
         */
        public scroolSpeedY = 0;

        public get textureScale(): Vector2 {
            return this._textureScale;
        }

        public set textureScale(value: Vector2){
            this._textureScale = value;

            // 重新计算我们的inverseTextureScale和源矩形大小
            this._inverseTexScale = new Vector2(1 / this._textureScale.x, 1 / this._textureScale.y);
        }

        public set scrollWidth(value: number){
            this._scrollWidth = value;
        }

        public get scrollWidth(){
            return this._scrollWidth;
        }

        public set scrollHeight(value: number){
            this._scrollHeight = value;
        }

        public get scrollHeight(){
            return this._scrollHeight;
        }

        private _scrollX = 0;
        private _scrollY = 0;
        private _scrollWidth = 0;
        private _scrollHeight = 0;

        constructor(sprite: Sprite) {
            super(sprite);

            this._scrollWidth = this.width;
            this._scrollHeight = this.height;
        }

        public update() {
            if (!this.sprite)
                return;

            this._scrollX += this.scrollSpeedX * Time.deltaTime;
            this._scrollY += this.scroolSpeedY * Time.deltaTime;

            this._sourceRect.x = Math.floor(this._scrollX);
            this._sourceRect.y = Math.floor(this._scrollY);
            this._sourceRect.width = this._scrollWidth + Math.abs(this._scrollX);
            this._sourceRect.height = this._scrollHeight + Math.abs(this._scrollY);
        }
    }
}
