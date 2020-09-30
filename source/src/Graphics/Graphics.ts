module es {
    export class Graphics {
        public static Instance: Graphics;
        /**
         * 用于绘制矩形、线条、圆等的精灵。
         * 将在启动时生成，但你可以用你的图集中的精灵代替，以减少纹理交换。应该是一个1x1的白色像素
         */
        public pixelTexture: Sprite;

        constructor(){
            let arrayBuffer = new ArrayBuffer(1);
            arrayBuffer[0] = 0xffffff;
            egret.BitmapData.create("arraybuffer", arrayBuffer, bitmapData => {
                let tex = new egret.Texture();
                tex.bitmapData = bitmapData;
                this.pixelTexture = new Sprite(tex);
            });
        }
    }
}