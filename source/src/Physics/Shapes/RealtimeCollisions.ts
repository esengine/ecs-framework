module es {
    export class RealtimeCollisions {
        public static intersectMovingCircleBox(s: Circle, b: Box, movement: Vector2, time: number): boolean {
            // 计算将b按球面半径r扩大后的AABB
            const e = b.bounds;
            e.inflate(s.radius, s.radius);

            // 将射线与展开的矩形e相交，如果射线错过了e，则以无交点退出，否则得到交点p和时间t作为结果。
            const ray = new Ray2D(s.position.sub(movement), s.position);
            const res = e.rayIntersects(ray);
            if (!res.intersected && res.distance > 1)
                return false;

            // 求交点
            const point = ray.start.add(ray.direction.scale(time));

            // 计算交点p位于b的哪个最小面和最大面之外。注意，u和v不能有相同的位集，它们之间必须至少有一个位集。
            let u: number, v: number = 0;
            if (point.x < b.bounds.left)
                u |= 1;
            if (point.x > b.bounds.right)
                v |= 1;
            if (point.y < b.bounds.top)
                u |= 2;
            if (point.y > b.bounds.bottom)
                v |= 2;

            // 'or'将所有的比特集合在一起，形成一个比特掩码(注意u + v == u | v)
            const m = u + v;

            // 如果这3个比特都被设置，那么该点就在顶点区域内。
            if (m == 3){
                // 如果有一条或多条命中,则必须在两条边的顶点相交,并返回最佳时间。
                console.log(`m == 3. corner ${Time.frameCount}`);
            }

            // 如果在m中只设置了一个位，那么该点就在一个面的区域。
            if ((m & (m - 1)) == 0){
                // 从扩大的矩形交点开始的时间就是正确的时间
                return true;
            }

            // 点在边缘区域，与边缘相交。
            return true;
        }

        /**
         * 支持函数，返回索引为n的矩形vert
         * @param b 
         * @param n 
         */
        public static corner(b: Rectangle, n: number){
            let p = es.Vector2.zero;
            p.x = (n & 1) == 0 ? b.right : b.left;
            p.y = (n & 1) == 0 ? b.bottom : b.top;
            return p;
        }

        /**
         * 检查圆是否与方框重叠，并返回point交点
         * @param cirlce 
         * @param box 
         * @param point 
         */
        public static testCircleBox(cirlce: Circle, box: Box, point: Vector2) {
            // 找出离球心最近的点
            point = box.bounds.getClosestPointOnRectangleToPoint(cirlce.position);

            // 圆和方块相交，如果圆心到点的距离小于圆的半径，则圆和方块相交
            const v = point.sub(cirlce.position);
            const dist = v.dot(v);

            return dist <= cirlce.radius * cirlce.radius;
        }
    }
}