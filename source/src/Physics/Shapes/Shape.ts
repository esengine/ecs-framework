abstract class Shape {
    public bounds: Rectangle;
    public position: Vector2;
    public center: Vector2;

    public abstract recalculateBounds(collider: Collider);
    public abstract pointCollidesWithShape(point: Vector2): CollisionResult;
    public abstract overlaps(other: Shape);
}