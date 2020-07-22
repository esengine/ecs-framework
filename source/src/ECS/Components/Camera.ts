module es {
    export enum CameraStyle {
        lockOn,
        cameraWindow,
    }

    export class Camera extends Component {
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

        /**
         * 相机的边框
         */
        public get bounds(){
            return new Rectangle(0, 0, SceneManager.stage.stageWidth, SceneManager.stage.stageHeight);
        }

        public get origin() {
            return this._origin;
        }

        public set origin(value: Vector2) {
            if (this._origin != value) {
                this._origin = value;
            }
        }

        private _zoom;
        private _minimumZoom = 0.3;
        private _maximumZoom = 3;
        private _origin: Vector2 = Vector2.zero;
        /**
         * 如果相机模式为cameraWindow 则会进行缓动移动
         * 该值为移动速度
         */
        public followLerp = 0.1;
        /**
         * 在cameraWindow模式下，宽度/高度被用做边界框，允许在不移动相机的情况下移动
         * 在lockOn模式下，只使用deadZone的x/y值 你可以通过直接setCenteredDeadzone重写它来自定义deadZone
         */
        public deadzone: Rectangle = new Rectangle();
        /**
         * 相机聚焦于屏幕中心的偏移
         */
        public focusOffset: Vector2 = new Vector2();
        /**
         * 如果为true 相机位置则不会超出地图矩形（0, 0, mapwidth, mapheight）
         */
        public mapLockEnabled: boolean = false;
        /**
         * 當前地圖映射的寬度和高度
         */
        public mapSize: Vector2 = new Vector2();

        public _targetEntity: Entity;
        public _targetCollider: Collider;
        public _desiredPositionDelta: Vector2 = new Vector2();
        public _cameraStyle: CameraStyle;
        public _worldSpaceDeadZone: Rectangle = new Rectangle();

        constructor(targetEntity: Entity = null, cameraStyle: CameraStyle = CameraStyle.lockOn) {
            super();

            this._targetEntity = targetEntity;
            this._cameraStyle = cameraStyle;
            this.setZoom(0);
        }

        /**
         * 当场景渲染目标的大小发生变化时，我们会更新相机的原点并调整它的位置以保持它原来的位置
         * @param newWidth
         * @param newHeight
         */
        public onSceneSizeChanged(newWidth: number, newHeight: number) {
            let oldOrigin = this._origin;
            this.origin = new Vector2(newWidth / 2, newHeight / 2);

            this.entity.transform.position = Vector2.add(this.entity.transform.position, Vector2.subtract(this._origin, oldOrigin));
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

            SceneManager.scene.scaleX = this._zoom;
            SceneManager.scene.scaleY = this._zoom;
            return this;
        }

        /**
         * 相机变焦可以达到的最小非缩放值（0-number.max） 默认为0.3
         * @param minZoom
         */
        public setMinimumZoom(minZoom: number): Camera {
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

        public zoomIn(deltaZoom: number) {
            this.zoom += deltaZoom;
        }

        public zoomOut(deltaZoom: number) {
            this.zoom -= deltaZoom;
        }

        public onAddedToEntity() {
            this.follow(this._targetEntity, this._cameraStyle);
        }

        public update() {
            let halfScreen = Vector2.multiply(new Vector2(this.bounds.width, this.bounds.height), new Vector2(0.5));
            this._worldSpaceDeadZone.x = this.position.x - halfScreen.x * SceneManager.scene.scaleX + this.deadzone.x + this.focusOffset.x;
            this._worldSpaceDeadZone.y = this.position.y - halfScreen.y * SceneManager.scene.scaleY + this.deadzone.y + this.focusOffset.y;
            this._worldSpaceDeadZone.width = this.deadzone.width;
            this._worldSpaceDeadZone.height = this.deadzone.height;

            if (this._targetEntity)
                this.updateFollow();

            this.position = Vector2.lerp(this.position, Vector2.add(this.position, this._desiredPositionDelta), this.followLerp);
            this.entity.transform.roundPosition();

            if (this.mapLockEnabled) {
                this.position = this.clampToMapSize(this.position);
                this.entity.transform.roundPosition();
            }
        }

        /**
         * 固定相机 永远不会离开地图的可见区域
         * @param position
         */
        public clampToMapSize(position: Vector2) {
            let halfScreen = Vector2.multiply(new Vector2(this.bounds.width, this.bounds.height), new Vector2(0.5));
            let cameraMax = new Vector2(this.mapSize.x - halfScreen.x, this.mapSize.y - halfScreen.y);

            return Vector2.clamp(position, halfScreen, cameraMax);
        }

        public updateFollow() {
            this._desiredPositionDelta.x = this._desiredPositionDelta.y = 0;

            if (this._cameraStyle == CameraStyle.lockOn) {
                let targetX = this._targetEntity.transform.position.x;
                let targetY = this._targetEntity.transform.position.y;

                if (this._worldSpaceDeadZone.x > targetX)
                    this._desiredPositionDelta.x = targetX - this._worldSpaceDeadZone.x;
                else if (this._worldSpaceDeadZone.x < targetX)
                    this._desiredPositionDelta.x = targetX - this._worldSpaceDeadZone.x;

                if (this._worldSpaceDeadZone.y < targetY)
                    this._desiredPositionDelta.y = targetY - this._worldSpaceDeadZone.y;
                else if (this._worldSpaceDeadZone.y > targetY)
                    this._desiredPositionDelta.y = targetY - this._worldSpaceDeadZone.y;
            } else {
                if (!this._targetCollider) {
                    this._targetCollider = this._targetEntity.getComponent<Collider>(Collider);
                    if (!this._targetCollider)
                        return;
                }

                let targetBounds = this._targetEntity.getComponent<Collider>(Collider).bounds;
                if (!this._worldSpaceDeadZone.containsRect(targetBounds)) {
                    if (this._worldSpaceDeadZone.left > targetBounds.left)
                        this._desiredPositionDelta.x = targetBounds.left - this._worldSpaceDeadZone.left;
                    else if (this._worldSpaceDeadZone.right < targetBounds.right)
                        this._desiredPositionDelta.x = targetBounds.right - this._worldSpaceDeadZone.right;

                    if (this._worldSpaceDeadZone.bottom < targetBounds.bottom)
                        this._desiredPositionDelta.y = targetBounds.bottom - this._worldSpaceDeadZone.bottom;
                    else if (this._worldSpaceDeadZone.top > targetBounds.top)
                        this._desiredPositionDelta.y = targetBounds.top - this._worldSpaceDeadZone.top;
                }
            }
        }

        public follow(targetEntity: Entity, cameraStyle: CameraStyle = CameraStyle.cameraWindow) {
            this._targetEntity = targetEntity;
            this._cameraStyle = cameraStyle;

            switch (this._cameraStyle) {
                case CameraStyle.cameraWindow:
                    let w = this.bounds.width / 6;
                    let h = this.bounds.height / 3;
                    this.deadzone = new Rectangle((this.bounds.width - w) / 2, (this.bounds.height - h) / 2, w, h);
                    break;
                case CameraStyle.lockOn:
                    this.deadzone = new Rectangle(this.bounds.width / 2, this.bounds.height / 2, 10, 10);
                    break;
            }
        }

        /**
         * 以给定的尺寸设置当前相机边界中心的死区
         * @param width
         * @param height
         */
        public setCenteredDeadzone(width: number, height: number) {
            this.deadzone = new Rectangle((this.bounds.width - width) / 2, (this.bounds.height - height) / 2, width, height);
        }
    }
}
