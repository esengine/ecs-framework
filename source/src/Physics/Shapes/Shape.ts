abstract class Shape extends egret.DisplayObject {
    public abstract bounds: Rectangle;
    public position: Vector2 = Vector2.zero;
    public abstract center: Vector2;

    public abstract pointCollidesWithShape(point: Vector2): CollisionResult;
    public abstract overlaps(other: Shape);
    public abstract collidesWithShape(other: Shape): CollisionResult;
}