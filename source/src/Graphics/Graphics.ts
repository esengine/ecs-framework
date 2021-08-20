module es {
    export class Graphics {
        public static instance: Graphics;
        public batcher: IBatcher;
        public pixelTexture: egret.Sprite;

        constructor(batcher: IBatcher) {
            this.batcher = batcher;
            this.pixelTexture = new egret.Sprite();
            this.pixelTexture.width = 1;
            this.pixelTexture.height = 1;
        }
    }
}