module es {
    export class ShapeCollisionsCircle {
        public static circleToCircleCast(first: Circle,second: Circle,deltaMovement: Vector2,hit: RaycastHit): boolean {
            let endPointOfCast = first.position.add(deltaMovement);
            let d = this.closestPointOnLine(first.position,endPointOfCast,second.position);

            let closestDistanceSquared = Vector2.sqrDistance(second.position, d);
            const sumOfRadiiSquared = (first.radius + second.radius) * (first.radius + second.radius);
            if (closestDistanceSquared <= sumOfRadiiSquared) {
                const normalizedDeltaMovement = deltaMovement.normalize();
                if (d === endPointOfCast) {
                    endPointOfCast = first.position.add(
                    deltaMovement.add(normalizedDeltaMovement.scale(second.radius))
                    );
                    d = this.closestPointOnLine(
                    first.position,
                    endPointOfCast,
                    second.position
                    );
                    closestDistanceSquared = Vector2.sqrDistance(second.position, d);
                }

                const backDist = Math.sqrt(sumOfRadiiSquared - closestDistanceSquared);
                hit.centroid = d.sub(normalizedDeltaMovement.scale(backDist));
                hit.normal = hit.centroid.sub(second.position).normalize();
                hit.fraction = (hit.centroid.x - first.position.x) / deltaMovement.x;
                hit.distance = Vector2.distance(first.position, hit.centroid);
                hit.point = second.position.add(hit.normal.scale(second.radius));
                return true;
            }

            return false;
          }

        public static circleToCircle(first: Circle, second: Circle, result: CollisionResult = new CollisionResult()): boolean {
            const distanceSquared = Vector2.sqrDistance(first.position, second.position);
            const sumOfRadii = first.radius + second.radius;
            const collided = distanceSquared < sumOfRadii * sumOfRadii;
            if (collided) {
                result.normal = first.position.sub(second.position).normalize();
                const depth = sumOfRadii - Math.sqrt(distanceSquared);
                result.minimumTranslationVector = result.normal.scale(-depth);
                result.point = second.position.add(result.normal.scale(second.radius));

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
         public static circleToBox(circle: Circle, box: Box, result: CollisionResult = new CollisionResult()): boolean {
            const closestPointOnBounds = box.bounds.getClosestPointOnRectangleBorderToPoint(circle.position, result.normal);

            // 先处理中心在盒子里的圆，如果我们是包含的, 它的成本更低，
            if (box.containsPoint(circle.position)) {
                result.point = closestPointOnBounds;

                // 计算MTV。找出安全的、非碰撞的位置，并从中得到MTV
                const safePlace = closestPointOnBounds.add(result.normal.scale(circle.radius));
                result.minimumTranslationVector = circle.position.sub(safePlace);

                return true;
            }

            const sqrDistance = Vector2.sqrDistance(closestPointOnBounds, circle.position);
            
            // 看框上的点距圆的半径是否小于圆的半径
            if (sqrDistance == 0) {
                result.minimumTranslationVector = result.normal.scale(circle.radius);
            } else if (sqrDistance <= circle.radius * circle.radius) {
                result.normal = circle.position.sub(closestPointOnBounds);
                const depth = result.normal.magnitude() - circle.radius;

                result.point = closestPointOnBounds;
                result.normal = result.normal.normalize();
                result.minimumTranslationVector = result.normal.scale(depth);

                return true;
            }

            return false;
        }

        public static circleToPolygon(circle: Circle, polygon: Polygon, result: CollisionResult = new CollisionResult()): boolean {
            // 圆圈在多边形中的位置坐标
            const poly2Circle = circle.position.sub(polygon.position);

            // 首先，我们需要找到从圆到多边形的最近距离
            const res =  Polygon.getClosestPointOnPolygonToPoint(polygon.points,poly2Circle);
            result.normal = res.edgeNormal;

            // 确保距离的平方小于半径的平方，否则我们不会相撞。
            // 请注意，如果圆完全包含在多边形中，距离可能大于半径。
            // 正因为如此，我们还要确保圆的位置不在多边形内。
            const circleCenterInsidePoly = polygon.containsPoint(circle.position);
            if (res.distanceSquared > circle.radius * circle.radius && !circleCenterInsidePoly)
                return false;

            // 算出MTV。我们要注意处理完全包含在多边形中的圆或包含其中心的圆
            let mtv: Vector2;
            if (circleCenterInsidePoly) {
                mtv = result.normal.scale(Math.sqrt(res.distanceSquared) - circle.radius);
            } else {
                // 如果我们没有距离，这意味着圆心在多边形的边缘上。只需根据它的半径移动它
                if (res.distanceSquared === 0) {
                    mtv = result.normal.scale(circle.radius);
                } else {
                    const distance = Math.sqrt(res.distanceSquared);
                    mtv = poly2Circle
                        .sub(res.closestPoint)
                        .scale(((circle.radius - distance) / distance) * -1);
                }
            }

            result.minimumTranslationVector = mtv;
            result.point = res.closestPoint.add(polygon.position);

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