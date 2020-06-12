///<reference path="./Shape.ts" />
class Polygon extends Shape {
    public points: Vector2[];
    public isUnrotated: boolean = true;
    private _polygonCenter: Vector2;
    private _areEdgeNormalsDirty = true;
    private _originalPoint: Vector2[]

    constructor(vertCount: number, radius: number) {
        super();
        this.setPoints(Polygon.buildSymmertricalPolygon(vertCount, radius));
    }

    public setPoints(points: Vector2[]) {
        this.points = points;
        this.recalculateCenterAndEdgeNormals();

        this._originalPoint = new Vector2[points.length];
        this._originalPoint = points;
    }

    public recalculateCenterAndEdgeNormals() {
        this._polygonCenter = Polygon.findPolygonCenter(this.points);
        this._areEdgeNormalsDirty = true;
    }

    public static findPolygonCenter(points: Vector2[]) {
        let x = 0, y = 0;

        for (let i = 0; i < points.length; i++) {
            x += points[i].x;
            y += points[i].y;
        }

        return new Vector2(x / points.length, y / points.length);
    }

    public static getClosestPointOnPolygonToPoint(points: Vector2[], point: Vector2): { closestPoint, distanceSquared, edgeNormal } {
        let distanceSquared = Number.MAX_VALUE;
        let edgeNormal = new Vector2(0, 0);
        let closestPoint = new Vector2(0, 0);

        let tempDistanceSquared;
        for (let i = 0; i < points.length; i++) {
            let j = i + 1;
            if (j == points.length)
                j = 0;

            let closest = ShapeCollisions.closestPointOnLine(points[i], points[j], point);
            tempDistanceSquared = Vector2.distanceSquared(point, closest);

            if (tempDistanceSquared < distanceSquared) {
                distanceSquared = tempDistanceSquared;
                closestPoint = closest;

                let line = Vector2.subtract(points[j], points[i]);
                edgeNormal.x = -line.y;
                edgeNormal.y = line.x;
            }
        }

        edgeNormal = Vector2.normalize(edgeNormal);

        return { closestPoint: closestPoint, distanceSquared: distanceSquared, edgeNormal: edgeNormal };
    }

    public pointCollidesWithShape(point: Vector2): CollisionResult {
        return ShapeCollisions.pointToPoly(point, this);
    }

    public containsPoint(point: Vector2) {
        point = Vector2.subtract(point, this.position);

        let isInside = false;
        for (let i = 0, j = this.points.length - 1; i < this.points.length; j = i++) {
            if (((this.points[i].y > point.y) != (this.points[j].y > point.y)) &&
                (point.x < (this.points[j].x - this.points[i].x) * (point.y - this.points[i].y) / (this.points[j].y - this.points[i].y) +
                    this.points[i].x)) {
                isInside = !isInside;
            }
        }

        return isInside;
    }

    public static buildSymmertricalPolygon(vertCount: number, radius: number) {
        let verts = new Vector2[vertCount];

        for (let i = 0; i < vertCount; i++) {
            let a = 2 * Math.PI * (i / vertCount);
            verts[i] = new Vector2(Math.cos(a), Math.sign(a) * radius);
        }

        return verts;
    }
}