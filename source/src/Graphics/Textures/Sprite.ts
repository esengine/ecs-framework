module es {
    export class Sprite extends cc.Sprite {
        public readonly sourceRect: Rectangle = new Rectangle();
        public readonly center: Vector2 = Vector2.zero;
        public origin: Vector2 = Vector2.zero;
        public readonly uvs: Rectangle = new Rectangle();

        constructor(texture: cc.Texture2D,
            sourceRect?: Rectangle,
            origin?: Vector2) {
            super();
            if (!texture)
                return;
            this.spriteFrame = new cc.SpriteFrame(texture);
            if (!sourceRect) {
                sourceRect = new Rectangle(0, 0, texture.width, texture.height);
            }
            if (!origin) {
                origin = sourceRect.getHalfSize();
            }
            this.sourceRect = sourceRect;
            this.center = new Vector2(sourceRect.width * 0.5, sourceRect.height * 0.5);
            this.origin = origin;

            let inverseTexW = 1 / texture.width;
            let inverseTexH = 1 / texture.height;

            this.uvs.x = sourceRect.x * inverseTexW;
            this.uvs.y = sourceRect.y * inverseTexH;
            this.uvs.width = sourceRect.width * inverseTexW;
            this.uvs.height = sourceRect.height * inverseTexH;
        }
    }
}