///<reference path="./Shape.ts" />
module es {
    export class Circle extends Shape {
        public radius: number;
        public _originalRadius: number;

        constructor(radius: number) {
            super();
            this.radius = radius;
            this._originalRadius = radius;
        }

        public recalculateBounds(collider: Collider) {
            // 如果我们没有旋转或不关心TRS我们使用localOffset作为中心
            this.center = collider.localOffset;

            if (collider.shouldColliderScaleAndRotateWithTransform) {
                // 我们只将直线缩放为一个圆，所以我们将使用最大值
                const scale = collider.entity.transform.scale;
                const hasUnitScale = scale.x === 1 && scale.y === 1;
                const maxScale = Math.max(scale.x, scale.y);
                this.radius = this._originalRadius * maxScale;

                if (collider.entity.transform.rotation !== 0) {
                    // 为了处理偏移原点的旋转，我们只需要将圆心围绕(0,0)在一个圆上移动，我们的偏移量就是0角
                    const offsetAngle = Math.atan2(collider.localOffset.y, collider.localOffset.x) * MathHelper.Rad2Deg;
                    const offsetLength = hasUnitScale ? collider._localOffsetLength : collider.localOffset.multiply(collider.entity.transform.scale).magnitude();
                    this.center = MathHelper.pointOnCircle(Vector2.zero, offsetLength, collider.entity.transform.rotation + offsetAngle);
                }
            }

            this.position = collider.transform.position.add(this.center);
            this.bounds = new Rectangle(this.position.x - this.radius, this.position.y - this.radius, this.radius * 2, this.radius * 2);
        }

        public overlaps(other: Shape) {
            const result = new Out<CollisionResult>();
            if (other instanceof Box && (other as Box).isUnrotated)
                return Collisions.rectToCircle(other.bounds, this.position, this.radius);

            if (other instanceof Circle)
                return Collisions.circleToCircle(this.position, this.radius, other.position, (other as Circle).radius);

            if (other instanceof Polygon)
                return ShapeCollisionsCircle.circleToPolygon(this, other, result);

            throw new Error(`overlaps of circle to ${other} are not supported`);
        }

        public collidesWithShape(other: Shape, result: Out<CollisionResult>): boolean {
            if (other instanceof Box && (other as Box).isUnrotated) {
                return ShapeCollisionsCircle.circleToBox(this, other, result);
            }

            if (other instanceof Circle) {
                return ShapeCollisionsCircle.circleToCircle(this, other, result);
            }

            if (other instanceof Polygon) {
                return ShapeCollisionsCircle.circleToPolygon(this, other, result);
            }

            throw new Error(`Collisions of Circle to ${other} are not supported`);
        }

        public collidesWithLine(start: Vector2, end: Vector2, hit: Out<RaycastHit>): boolean {
            return ShapeCollisionsLine.lineToCircle(start, end, this, hit);
        }

        public getPointAlongEdge(angle: number): Vector2 {
            return new Vector2(
              this.position.x + this.radius * Math.cos(angle),
              this.position.y + this.radius * Math.sin(angle)
            );
          }

        /**
         * 获取所提供的点是否在此范围内
         * @param point
         */
        public containsPoint(point: Vector2) {
            return (point.sub(this.position)).lengthSquared() <= this.radius * this.radius;
        }

        public pointCollidesWithShape(point: Vector2, result: Out<CollisionResult>): boolean {
            return ShapeCollisionsPoint.pointToCircle(point, this, result);
        }
    }
}
