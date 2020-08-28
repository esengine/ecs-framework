module es {
    export class CameraInset {
        public left: number = 0;
        public right: number = 0;
        public top: number = 0;
        public bottom: number = 0;
    }

    export class Camera extends Component {
        public _inset: CameraInset = new CameraInset();
        public _areMatrixedDirty: boolean = true;
        public _areBoundsDirty: boolean = true;
        public _isProjectionMatrixDirty = true;

        constructor() {
            super();
            this.setZoom(0);
        }

        /**
         * 对entity.transform.position的快速访问
         */
        public get position() {
            return this.entity.transform.position;
        }

        /**
         * 对entity.transform.position的快速访问
         * @param value
         */
        public set position(value: Vector2) {
            this.entity.transform.position = value;
        }

        /**
         * 对entity.transform.rotation的快速访问
         */
        public get rotation(): number {
            return this.entity.transform.rotation;
        }

        /**
         * 对entity.transform.rotation的快速访问
         * @param value
         */
        public set rotation(value: number) {
            this.entity.transform.rotation = value;
        }

        /**
         * 原始的缩放值。这就是用于比例矩阵的精确值。默认值为1。
         */
        public get rawZoom(){
            return this._zoom;
        }

        /**
         * 原始的缩放值。这就是用于比例矩阵的精确值。默认值为1。
         * @param value
         */
        public set rawZoom(value: number){
            if (value != this._zoom){
                this._zoom = value;
                this._areMatrixedDirty = true;
            }
        }

        public _zoom: number = 0;

        /**
         * 缩放值应该在-1和1之间、然后将该值从minimumZoom转换为maximumZoom。
         * 允许你设置适当的最小/最大值，然后使用更直观的-1到1的映射来更改缩放
         */
        public get zoom() {
            if (this._zoom == 0)
                return 1;

            if (this._zoom < 1)
                return MathHelper.map(this._zoom, this._minimumZoom, 1, -1, 0);

            return MathHelper.map(this._zoom, 1, this._maximumZoom, 0, 1);
        }

        /**
         * 缩放值应该在-1和1之间、然后将该值从minimumZoom转换为maximumZoom。
         * 允许你设置适当的最小/最大值，然后使用更直观的-1到1的映射来更改缩放
         * @param value
         */
        public set zoom(value: number) {
            this.setZoom(value);
        }

        public _minimumZoom = 0.3;

        /**
         * 相机变焦可以达到的最小非缩放值（0-number.max）。默认为0.3
         */
        public get minimumZoom() {
            return this._minimumZoom;
        }

        /**
         * 相机变焦可以达到的最小非缩放值（0-number.max）。默认为0.3
         * @param value
         */
        public set minimumZoom(value: number) {
            this.setMinimumZoom(value);
        }

        public _maximumZoom = 3;

        /**
         * 相机变焦可以达到的最大非缩放值（0-number.max）。默认为3
         */
        public get maximumZoom() {
            return this._maximumZoom;
        }

        /**
         * 相机变焦可以达到的最大非缩放值（0-number.max）。默认为3
         * @param value
         */
        public set maximumZoom(value: number) {
            this.setMaximumZoom(value);
        }

        public _bounds: Rectangle = new Rectangle();

        /**
         * 相机的世界-空间边界
         */
        public get bounds() {
            if (this._areMatrixedDirty)
                this.updateMatrixes();

            if (this._areBoundsDirty) {
                // 旋转或非旋转的边界都需要左上角和右下角
                let topLeft = this.screenToWorldPoint(new Vector2(this._inset.left, this._inset.top));
                let bottomRight = this.screenToWorldPoint(new Vector2(Core.graphicsDevice.viewport.width - this._inset.right,
                    Core.graphicsDevice.viewport.height - this._inset.bottom));

                if (this.entity.transform.rotation != 0) {
                    // 特别注意旋转的边界。我们需要找到绝对的最小/最大值并从中创建边界
                    let topRight = this.screenToWorldPoint(new Vector2(Core.graphicsDevice.viewport.width - this._inset.right,
                        this._inset.top));
                    let bottomLeft = this.screenToWorldPoint(new Vector2(this._inset.left,
                        Core.graphicsDevice.viewport.height - this._inset.bottom));

                    let minX = Math.min(topLeft.x, bottomRight.x, topRight.x, bottomLeft.x);
                    let maxX = Math.max(topLeft.x, bottomRight.x, topRight.x, bottomLeft.x);
                    let minY = Math.min(topLeft.y, bottomRight.y, topRight.y, bottomLeft.y);
                    let maxY = Math.max(topLeft.y, bottomRight.y, topRight.y, bottomLeft.y);

                    this._bounds.location = new Vector2(minX, minY);
                    this._bounds.width = maxX - minX;
                    this._bounds.height = maxY - minY;
                } else {
                    this._bounds.location = topLeft;
                    this._bounds.width = bottomRight.x - topLeft.x;
                    this._bounds.height = bottomRight.y - topLeft.y;
                }

                this._areBoundsDirty = false;
            }

            return this._bounds;
        }

        public _transformMatrix: Matrix2D = new Matrix2D().identity();

        /**
         * 用于从世界坐标转换到屏幕
         */
        public get transformMatrix(): Matrix2D {
            if (this._areMatrixedDirty)
                this.updateMatrixes();
            return this._transformMatrix;
        }

        public _inverseTransformMatrix: Matrix2D = new Matrix2D().identity();

        /**
         * 用于从屏幕坐标到世界的转换
         */
        public get inverseTransformMatrix(): Matrix2D {
            if (this._areMatrixedDirty)
                this.updateMatrixes();
            return this._inverseTransformMatrix;
        }

        public _origin: Vector2 = Vector2.zero;

        public get origin() {
            return this._origin;
        }

        public set origin(value: Vector2) {
            if (this._origin != value) {
                this._origin = value;
                this._areMatrixedDirty = true;
            }
        }

        /**
         * 设置用于从视口边缘插入摄像机边界的量
         * @param left
         * @param right
         * @param top
         * @param bottom
         */
        public setInset(left: number, right: number, top: number, bottom: number): Camera {
            this._inset = new CameraInset();
            this._inset.left = left;
            this._inset.right = right;
            this._inset.top = top;
            this._inset.bottom = bottom;
            this._areBoundsDirty = true;
            return this;
        }

        /**
         * 对entity.transform.setPosition快速访问
         * @param position
         */
        public setPosition(position: Vector2) {
            this.entity.transform.setPosition(position.x, position.y);
            return this;
        }

        /**
         * 对entity.transform.setRotation的快速访问
         * @param rotation
         */
        public setRotation(rotation: number): Camera {
            this.entity.transform.setRotation(rotation);
            return this;
        }

        /**
         * 设置缩放值，缩放值应该在-1到1之间。然后将该值从minimumZoom转换为maximumZoom
         * 允许您设置适当的最小/最大值。使用更直观的-1到1的映射来更改缩放
         * @param zoom
         */
        public setZoom(zoom: number): Camera {
            let newZoom = MathHelper.clamp(zoom, -1, 1);
            if (newZoom == 0) {
                this._zoom = 1;
            } else if (newZoom < 0) {
                this._zoom = MathHelper.map(newZoom, -1, 0, this._minimumZoom, 1);
            } else {
                this._zoom = MathHelper.map(newZoom, 0, 1, 1, this._maximumZoom);
            }
            this._areMatrixedDirty = true;

            return this;
        }

        /**
         * 相机变焦可以达到的最小非缩放值（0-number.max） 默认为0.3
         * @param minZoom
         */
        public setMinimumZoom(minZoom: number): Camera {
            if (minZoom <= 0) {
                console.error("minimumZoom must be greater than zero");
                return;
            }

            if (this._zoom < minZoom)
                this._zoom = this.minimumZoom;

            this._minimumZoom = minZoom;
            return this;
        }

        /**
         * 相机变焦可以达到的最大非缩放值（0-number.max） 默认为3
         * @param maxZoom
         */
        public setMaximumZoom(maxZoom: number): Camera {
            if (maxZoom <= 0) {
                console.error("maximumZoom must be greater than zero");
                return;
            }

            if (this._zoom > maxZoom)
                this._zoom = maxZoom;

            this._maximumZoom = maxZoom;
            return this;
        }

        public forceMatrixUpdate(){
            // 弄脏矩阵也会自动弄脏边界
            this._areMatrixedDirty = true;
        }

        public onEntityTransformChanged(comp: transform.Component) {
            this._areMatrixedDirty = true;
        }

        public zoomIn(deltaZoom: number) {
            this.zoom += deltaZoom;
        }

        public zoomOut(deltaZoom: number) {
            this.zoom -= deltaZoom;
        }

        /**
         * 将一个点从世界坐标转换到屏幕
         * @param worldPosition
         */
        public worldToScreenPoint(worldPosition: Vector2): Vector2 {
            this.updateMatrixes();
            Vector2Ext.transformR(worldPosition, this._transformMatrix, worldPosition);
            return worldPosition;
        }

        /**
         * 将点从屏幕坐标转换为世界坐标
         * @param screenPosition
         */
        public screenToWorldPoint(screenPosition: Vector2): Vector2 {
            this.updateMatrixes();
            Vector2Ext.transformR(screenPosition, this._inverseTransformMatrix, screenPosition);
            return screenPosition;
        }

        /**
         * 当场景渲染目标的大小发生变化时，我们会更新相机的原点并调整它的位置以保持它原来的位置
         * @param newWidth
         * @param newHeight
         */
        public onSceneRenderTargetSizeChanged(newWidth: number, newHeight: number){
            this._isProjectionMatrixDirty = true;
            let oldOrigin = this._origin;
            this.origin = new Vector2(newWidth / 2, newHeight / 2);

            this.entity.transform.position.add(Vector2.subtract(this._origin, oldOrigin));
        }

        /**
         * 返回鼠标在世界空间中的位置
         */
        public mouseToWorldPoint(): Vector2 {
            return this.screenToWorldPoint(Input.touchPosition);
        }

        protected updateMatrixes() {
            if (!this._areMatrixedDirty)
                return;

            let tempMat: Matrix2D;
            this._transformMatrix = Matrix2D.create().translate(-this.entity.transform.position.x, -this.entity.transform.position.y);

            if (this._zoom != 1) {
                tempMat = Matrix2D.create().scale(this._zoom, this._zoom);
                this._transformMatrix = this._transformMatrix.multiply(tempMat);
            }

            if (this.entity.transform.rotation != 0) {
                tempMat = Matrix2D.create().rotate(this.entity.transform.rotation);
                this._transformMatrix = this._transformMatrix.multiply(tempMat);
            }

            tempMat = Matrix2D.create().translate(Math.floor(this._origin.x), Math.floor(this._origin.y));
            this._transformMatrix = this._transformMatrix.multiply(tempMat);

            this._inverseTransformMatrix = this._transformMatrix.invert();

            // 无论何时矩阵改变边界都是无效的
            this._areBoundsDirty = true;
            this._areMatrixedDirty = false;
        }
    }
}
