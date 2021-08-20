module es {
    export class SpriteRenderer extends Component {
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

        protected _sprite: Sprite;

        /**
         * 应该由这个精灵显示的精灵
         * 当设置时，精灵的原点也被设置为精灵的origin
         */
        public get sprite(): Sprite {
            return this._sprite;
        }

        /**
         * 应该由这个精灵显示的精灵
         * 当设置时，精灵的原点也被设置为精灵的origin
         * @param value
         */
        public set sprite(value: Sprite) {
            this.setSprite(value);
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
    }
}