module es {
    export class ShapeCollisionsCircle {
        public static circleToCircleCast(first: Circle, second: Circle, deltaMovement: Vector2, hit: Out<RaycastHit>): boolean {
            hit.value = new RaycastHit();

            // 在动圆的运动矢量上找到离圆中心最近的点（第一个）
            let endPointOfCast = first.position.add(deltaMovement);
            let d = this.closestPointOnLine(first.position, endPointOfCast, second.position);

            // 然后求最近点到圆心的距离 
            let closestDistanceSquared = Vector2.sqrDistance(second.position, d);
            const sumOfRadiiSquared = (first.radius + second.radius) * (first.radius + second.radius);

            // 如果它小于半径之和，则发生碰撞
            if (closestDistanceSquared <= sumOfRadiiSquared) {
                const normalizedDeltaMovement = deltaMovement.normalize();

                // 边缘情况：如果端点等于线上最近的点，那么从它到 second.position 的线将不垂直于射线
                if (d === endPointOfCast) {
                    // 延长投射半径距离的终点，因此我们得到一个垂直的点
                    endPointOfCast = first.position.add(deltaMovement.add(normalizedDeltaMovement.scale(second.radius)));
                    d = this.closestPointOnLine(first.position, endPointOfCast, second.position);
                    closestDistanceSquared = Vector2.sqrDistance(second.position, d);
                }

                const backDist = Math.sqrt(sumOfRadiiSquared - closestDistanceSquared);
                hit.value.centroid = d.sub(normalizedDeltaMovement.scale(backDist));
                hit.value.normal = hit.value.centroid.sub(second.position).normalize();
                hit.value.fraction = (hit.value.centroid.x - first.position.x) / deltaMovement.x;
                hit.value.distance = Vector2.distance(first.position, hit.value.centroid);
                hit.value.point = second.position.add(hit.value.normal.scale(second.radius));
                return true;
            }

            return false;
        }

        public static circleToCircle(first: Circle, second: Circle, result: Out<CollisionResult>): boolean {
            result.value = new CollisionResult();

            const distanceSquared = Vector2.sqrDistance(first.position, second.position);
            const sumOfRadii = first.radius + second.radius;
            const collided = distanceSquared < sumOfRadii * sumOfRadii;
            if (collided) {
                result.value.normal = first.position.sub(second.position).normalize();
                const depth = sumOfRadii - Math.sqrt(distanceSquared);
                result.value.minimumTranslationVector = result.value.normal.scale(-depth);
                result.value.point = second.position.add(result.value.normal.scale(second.radius));

                return true;
            }

            return false;
        }

        /**
         * 适用于中心在框内的圆，也适用于与框外中心重合的圆。
         * @param circle
         * @param box
         * @param result
         */
        public static circleToBox(circle: Circle, box: Box, result: Out<CollisionResult>): boolean {
            result.value = new CollisionResult();
            const normal = new Out<Vector2>();
            const closestPointOnBounds = box.bounds.getClosestPointOnRectangleBorderToPoint(circle.position, normal);
            result.value.normal = normal.value;

            // 先处理中心在盒子里的圆，如果我们是包含的, 它的成本更低，
            if (box.containsPoint(circle.position)) {
                result.value.point = closestPointOnBounds;

                // 计算MTV。找出安全的、非碰撞的位置，并从中得到MTV
                const safePlace = closestPointOnBounds.add(result.value.normal.scale(circle.radius));
                result.value.minimumTranslationVector = circle.position.sub(safePlace);

                return true;
            }

            const sqrDistance = Vector2.sqrDistance(closestPointOnBounds, circle.position);

            // 看框上的点距圆的半径是否小于圆的半径
            if (sqrDistance == 0) {
                result.value.minimumTranslationVector = result.value.normal.scale(circle.radius);
            } else if (sqrDistance <= circle.radius * circle.radius) {
                result.value.normal = circle.position.sub(closestPointOnBounds);
                const depth = result.value.normal.magnitude() - circle.radius;

                result.value.point = closestPointOnBounds;
                result.value.normal = result.value.normal.normalize();
                result.value.minimumTranslationVector = result.value.normal.scale(depth);

                return true;
            }

            return false;
        }

        public static circleToPolygon(circle: Circle, polygon: Polygon, result: Out<CollisionResult>): boolean {
            result.value = new CollisionResult();

            // 圆圈在多边形中的位置坐标
            const poly2Circle = circle.position.sub(polygon.position);

            // 首先，我们需要找到从圆到多边形的最近距离
            const res = Polygon.getClosestPointOnPolygonToPoint(polygon.points, poly2Circle);
            result.value.normal = res.edgeNormal;

            // 确保距离的平方小于半径的平方，否则我们不会相撞。
            // 请注意，如果圆完全包含在多边形中，距离可能大于半径。
            // 正因为如此，我们还要确保圆的位置不在多边形内。
            const circleCenterInsidePoly = polygon.containsPoint(circle.position);
            if (res.distanceSquared > circle.radius * circle.radius && !circleCenterInsidePoly)
                return false;

            // 算出MTV。我们要注意处理完全包含在多边形中的圆或包含其中心的圆
            let mtv: Vector2;
            if (circleCenterInsidePoly) {
                mtv = result.value.normal.scale(Math.sqrt(res.distanceSquared) - circle.radius);
            } else {
                // 如果我们没有距离，这意味着圆心在多边形的边缘上。只需根据它的半径移动它
                if (res.distanceSquared === 0) {
                    mtv = result.value.normal.scale(circle.radius);
                } else {
                    const distance = Math.sqrt(res.distanceSquared);
                    mtv = poly2Circle
                        .sub(res.closestPoint)
                        .scale(((circle.radius - distance) / distance) * -1);
                }
            }

            result.value.minimumTranslationVector = mtv;
            result.value.point = res.closestPoint.add(polygon.position);

            return true;
        }

        public static closestPointOnLine(lineA: Vector2, lineB: Vector2, closestTo: Vector2): Vector2 {
            const v = lineB.sub(lineA);
            const w = closestTo.sub(lineA);
            let t = w.dot(v) / v.dot(v);
            t = MathHelper.clamp(t, 0, 1);
            return lineA.add(v.scaleEqual(t));
        }
    }
}