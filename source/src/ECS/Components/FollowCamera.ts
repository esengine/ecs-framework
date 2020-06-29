class FollowCamera extends Component {
    public camera: Camera;
    public followLerp = 0.1;
    public deadzone: Rectangle = new Rectangle();
    public focusOffset: Vector2 = new Vector2();
    public mapLockEnabled: boolean;
    public mapSize: Vector2 = new Vector2();

    private _targetEntity: Entity;
    private _cameraStyle: CameraStyle;
    private _worldSpaceDeadZone: Rectangle = new Rectangle();
    private _desiredPositionDelta: Vector2 = new Vector2();
    private _targetCollider: Collider;

    constructor(targetEntity: Entity, cameraStyle: CameraStyle = CameraStyle.lockOn){
        super();

        this._targetEntity = targetEntity;
        this._cameraStyle = cameraStyle;
        this.camera = null;
    }

    public onAddedToEntity(){
        if (!this.camera)
            this.camera = this.entity.scene.camera;

        this.follow(this._targetEntity, this._cameraStyle);
    }

    public follow(targetEntity: Entity, cameraStyle: CameraStyle = CameraStyle.cameraWindow){
        this._targetEntity = targetEntity;
        this._cameraStyle = cameraStyle;
        let cameraBounds = this.camera.bounds;

        switch (this._cameraStyle){
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
        let halfScreen = Vector2.multiply(this.camera.bounds.size, new Vector2(0.5));
        this._worldSpaceDeadZone.x = this.camera.position.x - halfScreen.x + this.deadzone.x + this.focusOffset.x;
        this._worldSpaceDeadZone.y = this.camera.position.y - halfScreen.y + this.deadzone.y + this.focusOffset.y;
        this._worldSpaceDeadZone.width = this.deadzone.width;
        this._worldSpaceDeadZone.height = this.deadzone.height;

        if (this._targetEntity)
            this.updateFollow();

        this.camera.position = Vector2.lerp(this.camera.position, Vector2.add(this.camera.position, this._desiredPositionDelta), this.followLerp);
        this.camera.entity.roundPosition();

        if (this.mapLockEnabled){
            this.camera.position = this.clampToMapSize(this.camera.position);
            this.camera.entity.roundPosition();
        }
    }

    private clampToMapSize(position: Vector2){
        let halfScreen = Vector2.multiply(new Vector2(this.camera.bounds.width, this.camera.bounds.height), new Vector2(0.5));
        let cameraMax = new Vector2(this.mapSize.x - halfScreen.x, this.mapSize.y - halfScreen.y);

        return Vector2.clamp(position, halfScreen, cameraMax);
    }

    private updateFollow(){
        this._desiredPositionDelta.x = this._desiredPositionDelta.y = 0;

        if (this._cameraStyle == CameraStyle.lockOn){
            let targetX = this._targetEntity.position.x;
            let targetY = this._targetEntity.position.y;

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
                this._targetCollider = this._targetEntity.getComponent<Collider>(Collider);
                if (!this._targetCollider)
                    return;
            }

            let targetBounds = this._targetEntity.getComponent<Collider>(Collider).bounds;
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