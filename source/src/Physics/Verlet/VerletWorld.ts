module es {
    export class VerletWorld {
        public gravity: Vector2 = new Vector2(0, 980);
        public constraintIterations = 3;
        public maximumStepIterations = 5;
        public simulationBounds: Rectangle;
        public allowDragging: boolean = true;
        public selectionRadiusSquared = 20 * 20;
        _draggedParticle: Particle;
        _composites: Composite[] = [];
        public static _colliders: Collider[] = [];
        _tempCircle: Circle = new Circle(1);

        _leftOverTime: number;
        _fixedDeltaTime: number = 1 / 60;
        _iterationSteps: number;
        _fixedDeltaTimeSq: number;

        constructor(simulationBounds: Rectangle = null) {
            this.simulationBounds = simulationBounds;
            this._fixedDeltaTime = Math.pow(this._fixedDeltaTime, 2);
        }

        public update() {
            this.updateTiming();

            if (this.allowDragging)
                this.handleDragging();

            for (let iteration = 1; iteration <= this._iterationSteps; iteration ++) {
                for (let i = this._composites.length - 1; i >= 0; i --) {
                    const composite = this._composites[i];
                    for (let s = 0; s < this.constraintIterations; s ++)
                        composite.solveConstraints();

                    composite.updateParticles(this._fixedDeltaTimeSq, this.gravity);

                    composite.handleConstraintCollisions();

                    for (let j = 0; j < composite.particles.length; j ++) {
                        const p = composite.particles[j];

                        if (this.simulationBounds) {
                            this.constrainParticleToBounds(p);
                        }

                        if (p.collidesWithColliders)
                            this.handleCollisions(p, composite.collidesWithLayers);
                    }
                }
            }
        }

        constrainParticleToBounds(p: Particle) {
            const tempPos = p.position;
            const bounds = this.simulationBounds;

            if (p.radius == 0) {
                if (tempPos.y > bounds.height)
                    tempPos.y = bounds.height;
                else if (tempPos.y < bounds.y)
                    tempPos.y = bounds.y;

                if (tempPos.x < bounds.x)
                    tempPos.x = bounds.x;
                else if (tempPos.x > bounds.width)
                    tempPos.x = bounds.width;
            } else {
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

        handleCollisions(p: Particle, collidesWithLayers: number) {
            const collidedCount = Physics.overlapCircleAll(p.position, p.radius, VerletWorld._colliders, collidesWithLayers);
            for (let i = 0; i < collidedCount; i++) {
                const collider = VerletWorld._colliders[i];
                if (collider.isTrigger)
                    continue;

                const collisionResult = new CollisionResult();

                if (p.radius < 2) {
                    if (collider.shape.pointCollidesWithShape(p.position, collisionResult)) {
                        p.position = p.position.sub(collisionResult.minimumTranslationVector);
                    }
                } else {
                    this._tempCircle.radius = p.radius;
                    this._tempCircle.position = p.position;

                    if (this._tempCircle.collidesWithShape(collider.shape, collisionResult)) {
                        p.position = p.position.sub(collisionResult.minimumTranslationVector);
                    }
                }
            }
        }

        updateTiming() {
            this._leftOverTime += Time.deltaTime;
            this._iterationSteps = Math.trunc(this._leftOverTime / this._fixedDeltaTime);
            this._leftOverTime -= this._iterationSteps * this._fixedDeltaTime;

            this._iterationSteps = Math.min(this._iterationSteps, this.maximumStepIterations);
        }

        public addComposite<T extends Composite>(composite: T): T {
            this._composites.push(composite);
            return composite;
        }

        public removeComposite(composite: Composite) {
            const index = this._composites.indexOf(composite);
            this._composites.splice(index, 1);
        }

        handleDragging() {

        }

        public getNearestParticle(position: Vector2) {
            let nearestSquaredDistance = this.selectionRadiusSquared;
            let particle: Particle = null;

            for (let j = 0; j < this._composites.length; j++) {
                const particles = this._composites[j].particles;
                for (let i = 0; i < particles.length; i++) {
                    const p = particles[i];
                    const squaredDistanceToParticle = Vector2.sqrDistance(p.position, position);
                    if (squaredDistanceToParticle <= this.selectionRadiusSquared &&
                        (particle == null || squaredDistanceToParticle < nearestSquaredDistance)) {
                        particle = p;
                        nearestSquaredDistance = squaredDistanceToParticle;
                    }
                }
            }

            return particle;
        }

        public debugRender(batcher: IBatcher) {
            for (let i = 0; i < this._composites.length; i ++) {
                this._composites[i].debugRender(batcher);
            }

            if (this.allowDragging) {
                if (this._draggedParticle != null) {
                    batcher.drawCircle(this._draggedParticle.position, 8, Color.White);
                }
            }
        }
    }
}