///<reference path="./Shape.ts" />
class Circle extends Shape {
    public radius: number;
    public _originalRadius: number;
    public center = new Vector2();

    public get bounds(){
        return new Rectangle().setEgretRect(this.getBounds());
    }

    constructor(radius: number) {
        super();
        this.radius = radius;
        this._originalRadius = radius;
    }

    public pointCollidesWithShape(point: Vector2): CollisionResult {
        return ShapeCollisions.pointToCircle(point, this);
    }

    public collidesWithShape(other: Shape): CollisionResult {
        if (other instanceof Box) {
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

    public overlaps(other: Shape){
        if (other instanceof Box)
            return Collisions.isRectToCircle(other.bounds, this.position, this.radius);

        if (other instanceof Circle)
            return Collisions.isCircleToCircle(this.position, this.radius, other.position, (other as Circle).radius);

        if (other instanceof Polygon)
            return ShapeCollisions.circleToPolygon(this, other);

        throw new Error(`overlaps of circle to ${other} are not supported`);
    }
}