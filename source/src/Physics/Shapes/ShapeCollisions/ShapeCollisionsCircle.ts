module es {
    export class ShapeCollisionsCircle {
        public static circleToCircle(first: Circle, second: Circle, result: CollisionResult = new CollisionResult()): boolean {
            let distanceSquared = Vector2.distanceSquared(first.position, second.position);
            let sumOfRadii = first.radius + second.radius;
            let collided = distanceSquared < sumOfRadii * sumOfRadii;
            if (collided) {
                result.normal = Vector2.normalize(Vector2.subtract(first.position, second.position));
                let depth = sumOfRadii - Math.sqrt(distanceSquared);
                result.minimumTranslationVector = Vector2.multiply(new Vector2(-depth), result.normal);
                result.point = Vector2.add(second.position, Vector2.multiply(result.normal, new Vector2(second.radius)));

                // 这可以得到实际的碰撞点，可能有用也可能没用，所以我们暂时把它留在这里
                // let collisionPointX = ((first.position.x * second.radius) + (second.position.x * first.radius)) / sumOfRadii;
                // let collisionPointY = ((first.position.y * second.radius) + (second.position.y * first.radius)) / sumOfRadii;
                // result.point = new Vector2(collisionPointX, collisionPointY);

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
            let closestPointOnBounds = box.bounds.getClosestPointOnRectangleBorderToPoint(circle.position, result.normal);

            // 先处理中心在盒子里的圆，如果我们是包含的, 它的成本更低，
            if (box.containsPoint(circle.position)) {
                result.point = closestPointOnBounds.clone();

                // 计算MTV。找出安全的、非碰撞的位置，并从中得到MTV
                let safePlace = Vector2.add(closestPointOnBounds, Vector2.multiply(result.normal, new Vector2(circle.radius)));
                result.minimumTranslationVector = Vector2.subtract(circle.position, safePlace);

                return true;
            }

            let sqrDistance = Vector2.distanceSquared(closestPointOnBounds, circle.position);
            
            // 看框上的点距圆的半径是否小于圆的半径
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

        public static circleToPolygon(circle: Circle, polygon: Polygon, result: CollisionResult = new CollisionResult()): boolean {
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
                    mtv = Vector2.subtract(new Vector2(-1), Vector2.subtract(poly2Circle, closestPoint))
                        .multiply(new Vector2((circle.radius - distance) / distance));
                }
            }

            result.minimumTranslationVector = mtv;
            result.point = Vector2.add(closestPoint, polygon.position);

            return true;
        }

        public static closestPointOnLine(lineA: Vector2, lineB: Vector2, closestTo: Vector2): Vector2 {
            let v = Vector2.subtract(lineB, lineA);
            let w = Vector2.subtract(closestTo, lineA);
            let t = Vector2.dot(w, v) / Vector2.dot(v, v);
            t = MathHelper.clamp(t, 0, 1);

            return Vector2.add(lineA, Vector2.multiply(v, new Vector2(t)));
        }
    }
}