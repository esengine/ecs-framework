module es {
    export class ShapeCollisionsPoint {
        public static pointToCircle(point: Vector2, circle: Circle, result: Out<CollisionResult>): boolean {
            result.value = new CollisionResult();

            let distanceSquared = Vector2.sqrDistance(point, circle.position);
            let sumOfRadii = 1 + circle.radius;
            let collided = distanceSquared < sumOfRadii * sumOfRadii;
            if (collided) {
                result.value.normal = point.sub(circle.position).normalize();
                let depth = sumOfRadii - Math.sqrt(distanceSquared);
                result.value.minimumTranslationVector = result.value.normal.scale(-depth);;
                result.value.point = circle.position.add(result.value.normal.scale(circle.radius));

                return true;
            }

            return false;
        }

        public static pointToBox(point: Vector2, box: Box, result: Out<CollisionResult>) {
            result.value = new CollisionResult();

            if (box.containsPoint(point)) {
                // 在方框的空间里找到点
                const normal = new Out<Vector2>();
                result.value.point = box.bounds.getClosestPointOnRectangleBorderToPoint(point, normal);
                result.value.normal = normal.value;
                result.value.minimumTranslationVector = point.sub(result.value.point);

                return true;
            }

            return false;
        }

        public static pointToPoly(point: Vector2, poly: Polygon, result: Out<CollisionResult>): boolean {
            result.value = new CollisionResult();

            if (poly.containsPoint(point)) {
                const res = Polygon.getClosestPointOnPolygonToPoint(
                    poly.points,
                    point.sub(poly.position)
                );
                result.value.normal = res.edgeNormal;
                result.value.minimumTranslationVector = result.value.normal.scale(Math.sqrt(res.distanceSquared));
                result.value.point = res.closestPoint.sub(poly.position);
                return true;
            }

            return false;
        }
    }
}