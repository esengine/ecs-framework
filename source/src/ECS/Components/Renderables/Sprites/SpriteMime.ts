module es {
    /**
     * 此组件将在每一帧中绘制相同的 spriteToMime
     * 渲染的唯一区别是 SpriteMime 使用自己的localOffset 和颜色
     * 这允许您将其用于阴影（通过 localPosition 偏移）
     */
    export class SpriteMime extends RenderableComponent {
        public getwidth() {
            return this._spriteToMime.getwidth();
        }

        public getheight() {
            return this._spriteToMime.getheight();
        }

        public getbounds() {
            return this._spriteToMime.bounds;
        }

        _spriteToMime: SpriteRenderer;
        _mimeSprite: Sprite;

        constructor(spriteToMime?: SpriteRenderer) {
            super();

            if (this._spriteToMime) {
                this._spriteToMime = spriteToMime;
                this._mimeSprite = spriteToMime.sprite.clone();
            }
        }

        public onAddedToEntity() {
            if (this._spriteToMime == null) {
                this._spriteToMime = this.getComponent(SpriteRenderer);
                if (this._spriteToMime) {
                    this._mimeSprite = this._spriteToMime.sprite.clone();
                } else {
                    this.enabled = false;
                }
            }
        }

        public onRemovedFromEntity() {
            if (this._mimeSprite) {
                this._mimeSprite.dispose();
            }
        }
        
        public render(batcher: Batcher, camera: Camera) {
            batcher.drawSprite(this._mimeSprite, this.entity.transform.position.add(this._localOffset), this.color,
                this.entity.transform.rotationDegrees, this._mimeSprite.origin, this.entity.transform.scale, this._layerDepth);
        }
    }
}