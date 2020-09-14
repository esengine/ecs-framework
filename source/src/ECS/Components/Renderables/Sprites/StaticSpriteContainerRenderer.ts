module es {
    import Bitmap = egret.Bitmap;

    export class StaticSpriteContainerRenderer extends RenderableComponent {
        public displayObject: egret.DisplayObjectContainer = new egret.DisplayObjectContainer();
        private displayObjectCache: Map<Sprite, Bitmap> = new Map<Sprite, Bitmap>();

        constructor(sprite: Sprite[] | egret.Texture[] = null) {
            super();
            for (let s of sprite){
                if (s instanceof Sprite)
                    this.pushSprite(s);
                else if (s instanceof egret.Texture)
                    this.pushSprite(new Sprite(s));
            }

            this.displayObject.cacheAsBitmap = true;
        }

        public get bounds() {
            if (this._areBoundsDirty) {
                if (this.displayObject) {
                    this._bounds.calculateBounds(this.entity.transform.position, this._localOffset, this._origin,
                        this.entity.transform.scale, this.entity.transform.rotation, this.displayObject.width,
                        this.displayObject.height);
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

        /**
         * 设置精灵并更新精灵的原点以匹配sprite.origin
         * @param sprite
         */
        public pushSprite(sprite: Sprite): StaticSpriteContainerRenderer {
            if (sprite) {
                this._origin = sprite.origin;
                this.displayObject.anchorOffsetX = this._origin.x;
                this.displayObject.anchorOffsetY = this._origin.y;
            }
            let bitmap = new Bitmap(sprite.texture2D);
            this.displayObject.addChild(new Bitmap(sprite.texture2D));
            this.displayObjectCache.set(sprite, bitmap);

            return this;
        }

        /**
         *
         * @param sprite
         */
        public getSprite(sprite: Sprite): Bitmap{
            return this.displayObjectCache.get(sprite);
        }

        /**
         * 设置可渲染的原点
         * @param origin
         */
        public setOrigin(origin: Vector2): StaticSpriteContainerRenderer {
            if (this._origin != origin) {
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
        public setOriginNormalized(value: Vector2): StaticSpriteContainerRenderer {
            this.setOrigin(new Vector2(value.x * this.width / this.entity.transform.scale.x,
                value.y * this.height / this.entity.transform.scale.y));
            return this;
        }

        public render(camera: Camera) {
            this.sync(camera);

            if (this.displayObject.x != this.bounds.x - camera.bounds.x) this.displayObject.x = this.bounds.x - camera.bounds.x;
            if (this.displayObject.y != this.bounds.y - camera.bounds.y) this.displayObject.y = this.bounds.y - camera.bounds.y;
        }
    }
}