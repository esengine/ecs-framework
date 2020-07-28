///<reference path="./TiledSpriteRenderer.ts"/>
module es {
    export class ScrollingSpriteRenderer extends TiledSpriteRenderer {
        public scrollSpeedX = 15;
        public scroolSpeedY = 0;
        private _scrollX = 0;
        private _scrollY = 0;

        public update(){
            this._scrollX += this.scrollSpeedX * Time.deltaTime;
            this._scrollY += this.scroolSpeedY * Time.deltaTime;
            this.sourceRect.x = this._scrollX;
            this.sourceRect.y = this._scrollY;
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
        }
    }
}
