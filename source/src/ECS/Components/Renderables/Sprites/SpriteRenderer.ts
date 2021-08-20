module es {
    export class SpriteRenderer extends RenderableComponent {
        constructor(sprite: Sprite | egret.Texture = null) {
            super();
            if (sprite instanceof Sprite)
                this.setSprite(sprite);
            else if (sprite instanceof egret.Texture)
                this.setSprite(new Sprite(sprite));
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

        /**
         * 设置精灵并更新精灵的原点以匹配sprite.origin
         * @param sprite
         */
        public setSprite(sprite: Sprite): SpriteRenderer {
            this._sprite = sprite;
            if (this._sprite) {
                this._origin = this._sprite.origin;
            }

            return this;
        }

        /**
         * 设置可渲染的原点
         * @param origin
         */
        public setOrigin(origin: Vector2): SpriteRenderer {
            if (!this._origin.equals(origin)) {
                this._origin = origin;
            }

            return this;
        }

        public render(batcher: Batcher, camera: Camera) {

        }
    }
}