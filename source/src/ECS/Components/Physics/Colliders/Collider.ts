module es {
    export abstract class Collider extends Component {
        /**
         * 对撞机的基本形状
         */
        public shape: Shape;
        /**
         * 将localOffset添加到实体。获取碰撞器几何图形的最终位置。
         * 允许向一个实体添加多个碰撞器并分别定位，还允许你设置缩放/旋转
         */
        public get localOffset(): Vector2{
            return this._localOffset;
        }

        /**
         * 将localOffset添加到实体。获取碰撞器几何图形的最终位置。
         * 允许向一个实体添加多个碰撞器并分别定位，还允许你设置缩放/旋转
         * @param value
         */
        public set localOffset(value: Vector2){
            this.setLocalOffset(value);
        }

        /**
         * 镖师碰撞器的绝对位置
         */
        public get absolutePosition(): Vector2{
            return Vector2.add(this.entity.transform.position, this._localOffset);
        }

        /**
         * 封装变换。如果碰撞器没和实体一起旋转 则返回transform.rotation
         */
        public get rotation(): number{
            if (this.shouldColliderScaleAndRotateWithTransform && this.entity)
                return this.entity.transform.rotation;

            return 0;
        }

        /**
         * 如果这个碰撞器是一个触发器，它将不会引起碰撞，但它仍然会触发事件
         */
        public isTrigger: boolean;
        /**
         * 在处理冲突时，physicsLayer可以用作过滤器。Flags类有帮助位掩码的方法
         */
        public physicsLayer = 1 << 0;
        /**
         * 碰撞器在使用移动器移动时应该碰撞的层
         * 默认为所有层
         */
        public collidesWithLayers = Physics.allLayers;

        /**
         * 如果为true，碰撞器将根据附加的变换缩放和旋转
         */
        public shouldColliderScaleAndRotateWithTransform = true;

        public get bounds(): Rectangle {
            this.shape.recalculateBounds(this);

            return this.shape.bounds;
        }

        /**
         * 这个对撞机在物理系统注册时的边界。
         * 存储这个允许我们始终能够安全地从物理系统中移除对撞机，即使它在试图移除它之前已经被移动了。
         */
        public registeredPhysicsBounds: Rectangle = new Rectangle();
        protected _colliderRequiresAutoSizing;
        protected _localOffset: Vector2 = Vector2.zero;
        public _localOffsetLength: number;

        /**
         * 标记来跟踪我们的实体是否被添加到场景中
         */
        protected _isParentEntityAddedToScene;
        /**
         * 标记来记录我们是否注册了物理系统
         */
        protected _isColliderRegistered;

        /**
         * 将localOffset添加到实体。获取碰撞器的最终位置。
         * 这允许您向一个实体添加多个碰撞器并分别定位它们。
         * @param offset
         */
        public setLocalOffset(offset: Vector2): Collider{
            if (this._localOffset != offset){
                this.unregisterColliderWithPhysicsSystem();
                this._localOffset = offset;
                this._localOffsetLength = this._localOffset.length();
                this.registerColliderWithPhysicsSystem();
            }

            return this;
        }

        /**
         * 如果为true，碰撞器将根据附加的变换缩放和旋转
         * @param shouldColliderScaleAndRotationWithTransform
         */
        public setShouldColliderScaleAndRotateWithTransform(shouldColliderScaleAndRotationWithTransform: boolean): Collider {
            this.shouldColliderScaleAndRotateWithTransform = shouldColliderScaleAndRotationWithTransform;
            return this;
        }

        public onAddedToEntity() {
            if (this._colliderRequiresAutoSizing) {
                if (!(this instanceof BoxCollider || this instanceof CircleCollider)) {
                    console.error("Only box and circle colliders can be created automatically");
                    return;
                }

                let renderable = this.entity.getComponent<RenderableComponent>(RenderableComponent);
                if (renderable) {
                    let bounds = renderable.bounds;

                    // 这里我们需要大小*反尺度，因为当我们自动调整碰撞器的大小时，它需要没有缩放的渲染
                    let width = bounds.width / this.entity.scale.x;
                    let height = bounds.height / this.entity.scale.y;
                    // 圆碰撞器需要特别注意原点
                    if (this instanceof CircleCollider){
                        let circleCollider = this as CircleCollider;
                        circleCollider.radius = Math.max(width, height) * 0.5;
                    } else {
                        this.width = width;
                        this.height = height;
                    }

                    // 获取渲染的中心，将其转移到本地坐标，并使用它作为碰撞器的localOffset
                    this.localOffset = Vector2.subtract(bounds.center, this.entity.transform.position);
                } else {
                    console.warn("Collider has no shape and no RenderableComponent. Can't figure out how to size it.");
                }
            }

            this._isParentEntityAddedToScene = true;
            this.registerColliderWithPhysicsSystem();
        }

        public onRemovedFromEntity() {
            this.unregisterColliderWithPhysicsSystem();
            this._isParentEntityAddedToScene = false;
        }

        public onEntityTransformChanged(comp: transform.Component) {
            if (this._isColliderRegistered)
                Physics.updateCollider(this);
        }

        public onEnabled() {
            this.registerColliderWithPhysicsSystem();
        }

        public onDisabled() {
            this.unregisterColliderWithPhysicsSystem();
        }

        /**
         * 父实体会在不同的时间调用它(当添加到场景，启用，等等)
         */
        public registerColliderWithPhysicsSystem() {
            // 如果在将我们添加到实体之前更改了origin等属性，则实体可以为null
            if (this._isParentEntityAddedToScene && !this._isColliderRegistered) {
                Physics.addCollider(this);
                this._isColliderRegistered = true;
            }
        }

        /**
         * 父实体会在不同的时候调用它(从场景中移除，禁用，等等)
         */
        public unregisterColliderWithPhysicsSystem() {
            if (this._isParentEntityAddedToScene && this._isColliderRegistered) {
                Physics.removeCollider(this);
            }
            this._isColliderRegistered = false;
        }

        /**
         * 检查这个形状是否与物理系统中的其他对撞机重叠
         * @param other
         */
        public overlaps(other: Collider) {
            return this.shape.overlaps(other.shape);
        }

        /**
         * 检查这个与运动应用的碰撞器(移动向量)是否与碰撞器碰撞。如果是这样，将返回true，并且结果将填充碰撞数据。
         * @param collider
         * @param motion
         */
        public collidesWith(collider: Collider, motion: Vector2) {
            // 改变形状的位置，使它在移动后的位置，这样我们可以检查重叠
            let oldPosition = this.entity.position;
            this.entity.position = Vector2.add(this.entity.position, motion);

            let result = this.shape.collidesWithShape(collider.shape);
            if (result)
                result.collider = collider;

            // 将图形位置返回到检查前的位置
            this.entity.position = oldPosition;

            return result;
        }
    }
}
