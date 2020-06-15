///<reference path="./Shape.ts" />
class Circle extends Shape {
    public radius: number;
    private _originalRadius: number;

    constructor(radius: number){
        super();
        this.radius = radius;
        this._originalRadius = radius;
    }

    public pointCollidesWithShape(point: Vector2): CollisionResult {
        return ShapeCollisions.pointToCicle(point, this);
    }

    public collidesWithShape(other: Shape): CollisionResult{
        if (other instanceof Box && (other as Box).isUnrotated){
            return ShapeCollisions.circleToRect(this, other as Box);
        }

        if (other instanceof Circle){
            // TODO CIRCLETOCIRCLE
        }

        if (other instanceof Polygon){
            return ShapeCollisions.circleToPolygon(this, other);
        }

        throw new Error(`Collisions of Circle to ${other} are not supported`);
    }

    public recalculateBounds(collider: Collider) {
        this.center = collider.localOffset;
    }
}