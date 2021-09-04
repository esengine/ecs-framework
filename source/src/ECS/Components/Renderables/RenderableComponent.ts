module es {
    export abstract class RenderableComponent extends Component implements IRenderable {
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
        public setSprite(sprite: Sprite): RenderableComponent {
            this._sprite = sprite;

            return this;
        }

        public getwidth() {
            return this.bounds.width;
        }

        public getheight() {
            return this.bounds.height;
        }

        protected _bounds: es.Rectangle = new es.Rectangle();
        public getbounds(): es.Rectangle {
            if (this._areBoundsDirty) {
                this._bounds.calculateBounds(this.entity.transform.position, this._localOffset, new es.Vector2(this.getwidth() / 2, this.getheight() / 2),
                    this.entity.transform.scale, this.entity.transform.rotation, this.getwidth(), this.getheight());
                this._areBoundsDirty = false;
            }
            return this._bounds;
        }
        public get bounds() {
            return this.getbounds();
        }
        protected _areBoundsDirty: boolean = true;
        public color: Color = Color.White;

        public get renderLayer() {
            return this._renderLayer;
        }
        public set renderLayer(value: number) {
            this.setRenderLayer(value);
        }

        protected _renderLayer: number = 0;

        public onEntityTransformChanged(comp: ComponentTransform) {
            this._areBoundsDirty = true;
        }

        public setColor(color: Color) {
            this.color = color;
            return this;
        }

        public get localOffset() {
            return this._localOffset;
        }
        public set localOffset(value: es.Vector2) {
            this.setLocalOffset(value);
        }

        public setLocalOffset(offset: es.Vector2) {
            if (!this._localOffset.equals(offset)) {
                this._localOffset = offset;
                this._areBoundsDirty = true;
            }

            return this;
        }

        public get isVisible() {
            return this._isVisible;
        }

        public set isVisible(value: boolean) {
            if (this._isVisible != value) {
                this._isVisible = value;

                if (this._isVisible) {
                    this.onBecameVisible();
                } else {
                    this.onBecameInvisible();
                }
            }
        }

        public debugRenderEnabled: boolean = true;

        protected _isVisible: boolean = false;
        protected _localOffset: es.Vector2 = new es.Vector2();

        public abstract render(batcher: IBatcher, camera: ICamera): void;

        protected onBecameVisible() {

        }

        protected onBecameInvisible() {

        }

        public setRenderLayer(renderLayer: number): RenderableComponent {
            if (renderLayer != this._renderLayer) {
                let oldRenderLayer = this._renderLayer;
                this._renderLayer = renderLayer;

                if (this.entity != null && this.entity.scene != null)
                    es.Core.scene.renderableComponents.updateRenderableRenderLayer(this, oldRenderLayer, this._renderLayer);
            }

            return this;
        }

        public isVisibleFromCamera(cam: ICamera): boolean {
            this.isVisible = cam.bounds.intersects(this.bounds);

            return this.isVisible;
        }

        public debugRender(batcher: IBatcher) {
            if (!this.debugRenderEnabled)
                return;

            let collider = null;
            for (let i = 0; i < this.entity.components.buffer.length; i++) {
                let component = this.entity.components.buffer[i];
                if (component instanceof Collider) {
                    collider = component;
                    break;
                }
            }

            if (collider == null) {
                batcher.drawHollowRect(this.bounds.x, this.bounds.y, this.bounds.width, this.bounds.height, new Color(255, 255, 0));
                batcher.end();
            }

            batcher.drawPixel(es.Vector2.add(this.entity.transform.position, this._localOffset), new Color(153, 50, 204), 4);
            batcher.end();
        }

        public tweenColorTo(to: Color, duration: number) {
            const tween = Pool.obtain(RenderableColorTween);
            tween.setTarget(this);
            tween.initialize(tween, to, duration);
            return tween;
        }
    }
}