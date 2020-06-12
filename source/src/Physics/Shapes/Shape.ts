abstract class Shape {
    public bounds: Rectangle;
    public position: Vector2;

    public abstract pointCollidesWithShape(point: Vector2): CollisionResult;
}