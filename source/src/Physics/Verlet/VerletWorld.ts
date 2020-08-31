module es {
    /**
     * Verlet模拟的根。创建一个世界，并调用它的更新方法。
     */
    export class VerletWorld {
        /**
         * 用于模拟的重力
         */
        public gravity: Vector2 = new Vector2(0, 980);
        /**
         * 整个模拟的最大迭代次数
         */
        public constraintIterations = 3;
        /**
         * 整个模拟的最大迭代次数
         */
        public maximumStepIterations = 5;
        /**
         * 世界的边界。粒子将被限制在这个空间中。
         */
        public simulationBounds?: Rectangle;
        /**
         * 粒子是否允许被拖拽
         */
        public allowDragging: boolean = true;

        public _composites: Composite[] = [];
        public static _colliders: Collider[] = new Array(4);
        public _tempCircle: Circle = new Circle(1);

        public _leftOverTime: number = 0;
        public _fixedDeltaTime = 1 / 60;
        public _iterationSteps: number = 0;
        public _fixedDeltaTimeSq: number = 0;

        constructor(simulationBounds: Rectangle = null) {
            this.simulationBounds = simulationBounds;
            this._fixedDeltaTimeSq = Math.pow(this._fixedDeltaTimeSq, 2);
        }

        public update(){
            this.updateTiming();

            if (this.allowDragging)
                this.handleDragging();

            for (let iteration = 1; iteration <= this._iterationSteps; iteration++){
                for (let i = this._composites.length - 1; i >= 0; i --){
                    let composite = this._composites[i];

                    for (let s = 0; s < this.constraintIterations; s++)
                        composite.solveConstraints();

                    composite.updateParticles(this._fixedDeltaTimeSq, this.gravity);
                    composite.handleConstraintCollisions();

                    for (let j = 0; j < composite.particles.length; j ++){
                        let p = composite.particles[j];

                        if (this.simulationBounds){
                            this.constrainParticleToBounds(p);
                        }

                        if (p.collidesWithColliders)
                            this.handleCollisions(p, composite.collidesWithLayers);
                    }
                }
            }
        }

        public handleCollisions(p: Particle, collidesWithLayers: number){
            let collidedCount = Physics.overlapCircleAll(p.position, p.radius, VerletWorld._colliders, collidesWithLayers);
            for (let i = 0; i < collidedCount; i ++){
                let collider = VerletWorld._colliders[i];
                if (collider.isTrigger)
                    continue;

                let collisionResult = new CollisionResult();
                // 如果我们有一个足够大的粒子半径使用一个圆来检查碰撞，否则回落到一个点
                if (p.radius < 2){
                    if (collider.shape.pointCollidesWithShape(p.position, collisionResult)){
                        // TODO: 添加一个碰撞器字典，让碰撞器设置为力的体积。然后，number可以在这里乘以mtv。它应该是非常小的值，比如0.002。
                        p.position.subtract(collisionResult.minimumTranslationVector);
                    }
                }else{
                    this._tempCircle.radius = p.radius;
                    this._tempCircle.position = p.position;

                    if (this._tempCircle.collidesWithShape(collider.shape, collisionResult)){
                        p.position.subtract(collisionResult.minimumTranslationVector);
                    }
                }
            }
        }

        public constrainParticleToBounds(p: Particle){
            let tempPos = p.position;
            let bounds = this.simulationBounds;

            if (p.radius == 0){
                if (tempPos.y > bounds.height)
                    tempPos.y = bounds.height;
                else if(tempPos.y < bounds.y)
                    tempPos.y = bounds.y;

                if (tempPos.x < bounds.x)
                    tempPos.x = bounds.x;
                else if (tempPos.x > bounds.width)
                    tempPos.x = bounds.width;
            }else{
                if (tempPos.y < bounds.y + p.radius)
                    tempPos.y = 2 * (bounds.y + p.radius) - tempPos.y;
                if (tempPos.y > bounds.height - p.radius)
                    tempPos.y = 2 * (bounds.height - p.radius) - tempPos.y;
                if (tempPos.x > bounds.width - p.radius)
                    tempPos.x = 2 * (bounds.width - p.radius) - tempPos.x;
                if (tempPos.x < bounds.x + p.radius)
                    tempPos.x = 2 * (bounds.x + p.radius) - tempPos.x;
            }

            p.position = tempPos;
        }

        public updateTiming(){
            this._leftOverTime += Time.deltaTime;
            this._iterationSteps = Math.floor(Math.trunc(this._leftOverTime / this._fixedDeltaTime));
            this._leftOverTime -= this._iterationSteps * this._fixedDeltaTime;

            this._iterationSteps = Math.min(this._iterationSteps, this.maximumStepIterations);
        }

        /**
         * 向模拟添加composite
         * @param composite
         */
        public addComposite<T extends Composite>(composite: T): T{
            this._composites.push(composite);
            return composite;
        }

        /**
         * 从模拟中删除一个composite
         * @param composite
         */
        public removeComposite(composite: Composite){
            this._composites.remove(composite);
        }

        public handleDragging(){

        }

        public debugRender(camera: Camera){
            for (let i = 0; i < this._composites.length; i ++)
                this._composites[i].debugRender(camera);
        }
    }
}