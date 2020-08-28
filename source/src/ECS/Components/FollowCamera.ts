module es {
    export enum CameraStyle {
        lockOn,
        cameraWindow,
    }

    export class FollowCamera extends Component {
        public camera: Camera;

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
        public focusOffset: Vector2 = Vector2.zero;
        /**
         * 如果为true 相机位置则不会超出地图矩形（0, 0, mapwidth, mapheight）
         */
        public mapLockEnabled: boolean = false;
        /**
         * 當前地圖映射的寬度和高度
         */
        public mapSize: Rectangle = new Rectangle();

        public _targetEntity: Entity;
        public _targetCollider: Collider;
        public _desiredPositionDelta: Vector2 = new Vector2();
        public _cameraStyle: CameraStyle;
        public _worldSpaceDeadZone: Rectangle = new Rectangle();

        private rectShape: egret.Shape = new egret.Shape();

        constructor(targetEntity: Entity = null, camera: Camera = null, cameraStyle: CameraStyle = CameraStyle.lockOn) {
            super();

            this._targetEntity = targetEntity;
            this._cameraStyle = cameraStyle;
            this.camera = camera;
        }

        public onAddedToEntity() {
            if (!this.camera)
                this.camera = this.entity.scene.camera;

            this.follow(this._targetEntity, this._cameraStyle);

            Core.emitter.addObserver(CoreEvents.GraphicsDeviceReset, this.onGraphicsDeviceReset, this);
        }

        public onGraphicsDeviceReset(){
            // 我们需要这个在下一帧触发 这样相机边界就会更新
            Core.schedule(0, false, this, t => {
                let self = t.context as FollowCamera;
                self.follow(self._targetEntity, self._cameraStyle);
            });
        }

        public update() {
            let halfScreen = Vector2.multiply(this.camera.bounds.size, new Vector2(0.5));
            this._worldSpaceDeadZone.x = this.camera.position.x - halfScreen.x * Core.scene.scaleX + this.deadzone.x + this.focusOffset.x;
            this._worldSpaceDeadZone.y = this.camera.position.y - halfScreen.y * Core.scene.scaleY + this.deadzone.y + this.focusOffset.y;
            this._worldSpaceDeadZone.width = this.deadzone.width;
            this._worldSpaceDeadZone.height = this.deadzone.height;

            if (this._targetEntity)
                this.updateFollow();

            this.camera.position = Vector2.lerp(this.camera.position, Vector2.add(this.camera.position, this._desiredPositionDelta), this.followLerp);
            this.entity.transform.roundPosition();

            if (this.mapLockEnabled) {
                this.camera.position = this.clampToMapSize(this.camera.position);
                this.entity.transform.roundPosition();
            }
        }

        public debugRender(camera: Camera) {
            if (!this.rectShape)
                this.debugDisplayObject.addChild(this.rectShape);

            this.rectShape.graphics.clear();
            if (this._cameraStyle == CameraStyle.lockOn){
                this.rectShape.graphics.beginFill(0x8B0000, 0);
                this.rectShape.graphics.lineStyle(1, 0x8B0000);
                this.rectShape.graphics.drawRect(this._worldSpaceDeadZone.x - 5 - camera.bounds.x, this._worldSpaceDeadZone.y - 5 - camera.bounds.y,
                    this._worldSpaceDeadZone.width, this._worldSpaceDeadZone.height);
                this.rectShape.graphics.endFill();
            } else {
                this.rectShape.graphics.beginFill(0x8B0000, 0);
                this.rectShape.graphics.lineStyle(1, 0x8B0000);
                this.rectShape.graphics.drawRect(this._worldSpaceDeadZone.x - camera.bounds.x, this._worldSpaceDeadZone.y - camera.bounds.y,
                    this._worldSpaceDeadZone.width, this._worldSpaceDeadZone.height);
                this.rectShape.graphics.endFill();
            }
        }


        /**
         * 固定相机 永远不会离开地图的可见区域
         * @param position
         */
        public clampToMapSize(position: Vector2) {
            let halfScreen = Vector2.multiply(this.camera.bounds.size, new Vector2(0.5)).add(new Vector2(this.mapSize.x, this.mapSize.y));
            let cameraMax = new Vector2(this.mapSize.width - halfScreen.x, this.mapSize.height - halfScreen.y);

            return Vector2.clamp(position, halfScreen, cameraMax);
        }

        public follow(targetEntity: Entity, cameraStyle: CameraStyle = CameraStyle.cameraWindow) {
            this._targetEntity = targetEntity;
            this._cameraStyle = cameraStyle;
            let cameraBounds = this.camera.bounds;

            switch (this._cameraStyle) {
                case CameraStyle.cameraWindow:
                    let w = cameraBounds.width / 6;
                    let h = cameraBounds.height / 3;
                    this.deadzone = new Rectangle((cameraBounds.width - w) / 2, (cameraBounds.height - h) / 2, w, h);
                    break;
                case CameraStyle.lockOn:
                    this.deadzone = new Rectangle(cameraBounds.width / 2, cameraBounds.height / 2, 10, 10);
                    break;
            }
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

        /**
         * 以给定的尺寸设置当前相机边界中心的死区
         * @param width
         * @param height
         */
        public setCenteredDeadzone(width: number, height: number) {
            if (!this.camera){
                console.error("相机是null。我们不能得到它的边界。请等到该组件添加到实体之后");
                return;
            }
            let cameraBounds = this.camera.bounds;
            this.deadzone = new Rectangle((cameraBounds.width - width) / 2, (cameraBounds.height - height) / 2, width, height);
        }
    }
}