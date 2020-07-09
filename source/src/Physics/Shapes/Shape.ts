abstract class Shape {
    public bounds: Rectangle = new Rectangle();
    public position: Vector2 = Vector2.zero;
    public abstract center: Vector2;

    public abstract recalculateBounds(collider: Collider);
    public abstract pointCollidesWithShape(point: Vector2): CollisionResult;
    public abstract overlaps(other: Shape);
    public abstract collidesWithShape(other: Shape): CollisionResult;
}