module es {
    /**
     * 各种形状的碰撞例程
     * 大多数人都希望第一个形状位于第二个形状的空间内(即shape1)
     * pos应该设置为shape1。pos - shape2.pos)。
     */
    export class ShapeCollisions {
        /**
         * 检查两个多边形之间的碰撞
         * @param first
         * @param second
         * @param result
         */
        public static polygonToPolygon(first: Polygon, second: Polygon, result: CollisionResult): boolean {
            let isIntersecting = true;

            let firstEdges = first.edgeNormals.slice();
            let secondEdges = second.edgeNormals.slice();
            let minIntervalDistance = Number.POSITIVE_INFINITY;
            let translationAxis = new Vector2();
            let polygonOffset = Vector2.subtract(first.position, second.position);
            let axis: Vector2;

            // 循环穿过两个多边形的所有边
            for (let edgeIndex = 0; edgeIndex < firstEdges.length + secondEdges.length; edgeIndex++) {
                // 1. 找出当前多边形是否相交
                // 多边形的归一化轴垂直于缓存给我们的当前边
                if (edgeIndex < firstEdges.length) {
                    axis = firstEdges[edgeIndex];
                } else {
                    axis = secondEdges[edgeIndex - firstEdges.length];
                }

                // 求多边形在当前轴上的投影
                let minA = new Ref(0);
                let minB = new Ref(0);
                let maxA = new Ref(0);
                let maxB = new Ref(0);
                let intervalDist = 0;
                this.getInterval(axis, first, minA, maxA);
                this.getInterval(axis, second, minB, maxB);

                // 将区间设为第二个多边形的空间。由轴上投影的位置差偏移。
                let relativeIntervalOffset = Vector2.dot(polygonOffset, axis);
                minA.value += relativeIntervalOffset;
                maxA.value += relativeIntervalOffset;

                // 检查多边形投影是否正在相交
                intervalDist = this.intervalDistance(minA.value, maxA.value, minB.value, maxB.value);
                if (intervalDist > 0)
                    isIntersecting = false;

                // 对于多对多数据类型转换，添加一个Vector2?参数称为deltaMovement。为了提高速度，我们这里不使用它
                // TODO: 现在找出多边形是否会相交。只要检查速度就行了

                // 如果多边形不相交，也不会相交，退出循环
                if (!isIntersecting)
                    return false;

                // 检查当前间隔距离是否为最小值。如果是，则存储间隔距离和当前距离。这将用于计算最小平移向量
                intervalDist = Math.abs(intervalDist);
                if (intervalDist < minIntervalDistance) {
                    minIntervalDistance = intervalDist;
                    translationAxis = axis;

                    if (Vector2.dot(translationAxis, polygonOffset) < 0)
                        translationAxis = new Vector2(-translationAxis.x, -translationAxis.y);
                }
            }

            // 利用最小平移向量对多边形进行推入。
            result.normal = translationAxis;
            result.minimumTranslationVector = new Vector2(-translationAxis.x * minIntervalDistance, -translationAxis.y * minIntervalDistance);

            return true;
        }

        /**
         * 计算[minA, maxA]和[minB, maxB]之间的距离。如果间隔重叠，距离是负的
         * @param minA
         * @param maxA
         * @param minB
         * @param maxB
         */
        public static intervalDistance(minA: number, maxA: number, minB: number, maxB) {
            if (minA < minB)
                return minB - maxA;

            return minA - maxB;
        }

        /**
         * 计算一个多边形在一个轴上的投影，并返回一个[min，max]区间
         * @param axis
         * @param polygon
         * @param min
         * @param max
         */
        public static getInterval(axis: Vector2, polygon: Polygon, min: Ref<number>, max: Ref<number>) {
            let dot = Vector2.dot(polygon.points[0], axis);
            min.value = max.value = dot;

            for (let i = 1; i < polygon.points.length; i++) {
                dot = Vector2.dot(polygon.points[i], axis);
                if (dot  < min.value ) {
                    min.value  = dot;
                } else if (dot > max.value) {
                    max.value  = dot;
                }
            }
        }

