module es {
    export class Collider extends Component {
        public static readonly lateSortOrder = 999;
        public castSortOrder: number = 0;
        /**
         * 对撞机的基本形状
         */
        public shape: Shape;
        /**
         * 如果这个碰撞器是一个触发器，它将不会引起碰撞，但它仍然会触发事件
         */
        public isTrigger: boolean = false;
        /**
         * 在处理冲突时，physicsLayer可以用作过滤器。Flags类有帮助位掩码的方法
         */
        public physicsLayer = new Ref(1 << 0);
        /**
         * 碰撞器在使用移动器移动时应该碰撞的层
         * 默认为所有层
         */
        public collidesWithLayers: Ref<number> = new Ref(Physics.allLayers);
        /**
         * 如果为true，碰撞器将根据附加的变换缩放和旋转
         */
        public shouldColliderScaleAndRotateWithTransform = true;
        /**
         * 这个对撞机在物理系统注册时的边界。
         * 存储这个允许我们始终能够安全地从物理系统中移除对撞机，即使它在试图移除它之前已经被移动了。
         */
        public registeredPhysicsBounds: Rectangle = new Rectangle();

        protected _colliderRequiresAutoSizing: boolean;

        public _localOffsetLength: number;
        public _isPositionDirty: boolean = true;
        public _isRotationDirty: boolean = true;
        /**
         * 标记来跟踪我们的实体是否被添加到场景中
         */
        protected _isParentEntityAddedToScene;
        /**
         * 标记来记录我们是否注册了物理系统
         */
        protected _isColliderRegistered;

        /**
         * 表示碰撞器的绝对位置
         */
        public get absolutePosition(): Vector2 {
            return Vector2.add(this.entity.transform.position, this._localOffset);
        }

        /**
         * 封装变换。如果碰撞器没和实体一起旋转 则返回transform.rotation
         */
        public get rotation(): number {
            if (this.shouldColliderScaleAndRotateWithTransform && this.entity != null)
                return this.entity.transform.rotation;

            return 0;
        }

        public get bounds(): Rectangle {
            if (this._isPositionDirty || this._isRotationDirty) {
                this.shape.recalculateBounds(this);
                this._isPositionDirty = this._isRotationDirty = false;
            }

            return this.shape.bounds;
        }

        protected _localOffset: Vector2 = Vector2.zero;

        /**
         * 将localOffset添加到实体。获取碰撞器几何图形的最终位置。
         * 允许向一个实体添加多个碰撞器并分别定位，还允许你设置缩放/旋转
         */
        public get localOffset(): Vector2 {
            return this._localOffset;
        }

        /**
         * 将localOffset添加到实体。获取碰撞器几何图形的最终位置。
         * 允许向一个实体添加多个碰撞器并分别定位，还允许你设置缩放/旋转
         * @param value
         */
        public set localOffset(value: Vector2) {
            this.setLocalOffset(value);
        }

