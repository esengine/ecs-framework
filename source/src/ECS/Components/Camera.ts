///<reference path="../Component.ts"/>
class Camera extends Component {
    private _zoom;
    private _origin: Vector2 = Vector2.zero;

    private _minimumZoom = 0.3;
    private _maximumZoom = 3;

    /** 
     * 如果相机模式为cameraWindow 则会进行缓动移动 
     * 该值为移动速度 
     */
    public followLerp = 0.1;
    public deadzone: Rectangle = new Rectangle();
    /** 锁定偏移量 默认中心 */
    public focusOffset: Vector2 = new Vector2();
    /** 是否地图锁定 如果锁定则需要设置mapSize属性 */
    public mapLockEnabled: boolean = false;
    /** 设置地图大小 默认从0 0左上角开始 只需要输入地图宽高 */
    public mapSize: Vector2 = new Vector2();
    /** 跟随的实体 设置后镜头将锁定目标为中心 */
    public targetEntity: Entity;
    private _worldSpaceDeadZone: Rectangle = new Rectangle();
    private _desiredPositionDelta: Vector2 = new Vector2();
    private _targetCollider: Collider;
    /** 相机模式 */
    public cameraStyle: CameraStyle = CameraStyle.lockOn;

    public get zoom(){
        if (this._zoom == 0)
            return 1;

        if (this._zoom < 1)
            return MathHelper.map(this._zoom, this._minimumZoom, 1, -1, 0);

        return MathHelper.map(this._zoom, 1, this._maximumZoom, 0, 1);
    }

    public set zoom(value: number){
        this.setZoom(value);
    }

    public get minimumZoom(){
        return this._minimumZoom;
    }

    public set minimumZoom(value: number){
        this.setMinimumZoom(value);
    }

    public get maximumZoom(){
        return this._maximumZoom;
    }

    public set maximumZoom(value: number){
        this.setMaximumZoom(value);
    }

    public get origin(){
        return this._origin;
    }

    public set origin(value: Vector2){
        if (this._origin != value){
            this._origin = value;
        }
    }

    public get position(){
        return this.entity.position;
    }

    public set position(value: Vector2){
        this.entity.position = value;
    }

    constructor() {
        super();

        this.width = SceneManager.stage.stageWidth;
        this.height = SceneManager.stage.stageHeight;
        this.setZoom(0);
    }

    public onSceneSizeChanged(newWidth: number, newHeight: number){
        let oldOrigin = this._origin;
        this.origin = new Vector2(newWidth / 2, newHeight / 2);

        this.entity.position = Vector2.add(this.entity.position, Vector2.subtract(this._origin, oldOrigin));
    }

    public setMinimumZoom(minZoom: number): Camera{
        if (this._zoom < minZoom)
            this._zoom = this.minimumZoom;

        this._minimumZoom = minZoom;
        return this;
    }

    public setMaximumZoom(maxZoom: number): Camera {
        if (this._zoom > maxZoom)
            this._zoom = maxZoom;

        this._maximumZoom = maxZoom;
        return this;
    }

    public setZoom(zoom: number): Camera{
        let newZoom = MathHelper.clamp(zoom, -1, 1);
        if (newZoom == 0){
            this._zoom = 1;
        } else if(newZoom < 0){
            this._zoom = MathHelper.map(newZoom, -1, 0, this._minimumZoom, 1);
        } else {
            this._zoom = MathHelper.map(newZoom, 0, 1, 1, this._maximumZoom);
        }

        SceneManager.scene.scaleX = this._zoom;
        SceneManager.scene.scaleY = this._zoom;
        return this;
    }

    public setRotation(rotation: number): Camera {
        SceneManager.scene.rotation = rotation;
        return this;
    }

    public setPosition(position: Vector2){
        this.entity.position = position;

        return this;
    }

    public follow(targetEntity: Entity, cameraStyle: CameraStyle = CameraStyle.cameraWindow){
        this.targetEntity = targetEntity;
        this.cameraStyle = cameraStyle;
        let cameraBounds = new Rectangle(0, 0, SceneManager.stage.stageWidth, SceneManager.stage.stageHeight);

        switch (this.cameraStyle){
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

    public update(){
        let cameraBounds = new Rectangle(0, 0, SceneManager.stage.stageWidth, SceneManager.stage.stageHeight);
        let halfScreen = Vector2.multiply(new Vector2(cameraBounds.width, cameraBounds.height), new Vector2(0.5));
        this._worldSpaceDeadZone.x = this.position.x - halfScreen.x + this.deadzone.x + this.focusOffset.x;
        this._worldSpaceDeadZone.y = this.position.y - halfScreen.y + this.deadzone.y + this.focusOffset.y;
        this._worldSpaceDeadZone.width = this.deadzone.width;
        this._worldSpaceDeadZone.height = this.deadzone.height;

        if (this.targetEntity)
            this.updateFollow();

        this.position = Vector2.lerp(this.position, Vector2.add(this.position, this._desiredPositionDelta), this.followLerp);
        this.entity.roundPosition();

        if (this.mapLockEnabled){
            this.position = this.clampToMapSize(this.position);
            this.entity.roundPosition();
        }
    }

    private clampToMapSize(position: Vector2){
        let cameraBounds = new Rectangle(0, 0, SceneManager.stage.stageWidth, SceneManager.stage.stageHeight);
        let halfScreen = Vector2.multiply(new Vector2(cameraBounds.width, cameraBounds.height), new Vector2(0.5));
        let cameraMax = new Vector2(this.mapSize.x - halfScreen.x, this.mapSize.y - halfScreen.y);

        return Vector2.clamp(position, halfScreen, cameraMax);
    }

    private updateFollow(){
        this._desiredPositionDelta.x = this._desiredPositionDelta.y = 0;

        if (this.cameraStyle == CameraStyle.lockOn){
            let targetX = this.targetEntity.position.x;
            let targetY = this.targetEntity.position.y;

            if (this._worldSpaceDeadZone.x > targetX)
                this._desiredPositionDelta.x = targetX - this._worldSpaceDeadZone.x;
            else if(this._worldSpaceDeadZone.x < targetX)
                this._desiredPositionDelta.x = targetX - this._worldSpaceDeadZone.x;

            if (this._worldSpaceDeadZone.y < targetY)
                this._desiredPositionDelta.y = targetY - this._worldSpaceDeadZone.y;
            else if(this._worldSpaceDeadZone.y > targetY)
                this._desiredPositionDelta.y = targetY - this._worldSpaceDeadZone.y;
        } else {
            if (!this._targetCollider){
                this._targetCollider = this.targetEntity.getComponent<Collider>(Collider);
                if (!this._targetCollider)
                    return;
            }

            let targetBounds = this.targetEntity.getComponent<Collider>(Collider).bounds;
            if (!this._worldSpaceDeadZone.containsRect(targetBounds)){
                if (this._worldSpaceDeadZone.left > targetBounds.left)
                    this._desiredPositionDelta.x = targetBounds.left - this._worldSpaceDeadZone.left;
                else if(this._worldSpaceDeadZone.right < targetBounds.right)
                    this._desiredPositionDelta.x = targetBounds.right - this._worldSpaceDeadZone.right;

                if (this._worldSpaceDeadZone.bottom < targetBounds.bottom)
                    this._desiredPositionDelta.y = targetBounds.bottom - this._worldSpaceDeadZone.bottom;
                else if(this._worldSpaceDeadZone.top > targetBounds.top)
                    this._desiredPositionDelta.y = targetBounds.top - this._worldSpaceDeadZone.top;
            }
        }
    }
}

enum CameraStyle {
    lockOn,
    cameraWindow,
}