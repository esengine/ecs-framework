///<reference path="./TiledSpriteRenderer.ts"/>
module es {
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

        private _scrollX = 0;
        private _scrollY = 0;

        constructor(sprite: Sprite) {
            super(sprite);
        }

        public update() {
            this._scrollX += this.scrollSpeedX * Time.deltaTime;
            this._scrollY += this.scroolSpeedY * Time.deltaTime;
            this._sourceRect.x = this._scrollX;
            this._sourceRect.y = this._scrollY;
        }
    }
}
