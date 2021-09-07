module es {
    export class SpriteRenderer extends RenderableComponent {
        public getbounds() {
            if (this._areBoundsDirty) {
                if (this._sprite != null) {
                    this._bounds.calculateBounds(this.entity.transform.position, this._localOffset, this._origin,
                        this.entity.transform.scale, this.entity.transform.rotation, this._sprite.sourceRect.width,
                        this._sprite.sourceRect.height);
                }
                this._areBoundsDirty = false;
            }

            return this._bounds;
        }

        constructor(sprite: Sprite |egret.Texture = null) {
            super();
            if (sprite instanceof Sprite) {
                this.setSprite(sprite);
            }
            else if (sprite instanceof egret.Texture) {
                this.setSprite(new Sprite(sprite));
            }
        }

        protected _origin: Vector2;

        /**
         * 精灵的原点。这是在设置精灵时自动设置的
         */
        public get origin(): Vector2 {
            return this._origin;
        }

        /**
         * 精灵的原点。这是在设置精灵时自动设置的
         * @param value
         */
        public set origin(value: Vector2) {
            this.setOrigin(value);
        }

        public get originNormalized() {
            return new Vector2(this._origin.x / this.getwidth() * this.entity.transform.scale.x,
                this._origin.y / this.getheight() * this.entity.transform.scale.y);
        }

        public set originNormalized(value: Vector2) {
            this.setOrigin(new Vector2(value.x * this.getwidth() / this.entity.transform.scale.x,
                value.y))
        }
        
        /**
         * 设置精灵并更新精灵的原点以匹配sprite.origin
         * @param sprite
         */
        public setSprite(sprite: Sprite): SpriteRenderer {
            if (!this._sprite) {
                this._sprite = sprite.clone();
            } else {
                this._sprite.setTexture(sprite.texture);
            }
            if (this._sprite) {
                this._origin = this._sprite.origin;
            }
            this._areBoundsDirty = true;

            return this;
        }

        /**
         * 设置可渲染的原点
         * @param origin
         */
        public setOrigin(origin: Vector2): SpriteRenderer {
            if (!this._origin.equals(origin)) {
                this._origin = origin;
                this._areBoundsDirty = true;
            }

            return this;
        }

        public setOriginNormalized(value: Vector2): SpriteRenderer {
            this.setOrigin(new Vector2(value.x * this.getwidth() / this.entity.transform.scale.x,
                value.y * this.getheight() / this.entity.transform.scale.y));

            return this;
        }

        public render(batcher: Batcher, camera: Camera) {
            batcher.drawSprite(this.sprite, this.entity.transform.position.add(this.localOffset),
                this.color, this.entity.transform.rotationDegrees, this.origin, this.entity.transform.scale, this._layerDepth);
        }
    }
}