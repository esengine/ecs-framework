abstract class Collider extends Component{
    public shape: Shape;
    public physicsLayer = 1 << 0;
    public isTrigger: boolean;
    public registeredPhysicsBounds: Rectangle;

    protected _isParentEntityAddedToScene;
    protected _isPositionDirty = true;
    protected _colliderRequiresAutoSizing;

    public get bounds(): Rectangle {
        return this.shape.bounds;
    }

    public initialize() {
    }
}