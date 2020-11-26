module es {
    export class RectangleExt {
        /**
         * 获取指定边的位置
         * @param rect
         * @param edge
         */
        public static getSide(rect: Rectangle, edge: Edge) {
            switch (edge) {
                case Edge.top:
                    return rect.top;
                case Edge.bottom:
                    return rect.bottom;
                case es.Edge.left:
                    return rect.left;
                case Edge.right:
                    return rect.right;
            }
        }

        /**
         * 计算两个矩形的并集。结果将是一个包含其他两个的矩形。
         * @param first
         * @param point
         */
        public static union(first: Rectangle, point: Vector2) {
            let rect = new Rectangle(point.x, point.y, 0, 0);
            let result = new Rectangle();
            result.x = Math.min(first.x, rect.x);
            result.y = Math.min(first.y, rect.y);
            result.width = Math.max(first.right, rect.right) - result.x;
            result.height = Math.max(first.bottom, result.bottom) - result.y;
            return result;
        }

        public static getHalfRect(rect: Rectangle, edge: Edge) {
            switch (edge) {
                case Edge.top:
                    return new Rectangle(rect.x, rect.y, rect.width, rect.height / 2);
                case Edge.bottom:
                    return new Rectangle(rect.x, rect.y + rect.height / 2, rect.width, rect.height / 2);
                case Edge.left:
                    return new Rectangle(rect.x, rect.y, rect.width / 2, rect.height);
                case Edge.right:
                    return new Rectangle(rect.x + rect.width / 2, rect.y, rect.width / 2, rect.height);
            }
        }

        /**
         * 获取矩形的一部分，其宽度/高度的大小位于矩形的边缘，但仍然包含在其中。
         * @param rect
         * @param edge
         * @param size
         */
        public static getRectEdgePortion(rect: Rectangle, edge: Edge, size: number = 1) {
            switch (edge) {
                case es.Edge.top:
                    return new Rectangle(rect.x, rect.y, rect.width, size);
                case Edge.bottom:
                    return new Rectangle(rect.x, rect.y + rect.height - size, rect.width, size);
                case Edge.left:
                    return new Rectangle(rect.x, rect.y, size, rect.height);
                case Edge.right:
                    return new Rectangle(rect.x + rect.width - size, rect.y, size, rect.height);
            }
        }

        public static expandSide(rect: Rectangle, edge: Edge, amount: number) {
            amount = Math.abs(amount);

            switch (edge) {
                case Edge.top:
                    rect.y -= amount;
                    rect.height += amount;
                    break;
                case es.Edge.bottom:
                    rect.height += amount;
                    break;
                case Edge.left:
                    rect.x -= amount;
                    rect.width += amount;
                    break;
                case Edge.right:
                    rect.width += amount;
                    break;
            }
        }

        public static contract(rect: Rectangle, horizontalAmount, verticalAmount) {
            rect.x += horizontalAmount;
            rect.y += verticalAmount;
            rect.width -= horizontalAmount * 2;
            rect.height -= verticalAmount * 2;
        }
    }
}
