module es {
    /**
     * 扇形形状
     */
    export class Sector extends Shape {
        public center: Vector2;
        public radius: number;
        public startAngle: number;
        public endAngle: number;
        public angle: number;
        public radiusSquared: number;
        public numberOfPoints: number;
        public angleStep: number;
        public points: Vector2[];

        public get sectorAngle(): number {
            let angle = this.endAngle - this.startAngle;
            if (angle < 0) angle += 360;
            return angle;
        }

        constructor(center: Vector2, radius: number, startAngle: number, endAngle: number) {
            super();
            this.center = center;
            this.radius = radius;
            this.startAngle = startAngle;
            this.endAngle = endAngle;
            this.angle = endAngle - startAngle;
            this.radiusSquared = radius * radius;
            this.points = this.getPoints();
            this.calculateProperties();
        }

        /**
         * 扇形的圆心和半径计算出扇形的重心
         * @returns 
         */
        public getCentroid(): Vector2 {
            const x = (Math.cos(this.startAngle) + Math.cos(this.endAngle)) * this.radius / 3;
            const y = (Math.sin(this.startAngle) + Math.sin(this.endAngle)) * this.radius / 3;
            return new Vector2(x + this.center.x, y + this.center.y);
        }

        /**
         * 计算向量角度
         * @returns 
         */
        public getAngle(): number {
            return this.startAngle;
        }

        public recalculateBounds(collider: Collider): void {
            const localCenter = this.center.add(collider.localOffset);
            const x = localCenter.x - this.radius;
            const y = localCenter.y - this.radius;
            const width = this.radius * 2;
            const height = this.radius * 2;
            const bounds = new Rectangle(x, y, width, height);
            this.bounds = bounds;

            this.center = localCenter;
        }

        public overlaps(other: Shape): boolean {
            let result = new Out<CollisionResult>();
            if (other instanceof Polygon)
                return ShapeCollisionSector.sectorToPolygon(this, other, result);

            if (other instanceof Circle) {
                if (ShapeCollisionSector.sectorToCircle(this, other, result)) {
                    result.value.invertResult();
                    return true;
                }

                return false;
            }

            throw new Error(`overlaps of Sector to ${other} are not supported`);
        }

        public collidesWithShape(other: Shape, collisionResult: Out<CollisionResult>): boolean {
            if (other instanceof Box) {
                return ShapeCollisionSector.sectorToBox(this, other, collisionResult);
            }
            
            if (other instanceof Polygon) {
                return ShapeCollisionSector.sectorToPolygon(this, other, collisionResult);
            }

            if (other instanceof Circle) {
                return ShapeCollisionSector.sectorToCircle(this, other, collisionResult);
            }

            throw new Error(`overlaps of Polygon to ${other} are not supported`);
        }

        public collidesWithLine(start: Vector2, end: Vector2, hit: Out<RaycastHit>): boolean {
            const toStart = start.sub(this.center);
            const toEnd = end.sub(this.center);
            const angleStart = toStart.getAngle();
            const angleEnd = toEnd.getAngle();
            let angleDiff = angleEnd - angleStart;

            if (angleDiff > Math.PI) {
                angleDiff -= 2 * Math.PI;
            } else if (angleDiff < -Math.PI) {
                angleDiff += 2 * Math.PI;
            }

            if (angleDiff >= this.startAngle && angleDiff <= this.endAngle) {
                const r = toStart.getLength();
                const t = this.startAngle - angleStart;
                const x = r * Math.cos(t);
                const y = r * Math.sin(t);
                const intersection = new Vector2(x, y);

                if (intersection.isBetween(start, end)) {
                    const distance = intersection.sub(start).getLength();
                    const fraction = distance / start.getDistance(end);
                    const normal = intersection.sub(this.center).normalize();
                    const point = intersection.add(this.center);

                    const raycastHit = new RaycastHit();
                    raycastHit.setValues(fraction, distance, point, normal);
                    hit.value = raycastHit;

                    return true;
                }
            }

            return false;
        }

        public containsPoint(point: Vector2) {
            const toPoint = point.sub(this.center);
            const distanceSquared = toPoint.lengthSquared();

            if (distanceSquared > this.radiusSquared) {
                return false;
            }

            const angle = toPoint.getAngle();
            const startAngle = this.startAngle;
            const endAngle = startAngle + this.angle;

            let angleDiff = angle - startAngle;
            if (angleDiff < 0) {
                angleDiff += Math.PI * 2;
            }
            if (angleDiff > this.angle) {
                return false;
            }

            return true;
        }

        public pointCollidesWithShape(point: Vector2, result: Out<CollisionResult>): boolean {
            if (!this.containsPoint(point)) {
                if (result) {
                    result.value = null;
                }
                return false;
            }

            if (result) {
                result.value = new CollisionResult();
                result.value.normal = point.sub(this.center).normalize();
                result.value.minimumTranslationVector = result.value.normal.scale(
                    this.radius - point.sub(this.center).getLength()
                );
                result.value.point = point;
            }

            return true;
        }

        public getPoints(): Vector2[] {
            let points = new Array<Vector2>(this.numberOfPoints);
            for (let i = 0; i < this.numberOfPoints; i++) {
                let angle = this.startAngle + i * this.angleStep;
                points[i] = Vector2.fromAngle(angle, this.radius).add(this.center);
            }
            return points;
        }
        
        private calculateProperties() {
            this.numberOfPoints = Math.max(10, Math.floor(this.radius * 0.1));
            this.angleStep = (this.endAngle - this.startAngle) / (this.numberOfPoints - 1);
        }

        public getFurthestPoint(normal: Vector2): Vector2 {
            let maxProjection = -Number.MAX_VALUE;
            let furthestPoint = new Vector2();
            for (let i = 0; i < this.numberOfPoints; i++) {
                let projection = this.points[i].dot(normal);
                if (projection > maxProjection) {
                    maxProjection = projection;
                    furthestPoint.copyFrom(this.points[i]);
                }
            }
            return furthestPoint;
        }
        
    }
}