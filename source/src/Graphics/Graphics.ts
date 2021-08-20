module es {
    export class Graphics {
        public static instance: Graphics;
        public batcher: IBatcher;
        public pixelTexture: egret.Sprite;

        constructor() {
            this.batcher = new Batcher();
            this.pixelTexture = new egret.Sprite();
            this.pixelTexture.graphics.drawRect(0, 0, 1, 1);
            this.pixelTexture.graphics.endFill();
        }
    }
}