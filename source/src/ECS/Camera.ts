///<reference path="Component.ts"/>
module es {
    class CameraInset {
        left: number = 0;
        right: number = 0;
        top: number = 0;
        bottom: number = 0;
    }

    export class Camera extends Component implements IUpdatable, ICamera {
        public get position() {
            return this.entity.transform.position;
        }

        public get rotation() {
            return this.entity.transform.rotation;
        }

        public get bounds() {
            if (this._areMatrixesDirty)
                this.updateMatrixes();

            if (this._areBoundsDirty) {
                let viewport = new Rectangle(0, 0, Core.stage.width, Core.stage.height);
                let topLeft = this.screenToWorldPoint(new Vector2(this._inset.left, this._inset.top));
                let bottomRight = this.screenToWorldPoint(new Vector2(viewport.width - this._inset.right,
                    viewport.height - this._inset.bottom));

                if (this.entity.transform.rotation != 0) {
                    let topRight = this.screenToWorldPoint(new Vector2(viewport.width - this._inset.right,
                        this._inset.top));
                    let bottomLeft = this.screenToWorldPoint(new Vector2(this._inset.left,
                        viewport.height - this._inset.bottom));

                    let minX = Math.min(topLeft.x, bottomRight.x, topRight.x, bottomLeft.x);
                    let maxX = Math.max(topLeft.x, bottomRight.x, topRight.x, bottomLeft.x);
                    let minY = Math.min(topLeft.y, bottomRight.y, topRight.y, bottomLeft.y);
                    let maxY = Math.max(topLeft.x, bottomRight.y, topRight.y, bottomLeft.y);

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

        public get transformMatrix() {
            if (this._areBoundsDirty)
                this.updateMatrixes();

            return this._transformMatrix;
        }

        public get inverseTransformMatrix() {
            if (this._areBoundsDirty)
                this.updateMatrixes();

            return this._inverseTransformMatrix;
        }

        public get origin() {
            return this._origin;
        }

        public set origin(value: Vector2) {
            if (!this._origin.equals(value)) {
                this._origin = value;
                this._areMatrixesDirty = true;
            }
        }

        public get zoom() {
            if (this._zoom == 0)
                return 1;

            if (this._zoom < 1)
                return MathHelper.map(this._zoom, this._minimumZoom, 1, -1, 0);

            return MathHelper.map(this._zoom, 1, this._maxmumZoom, 0, 1);
        }

        public set zoom(value: number) {
            this.setZoom(value);
        }

        public get rawZoom() {
            return this._zoom;
        }

        public set rawZoom(value: number) {
            if (value != this._zoom) {
                this._zoom = value;
                this._areMatrixesDirty = true;
            }
        }

        public get minimumZoom() {
            return this._minimumZoom;
        }

        public set minimumZoom(value: number) {
            this.setMinimumZoom(value);
        }

        public get maximumZoom() {
            return this._maxmumZoom;
        }

        public set maximumZoom(value: number) {
            this.setMaximumZoom(value);
        }

        public get ratio() {
            return this._ratio;
        }

        public set ratio(value: Vector2) {
            this.setRatio(value);
        }

        private _transformMatrix: Matrix2D = Matrix2D.identity;
        private _inverseTransformMatrix = Matrix2D.identity;

        private _bounds: Rectangle = new Rectangle();
        private _inset: CameraInset = new CameraInset();
        private _zoom: number = 0;
        private _minimumZoom = 0.3;
        private _maxmumZoom = 3;
        private _origin: Vector2 = Vector2.zero;
        private _ratio: Vector2 = Vector2.one;

        private _areMatrixesDirty: boolean = true;
        private _areBoundsDirty: boolean = true;

        private camera: Camera;

        constructor() {
            super();
            this.setZoom(0);

            this.origin = new Vector2(Core.stage.stageWidth / 2, Core.stage.stageHeight / 2);
            this.ratio = new Vector2(1, 1);
        }

        public onSceneRenderTargetSizeChanged(newWidth: number, newHeight: number) {
            const oldOrigin = this._origin.clone();
            this.origin = new Vector2(newWidth / 2, newHeight / 2);

            this.entity.transform.position.addEqual(this._origin.sub(oldOrigin));
        }

        protected updateMatrixes() {
            if (!this._areBoundsDirty)
                return;

            let tempMat: Matrix2D = new Matrix2D();
            Matrix2D.createTranslation(-this.entity.transform.position.x, -this.entity.transform.position.y, this._transformMatrix);

            if (this._zoom != 1) {
                Matrix2D.createScale(this._zoom, this._zoom, tempMat);
                this._transformMatrix = this._transformMatrix.multiply(tempMat);
            }

            if (this.entity.transform.rotation != 0) {
                Matrix2D.createRotation(this.entity.transform.rotation, tempMat);
                this._transformMatrix = this._transformMatrix.multiply(tempMat);
            }

            Matrix2D.createTranslation(Math.trunc(this._origin.x), Math.trunc(this._origin.y), tempMat);
            this._transformMatrix = this._transformMatrix.multiply(tempMat);

            this._inverseTransformMatrix = Matrix2D.invert(this._transformMatrix);

            this._areBoundsDirty = true;
            this._areMatrixesDirty = false;
        }

        public setZoom(zoom: number) {
            let newZoom = MathHelper.clamp(zoom, -1, 1);
            if (newZoom == 0)
                this._zoom = 1;
            else if (newZoom < 0)
                this._zoom = MathHelper.map(newZoom, -1, 0, this._minimumZoom, 1);
            else
                this._zoom = MathHelper.map(newZoom, 0, 1, 1, this._maxmumZoom);

            this._areMatrixesDirty = true;

            return this;
        }

        public setMinimumZoom(minZoom: number) {
            Insist.isTrue(minZoom > 0, "minimumZoom必须大于零");

            if (this._zoom < minZoom)
                this._zoom = this.minimumZoom;

            this._minimumZoom = minZoom;
            return this;
        }

        public setMaximumZoom(maxZoom: number) {
            Insist.isTrue(maxZoom > 0, "MaximumZoom必须大于零");

            if (this._zoom > maxZoom)
                this._zoom = maxZoom;

            this._maxmumZoom = maxZoom;
            return this;
        }

        public setRatio(value: Vector2) {
            if (!this._ratio.equals(value)) {
                this._ratio = value;
                this._areBoundsDirty = true;
            }

            return this;
        }

        public setInset(left: number, right: number, top: number, bottom: number) {
            this._inset = new CameraInset();
            this._inset.left = left;
            this._inset.right = right;
            this._inset.top = top;
            this._inset.bottom = bottom;
            this._areBoundsDirty = true;
            return this;
        }

        public zoomIn(deltaZoom: number) {
            this.zoom += deltaZoom;
        }

        public zoomOut(deltaZoom: number) {
            this.zoom -= deltaZoom;
        }

        public screenToWorldPoint(screenPosition: Vector2): Vector2 {
            this.updateMatrixes();
            Vector2Ext.transformR(screenPosition.multiply(this.ratio), this._inverseTransformMatrix, screenPosition);
            return screenPosition;
        }

        public worldToScreenPoint(worldPosition: Vector2): Vector2 {
            this.updateMatrixes();
            Vector2Ext.transformR(worldPosition.multiply(this.ratio), this._transformMatrix, worldPosition);
            return worldPosition;
        }

        public forceMatrixUpdate() {
            this._areMatrixesDirty = true;
        }

        public onEntityTransformChanged(comp: ComponentTransform) {
            this._areMatrixesDirty = true;
        }

        public touchToWorldPoint() {
            return this.screenToWorldPoint(Input.scaledPosition(Input.touchPosition));
        }

        public mouseToWorldPoint() {
            return this.screenToWorldPoint(Input.scaledPosition(Input.mousePosition));
        }

        public update() {
        }
    }
}

