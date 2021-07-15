module es {
    export class ShapeCollisionsPoint {
        public static pointToCircle(point: Vector2, circle: Circle, result: CollisionResult): boolean {
            let distanceSquared = Vector2.sqrDistance(point, circle.position);
            let sumOfRadii = 1 + circle.radius;
            let collided = distanceSquared < sumOfRadii * sumOfRadii;
            if (collided) {
                result.normal = point.sub(circle.position).normalize();
                let depth = sumOfRadii - Math.sqrt(distanceSquared);
                result.minimumTranslationVector = result.normal.scale(-depth);;
                result.point = circle.position.add(result.normal.scale(circle.radius));

                return true;
            }

            return false;
        }

        public static pointToBox(point: Vector2, box: Box, result: CollisionResult = new CollisionResult()) {
            if (box.containsPoint(point)) {
                // 在方框的空间里找到点
                result.point = box.bounds.getClosestPointOnRectangleBorderToPoint(point, result.normal);
                result.minimumTranslationVector = point.sub(result.point);

                return true;
            }

            return false;
        }

        public static pointToPoly(point: Vector2, poly: Polygon, result: CollisionResult = new CollisionResult()): boolean {
            if (poly.containsPoint(point)) {
                const res = Polygon.getClosestPointOnPolygonToPoint(
                    poly.points,
                    point.sub(poly.position)
                );
                result.normal = res.edgeNormal;
                result.minimumTranslationVector = result.normal.scale(
                    Math.sqrt(res.distanceSquared)
                );
                result.point = res.closestPoint.sub(poly.position);
                return true;
            }

            return false;
        }
    }
}