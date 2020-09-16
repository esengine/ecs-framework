module es {
    import Bitmap = egret.Bitmap;

    export class SpriteRenderer extends RenderableComponent {
        constructor(sprite: Sprite | egret.Texture = null) {
            super();
            if (sprite instanceof Sprite)
                this.setSprite(sprite);
            else if (sprite instanceof egret.Texture)
                this.setSprite(new Sprite(sprite));
        }

        public get bounds() {
            if (this._areBoundsDirty) {
                if (this._sprite) {
                    this._bounds.calculateBounds(this.entity.transform.position, this._localOffset, this._origin,
                        this.entity.transform.scale, this.entity.transform.rotation, this._sprite.sourceRect.width,
                        this._sprite.sourceRect.height);
                    this._areBoundsDirty = false;
                }
            }

            return this._bounds;
        }

        /**
         * 用归一化方法设置原点
         * x/y 均为 0-1
         */
        public get originNormalized(): Vector2 {
            return new Vector2(this._origin.x / this.width * this.entity.transform.scale.x,
                this._origin.y / this.height * this.entity.transform.scale.y);
        }

        /**
         * 用归一化方法设置原点
         * x/y 均为 0-1
         * @param value
         */
        public set originNormalized(value: Vector2) {
            this.setOrigin(new Vector2(value.x * this.width / this.entity.transform.scale.x,
                value.y * this.height / this.entity.transform.scale.y));
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
                this.displayObject.anchorOffsetX = this._origin.x;
                this.displayObject.anchorOffsetY = this._origin.y;
            }
            this.displayObject = new Bitmap(sprite.texture2D);
            this.displayObject.touchEnabled = false;

            return this;
        }

        /**
         * 设置可渲染的原点
         * @param origin
         */
        public setOrigin(origin: Vector2): SpriteRenderer {
            if (!this._origin.equals(origin)) {
                this._origin = origin;
                this.displayObject.anchorOffsetX = this._origin.x;
                this.displayObject.anchorOffsetY = this._origin.y;
                this._areBoundsDirty = true;
            }

            return this;
        }

        /**
         * 用归一化方法设置原点
         * x/y 均为 0-1
         * @param value
         */
        public setOriginNormalized(value: Vector2): SpriteRenderer {
            this.setOrigin(new Vector2(value.x * this.width / this.entity.transform.scale.x,
                value.y * this.height / this.entity.transform.scale.y));
            return this;
        }

        public render(camera: Camera) {
            this.sync(camera);

            if (this.displayObject.x != this.bounds.x - camera.bounds.x + this._origin.x) this.displayObject.x = this.bounds.x - camera.bounds.x + this._origin.x;
            if (this.displayObject.y != this.bounds.y - camera.bounds.y + this._origin.y) this.displayObject.y = this.bounds.y - camera.bounds.y + this._origin.y;
        }
    }
}

