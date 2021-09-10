///<reference path="Sprite.ts" />
module es {
    export class NinePatchSprite extends Sprite {
        public left: number = 0;
        public right: number = 0;
        public top: number = 0;
        public bottom: number = 0;
        public ninePatchRects: Rectangle[] = [];

        /** 用于指示这九个补丁是否有额外的填充信息 */
        public hasPadding: boolean = false;

        public padLeft: number = 0;
        public padRight: number = 0;
        public padTop: number = 0;
        public padBottom: number = 0;

        constructor(texture: egret.Texture, sourceRect: Rectangle, left: number, right: number, top: number, bottom: number) {
            super(texture, sourceRect);
            this.left = left;
            this.right = right;
            this.top = top;
            this.bottom = bottom;

            this.generateNinePatchRects(sourceRect, this.ninePatchRects, left, right, top, bottom);
        }
    }
}