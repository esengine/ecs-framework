module es {
    export class Sprite extends egret.Bitmap {
        private _sourceRect: Rectangle = new Rectangle();
        public get sourceRect() {
            return this._sourceRect;
        }
        private _center: Vector2 = Vector2.zero;
        public get center() {
            return this._center;
        }
        public origin: Vector2 = Vector2.zero;
        public readonly uvs: Rectangle = new Rectangle();
        private _dispose = false;
        public get isDispose() {
            return this._dispose;
        }

        constructor(texture: egret.Texture,
            sourceRect?: Rectangle,
            origin?: Vector2) {
            super();
            this.setTexture(texture, sourceRect, origin);
        }

        public setTexture(texture: egret.Texture, sourceRect?: Rectangle,
            origin?: Vector2) {
            if (!texture)
                return;
            this.texture = texture;
            if (!sourceRect) {
                sourceRect = new Rectangle(0, 0, texture.textureWidth, texture.textureHeight);
            }
            if (!origin) {
                origin = sourceRect.getHalfSize();
            }
            this._sourceRect = sourceRect;
            this._center = new Vector2(sourceRect.width * 0.5, sourceRect.height * 0.5);
            this.origin = origin;

            let inverseTexW = 1 / texture.textureWidth;
            let inverseTexH = 1 / texture.textureHeight;

            this.uvs.x = sourceRect.x * inverseTexW;
            this.uvs.y = sourceRect.y * inverseTexH;
            this.uvs.width = sourceRect.width * inverseTexW;
            this.uvs.height = sourceRect.height * inverseTexH;
        }

        /**
         * 生成九个补丁矩形。 destArray 应该有 9 个元素。 
         * renderRect 是将渲染九个补丁的最终区域。 
         * 在 Sprite.sourceRect 中获取渲染通道的源矩形。 
         * 传入更大的 Rectangle 以获得最终目标渲染 Rectangles。
         * @param renderRect 
         * @param destArray 
         * @param marginLeft 
         * @param marginRight 
         * @param mariginTop 
         * @param marginBottom 
         */
        public generateNinePatchRects(renderRect: Rectangle, destArray: Rectangle[], marginLeft: number, marginRight: number, mariginTop: number, marginBottom: number) {
            Insist.isTrue(destArray.length == 9, "destArray 的长度不是 9");

            const stretchedCenterWidth = renderRect.width - marginLeft - marginRight;
            const stretchedCenterHeight = renderRect.height - mariginTop - marginBottom;
            const bottomY = renderRect.y + renderRect.height - marginBottom;
            const rightX = renderRect.x + renderRect.width - marginRight;
            const leftX = renderRect.x + marginLeft;
            const topY = renderRect.y + mariginTop;

            destArray[0] = new Rectangle(renderRect.x, renderRect.y, marginLeft, mariginTop);
            destArray[1] = new Rectangle(leftX, renderRect.y, stretchedCenterWidth, mariginTop);
            destArray[2] = new Rectangle(rightX, renderRect.y, marginRight, mariginTop);
            destArray[3] = new Rectangle(renderRect.x, topY, marginLeft, stretchedCenterHeight);
            destArray[4] = new Rectangle(leftX, topY, stretchedCenterWidth, stretchedCenterHeight);
            destArray[5] = new Rectangle(rightX, topY, marginRight, stretchedCenterHeight);
            destArray[6] = new Rectangle(renderRect.x, bottomY, marginLeft, marginBottom);
            destArray[7] = new Rectangle(leftX, bottomY, stretchedCenterWidth, marginBottom);
            destArray[8] = new Rectangle(rightX, bottomY, marginRight, marginBottom);
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

        public clone() {
            return new Sprite(this.texture, this.sourceRect, this.origin);
        }

        /**
         * 销毁Sprite
         * 注意: disposeTexture开启后所有用到该纹理的组件也将被销毁
         * 请确保其他引用该纹理的组件未引用该纹理后开启
         * @param disposeTexture 是否销毁纹理
         */
        public dispose(disposeTexture: boolean = false) {
            if (this.parent) {
                this.parent.removeChild(this);
            }
            if (disposeTexture) {
                this.texture.dispose();
            }
            this._dispose = true;
        }
    }
}