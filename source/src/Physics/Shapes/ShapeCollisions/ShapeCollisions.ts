module es {
    export class ShapeCollisions {
        /**
         * 检查两个多边形之间的碰撞
         * @param first
         * @param second
         * @param result
         */
        public static polygonToPolygon(first: Polygon, second: Polygon, result: CollisionResult): boolean {
            let isIntersecting = true;

            let firstEdges = first.edgeNormals;
            let secondEdges = second.edgeNormals;
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
                let minA = 0;
                let minB = 0;
                let maxA = 0;
                let maxB = 0;
                let intervalDist = 0;
                let ta = this.getInterval(axis, first, minA, maxA);
                minA = ta.min;
                minB = ta.max;
                let tb = this.getInterval(axis, second, minB, maxB);
                minB = tb.min;
                maxB = tb.max;

                // 将区间设为第二个多边形的空间。由轴上投影的位置差偏移。
                let relativeIntervalOffset = Vector2.dot(polygonOffset, axis);
                minA += relativeIntervalOffset;
                maxA += relativeIntervalOffset;

                // 检查多边形投影是否正在相交
                intervalDist = this.intervalDistance(minA, maxA, minB, maxB);
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
                        translationAxis = new Vector2(-translationAxis);
                }
            }

            // 利用最小平移向量对多边形进行推入。
            result.normal = translationAxis;
            result.minimumTranslationVector = Vector2.multiply(new Vector2(-translationAxis.x, -translationAxis.y), new Vector2(minIntervalDistance));

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

            return minA - minB;
        }

        /**
         * 计算一个多边形在一个轴上的投影，并返回一个[min，max]区间
         * @param axis
         * @param polygon
         * @param min
         * @param max
         */
        public static getInterval(axis: Vector2, polygon: Polygon, min: number, max: number) {
            let dot = Vector2.dot(polygon.points[0], axis);
            min = max = dot;

            for (let i = 1; i < polygon.points.length; i++) {
                dot = Vector2.dot(polygon.points[i], axis);
                if (dot < min) {
                    min = dot;
                } else if (dot > max) {
                    max = dot;
                }
            }

            return {min: min, max: max};
        }

        /**
         *
         * @param circle
         * @param polygon
         * @param result
         */
        public static circleToPolygon(circle: Circle, polygon: Polygon, result: CollisionResult): boolean {
            let poly2Circle = Vector2.subtract(circle.position, polygon.position);

            let distanceSquared = 0;
            let closestPoint = Polygon.getClosestPointOnPolygonToPoint(polygon.points, poly2Circle, distanceSquared, result.normal);

            let circleCenterInsidePoly = polygon.containsPoint(circle.position);
            if (distanceSquared > circle.radius * circle.radius && !circleCenterInsidePoly)
                return false;

            let mtv: Vector2;
            if (circleCenterInsidePoly) {
                mtv = Vector2.multiply(result.normal, new Vector2(Math.sqrt(distanceSquared) - circle.radius));
            } else {
                if (distanceSquared == 0) {
                    mtv = Vector2.multiply(result.normal, new Vector2(circle.radius));
                } else {
                    let distance = Math.sqrt(distanceSquared);
                    mtv = Vector2.multiply(new Vector2(-Vector2.subtract(poly2Circle, closestPoint)), new Vector2((circle.radius - distanceSquared) / distance));
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
                result.normal = Vector2Ext.normalize(result.normal);
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
                let distanceSquared: number = 0;
                let closestPoint = Polygon.getClosestPointOnPolygonToPoint(poly.points, Vector2.subtract(point, poly.position), distanceSquared, result.normal);

                result.minimumTranslationVector = Vector2.multiply(result.normal, new Vector2(Math.sqrt(distanceSquared), Math.sqrt(distanceSquared)));
                result.point = Vector2.add(closestPoint, poly.position);

                return true;
            }

            return false;
        }

        /**
         *
         * @param first
         * @param second
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

        private static minkowskiDifference(first: Box, second: Box) {
            // 我们需要第一个框的左上角
            // 碰撞器只会修改运动的位置所以我们需要用位置来计算出运动是什么。
            let positionOffset = Vector2.subtract(first.position, Vector2.add(first.bounds.location, Vector2.divide(first.bounds.size, new Vector2(2))));
            let topLeft = Vector2.subtract(Vector2.add(first.bounds.location, positionOffset), second.bounds.max);
            let fullSize = Vector2.add(first.bounds.size, second.bounds.size);

            return new Rectangle(topLeft.x, topLeft.y, fullSize.x, fullSize.y)
        }
    }
}
