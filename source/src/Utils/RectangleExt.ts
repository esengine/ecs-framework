class RectangleExt {
    public static union(first: Rectangle, point: Vector2){
        let rect = new Rectangle(point.x, point.y, 0, 0);
        return this.unionR(first, rect);
    }

    public static unionR(value1: Rectangle, value2: Rectangle){
        let result = new Rectangle();
        result.x = Math.min(value1.x, value2.x);
        result.y = Math.min(value1.y, value2.y);
        result.width = Math.max(value1.right, value2.right) - result.x;
        result.height = Math.max(value1.bottom, value2.bottom) - result.y;

        return result;
    }
}