        /**
         *
         * @param circle
         * @param polygon
         * @param result
         */
        public static circleToPolygon(circle: Circle, polygon: Polygon, result: CollisionResult): boolean {
            // 圆圈在多边形中的位置坐标
            let poly2Circle = Vector2.subtract(circle.position, polygon.position);

            // 首先，我们需要找到从圆到多边形的最近距离
            let distanceSquared = new Ref(0);
            let closestPoint = Polygon.getClosestPointOnPolygonToPoint(polygon.points, poly2Circle, distanceSquared, result.normal);

            // 确保距离的平方小于半径的平方，否则我们不会相撞。
            // 请注意，如果圆完全包含在多边形中，距离可能大于半径。
            // 正因为如此，我们还要确保圆的位置不在多边形内。
            let circleCenterInsidePoly = polygon.containsPoint(circle.position);
            if (distanceSquared.value > circle.radius * circle.radius && !circleCenterInsidePoly)
                return false;

            // 算出MTV。我们要注意处理完全包含在多边形中的圆或包含其中心的圆
            let mtv: Vector2;
            if (circleCenterInsidePoly) {
                mtv = Vector2.multiply(result.normal, new Vector2(Math.sqrt(distanceSquared.value) - circle.radius));
            } else {
                // 如果我们没有距离，这意味着圆心在多边形的边缘上。只需根据它的半径移动它
                if (distanceSquared.value == 0) {
                    mtv = new Vector2(result.normal.x * circle.radius, result.normal.y * circle.radius);
                } else {
                    let distance = Math.sqrt(distanceSquared.value);
                    mtv = new Vector2(-poly2Circle.x + closestPoint.x, -poly2Circle.y + closestPoint.y)
                        .multiply(new Vector2((circle.radius - distance) / distance));
                }
            }

            result.minimumTranslationVector = mtv;
            result.point = Vector2.add(closestPoint, polygon.position);

            return true;
        }

        /**
         * 适用于圆心在方框内以及只与方框外圆心重叠的圆。
         * @param circle
         * @param box
         * @param result
         */
        public static circleToBox(circle: Circle, box: Box, result: CollisionResult): boolean {
            let closestPointOnBounds = box.bounds.getClosestPointOnRectangleBorderToPoint(circle.position, result.normal);

            // 处理那些中心在盒子里的圆，因为比较好操作，
            if (box.containsPoint(circle.position)) {
                result.point = closestPointOnBounds;

                // 计算mtv。找到安全的，没有碰撞的位置，然后从那里得到mtv
                let safePlace = Vector2.add(closestPointOnBounds, Vector2.multiply(result.normal, new Vector2(circle.radius)));
                result.minimumTranslationVector = Vector2.subtract(circle.position, safePlace);

                return true;
            }

            let sqrDistance = Vector2.distanceSquared(closestPointOnBounds, circle.position);
            // 看盒子上的点与圆的距离是否小于半径
            if (sqrDistance == 0) {
                result.minimumTranslationVector = Vector2.multiply(result.normal, new Vector2(circle.radius));
            } else if (sqrDistance <= circle.radius * circle.radius) {
                result.normal = Vector2.subtract(circle.position, closestPointOnBounds);
                let depth = result.normal.length() - circle.radius;

                result.point = closestPointOnBounds;
                Vector2Ext.normalize(result.normal);
                result.minimumTranslationVector = Vector2.multiply(new Vector2(depth), result.normal);

                return true;
            }

            return false;
        }

        /**
         *
         * @param point
         * @param circle
         * @param result
         */
        public static pointToCircle(point: Vector2, circle: Circle, result: CollisionResult): boolean {
            let distanceSquared = Vector2.distanceSquared(point, circle.position);
            let sumOfRadii = 1 + circle.radius;
            let collided = distanceSquared < sumOfRadii * sumOfRadii;
            if (collided) {
                result.normal = Vector2.normalize(Vector2.subtract(point, circle.position));
                let depth = sumOfRadii - Math.sqrt(distanceSquared);
                result.minimumTranslationVector = Vector2.multiply(new Vector2(-depth, -depth), result.normal);
                result.point = Vector2.add(circle.position, Vector2.multiply(result.normal, new Vector2(circle.radius, circle.radius)));

                return true;
            }

            return false;
        }

        public static pointToBox(point: Vector2, box: Box, result: CollisionResult){
            if (box.containsPoint(point)){
                // 在方框的空间里找到点
                result.point = box.bounds.getClosestPointOnRectangleBorderToPoint(point, result.normal);
                result.minimumTranslationVector = Vector2.subtract(point, result.point);

                return true;
            }

            return false;
        }

