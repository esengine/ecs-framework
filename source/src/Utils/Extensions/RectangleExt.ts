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
            result.height = Math.max(first.bottom, rect.bottom) - result.y;
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

        /**
         * 给定多边形的点，计算其边界
         * @param points 
         */
        public static boundsFromPolygonVector(points: Vector2[]) {
            // 我们需要找到最小/最大的x/y值。
            let minX = Number.POSITIVE_INFINITY;
            let minY = Number.POSITIVE_INFINITY;
            let maxX = Number.NEGATIVE_INFINITY;
            let maxY = Number.NEGATIVE_INFINITY;

            for (let i = 0; i < points.length; i ++) {
                let pt = points[i];

                if (pt.x < minX)
                    minX = pt.x;
                if (pt.x > maxX)
                    maxX = pt.x;

                if (pt.y < minY)
                    minY = pt.y;
                if (pt.y > maxY)
                    maxY = pt.y;
            }

            return this.fromMinMaxVector(new Vector2(minX, minY), new Vector2(maxX, maxY));
        }

        /**
         * 创建一个给定最小/最大点（左上角，右下角）的矩形
         * @param min 
         * @param max 
         */
        public static fromMinMaxVector(min: Vector2, max: Vector2) {
            return new Rectangle(min.x, min.y, max.x - min.x, max.y - min.y);
        }

        /**
         * 返回一个跨越当前边界和提供的delta位置的Bounds
         * @param rect 
         * @param deltaX 
         * @param deltaY 
         */
        public static getSweptBroadphaseBounds(rect: Rectangle, deltaX: number, deltaY: number){
            let broadphasebox = Rectangle.empty;

            broadphasebox.x = deltaX > 0 ? rect.x : rect.x + deltaX;
            broadphasebox.y = deltaY > 0 ? rect.y : rect.y + deltaY;
            broadphasebox.width = deltaX > 0 ? deltaX + rect.width : rect.width - deltaX;
            broadphasebox.height = deltaY > 0 ? deltaY + rect.height : rect.height - deltaY;

            return broadphasebox;
        }

        /**
         * 如果矩形发生碰撞，返回true 
         * moveX和moveY将返回b1为避免碰撞而必须移动的移动量
         * @param rect 
         * @param other 
         * @param moveX 
         * @param moveY 
         */
        public collisionCheck(rect: Rectangle, other: Rectangle, moveX: Ref<number>, moveY: Ref<number>) {
            moveX.value = moveY.value = 0;

            let l = other.x - (rect.x + rect.width);
            let r = (other.x + other.width) - rect.x;
            let t = other.y - (rect.y + rect.height);
            let b = (other.y + other.height) - rect.y;

            // 检验是否有碰撞
            if (l > 0 || r < 0 || t > 0 || b < 0)
                return false;

            // 求两边的偏移量
            moveX.value = Math.abs(l) < r ? l : r;
            moveY.value = Math.abs(t) < b ? t : b;

            // 只使用最小的偏移量
            if (Math.abs(moveX.value) < Math.abs(moveY.value))
                moveY.value = 0;
            else
                moveX.value = 0;

            return true;
        }

        /**
         * 计算两个矩形之间有符号的交点深度
         * @param rectA 
         * @param rectB 
         * @returns 两个相交的矩形之间的重叠量。
         * 这些深度值可以是负值，取决于矩形相交的边。
         * 这允许调用者确定正确的推送对象的方向，以解决碰撞问题。
         * 如果矩形不相交，则返回Vector2.zero。
         */
        public static getIntersectionDepth(rectA: Rectangle, rectB: Rectangle) {
            // 计算半尺寸
            let halfWidthA = rectA.width / 2;
            let halfHeightA = rectA.height / 2;
            let halfWidthB = rectB.width / 2;
            let halfHeightB = rectB.height / 2;

            // 计算中心
            let centerA = new Vector2(rectA.left + halfWidthA, rectA.top + halfHeightA);
            let centerB = new Vector2(rectB.left + halfWidthB, rectB.top + halfHeightB);

            // 计算当前中心间的距离和最小非相交距离
            let distanceX = centerA.x - centerB.x;
            let distanceY = centerA.y - centerB.y;
            let minDistanceX = halfWidthA + halfWidthB;
            let minDistanceY = halfHeightA + halfHeightB;

            // 如果我们根本不相交，则返回(0，0)
            if (Math.abs(distanceX) >= minDistanceX || Math.abs(distanceY) >= minDistanceY)
                return Vector2.zero;

            // 计算并返回交叉点深度
            let depthX = distanceX > 0 ? minDistanceX - distanceX : -minDistanceX - distanceX;
            let depthY = distanceY > 0 ? minDistanceY - distanceY : -minDistanceY - distanceY;

            return new Vector2(depthX, depthY);
        }
    }
}
