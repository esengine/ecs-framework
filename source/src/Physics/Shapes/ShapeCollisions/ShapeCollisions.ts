class ShapeCollisions {
    /**
     * 检查两个多边形之间的碰撞
     * @param first 
     * @param second 
     */
    public static polygonToPolygon(first: Polygon, second: Polygon) {
        let result = new CollisionResult();
        let isIntersecting = true;

        let firstEdges = first.edgeNormals;
        let secondEdges = second.edgeNormals;
        let minIntervalDistance = Number.POSITIVE_INFINITY;
        let translationAxis = new Vector2();
        let polygonOffset = Vector2.subtract(first.position, second.position);
        let axis: Vector2;

        for (let edgeIndex = 0; edgeIndex < firstEdges.length + secondEdges.length; edgeIndex++) {
            if (edgeIndex < firstEdges.length) {
                axis = firstEdges[edgeIndex];
            } else {
                axis = secondEdges[edgeIndex - firstEdges.length];
            }

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

            let relativeIntervalOffset = Vector2.dot(polygonOffset, axis);
            minA += relativeIntervalOffset;
            maxA += relativeIntervalOffset;

            intervalDist = this.intervalDistance(minA, maxA, minB, maxB);
            if (intervalDist > 0)
                isIntersecting = false;

            if (!isIntersecting)
                return null;

            intervalDist = Math.abs(intervalDist);
            if (intervalDist < minIntervalDistance) {
                minIntervalDistance = intervalDist;
                translationAxis = axis;

                if (Vector2.dot(translationAxis, polygonOffset) < 0)
                    translationAxis = new Vector2(-translationAxis);
            }
        }

        result.normal = translationAxis;
        result.minimumTranslationVector = Vector2.multiply(new Vector2(-translationAxis), new Vector2(minIntervalDistance));

        return result;
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

        return { min: min, max: max };
    }

    /**
     * 
     * @param circle 
     * @param polygon 
     */
    public static circleToPolygon(circle: Circle, polygon: Polygon) {
        let result = new CollisionResult();

        let poly2Circle = Vector2.subtract(circle.position, polygon.position);

        let gpp = Polygon.getClosestPointOnPolygonToPoint(polygon.points, poly2Circle);
        let closestPoint: Vector2 = gpp.closestPoint;
        let distanceSquared: number = gpp.distanceSquared;
        result.normal = gpp.edgeNormal;

        let circleCenterInsidePoly = polygon.containsPoint(circle.position);
        if (distanceSquared > circle.radius * circle.radius && !circleCenterInsidePoly)
            return null;

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

        return result;
    }

    /**
     * 适用于圆心在方框内以及只与方框外圆心重叠的圆。
     * @param circle 
     * @param box 
     */
    public static circleToBox(circle: Circle, box: Box): CollisionResult {
        let result = new CollisionResult();
        let closestPointOnBounds = box.bounds.getClosestPointOnRectangleBorderToPoint(circle.position).res;

        if (box.containsPoint(circle.position)) {
            result.point = closestPointOnBounds;

            let safePlace = Vector2.add(closestPointOnBounds, Vector2.subtract(result.normal, new Vector2(circle.radius)));
            result.minimumTranslationVector = Vector2.subtract(circle.position, safePlace);

            return result;
        }

        let sqrDistance = Vector2.distanceSquared(closestPointOnBounds, circle.position);
        if (sqrDistance == 0) {
            result.minimumTranslationVector = Vector2.multiply(result.normal, new Vector2(circle.radius));
        } else if (sqrDistance <= circle.radius * circle.radius) {
            result.normal = Vector2.subtract(circle.position, closestPointOnBounds);
            let depth = result.normal.length() - circle.radius;
            result.normal = Vector2Ext.normalize(result.normal);
            result.minimumTranslationVector = Vector2.multiply(new Vector2(depth), result.normal);

            return result;
        }

        return null;
    }

    /**
     * 
     * @param point 
     * @param circle 
     */
    public static pointToCircle(point: Vector2, circle: Circle) {
        let result = new CollisionResult();

        let distanceSquared = Vector2.distanceSquared(point, circle.position);
        let sumOfRadii = 1 + circle.radius;
        let collided = distanceSquared < sumOfRadii * sumOfRadii;
        if (collided) {
            result.normal = Vector2.normalize(Vector2.subtract(point, circle.position));
            let depth = sumOfRadii - Math.sqrt(distanceSquared);
            result.minimumTranslationVector = Vector2.multiply(new Vector2(-depth, -depth), result.normal);
            result.point = Vector2.add(circle.position, Vector2.multiply(result.normal, new Vector2(circle.radius, circle.radius)));

            return result;
        }

        return null;
    }

    /**
     * 
     * @param lineA 
     * @param lineB 
     * @param closestTo 
     */
    public static closestPointOnLine(lineA: Vector2, lineB: Vector2, closestTo: Vector2) {
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
     */
    public static pointToPoly(point: Vector2, poly: Polygon) {
        let result = new CollisionResult();

        if (poly.containsPoint(point)) {
            let distanceSquared: number;
            let gpp = Polygon.getClosestPointOnPolygonToPoint(poly.points, Vector2.subtract(point, poly.position));
            let closestPoint = gpp.closestPoint;
            distanceSquared = gpp.distanceSquared;
            result.normal = gpp.edgeNormal;

            result.minimumTranslationVector = Vector2.multiply(result.normal, new Vector2(Math.sqrt(distanceSquared), Math.sqrt(distanceSquared)));
            result.point = Vector2.add(closestPoint, poly.position);

            return result;
        }

        return null;
    }

    /**
     * 
     * @param first 
     * @param second 
     */
    public static circleToCircle(first: Circle, second: Circle){
        let result = new CollisionResult();

        let distanceSquared = Vector2.distanceSquared(first.position, second.position);
        let sumOfRadii = first.radius + second.radius;
        let collided = distanceSquared < sumOfRadii * sumOfRadii;
        if (collided){
            result.normal = Vector2.normalize(Vector2.subtract(first.position, second.position));
            let depth = sumOfRadii - Math.sqrt(distanceSquared);
            result.minimumTranslationVector = Vector2.multiply(new Vector2(-depth), result.normal);
            result.point = Vector2.add(second.position, Vector2.multiply(result.normal, new Vector2(second.radius)));

            return result;
        }

        return null;
    }

    /**
     * 
     * @param first 
     * @param second 
     */
    public static boxToBox(first: Box, second: Box){
        let result = new CollisionResult();

        let minkowskiDiff = this.minkowskiDifference(first, second);
        if (minkowskiDiff.contains(new Vector2(0, 0))){
            result.minimumTranslationVector = minkowskiDiff.getClosestPointOnBoundsToOrigin();

            if (result.minimumTranslationVector == Vector2.zero)
                return false;
            
            result.normal = new Vector2(-result.minimumTranslationVector.x, -result.minimumTranslationVector.y);
            result.normal.normalize();

            return result;
        }

        return null;
    }

    private static minkowskiDifference(first: Box, second: Box){
        let positionOffset = Vector2.subtract(first.position, Vector2.add(first.bounds.location, Vector2.divide(first.bounds.size, new Vector2(2))));
        let topLeft = Vector2.subtract(Vector2.add(first.bounds.location, positionOffset), second.bounds.max);
        let fullSize = Vector2.add(first.bounds.size, second.bounds.size);

        return new Rectangle(topLeft.x, topLeft.y, fullSize.x, fullSize.y)
    }
}