        /**
         * 将localOffset添加到实体。获取碰撞器的最终位置。
         * 这允许您向一个实体添加多个碰撞器并分别定位它们。
         * @param offset
         */
        public setLocalOffset(offset: Vector2): Collider {
            if (!this._localOffset.equals(offset)) {
                this.unregisterColliderWithPhysicsSystem();
                this._localOffset.setTo(offset.x, offset.y);
                this._localOffsetLength = this._localOffset.magnitude();
                this._isPositionDirty = true;
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
            this._isPositionDirty = this._isRotationDirty = true;
            return this;
        }

        public onAddedToEntity() {
            if (this._colliderRequiresAutoSizing) {
                let renderable = null;
                for (let i = 0; i < this.entity.components.buffer.length; i ++) {
                    let component = this.entity.components.buffer[i];
                    if (component instanceof RenderableComponent){
                        renderable = component;
                        break;
                    }
                }

                if (renderable != null) {
                    let renderableBounds = renderable.bounds.clone();

                    let width = renderableBounds.width / this.entity.transform.scale.x;
                    let height = renderableBounds.height / this.entity.transform.scale.y;

                    if (this instanceof CircleCollider) {
                        this.radius = Math.max(width, height) * 0.5;
                        this.localOffset = renderableBounds.center.sub(this.entity.transform.position);
                    } else if (this instanceof BoxCollider) {
                        this.width = width;
                        this.height = height;

                        this.localOffset = renderableBounds.center.sub(this.entity.transform.position);
                    }
                }
            }
            this._isParentEntityAddedToScene = true;
            this.registerColliderWithPhysicsSystem();
        }

        public onRemovedFromEntity() {
            this.unregisterColliderWithPhysicsSystem();
            this._isParentEntityAddedToScene = false;
        }

        public onEntityTransformChanged(comp: ComponentTransform) {
            switch (comp) {
                case ComponentTransform.position:
                    this._isPositionDirty = true;
                    break;
                case ComponentTransform.scale:
                    this._isPositionDirty = true;
                    break;
                case ComponentTransform.rotation:
                    this._isRotationDirty = true;
                    break;
            }

            if (this._isColliderRegistered)
                Physics.updateCollider(this);
        }

        public onEnabled() {
            this.registerColliderWithPhysicsSystem();
            this._isPositionDirty = this._isRotationDirty = true;
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
        public overlaps(other: Collider): boolean {
            return this.shape.overlaps(other.shape);
        }

        /**
         * 检查这个与运动应用的碰撞器(移动向量)是否与碰撞器碰撞。如果是这样，将返回true，并且结果将填充碰撞数据。
         * @param collider
         * @param motion
         * @param result
         */
        public collidesWith(collider: Collider, motion: Vector2, result: CollisionResult = new CollisionResult()): boolean {
            // 改变形状的位置，使它在移动后的位置，这样我们可以检查重叠
            const oldPosition = this.entity.position;
            this.entity.position = this.entity.position.add(motion);

            const didCollide = this.shape.collidesWithShape(collider.shape, result);
            if (didCollide)
                result.collider = collider;

            // 将图形位置返回到检查前的位置
            this.entity.position = oldPosition;

            return didCollide;
        }

        /**
         * 检查这个对撞机是否与对撞机发生碰撞。如果碰撞，则返回true，结果将被填充
         * @param collider 
         * @param result 
         */
        public collidesWithNonMotion(collider: Collider, result: CollisionResult = new CollisionResult()): boolean {
            if (this.shape.collidesWithShape(collider.shape, result)) {
                result.collider = collider;
                return true;
            }

            result.collider = null;
            return false;
        }

        /**
         * 检查此碰撞器是否已应用运动（增量运动矢量）与任何碰撞器发生碰撞。 
         * 如果是这样，则将返回true，并且将使用碰撞数据填充结果。 运动将设置为碰撞器在碰撞之前可以行进的最大距离。 
         * @param motion 
         * @param result 
         */
        public collidesWithAny(motion: Vector2, result: CollisionResult) {
            // 在我们的新位置上获取我们可能会碰到的任何东西 
            let colliderBounds = this.bounds.clone();
            colliderBounds.x += motion.x;
            colliderBounds.y += motion.y;
            let neighbors = Physics.boxcastBroadphaseExcludingSelf(this, colliderBounds, this.collidesWithLayers.value);

            // 更改形状位置，使其处于移动后的位置，以便我们检查是否有重叠 
            let oldPosition = this.shape.position.clone();
            this.shape.position = Vector2.add(this.shape.position, motion);

            let didCollide = false;
            for (let neighbor of neighbors) {
                if (neighbor.isTrigger)
                    continue;

                if (this.collidesWithNonMotion(neighbor, result)) {
                    motion = motion.sub(result.minimumTranslationVector);
                    this.shape.position = this.shape.position.sub(result.minimumTranslationVector);
                    didCollide = true;
                }
            }

            // 将形状位置返回到检查之前的位置 
            this.shape.position = oldPosition.clone();

            return didCollide;
        }

        /**
         * 检查此碰撞器是否与场景中的其他碰撞器碰撞。它相交的第一个碰撞器将在碰撞结果中返回碰撞数据。
         * @param result 
         */
        public collidesWithAnyNonMotion(result: CollisionResult = new CollisionResult()) {
            // 在我们的新位置上获取我们可能会碰到的任何东西 
            let neighbors = Physics.boxcastBroadphaseExcludingSelfNonRect(this, this.collidesWithLayers.value);

            for (let neighbor of neighbors) {
                if (neighbor.isTrigger)
                    continue;

                if (this.collidesWithNonMotion(neighbor, result))
                    return true;
            }

            return false;
        }
    }
}
