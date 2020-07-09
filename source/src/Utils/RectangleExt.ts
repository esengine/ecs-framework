class RectangleExt {
    public static union(first: Rectangle, point: Vector2){
        let rect = new Rectangle(point.x, point.y, 0, 0);
        let rectResult = first.union(rect);
        return new Rectangle(rectResult.x, rectResult.y, rectResult.width, rectResult.height);
    }
}