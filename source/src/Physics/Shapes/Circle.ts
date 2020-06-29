///<reference path="./Shape.ts" />
class Circle extends Shape {
    public radius: number;
    private _originalRadius: number;

    constructor(radius: number) {
        super();
        this.radius = radius;
        this._originalRadius = radius;
    }

    public pointCollidesWithShape(point: Vector2): CollisionResult {
        return ShapeCollisions.pointToCircle(point, this);
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

    public recalculateBounds(collider: Collider) {
        this.center = collider.localOffset;

        if (collider.shouldColliderScaleAndRotationWithTransform) {
            let scale = collider.entity.scale;
            let hasUnitScale = scale.x == 1 && scale.y == 1;
            let maxScale = Math.max(scale.x, scale.y);
            this.radius = this._originalRadius * maxScale;

            if (collider.entity.rotation != 0) {
                let offsetAngle = Math.atan2(collider.localOffset.y, collider.localOffset.x) * MathHelper.Rad2Deg;
                let offsetLength = hasUnitScale ? collider._localOffsetLength : (Vector2.multiply(collider.localOffset, collider.entity.scale)).length();
                this.center = MathHelper.pointOnCirlce(Vector2.zero, offsetLength, MathHelper.toDegrees(collider.entity.rotation) + offsetAngle);
            }
        }

        this.position = Vector2.add(collider.entity.position, this.center);
        this.bounds = new Rectangle(this.position.x - this.radius, this.position.y - this.radius, this.radius * 2, this.radius * 2);
    }

    public overlaps(other: Shape){
        if (other instanceof Box && (other as Box).isUnrotated)
            return Collisions.isRectToCircle(other.bounds, this.position, this.radius);

        if (other instanceof Circle)
            return Collisions.isCircleToCircle(this.position, this.radius, other.position, (other as Circle).radius);

        if (other instanceof Polygon)
            return ShapeCollisions.circleToPolygon(this, other);

        throw new Error(`overlaps of circle to ${other} are not supported`);
    }
}