module es {
    export class RectangleExt {
        /**
         * 计算两个矩形的并集。结果将是一个包含其他两个的矩形。
         * @param first
         * @param point
         */
        public static union(first: Rectangle, point: Vector2) {
            let rect = new Rectangle(point.x, point.y, 0, 0);
            // let rectResult = first.union(rect);
            let result = new Rectangle();
            result.x = Math.min(first.x, rect.x);
            result.y = Math.min(first.y, rect.y);
            result.width = Math.max(first.right, rect.right) - result.x;
            result.height = Math.max(first.bottom, result.bottom) - result.y;
            return result;
        }
    }
}
