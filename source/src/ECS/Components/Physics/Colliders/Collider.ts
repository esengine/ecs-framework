abstract class Collider extends Component{
    public shape: Shape;
    public physicsLayer = 1 << 0;
    public isTrigger: boolean;
    public registeredPhysicsBounds: Rectangle;

    protected _isParentEntityAddedToScene;
    protected _isPositionDirty = true;
    protected _isRotationDirty = true;
    protected _colliderRequiresAutoSizing;
    protected _localOffset: Vector2;
    protected _isColliderRegisterd;

    public get bounds(): Rectangle {
        if (this._isPositionDirty || this._isRotationDirty){
            this.shape.recalculateBounds(this);
            this._isPositionDirty = this._isRotationDirty = false;
        }

        return this.shape.bounds;
    }

    public get localOffset(){
        return this._localOffset;
    }

    public set localOffset(value: Vector2){
        this.setLocalOffset(value);
    }

    public setLocalOffset(offset: Vector2){
        if (this._localOffset != offset){
            this.unregisterColliderWithPhysicsSystem();
            this._localOffset = offset;
            this._isPositionDirty = true;
            this.registerColliderWithPhysicsSystem();
        }
    }

    public registerColliderWithPhysicsSystem(){
        if (this._isParentEntityAddedToScene && !this._isColliderRegisterd){
            Physics.addCollider(this);
            this._isColliderRegisterd = true;
        }
    }

    public unregisterColliderWithPhysicsSystem(){
        if (this._isParentEntityAddedToScene && this._isColliderRegisterd){
            Physics.removeCollider(this);
        }
        this._isColliderRegisterd = false;
    }

    public initialize() {
    }
}