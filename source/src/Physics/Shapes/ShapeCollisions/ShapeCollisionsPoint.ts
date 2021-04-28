module es {
    export class ShapeCollisionsPoint {
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

        public static pointToBox(point: Vector2, box: Box, result: CollisionResult = new CollisionResult()){
            if (box.containsPoint(point)){
                // 在方框的空间里找到点
                result.point = box.bounds.getClosestPointOnRectangleBorderToPoint(point, result.normal);
                result.minimumTranslationVector = Vector2.subtract(point, result.point);

                return true;
            }

            return false;
        }

        public static pointToPoly(point: Vector2, poly: Polygon, result: CollisionResult = new CollisionResult()): boolean {
            if (poly.containsPoint(point)) {
                let distanceSquared = new Ref(0);
                let closestPoint = Polygon.getClosestPointOnPolygonToPoint(poly.points, Vector2.subtract(point, poly.position), distanceSquared, result.normal);

                result.minimumTranslationVector = new Vector2(result.normal.x * Math.sqrt(distanceSquared.value), result.normal.y * Math.sqrt(distanceSquared.value));
                result.point = Vector2.add(closestPoint, poly.position);

                return true;
            }

            return false;
        }
    }
}