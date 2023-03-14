module es {
    export class RealtimeCollisions {
        /**
         * 判断移动的圆是否与矩形相交，并返回相撞的时间。
         * @param s 移动的圆
         * @param b 矩形
         * @param movement 移动的向量
         * @param time 时间
         * @returns 是否相撞
         */
        public static intersectMovingCircleBox(s: Circle, b: Box, movement: Vector2, time: number): boolean {
            // 计算将b按球面半径r扩大后的AABB
            const e = b.bounds;
            e.inflate(s.radius, s.radius);

            // 将射线与展开的矩形e相交，如果射线错过了e，则以无交点退出，否则得到交点p和时间t作为结果。
            const ray = new Ray2D(s.position.sub(movement), s.position); // 创建射线，将移动后的圆心作为起点
            const res = e.rayIntersects(ray); // 判断射线与展开的矩形是否相交
            if (!res.intersected && res.distance > 1)
                return false; // 如果没有相交且距离大于1，则无法相撞

            // 求交点
            const point = ray.start.add(ray.direction.scale(time));

            // 计算交点p位于b的哪个最小面和最大面之外。注意，u和v不能有相同的位集，它们之间必须至少有一个位集。
            let u: number, v: number = 0;
            if (point.x < b.bounds.left)
                u |= 1; // 如果交点在最小的x面的左边，将第一位设为1
            if (point.x > b.bounds.right)
                v |= 1; // 如果交点在最大的x面的右边，将第一位设为1
            if (point.y < b.bounds.top)
                u |= 2; // 如果交点在最小的y面的上面，将第二位设为1
            if (point.y > b.bounds.bottom)
                v |= 2; // 如果交点在最大的y面的下面，将第二位设为1

            // 'or'将所有的比特集合在一起，形成一个比特掩码(注意u + v == u | v)
            const m = u + v;

            // 如果这3个比特都被设置，那么该点就在顶点区域内。
            if (m == 3) {
                // 如果有一条或多条命中,则必须在两条边的顶点相交,并返回最佳时间。
                console.log(`m == 3. corner ${Time.frameCount}`);
            }

            // 如果在m中只设置了一个位，那么该点就在一个面的区域。
            if ((m & (m - 1)) == 0) {
                // 从扩大的矩形交点开始的时间就是正确的时间
                return true;
            }

            // 点在边缘区域，与边缘相交。
            return true;
        }


        /**
         * 返回矩形的第n个角的坐标。
         * @param b 矩形
         * @param n 第n个角的编号
         * @returns 第n个角的坐标
         */
        public static corner(b: Rectangle, n: number): es.Vector2 {
            let p = es.Vector2.zero;
            p.x = (n & 1) === 0 ? b.right : b.left;
            p.y = (n & 1) === 0 ? b.bottom : b.top;
            return p;
        }

        /**
         * 测试一个圆和一个矩形是否相交，并返回是否相交。
         * @param circle 圆
         * @param box 矩形
         * @param point 离圆心最近的点
         * @returns 是否相交
         */
        public static testCircleBox(circle: Circle, box: Box, point: Vector2): boolean {
            // 找出离圆心最近的点
            point = box.bounds.getClosestPointOnRectangleToPoint(circle.position);

            // 如果圆心到点的距离小于等于圆的半径，则圆和方块相交
            const v = point.sub(circle.position);
            const dist = v.dot(v);

            return dist <= circle.radius * circle.radius;
        }
    }
}