abstract class Collider extends Component{
    public shape: Shape;
    public physicsLayer = 1 << 0;
    public isTrigger: boolean;
    public registeredPhysicsBounds: Rectangle;
    public shouldColliderScaleAndRotationWithTransform = true;
    public collidesWithLayers = Physics.allLayers;

    public _localOffsetLength: number;
    public _isPositionDirty = true;
    public _isRotationDirty = true;
    protected _isParentEntityAddedToScene;
    protected _colliderRequiresAutoSizing;
    protected _localOffset: Vector2 = new Vector2(0, 0);
    protected _isColliderRegistered;

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
            this._localOffsetLength = this._localOffset.length();
            this._isPositionDirty = true;
            this.registerColliderWithPhysicsSystem();
        }
    }

    public registerColliderWithPhysicsSystem(){
        if (this._isParentEntityAddedToScene && !this._isColliderRegistered){
            Physics.addCollider(this);
            this._isColliderRegistered = true;
        }
    }

    public unregisterColliderWithPhysicsSystem(){
        if (this._isParentEntityAddedToScene && this._isColliderRegistered){
            Physics.removeCollider(this);
        }
        this._isColliderRegistered = false;
    }

    public overlaps(other: Collider){
        return this.shape.overlaps(other.shape);
    }

    /**
     * 检查这个与运动应用的碰撞器(移动向量)是否与碰撞器碰撞。如果是这样，将返回true，并且结果将填充碰撞数据。
     * @param collider 
     * @param motion 
     */
    public collidesWith(collider: Collider, motion: Vector2){
        // 改变形状的位置，使它在移动后的位置，这样我们可以检查重叠
        let oldPosition = this.shape.position;
        this.shape.position = Vector2.add(this.shape.position, motion);

        let result = this.shape.collidesWithShape(collider.shape);
        if (result)
            result.collider = collider;

        // 将图形位置返回到检查前的位置
        this.shape.position = oldPosition;

        return result;
    }

    public onAddedToEntity(){
        if (this._colliderRequiresAutoSizing){
            if (!(this instanceof BoxCollider)){
                console.error("Only box and circle colliders can be created automatically");
            }

            let renderable = this.entity.getComponent<RenderableComponent>(RenderableComponent);
            if (renderable){
                let renderbaleBounds = renderable.bounds;

                // 这里我们需要大小*反尺度，因为当我们自动调整碰撞器的大小时，它需要没有缩放的渲染
                let width = renderbaleBounds.width / this.entity.scale.x;
                let height = renderbaleBounds.height / this.entity.scale.y;

                if (this instanceof BoxCollider){
                    let boxCollider = this as BoxCollider;
                    boxCollider.width = width;
                    boxCollider.height = height;

                    // 获取渲染的中心，将其转移到本地坐标，并使用它作为碰撞器的localOffset
                    this.localOffset = Vector2.subtract(renderbaleBounds.center, this.entity.position);
                }
            }
        }

        this._isParentEntityAddedToScene = true;
        this.registerColliderWithPhysicsSystem();
    }
    
    public onRemovedFromEntity(){
        this.unregisterColliderWithPhysicsSystem();
        this._isParentEntityAddedToScene = false;
    }

    public onEnabled(){
        this.registerColliderWithPhysicsSystem();
        this._isPositionDirty = this._isRotationDirty = true;
    }

    public onDisabled(){
        this.unregisterColliderWithPhysicsSystem();
    }

    public update(){
        let spriteRenderer = this.entity.getComponent(SpriteRenderer);
        // 将显示目标设置为碰撞盒
        if (spriteRenderer){
            this.bounds.x = spriteRenderer.x;
            this.bounds.y = spriteRenderer.y;
        }
    }
}