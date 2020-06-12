class ShapeCollisions {
    public static circleToRect(circle: Circle, box: Rect): CollisionResult{
        let result = new CollisionResult();
        let closestPointOnBounds = box.bounds.getClosestPointOnRectangleBorderToPoint(circle.position).res;

        if (box.containsPoint(circle.position)){
            result.point = closestPointOnBounds;

            let safePlace = Vector2.add(closestPointOnBounds, Vector2.subtract(result.normal, new Vector2(circle.radius, circle.radius)));
        }

        return result;
    }

    public static pointToCicle(point: Vector2, circle: Circle){
        let result = new CollisionResult();

        let distanceSquared = Vector2.distanceSquared(point, circle.position);
        let sumOfRadii = 1 + circle.radius;
        let collided = distanceSquared < sumOfRadii * sumOfRadii;
        if (collided){
            result.normal = Vector2.normalize(Vector2.subtract(point, circle.position));
            let depth = sumOfRadii - Math.sqrt(distanceSquared);
            result.minimumTranslationVector = Vector2.multiply(new Vector2(-depth, -depth), result.normal);
            result.point = Vector2.add(circle.position, Vector2.multiply(result.normal, new Vector2(circle.radius, circle.radius)));

            return result;
        }

        return result;
    }

    public static closestPointOnLine(lineA: Vector2, lineB: Vector2, closestTo: Vector2){
        let v = Vector2.subtract(lineB, lineA);
        let w = Vector2.subtract(closestTo, lineA);
        let t = Vector2.dot(w, v) / Vector2.dot(v, v);
        t = MathHelper.clamp(t, 0, 1);

        return Vector2.add(lineA, Vector2.multiply(v, new Vector2(t, t)));
    }

    public static pointToPoly(point: Vector2, poly: Polygon){
        let result = new CollisionResult();

        if (poly.containsPoint(point)){
            let distanceSquared: number;
            let gpp = Polygon.getClosestPointOnPolygonToPoint(poly.points, Vector2.subtract(point, poly.position));
            let closestPoint = gpp.closestPoint;
            distanceSquared = gpp.distanceSquared;
            result.normal = gpp.edgeNormal;

            result.minimumTranslationVector = Vector2.multiply(result.normal, new Vector2(Math.sqrt(distanceSquared), Math.sqrt(distanceSquared)));
            result.point = Vector2.add(closestPoint, poly.position);

            return result;
        }

        return result;
    }
}