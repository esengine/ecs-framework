module es {
    export class RealtimeCollisions {
        public static intersectMovingCircleBox(s: Circle, b: Box, movement: Vector2, time: Ref<number>): boolean {
            // 计算用球面半径r inflate b得到的AABB
            let e = b.bounds;
            e.inflate(s.radius, s.radius);

            // 射线与展开矩形e相交。如果射线错过了e，则退出不相交，否则得到相交点p和时间t
            let ray = new Ray2D(Vector2.subtract(s.position, movement), s.position);
            if (!e.rayIntersects(ray, time) && time.value > 1)
                return false;

            // 求交点
            let point = Vector2.add(ray.start, Vector2.add(ray.direction, new Vector2(time.value)));

            // 计算b的最小面和最大面p的交点在哪个面之外。注意，u和v不能有相同的位集，它们之间必须至少有一个位集。
            let u, v = 0;
            if (point.x < b.bounds.left)
                u |= 1;
            if (point.x > b.bounds.right)
                v |= 1;
            if (point.y < b.bounds.top)
                u |= 2;
            if (point.y > b.bounds.bottom)
                v |= 2;

            // 将所有位集合成位掩码(注意u + v == u | v)
            let m = u + v;

            // 如果所有的3位都被设置，那么点在一个顶点区域
            if (m == 3){
                // 现在必须相交的部分，如果一个或多个击中对胶囊的两边会合在斜面和返回的最佳时间
                // TODO: 需要实现这个
                console.log(`m == 3. corner ${Time.frameCount}`);
            }

            // 如果m中只设置了一个位，那么点在一个面区域
            if ((m & (m - 1)) == 0){
                // 什么也不做。从扩展矩形交集的时间是正确的时间
                return true;
            }

            // 点在边缘区域上。与边缘相交。
            return true;
        }
    }
}