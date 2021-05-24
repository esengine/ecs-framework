module es {
    export class ShapeCollisionsPolygon {
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
            let translationAxis = es.Vector2.zero;
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
                if (dot < min.value) {
                    min.value = dot;
                } else if (dot > max.value) {
                    max.value = dot;
                }
            }
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
    }
}