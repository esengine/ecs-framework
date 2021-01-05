module es {
    /**
     * IRenderable的具体实现。包含方便的方法。
     * 非常重要！子类必须覆盖width/height或bounds! 子类必须覆盖width/height或bounds!
     */
    export abstract class RenderableComponent extends Component implements IRenderable, IComparer<RenderableComponent> {
        public static renderIdGenerator: number = 0;
        /**
         * 不重写bounds属性的子类必须实现这个！RenderableComponent的宽度。
         */
        public abstract get width();

        /**
         * 不重写bounds属性的子类必须实现这个!
         */
        public abstract get height();

        /**
         * 包裹此对象的AABB。用来进行相机筛选。
         */
        public abstract get bounds();

        /**
         * 标准的Batcher图层深度，0为前面，1为后面。
         * 改变这个值会触发场景中可渲染组件列表的排序。
         */
        public get layerDepth() {
            return this._layerDepth;
        }
        public set layerDepth(value: number) {
            this.setLayerDepth(value);
        }

        /**
         * 较低的renderLayers在前面，较高的在后面，就像layerDepth一樣，但不是限制在0-1。
         * 请注意，这意味着更高的renderLayers首先被发送到Batcher。
         */
        public get renderLayer() {
            return this._renderLayer;
        }
        public set renderLayer(value: number) {
            this.setRenderLayer(value);
        }

        /**
         * 渲染时传递给批处理程序的颜色
         */
        public color: number = 0xffffff;

        /**
         * 由渲染器使用，用于指定该精灵的渲染方式
         */
        public material: IMaterial;
        /**
         * 偏移。用于将多个Renderables添加到需要特定定位的实体
         */
        public get localOffset(): Vector2 {
            return this._localOffset;
        }
        public set localOffset(value: Vector2) {
            this.setLocalOffset(value);
        }
        /**
         * 这个Renderable的可见性。
         * 状态的改变最终会调用onBecameVisible/onBecameInvisible方法
         */
        public get isVisible() {
            return this._isVisble;
        }
        public set isVisible(value: boolean) {
            if (this._isVisble != value) {
                this._isVisble = value;

                if (this._isVisble)
                    this.onBecameVisible();
                else
                    this.onBecameInvisible();
            }
        }

        constructor() {
            super();
        }

        public debugRenderEnabled: boolean = true;

        protected _localOffset: Vector2 = Vector2.zero;
        protected _layerDepth: number;
        protected _renderLayer: number;
        protected _bounds: Rectangle = Rectangle.empty;
        protected _isVisble: boolean;

        protected _areBoundsDirty: boolean = true;

        public onEntityTransformChanged(comp: transform.Component) {
            this._areBoundsDirty = true;
        }

        /**
         * 被渲染器调用。摄像机可以用来进行裁剪，并使用Batcher实例进行绘制
         * @param batcher 
         * @param camera 
         */
        public abstract render(batcher: IBatcher, camera: ICamera);

        /**
         * 只有在没有对撞机的情况下才会渲染边界。始终在原点上渲染一个正方形
         * @param batcher 
         */
        public debugRender(batcher: IBatcher) {
            if (!this.debugRenderEnabled)
                return;

            // 如果我们没有对撞机，我们就画出我们的范围
            if (this.entity.getComponent<Collider>(Collider) == null)
                batcher.drawHollowRect(this.bounds, 0xFFFF00);

            batcher.drawPixel(this.entity.transform.position.add(this._localOffset), 0xcc3299, 4);
        }

        /**
         * 当Renderable进入相机帧时被调用。
         * 请注意，如果您的Renderer没有使用isVisibleFromCamera来进行裁剪检查，这些方法将不会被调用。
         * 所有默认的Renderer都会这样做
         */
        protected onBecameVisible() {

        }

        /**
         * 当渲染器退出相机帧时，将调用这些方法。
         * 请注意，如果你的Renderer没有使用isVisibleFromCamera来进行Culling检查，这些方法将不会被调用。
         * 所有默认的Renderer都会这样做
         */
        protected onBecameInvisible() {

        }

        public onRemovedFromEntity() {

        }

        /**
         * 如果Renderables的边界与Camera.bounds相交，则返回true。
         * 处理isVisible标志的状态切换。在你的渲染方法中使用这个方法来决定你是否应该渲染
         * @param camera 
         */
        public isVisibleFromCamera(camera: ICamera) {
            this.isVisible = camera.bounds.intersects(this.bounds);
            return this.isVisible;
        }

        public setMaterial(material: IMaterial) {
            this.material = material;
            if (this.entity != null && this.entity.scene != null)
                this.entity.scene.renderableComponents.setRenderLayerNeedsComponentSort(this.renderLayer);
            return this;
        }

        /**
         * 标准的Batcher图层深度，0为前面，1为后面。
         * 改变这个值会触发一种类似于renderableComponents的方法
         * @param layerDepth 
         */
        public setLayerDepth(layerDepth: number): RenderableComponent {
            this._layerDepth = MathHelper.clamp01(layerDepth);

            if (this.entity != null && this.entity.scene != null)
                this.entity.scene.renderableComponents.setRenderLayerNeedsComponentSort(this.renderLayer);
            return this;
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
         * 偏移。用于将多个Renderables添加到需要特定定位的实体
         * @param offset 
         */
        public setLocalOffset(offset: Vector2): RenderableComponent {
            if (!this._localOffset.equals(offset)) {
                this._localOffset = offset;
                this._areBoundsDirty = true;
            }

            return this;
        }

        /**
         * 用于检索一个已经铸造的Material子类的帮助程序
         */
        public getMaterial<T extends IMaterial>(): T {
            return this.material as T;
        }

        /**
         * 先按renderLayer排序，再按layerDepth排序，最后按材质排序
         * @param other 
         */
        public compare(other: RenderableComponent) {
            let res = other.renderLayer - this.renderLayer;
            if (res == 0) {
                res = other.layerDepth - this.layerDepth;
                if (res == 0) {
                    if (this.material == other.material)
                        return 0;

                    if (other.material == null)
                        return -1;

                    return 1;
                }
            }
        }
    }
}