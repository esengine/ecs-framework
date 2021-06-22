module es {
    class CharacterRaycastOrigins {
        public topLeft: Vector2;
        public bottomRight: Vector2;
        public bottomLeft: Vector2;

        public constructor() {
            this.topLeft = Vector2.zero;
            this.bottomRight = Vector2.zero;
            this.bottomLeft = Vector2.zero;
        }
    }

    class CharacterCollisionState2D {
        public right: boolean = false;
        public left: boolean = false;
        public above: boolean = false;
        public below: boolean = false;
        public becameGroundedThisFrame: boolean = false;
        public wasGroundedLastFrame: boolean = false;
        public movingDownSlope: boolean = false;
        public slopeAngle: number = 0;

        public hasCollision(): boolean {
            return this.below || this.right || this.left || this.above;
        }

        public reset(): void {
            this.right = this.left = false;
            this.above = this.below = false;
            this.becameGroundedThisFrame = this.movingDownSlope = false;
            this.slopeAngle = 0;
        }

        public toString(): string {
            return `[CharacterCollisionState2D] r: ${this.right}, l: ${this.left}, a: ${this.above}, b: ${this.below}, movingDownSlope: ${this.movingDownSlope}, angle: ${this.slopeAngle}, wasGroundedLastFrame: ${this.wasGroundedLastFrame}, becameGroundedThisFrame: ${this.becameGroundedThisFrame}`;
        }
    }

    export class CharacterController implements ITriggerListener {
        public onControllerCollidedEvent: ObservableT<RaycastHit>;
        public onTriggerEnterEvent: ObservableT<Collider>;
        public onTriggerExitEvent: ObservableT<Collider>;


        /**
         * 如果为 true，则在垂直移动单帧时将忽略平台的一种方式 
         */
        public ignoreOneWayPlatformsTime: number;
        public supportSlopedOneWayPlatforms: boolean;

        public ignoredColliders: Set<Collider> = new Set();


        /**
         * 定义距离碰撞射线的边缘有多远。 
         * 如果使用 0 范围进行投射，则通常会导致不需要的光线击中（例如，直接从表面水平投射的足部碰撞器可能会导致击中） 
         */
        public get skinWidth() {
            return this._skinWidth;
        }

        public set skinWidth(value: number) {
            this._skinWidth = value;
            this.recalculateDistanceBetweenRays();
        }

        /**
         * CC2D 可以爬升的最大坡度角 
         */
        public slopeLimit: number = 30;

        /**
         * 构成跳跃的帧之间垂直运动变化的阈值 
         */
        public jumpingThreshold: number = -7;

        /**
         * 基于斜率乘以速度的曲线（负 = 下坡和正 = 上坡） 
         */
        public slopeSpeedMultiplier: AnimCurve;

        public totalHorizontalRays: number = 5;
        public totalVerticalRays: number = 3;

        public collisionState: CharacterCollisionState2D = new CharacterCollisionState2D();
        public velocity: Vector2 = new Vector2(0, 0);

        public get isGrounded(): boolean {
            return this.collisionState.below;
        }

        public get raycastHitsThisFrame(): RaycastHit[] {
            return this._raycastHitsThisFrame;
        }

        public constructor(
            player: Entity,
            skinWidth?: number,
            platformMask: number = -1,
            onewayPlatformMask: number = -1,
            triggerMask: number = -1
        ) {
            this.onTriggerEnterEvent = new ObservableT();
            this.onTriggerExitEvent = new ObservableT();
            this.onControllerCollidedEvent = new ObservableT();

            this.platformMask = platformMask;
            this.oneWayPlatformMask = onewayPlatformMask;
            this.triggerMask = triggerMask;

            // 将我们的单向平台添加到我们的普通平台掩码中，以便我们可以从上方降落 
            this.platformMask |= this.oneWayPlatformMask;

            this._player = player;
            let collider = null;
            for (let i = 0; i < this._player.components.buffer.length; i++) {
                let component = this._player.components.buffer[i];
                if (component instanceof Collider) {
                    collider = component;
                    break;
                }
            }
            collider.isTrigger = false;
            if (collider instanceof BoxCollider) {
                this._collider = collider as BoxCollider;
            } else {
                throw new Error('player collider must be box');
            }

            // 在这里，我们触发了具有主体的 setter 的属性 
            this.skinWidth = skinWidth || collider.width * 0.05;

            this._slopeLimitTangent = Math.tan(75 * MathHelper.Deg2Rad);
            this._triggerHelper = new ColliderTriggerHelper(this._player);

            // 我们想设置我们的 CC2D 忽略所有碰撞层，除了我们的 triggerMask 
            for (let i = 0; i < 32; i++) {
                // 查看我们的 triggerMask 是否包含此层，如果不包含则忽略它 
                if ((this.triggerMask & (1 << i)) === 0) {
                    Flags.unsetFlag(this._collider.collidesWithLayers, i);
                }
            }
        }

        public onTriggerEnter(other: Collider, local: Collider): void {
            this.onTriggerEnterEvent.notify(other);
        }

        public onTriggerExit(other: Collider, local: Collider): void {
            this.onTriggerExitEvent.notify(other);
        }

        /**
         * 尝试将角色移动到位置 + deltaMovement。 任何挡路的碰撞器都会在遇到时导致运动停止
         * @param deltaMovement 
         * @param deltaTime 
         */
        public move(deltaMovement: Vector2, deltaTime: number): void {
            this.collisionState.wasGroundedLastFrame = this.collisionState.below;

            this.collisionState.reset();
            this._raycastHitsThisFrame = [];
            this._isGoingUpSlope = false;

            this.primeRaycastOrigins();

            if (deltaMovement.y > 0 && this.collisionState.wasGroundedLastFrame) {
                deltaMovement = this.handleVerticalSlope(deltaMovement);
            }

            if (deltaMovement.x !== 0) {
                deltaMovement = this.moveHorizontally(deltaMovement);
            }

            if (deltaMovement.y !== 0) {
                deltaMovement = this.moveVertically(deltaMovement);
            }

            this._player.setPosition(
                this._player.position.x + deltaMovement.x,
                this._player.position.y + deltaMovement.y
            );

            if (deltaTime > 0) {
                this.velocity.x = deltaMovement.x / deltaTime;
                this.velocity.y = deltaMovement.y / deltaTime;
            }

            if (
                !this.collisionState.wasGroundedLastFrame &&
                this.collisionState.below
            ) {
                this.collisionState.becameGroundedThisFrame = true;
            }

            if (this._isGoingUpSlope) {
                this.velocity.y = 0;
            }

            if (!this._isWarpingToGround) {
                this._triggerHelper.update();
            }
            for (let i = 0; i < this._raycastHitsThisFrame.length; i++) {
                this.onControllerCollidedEvent.notify(this._raycastHitsThisFrame[i]);
            }

            if (this.ignoreOneWayPlatformsTime > 0) {
                this.ignoreOneWayPlatformsTime -= deltaTime;
            }
        }


        /**
         * 直接向下移动直到接地 
         * @param maxDistance 
         */
        public warpToGrounded(maxDistance: number = 1000): void {
            this.ignoreOneWayPlatformsTime = 0;
            this._isWarpingToGround = true;
            let delta = 0;
            do {
                delta += 1;
                this.move(new Vector2(0, 1), 0.02);
                if (delta > maxDistance) {
                    break;
                }
            } while (!this.isGrounded);
            this._isWarpingToGround = false;
        }

        /**
         * 这应该在您必须在运行时修改 BoxCollider2D 的任何时候调用。 
         * 它将重新计算用于碰撞检测的光线之间的距离。
         * 它也用于 skinWidth setter，以防在运行时更改。 
         */
        public recalculateDistanceBetweenRays(): void {
            const colliderUsableHeight =
                this._collider.height * Math.abs(this._player.scale.y) -
                2 * this._skinWidth;
            this._verticalDistanceBetweenRays =
                colliderUsableHeight / (this.totalHorizontalRays - 1);

            const colliderUsableWidth =
                this._collider.width * Math.abs(this._player.scale.x) -
                2 * this._skinWidth;
            this._horizontalDistanceBetweenRays =
                colliderUsableWidth / (this.totalVerticalRays - 1);
        }

        /**
         * 将 raycastOrigins 重置为由 skinWidth 插入的框碰撞器的当前范围。 
         * 插入它是为了避免从直接接触另一个碰撞器的位置投射光线，从而导致不稳定的法线数据。 
         */
        private primeRaycastOrigins(): void {
            const rect = this._collider.bounds;
            this._raycastOrigins.topLeft = new Vector2(
                rect.x + this._skinWidth,
                rect.y + this._skinWidth
            );
            this._raycastOrigins.bottomRight = new Vector2(
                rect.right - this._skinWidth,
                rect.bottom - this._skinWidth
            );
            this._raycastOrigins.bottomLeft = new Vector2(
                rect.x + this._skinWidth,
                rect.bottom - this._skinWidth
            );
        }

        /**
         * 我们必须在这方面使用一些技巧。 
         * 光线必须从我们的碰撞器（skinWidth）内部的一小段距离投射，以避免零距离光线会得到错误的法线。 
         * 由于这个小偏移，我们必须增加光线距离 skinWidth 然后记住在实际移动玩家之前从 deltaMovement 中删除 skinWidth 
         * @param deltaMovement 
         * @returns 
         */
        private moveHorizontally(deltaMovement: Vector2): Vector2 {
            const isGoingRight = deltaMovement.x > 0;
            let rayDistance =
                Math.abs(deltaMovement.x) +
                this._skinWidth * this.rayOriginSkinMutiplier;
            const rayDirection: Vector2 = isGoingRight ? Vector2.right : Vector2.left;
            const initialRayOriginY = this._raycastOrigins.bottomLeft.y;
            const initialRayOriginX = isGoingRight
                ? this._raycastOrigins.bottomRight.x -
                this._skinWidth * (this.rayOriginSkinMutiplier - 1)
                : this._raycastOrigins.bottomLeft.x +
                this._skinWidth * (this.rayOriginSkinMutiplier - 1);

            for (let i = 0; i < this.totalHorizontalRays; i++) {
                const ray = new Vector2(
                    initialRayOriginX,
                    initialRayOriginY - i * this._verticalDistanceBetweenRays
                );

                // if we are grounded we will include oneWayPlatforms
                // only on the first ray (the bottom one). this will allow us to
                // walk up sloped oneWayPlatforms
                if (
                    i === 0 &&
                    this.supportSlopedOneWayPlatforms &&
                    this.collisionState.wasGroundedLastFrame
                ) {
                    this._raycastHit = Physics.linecastIgnoreCollider(
                        ray,
                        ray.add(rayDirection.multiplyScaler(rayDistance)),
                        this.platformMask,
                        this.ignoredColliders
                    );
                } else {
                    this._raycastHit = Physics.linecastIgnoreCollider(
                        ray,
                        ray.add(rayDirection.multiplyScaler(rayDistance)),
                        this.platformMask & ~this.oneWayPlatformMask,
                        this.ignoredColliders
                    );
                }

                if (this._raycastHit.collider) {
                    if (
                        i === 0 &&
                        this.handleHorizontalSlope(
                            deltaMovement,
                            Vector2.unsignedAngle(this._raycastHit.normal, Vector2.up)
                        )
                    ) {
                        this._raycastHitsThisFrame.push(this._raycastHit);
                        break;
                    }

                    deltaMovement.x = this._raycastHit.point.x - ray.x;
                    rayDistance = Math.abs(deltaMovement.x);

                    if (isGoingRight) {
                        deltaMovement.x -= this._skinWidth * this.rayOriginSkinMutiplier;
                        this.collisionState.right = true;
                    } else {
                        deltaMovement.x += this._skinWidth * this.rayOriginSkinMutiplier;
                        this.collisionState.left = true;
                    }

                    this._raycastHitsThisFrame.push(this._raycastHit);

                    if (
                        rayDistance <
                        this._skinWidth * this.rayOriginSkinMutiplier +
                        this.kSkinWidthFloatFudgeFactor
                    ) {
                        break;
                    }
                }
            }

            return deltaMovement;
        }

        private moveVertically(deltaMovement: Vector2): Vector2 {
            const isGoingUp = deltaMovement.y < 0;
            let rayDistance =
                Math.abs(deltaMovement.y) +
                this._skinWidth * this.rayOriginSkinMutiplier;
            const rayDirection = isGoingUp ? Vector2.up : Vector2.down;

            let initialRayOriginX = this._raycastOrigins.topLeft.x;
            const initialRayOriginY = isGoingUp
                ? this._raycastOrigins.topLeft.y +
                this._skinWidth * (this.rayOriginSkinMutiplier - 1)
                : this._raycastOrigins.bottomLeft.y -
                this._skinWidth * (this.rayOriginSkinMutiplier - 1);

            initialRayOriginX += deltaMovement.x;

            let mask = this.platformMask;
            if (isGoingUp || this.ignoreOneWayPlatformsTime > 0) {
                mask &= ~this.oneWayPlatformMask;
            }

            for (let i = 0; i < this.totalVerticalRays; i++) {
                const rayStart = new Vector2(
                    initialRayOriginX + i * this._horizontalDistanceBetweenRays,
                    initialRayOriginY
                );
                this._raycastHit = Physics.linecastIgnoreCollider(
                    rayStart,
                    rayStart.add(rayDirection.multiplyScaler(rayDistance)),
                    mask,
                    this.ignoredColliders
                );
                if (this._raycastHit.collider) {
                    deltaMovement.y = this._raycastHit.point.y - rayStart.y;
                    rayDistance = Math.abs(deltaMovement.y);

                    if (isGoingUp) {
                        deltaMovement.y += this._skinWidth * this.rayOriginSkinMutiplier;
                        this.collisionState.above = true;
                    } else {
                        deltaMovement.y -= this._skinWidth * this.rayOriginSkinMutiplier;
                        this.collisionState.below = true;
                    }

                    this._raycastHitsThisFrame.push(this._raycastHit);

                    if (!isGoingUp && deltaMovement.y < -0.00001) {
                        this._isGoingUpSlope = true;
                    }

                    if (
                        rayDistance <
                        this._skinWidth * this.rayOriginSkinMutiplier +
                        this.kSkinWidthFloatFudgeFactor
                    ) {
                        break;
                    }
                }
            }

            return deltaMovement;
        }

        /**
         * 检查 BoxCollider2D 下的中心点是否存在坡度。 
         * 如果找到一个，则调整 deltaMovement 以便玩家保持接地，并考虑slopeSpeedModifier 以加快移动速度。 
         * @param deltaMovement 
         * @returns 
         */
        private handleVerticalSlope(deltaMovement: Vector2): Vector2 {
            const centerOfCollider =
                (this._raycastOrigins.bottomLeft.x +
                    this._raycastOrigins.bottomRight.x) *
                0.5;
            const rayDirection = Vector2.down;

            const slopeCheckRayDistance =
                this._slopeLimitTangent *
                (this._raycastOrigins.bottomRight.x - centerOfCollider);

            const slopeRay = new Vector2(
                centerOfCollider,
                this._raycastOrigins.bottomLeft.y
            );

            this._raycastHit = Physics.linecastIgnoreCollider(
                slopeRay,
                slopeRay.add(rayDirection.multiplyScaler(slopeCheckRayDistance)),
                this.platformMask,
                this.ignoredColliders
            );
            if (this._raycastHit.collider) {
                const angle = Vector2.unsignedAngle(this._raycastHit.normal, Vector2.up);
                if (angle === 0) {
                    return deltaMovement;
                }

                const isMovingDownSlope =
                    Math.sign(this._raycastHit.normal.x) === Math.sign(deltaMovement.x);
                if (isMovingDownSlope) {
                    const slopeModifier = this.slopeSpeedMultiplier
                        ? this.slopeSpeedMultiplier.lerp(-angle)
                        : 1;
                    deltaMovement.y +=
                        this._raycastHit.point.y - slopeRay.y - this.skinWidth;
                    deltaMovement.x *= slopeModifier;
                    this.collisionState.movingDownSlope = true;
                    this.collisionState.slopeAngle = angle;
                }
            }

            return deltaMovement;
        }

        /**
         * 如果我们要上坡，则处理调整 deltaMovement
         * @param deltaMovement 
         * @param angle 
         * @returns 
         */
        private handleHorizontalSlope(
            deltaMovement: Vector2,
            angle: number
        ): boolean {
            if (Math.round(angle) === 90) {
                return false;
            }

            if (angle < this.slopeLimit) {
                if (deltaMovement.y > this.jumpingThreshold) {
                    const slopeModifier = this.slopeSpeedMultiplier
                        ? this.slopeSpeedMultiplier.lerp(angle)
                        : 1;
                    deltaMovement.x *= slopeModifier;

                    deltaMovement.y = Math.abs(
                        Math.tan(angle * MathHelper.Deg2Rad) * deltaMovement.x
                    );
                    const isGoingRight = deltaMovement.x > 0;

                    const ray = isGoingRight
                        ? this._raycastOrigins.bottomRight
                        : this._raycastOrigins.bottomLeft;
                    let raycastHit = null;
                    if (
                        this.supportSlopedOneWayPlatforms &&
                        this.collisionState.wasGroundedLastFrame
                    ) {
                        raycastHit = Physics.linecastIgnoreCollider(
                            ray,
                            ray.add(deltaMovement),
                            this.platformMask,
                            this.ignoredColliders
                        );
                    } else {
                        raycastHit = Physics.linecastIgnoreCollider(
                            ray,
                            ray.add(deltaMovement),
                            this.platformMask & ~this.oneWayPlatformMask,
                            this.ignoredColliders
                        );
                    }

                    if (raycastHit.collider) {
                        deltaMovement.x = raycastHit.point.x - ray.x;
                        deltaMovement.y = raycastHit.point.y - ray.y;
                        if (isGoingRight) {
                            deltaMovement.x -= this._skinWidth;
                        } else {
                            deltaMovement.x += this._skinWidth;
                        }
                    }

                    this._isGoingUpSlope = true;
                    this.collisionState.below = true;
                }
            } else {
                deltaMovement.x = 0;
            }

            return true;
        }

        private _player: Entity;
        private _collider: BoxCollider;
        private _skinWidth: number = 0.02;
        private _triggerHelper: ColliderTriggerHelper;

        /**
         * 这用于计算为检查坡度而投射的向下光线。 
         * 我们使用有点随意的值 75 度来计算检查斜率的射线的长度。 
         */
        private _slopeLimitTangent: number;

        private readonly kSkinWidthFloatFudgeFactor: number = 0.001;

        /**
         * 我们的光线投射原点角的支架（TR、TL、BR、BL） 
         */
        private _raycastOrigins: CharacterRaycastOrigins = new CharacterRaycastOrigins();

        /**
         * 存储我们在移动过程中命中的光线投射 
         */
        private _raycastHit: RaycastHit = new RaycastHit();

        /**
         * 存储此帧发生的任何光线投射命中。 
         * 我们必须存储它们，以防我们遇到水平和垂直移动的碰撞，以便我们可以在设置所有碰撞状态后发送事件 
         */
        private _raycastHitsThisFrame: RaycastHit[];

        // 水平/垂直移动数据 
        private _verticalDistanceBetweenRays: number;
        private _horizontalDistanceBetweenRays: number;

        /**
         * 我们使用这个标志来标记我们正在爬坡的情况，我们修改了 delta.y 以允许爬升。 
         * 原因是，如果我们到达斜坡的尽头，我们可以进行调整以保持接地 
         */
        private _isGoingUpSlope: boolean = false;

        private _isWarpingToGround: boolean = true;

        private platformMask: number = -1;
        private triggerMask: number = -1;
        private oneWayPlatformMask: number = -1;

        private readonly rayOriginSkinMutiplier = 4;
    }
}