        /**
         *
         * @param lineA
         * @param lineB
         * @param closestTo
         */
        public static closestPointOnLine(lineA: Vector2, lineB: Vector2, closestTo: Vector2): Vector2 {
            let v = Vector2.subtract(lineB, lineA);
            let w = Vector2.subtract(closestTo, lineA);
            let t = Vector2.dot(w, v) / Vector2.dot(v, v);
            t = MathHelper.clamp(t, 0, 1);

            return Vector2.add(lineA, Vector2.multiply(v, new Vector2(t, t)));
        }

        /**
         *
         * @param point
         * @param poly
         * @param result
         */
        public static pointToPoly(point: Vector2, poly: Polygon, result: CollisionResult): boolean {
            if (poly.containsPoint(point)) {
                let distanceSquared = new Ref(0);
                let closestPoint = Polygon.getClosestPointOnPolygonToPoint(poly.points, Vector2.subtract(point, poly.position), distanceSquared, result.normal);

                result.minimumTranslationVector = new Vector2(result.normal.x * Math.sqrt(distanceSquared.value), result.normal.y * Math.sqrt(distanceSquared.value));
                result.point = Vector2.add(closestPoint, poly.position);

                return true;
            }

            return false;
        }

        /**
         *
         * @param first
         * @param second
         * @param result
         */
        public static circleToCircle(first: Circle, second: Circle, result: CollisionResult): boolean {
            let distanceSquared = Vector2.distanceSquared(first.position, second.position);
            let sumOfRadii = first.radius + second.radius;
            let collided = distanceSquared < sumOfRadii * sumOfRadii;
            if (collided) {
                result.normal = Vector2.normalize(Vector2.subtract(first.position, second.position));
                let depth = sumOfRadii - Math.sqrt(distanceSquared);
                result.minimumTranslationVector = Vector2.multiply(new Vector2(-depth), result.normal);
                result.point = Vector2.add(second.position, Vector2.multiply(result.normal, new Vector2(second.radius)));

                return true;
            }

            return false;
        }

        /**
         *
         * @param first
         * @param second
         * @param result
         */
        public static boxToBox(first: Box, second: Box, result: CollisionResult): boolean {
            let minkowskiDiff = this.minkowskiDifference(first, second);
            if (minkowskiDiff.contains(0, 0)) {
                // 计算MTV。如果它是零，我们就可以称它为非碰撞
                result.minimumTranslationVector = minkowskiDiff.getClosestPointOnBoundsToOrigin();

                if (result.minimumTranslationVector.equals(Vector2.zero))
                    return false;

                result.normal = new Vector2(-result.minimumTranslationVector.x, -result.minimumTranslationVector.y);
                result.normal.normalize();

                return true;
            }

            return false;
        }

        private static minkowskiDifference(first: Box, second: Box): Rectangle {
            // 我们需要第一个框的左上角
            // 碰撞器只会修改运动的位置所以我们需要用位置来计算出运动是什么。
            let positionOffset = Vector2.subtract(first.position, Vector2.add(first.bounds.location, new Vector2(first.bounds.size.x / 2, first.bounds.size.y / 2)));
            let topLeft = Vector2.subtract(Vector2.add(first.bounds.location, positionOffset), second.bounds.max);
            let fullSize = Vector2.add(first.bounds.size, second.bounds.size);

            return new Rectangle(topLeft.x, topLeft.y, fullSize.x, fullSize.y)
        }

        public static lineToPoly(start: Vector2, end: Vector2, polygon: Polygon, hit: RaycastHit): boolean {
            let normal = Vector2.zero;
            let intersectionPoint = Vector2.zero;
            let fraction = Number.MAX_VALUE;
            let hasIntersection = false;

            for (let j = polygon.points.length - 1, i = 0; i < polygon.points.length; j = i, i ++){
                let edge1 = Vector2.add(polygon.position, polygon.points[j]);
                let edge2 = Vector2.add(polygon.position, polygon.points[i]);
                let intersection: Vector2 = Vector2.zero;
                if (this.lineToLine(edge1, edge2, start, end, intersection)){
                    hasIntersection = true;

                    // TODO: 这是得到分数的正确和最有效的方法吗?
                    // 先检查x分数。如果是NaN，就用y代替
                    let distanceFraction = (intersection.x - start.x) / (end.x - start.x);
                    if (Number.isNaN(distanceFraction) || Number.isFinite(distanceFraction))
                        distanceFraction = (intersection.y - start.y) / (end.y - start.y);

                    if (distanceFraction < fraction){
                        let edge = Vector2.subtract(edge2, edge1);
                        normal = new Vector2(edge.y, -edge.x);
                        fraction = distanceFraction;
                        intersectionPoint = intersection;
                    }
                }
            }

            if (hasIntersection){
                normal.normalize();
                let distance = Vector2.distance(start, intersectionPoint);
                hit.setValuesNonCollider(fraction, distance, intersectionPoint, normal);
                return true;
            }

            return false;
        }

