///<reference path="../PooledComponent.ts" />
module es {
    /**
     * 所有可渲染组件的基类
     */
    export abstract class RenderableComponent extends Component implements IRenderable {
        /**
         * 用于装载egret显示对象
         */
        public displayObject: egret.DisplayObject = new egret.DisplayObject();
        public hollowShape: egret.Shape = new egret.Shape();
        public pixelShape: egret.Shape = new egret.Shape();
        /**
         * 用于着色器处理精灵
         */
        public color: number = 0x000000;
        protected _areBoundsDirty = true;

        /**
         * renderableComponent的宽度
         * 如果你不重写bounds属性则需要实现这个
         */
        public get width() {
            return this.bounds.width;
        }

        /**
         * renderableComponent的高度
         * 如果你不重写bounds属性则需要实现这个
         */
        public get height() {
            return this.bounds.height;
        }

        public debugRenderEnabled: boolean = true;
        protected _localOffset: Vector2 = Vector2.zero;

        /**
         * 从父实体的偏移量。用于向需要特定定位的实体
         */
        public get localOffset(): Vector2 {
            return this._localOffset;
        }

        /**
         * 从父实体的偏移量。用于向需要特定定位的实体
         * @param value
         */
        public set localOffset(value: Vector2) {
            this.setLocalOffset(value);
        }

        protected _renderLayer: number = 0;

        /**
         * 较低的渲染层在前面，较高的在后面
         */
        public get renderLayer(): number {
            return this._renderLayer;
        }

        public set renderLayer(value: number) {
            this.setRenderLayer(value);
        }

        protected _bounds: Rectangle = new Rectangle();

        /**
         * 这个物体的AABB, 用于相机剔除
         */
        public get bounds(): Rectangle {
            if (this._areBoundsDirty) {
                this._bounds.calculateBounds(this.entity.transform.position, this._localOffset, Vector2.zero,
                    this.entity.transform.scale, this.entity.transform.rotation, this.width, this.height);
                this._areBoundsDirty = false;
            }

            return this._bounds;
        }

        private _isVisible: boolean;

        /**
         * 可渲染的可见性。状态的改变会调用onBecameVisible/onBecameInvisible方法
         */
        public get isVisible() {
            return this._isVisible;
        }

        /**
         * 可渲染的可见性。状态的改变会调用onBecameVisible/onBecameInvisible方法
         * @param value
         */
        public set isVisible(value: boolean) {
            if (this._isVisible != value) {
                this._isVisible = value;

                if (this._isVisible)
                    this.onBecameVisible();
                else
                    this.onBecameInvisible();
            }
        }

        public onEntityTransformChanged(comp: transform.Component) {
            this._areBoundsDirty = true;
        }

        /**
         * 由渲染器调用。可以使用摄像机进行剔除
         * @param camera
         */
        public abstract render(camera: Camera);

        public debugRender(camera: Camera) {
            if (!this.debugRenderEnabled)
                return;

            if (!this.hollowShape.parent)
                this.debugDisplayObject.addChild(this.hollowShape);

            if (!this.pixelShape.parent)
                this.debugDisplayObject.addChild(this.pixelShape);

            if (!this.entity.getComponent(Collider)){
                this.hollowShape.graphics.clear();
                this.hollowShape.graphics.beginFill(Colors.renderableBounds, 0);
                this.hollowShape.graphics.lineStyle(1, Colors.renderableBounds);
                this.hollowShape.graphics.drawRect(this.bounds.x - camera.bounds.x, this.bounds.y - camera.bounds.y, this.bounds.width, this.bounds.height);
                this.hollowShape.graphics.endFill();
            }

            let pixelPos = Vector2.add(this.entity.transform.position, this._localOffset).subtract(camera.bounds.location);
            this.pixelShape.graphics.clear();
            this.pixelShape.graphics.beginFill(Colors.renderableCenter, 0);
            this.pixelShape.graphics.lineStyle(4, Colors.renderableCenter);
            this.pixelShape.graphics.moveTo(pixelPos.x, pixelPos.y);
            this.pixelShape.graphics.lineTo(pixelPos.x, pixelPos.y);
            this.pixelShape.graphics.endFill();
        }

        /**
         * 如果renderableComponent的边界与camera.bounds相交 返回true
         * 用于处理isVisible标志的状态开关
         * 在渲染方法中使用这个方法来决定是否渲染
         * @param camera
         */
        public isVisibleFromCamera(camera: Camera): boolean {
            if (!camera)
                return false;

            this.isVisible = camera.bounds.intersects(this.bounds);
            return this.isVisible;
        }

        /**
         * 较低的渲染层在前面，较高的在后面
         * @param renderLayer
         */
        public setRenderLayer(renderLayer: number): RenderableComponent {
            if (renderLayer != this._renderLayer) {
                let oldRenderLayer = this._renderLayer;
                this._renderLayer = renderLayer;

                // 如果该组件拥有一个实体，那么是由ComponentList管理，需要通知它改变了渲染层
                if (this.entity && this.entity.scene)
                    this.entity.scene.renderableComponents.updateRenderableRenderLayer(this, oldRenderLayer, this._renderLayer);
            }

            return this;
        }

        /**
         * 用于着色器处理精灵
         * @param color
         */
        public setColor(color: number): RenderableComponent {
            this.color = color;
            return this;
        }

        /**
         * 从父实体的偏移量。用于向需要特定定位的实体
         * @param offset
         */
        public setLocalOffset(offset: Vector2): RenderableComponent {
            if (this._localOffset != offset) {
                this._localOffset = offset;
            }

            return this;
        }

        /**
         * 进行状态同步
         */
        public sync(camera: Camera) {
            if (this.displayObject.x != this.bounds.x - camera.bounds.y) this.displayObject.x = this.bounds.x - camera.bounds.y;
            if (this.displayObject.y != this.bounds.y - camera.bounds.y) this.displayObject.y = this.bounds.y - camera.bounds.y;
            if (this.displayObject.scaleX != this.entity.scale.x) this.displayObject.scaleX = this.entity.scale.x;
            if (this.displayObject.scaleY != this.entity.scale.y) this.displayObject.scaleY = this.entity.scale.y;
            if (this.displayObject.rotation != this.entity.rotationDegrees) this.displayObject.rotation = this.entity.rotationDegrees;
        }

        public compareTo(other: RenderableComponent){
            return other.renderLayer - this.renderLayer;
        }

        public toString() {
            return `[RenderableComponent] renderLayer: ${this.renderLayer}`;
        }

        /**
         * 当renderableComponent进入相机框架时调用
         * 如果渲染器不适用isVisibleFromCamera进行剔除检查 这些方法不会被调用
         */
        protected onBecameVisible() {
            this.displayObject.visible = this.isVisible;
            this.debugDisplayObject.visible = this.isVisible;
        }

        /**
         * 当renderableComponent离开相机框架时调用
         * 如果渲染器不适用isVisibleFromCamera进行剔除检查 这些方法不会被调用
         */
        protected onBecameInvisible() {
            this.displayObject.visible = this.isVisible;
            this.debugDisplayObject.visible = this.isVisible;
        }
    }
}