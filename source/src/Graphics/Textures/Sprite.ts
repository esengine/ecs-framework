module es {
    export class Sprite {
        public texture2D: egret.Texture;
        public readonly sourceRect: Rectangle;
        public readonly center: Vector2;
        public origin: Vector2;
        public readonly uvs: Rectangle = new Rectangle();

        constructor(texture: egret.Texture,
            sourceRect: Rectangle = new Rectangle(0, 0, texture.textureWidth, texture.textureHeight),
            origin: Vector2 = sourceRect.getHalfSize()) {
            this.texture2D = texture;
            this.sourceRect = sourceRect;
            this.center = new Vector2(sourceRect.width * 0.5, sourceRect.height * 0.5);
            this.origin = origin;

            let inverseTexW = 1 / texture.textureWidth;
            let inverseTexH = 1 / texture.textureHeight;

            this.uvs.x = sourceRect.x * inverseTexW;
            this.uvs.y = sourceRect.y * inverseTexH;
            this.uvs.width = sourceRect.width * inverseTexW;
            this.uvs.height = sourceRect.height * inverseTexH;
        }

        /**
         * 提供一个精灵的列/行等间隔的图集的精灵列表
         * @param texture
         * @param cellWidth
         * @param cellHeight
         * @param cellOffset 处理时要包含的第一个单元格。基于0的索引
         * @param maxCellsToInclude 包含的最大单元
         */
        public static spritesFromAtlas(texture: egret.Texture, cellWidth: number, cellHeight: number,
            cellOffset: number = 0, maxCellsToInclude: number = Number.MAX_VALUE) {
            let sprites: Sprite[] = [];
            let cols = texture.textureWidth / cellWidth;
            let rows = texture.textureHeight / cellHeight;
            let i = 0;
            let spriteSheet = new egret.SpriteSheet(texture);

            for (let y = 0; y < rows; y++) {
                for (let x = 0; x < cols; x++) {
                    if (i++ < cellOffset) continue;

                    let texture = spriteSheet.getTexture(`${y}_${x}`);
                    if (!texture)
                        texture = spriteSheet.createTexture(`${y}_${x}`, x * cellWidth, y * cellHeight, cellWidth, cellHeight);
                    sprites.push(new Sprite(texture));

                    if (sprites.length == maxCellsToInclude) return sprites;
                }
            }

            return sprites;
        }
    }
}