        public static lineToLine(a1: Vector2, a2: Vector2, b1: Vector2, b2: Vector2, intersection: Vector2){
            let b = Vector2.subtract(a2, a1);
            let d = Vector2.subtract(b2, b1);
            let bDotDPerp = b.x * d.y - b.y * d.x;

            // 如果b*d = 0，表示这两条直线平行，因此有无穷个交点
            if (bDotDPerp == 0)
                return false;

            let c = Vector2.subtract(b1, a1);
            let t = (c.x * d.y - c.y * d.x) / bDotDPerp;
            if (t < 0 || t > 1)
                return false;

            let u = (c.x * b.y - c.y * b.x) / bDotDPerp;
            if (u < 0 || u > 1)
                return false;

            intersection = Vector2.add(a1, Vector2.multiply(new Vector2(t), b));

            return true;
        }

        public static lineToCircle(start: Vector2, end: Vector2, s: Circle, hit: RaycastHit): boolean{
            // 计算这里的长度并分别对d进行标准化，因为如果我们命中了我们需要它来得到分数
            let lineLength = Vector2.distance(start, end);
            let d = Vector2.divide(Vector2.subtract(end, start), new Vector2(lineLength));
            let m = Vector2.subtract(start, s.position);
            let b = Vector2.dot(m, d);
            let c = Vector2.dot(m, m) - s.radius * s.radius;

            // 如果r的原点在s之外，(c>0)和r指向s (b>0) 则返回
            if (c > 0 && b > 0)
                return false;

            let discr = b * b - c;
            // 线不在圆圈上
            if (discr < 0)
                return false;

            // 射线相交圆
            hit.fraction = -b - Math.sqrt(discr);

            // 如果分数为负数，射线从圈内开始，
            if (hit.fraction < 0)
                hit.fraction = 0;

            hit.point = Vector2.add(start, Vector2.multiply(new Vector2(hit.fraction), d));
            hit.distance = Vector2.distance(start, hit.point);
            hit.normal = Vector2.normalize(Vector2.subtract(hit.point, s.position));
            hit.fraction = hit.distance / lineLength;

            return true;
        }

        /**
         * 用second检查被deltaMovement移动的框的结果
         * @param first
         * @param second
         * @param movement
         * @param hit
         */
        public static boxToBoxCast(first: Box, second: Box, movement: Vector2, hit: RaycastHit): boolean{
            // 首先，我们检查是否有重叠。如果有重叠，我们就不做扫描测试
            let minkowskiDiff = this.minkowskiDifference(first, second);
            if (minkowskiDiff.contains(0, 0)){
                // 计算MTV。如果它是零，我们就可以称它为非碰撞
                let mtv = minkowskiDiff.getClosestPointOnBoundsToOrigin();
                if (mtv.equals(Vector2.zero))
                    return false;

                hit.normal = new Vector2(-mtv.x);
                hit.normal.normalize();
                hit.distance = 0;
                hit.fraction = 0;

                return true;
            }else{
                // 射线投射移动矢量
                let ray = new Ray2D(Vector2.zero, new Vector2(-movement.x));
                let fraction = new Ref(0);
                if (minkowskiDiff.rayIntersects(ray, fraction) && fraction.value <= 1){
                    hit.fraction = fraction.value;
                    hit.distance = movement.length() * fraction.value;
                    hit.normal = new Vector2(-movement.x, -movement.y);
                    hit.normal.normalize();
                    hit.centroid = Vector2.add(first.bounds.center, Vector2.multiply(movement, new Vector2(fraction.value)));

                    return true;
                }
            }

            return false;
        }
    }
}
