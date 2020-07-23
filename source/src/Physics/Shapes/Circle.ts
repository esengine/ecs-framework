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

        public recalculateBounds(collider: es.Collider) {
            // 如果我们没有旋转或不关心TRS我们使用localOffset作为中心
            this.center = collider.localOffset;

            if (collider.shouldColliderScaleAndRotateWithTransform) {
                // 我们只将直线缩放为一个圆，所以我们将使用最大值
                let scale = collider.entity.transform.scale;
                let hasUnitScale = scale.x == 1 && scale.y == 1;
                let maxScale = Math.max(scale.x, scale.y);
                this.radius = this._originalRadius * maxScale;

                if (collider.entity.transform.rotation != 0) {
                    // 为了处理偏移原点的旋转，我们只需要将圆心围绕(0,0)在一个圆上移动，我们的偏移量就是0角
                    let offsetAngle = Math.atan2(collider.localOffset.y, collider.localOffset.x) * MathHelper.Rad2Deg;
                    let offsetLength = hasUnitScale ? collider._localOffsetLength : Vector2.multiply(collider.localOffset, collider.entity.transform.scale).length();
                    this.center = MathHelper.pointOnCirlce(Vector2.zero, offsetLength, collider.entity.transform.rotation + offsetAngle);
                }
            }

            this.position = Vector2.add(collider.transform.position, this.center);
            this.bounds = new Rectangle(this.position.x - this.radius, this.position.y - this.radius, this.radius * 2, this.radius * 2);
        }

        public overlaps(other: Shape) {
            if (other instanceof Box && (other as Box).isUnrotated)
                return Collisions.isRectToCircle(other.bounds, this.position, this.radius);

            if (other instanceof Circle)
                return Collisions.isCircleToCircle(this.position, this.radius, other.position, (other as Circle).radius);

            if (other instanceof Polygon)
                return ShapeCollisions.circleToPolygon(this, other);

            throw new Error(`overlaps of circle to ${other} are not supported`);
        }

        public collidesWithShape(other: Shape): CollisionResult {
            if (other instanceof Box && (other as Box).isUnrotated) {
                return ShapeCollisions.circleToBox(this, other);
            }

            if (other instanceof Circle) {
                return ShapeCollisions.circleToCircle(this, other);
            }

            if (other instanceof Polygon) {
                return ShapeCollisions.circleToPolygon(this, other);
            }

            throw new Error(`Collisions of Circle to ${other} are not supported`);
        }

        public pointCollidesWithShape(point: Vector2): CollisionResult {
            return ShapeCollisions.pointToCircle(point, this);
        }
    }
}
