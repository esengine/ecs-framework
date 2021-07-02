module es {
    export class DistanceConstraint extends Constraint {
        public stiffness: number;
        public restingDistance: number;
        public tearSensitivity = Number.POSITIVE_INFINITY;
        public shouldApproximateCollisionsWithPoints: boolean;
        public totalPointsToApproximateCollisionsWith = 5;
        _particleOne: Particle;
        _particleTwo: Particle;
        static _polygon: Polygon = new Polygon([]);

        constructor(first: Particle, second: Particle, stiffness: number, distance: number = -1) {
            super();

            DistanceConstraint._polygon.create(2, 1);
            this._particleOne = first;
            this._particleTwo = second;
            this.stiffness = stiffness;

            if (distance > -1)
                this.restingDistance = distance;
            else
                this.restingDistance = Vector2.distance(first.position, second.position);
        }

        public static create(a: Particle, center: Particle, c: Particle, stiffness: number, angleInDegrees: number) {
            const aToCenter = Vector2.distance(a.position, center.position);
            const cToCenter = Vector2.distance(c.position, center.position);
            const distance = Math.sqrt(aToCenter * aToCenter + cToCenter * cToCenter - (2 * aToCenter * cToCenter * Math.cos(angleInDegrees * MathHelper.Deg2Rad)));

            return new DistanceConstraint(a, c, stiffness, distance);
        }

        public setTearSensitivity(tearSensitivity: number) {
            this.tearSensitivity = tearSensitivity;
            return this;
        }

        public setCollidesWithColliders(collidesWithColliders: boolean) {
            this.collidesWithColliders = collidesWithColliders;
            return this;
        }

        public setShouldApproximateCollisionsWithPoints(shouldApproximateCollisionsWithPoints: boolean) {
            this.shouldApproximateCollisionsWithPoints = shouldApproximateCollisionsWithPoints;
            return this;
        }
        
        public solve(): void {
            const diff = this._particleOne.position.sub(this._particleTwo.position);
            const d = diff.magnitude();

            const difference = (this.restingDistance - d) / d;
            if (d / this.restingDistance > this.tearSensitivity) {
                this.composite.removeConstraint(this);
                return;
            }

            const im1 = 1 / this._particleOne.mass;
            const im2 = 1 / this._particleTwo.mass;
            const scalarP1 = (im1 / (im1 + im2)) * this.stiffness;
            const scalarP2 = this.stiffness - scalarP1;

            this._particleOne.position = this._particleOne.position.add(diff.scale(scalarP1 * difference));
            this._particleTwo.position = this._particleTwo.position.sub(diff.scale(scalarP2 * difference));
        }

        public handleCollisions(collidesWithLayers: number) {
            if (this.shouldApproximateCollisionsWithPoints) {
                this.approximateCollisionsWithPoints(collidesWithLayers);
                return;
            }

            const minX = Math.min(this._particleOne.position.x, this._particleTwo.position.x);
            const maxX = Math.max(this._particleOne.position.x, this._particleTwo.position.x);
            const minY = Math.min(this._particleOne.position.y, this._particleTwo.position.y);
            const maxY = Math.max(this._particleOne.position.y, this._particleTwo.position.y);
            DistanceConstraint._polygon.bounds = Rectangle.fromMinMax(minX, minY, maxX, maxY);

            let midPoint: Vector2;
            this.preparePolygonForCollisionChecks(midPoint);

            const colliders = Physics.boxcastBroadphase(DistanceConstraint._polygon.bounds, collidesWithLayers);
            for (let i = 0; i < colliders.length; i ++) {
                const collider = colliders[i];
                const result = new CollisionResult();
                if (DistanceConstraint._polygon.collidesWithShape(collider.shape, result)) {
                    this._particleOne.position = this._particleOne.position.sub(result.minimumTranslationVector);
                    this._particleTwo.position = this._particleTwo.position.sub(result.minimumTranslationVector);
                }
            }
        }

        approximateCollisionsWithPoints(collidesWithLayers: number) {
            let pt: Vector2;
            for (let j = 0; j < this.totalPointsToApproximateCollisionsWith - 1; j ++) {
                pt = Vector2.lerp(this._particleOne.position, this._particleTwo.position, (j + 1) / this.totalPointsToApproximateCollisionsWith);
                const collidedCount = Physics.overlapCircleAll(pt, 3, VerletWorld._colliders, collidesWithLayers);
                for (let i = 0; i < collidedCount; i ++) {
                    const collider = VerletWorld._colliders[i];
                    const collisionResult = new CollisionResult();
                    if (collider.shape.pointCollidesWithShape(pt, collisionResult)) {
                        this._particleOne.position = this._particleOne.position.sub(collisionResult.minimumTranslationVector);
                        this._particleTwo.position = this._particleTwo.position.sub(collisionResult.minimumTranslationVector);
                    }
                }
            }
        }

        preparePolygonForCollisionChecks(midPoint: Vector2) {
            const tempMidPoint = Vector2.lerp(this._particleOne.position, this._particleTwo.position, 0.5);
            midPoint.setTo(tempMidPoint.x, tempMidPoint.y);
            DistanceConstraint._polygon.position = midPoint;
            DistanceConstraint._polygon.points[0] = this._particleOne.position.sub(DistanceConstraint._polygon.position);
            DistanceConstraint._polygon.points[1] = this._particleTwo.position.sub(DistanceConstraint._polygon.position);
            DistanceConstraint._polygon.recalculateCenterAndEdgeNormals();
        }

        public debugRender(batcher: IBatcher) {
            batcher.drawLine(this._particleOne.position, this._particleTwo.position, new Color(67, 62, 54), 1);
        }
    }
}