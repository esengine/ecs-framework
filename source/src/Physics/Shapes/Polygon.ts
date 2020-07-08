///<reference path="./Shape.ts" />
class Polygon extends Shape {
    public points: Vector2[];
    public isUnrotated: boolean = true;
    private _polygonCenter: Vector2;
    private _areEdgeNormalsDirty = true;
    protected _originalPoints: Vector2[];

    public _edgeNormals: Vector2[];
    public get edgeNormals(){
        if (this._areEdgeNormalsDirty)
            this.buildEdgeNormals();
        return this._edgeNormals;
    }
    public isBox: boolean;

    constructor(points: Vector2[], isBox?: boolean){
        super();

        this.setPoints(points);
        this.isBox = isBox;
    }

    private buildEdgeNormals(){
        let totalEdges = this.isBox ? 2 : this.points.length;
        if (this._edgeNormals == null || this._edgeNormals.length != totalEdges)
            this._edgeNormals = new Array(totalEdges);

        let p2: Vector2;
        for (let i = 0; i < totalEdges; i ++){
            let p1 = this.points[i];
            if (i + 1 >= this.points.length)
                p2 = this.points[0];
            else
                p2 = this.points[i + 1];

            let perp = Vector2Ext.perpendicular(p1, p2);
            perp = Vector2.normalize(perp);
            this._edgeNormals[i] = perp;
        }
    }

    public setPoints(points: Vector2[]) {
        this.points = points;
        this.recalculateCenterAndEdgeNormals();

        this._originalPoints = [];
        for (let i = 0; i < this.points.length; i ++){
            this._originalPoints.push(this.points[i]);
        }
    }

    public collidesWithShape(other: Shape){
        let result = new CollisionResult();
        if (other instanceof Polygon){
            return ShapeCollisions.polygonToPolygon(this, other);
        }

        if (other instanceof Circle){
            result = ShapeCollisions.circleToPolygon(other, this);
            if (result){
                result.invertResult();
                return result;
            }

            return null;
        }

        throw new Error(`overlaps of Polygon to ${other} are not supported`);
    }

    public recalculateCenterAndEdgeNormals() {
        this._polygonCenter = Polygon.findPolygonCenter(this.points);
        this._areEdgeNormalsDirty = true;
    }

    public overlaps(other: Shape){
        let result: CollisionResult;
        if (other instanceof Polygon)
            return ShapeCollisions.polygonToPolygon(this, other);

        if (other instanceof Circle){
            result = ShapeCollisions.circleToPolygon(other, this);
            if (result){
                result.invertResult();
                return true;
            }

            return false;
        }

        throw new Error(`overlaps of Pologon to ${other} are not supported`);
    }

    public static findPolygonCenter(points: Vector2[]) {
        let x = 0, y = 0;

        for (let i = 0; i < points.length; i++) {
            x += points[i].x;
            y += points[i].y;
        }

        return new Vector2(x / points.length, y / points.length);
    }

    /**
     * 迭代多边形的所有边，并得到任意边上离点最近的点。
     * 通过最近点的平方距离和它所在的边的法线返回。
     * 点应该在多边形的空间中(点-多边形.位置)
     * @param points 
     * @param point 
     */
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

                // 求直线的法线
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

    /**
     * 本质上，这个算法所做的就是从一个点发射一条射线。
     * 如果它与奇数条多边形边相交，我们就知道它在多边形内部。
     * @param point 
     */
    public containsPoint(point: Vector2) {
        // 将点归一化到多边形坐标空间中
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

    /**
     * 建立一个对称的多边形(六边形，八角形，n角形)并返回点
     * @param vertCount 
     * @param radius 
     */
    public static buildSymmertricalPolygon(vertCount: number, radius: number) {
        let verts = new Array(vertCount);

        for (let i = 0; i < vertCount; i++) {
            let a = 2 * Math.PI * (i / vertCount);
            verts[i] = new Vector2(Math.cos(a), Math.sin(a) * radius);
        }

        return verts;
    }

    public recalculateBounds(collider: Collider) {
        // 如果我们没有旋转或不关心TRS我们使用localOffset作为中心，我们会从那开始
        this.center = collider.localOffset;

        if (collider.shouldColliderScaleAndRotateWithTransform){
            let hasUnitScale = true;
            let tempMat: Matrix2D;
            let combinedMatrix = Matrix2D.createTranslation(-this._polygonCenter.x, -this._polygonCenter.y);

            if (collider.entity.scale != Vector2.one){
                tempMat = Matrix2D.createScale(collider.entity.scale.x, collider.entity.scale.y);
                combinedMatrix = Matrix2D.multiply(combinedMatrix, tempMat);

                hasUnitScale = false;

                // 缩放偏移量并将其设置为中心。如果我们有旋转，它会在下面重置
                let scaledOffset = Vector2.multiply(collider.localOffset, collider.entity.scale);
                this.center = scaledOffset;
            }

            if (collider.entity.rotation != 0){
                tempMat = Matrix2D.createRotation(collider.entity.rotation, tempMat);
                combinedMatrix = Matrix2D.multiply(combinedMatrix, tempMat);

                // 为了处理偏移原点的旋转我们只需要将圆心在(0,0)附近移动我们的偏移使角度为0
                // 我们还需要处理这里的比例所以我们先对偏移进行缩放以得到合适的长度。
                let offsetAngle = Math.atan2(collider.localOffset.y, collider.localOffset.x) * MathHelper.Rad2Deg;
                let offsetLength = hasUnitScale ? collider._localOffsetLength : (Vector2.multiply(collider.localOffset, collider.entity.scale)).length();
                this.center = MathHelper.pointOnCirlce(Vector2.zero, offsetLength, MathHelper.toDegrees(collider.entity.rotation) + offsetAngle);
            }

            tempMat = Matrix2D.createTranslation(this._polygonCenter.x, this._polygonCenter.y);
            combinedMatrix = Matrix2D.multiply(combinedMatrix, tempMat);

            // 最后变换原始点
            Vector2Ext.transform(this._originalPoints, combinedMatrix, this.points);
            this.isUnrotated = collider.entity.rotation == 0;
        }

        this.position = Vector2.add(collider.entity.position, this.center);
        this.bounds = Rectangle.rectEncompassingPoints(this.points);
        this.bounds.location = Vector2.add(this.bounds.location, this.position);
    }
}