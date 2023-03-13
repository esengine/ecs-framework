///<reference path="./Shape.ts" />
module es {
    /**
     * 多边形
     */
    export class Polygon extends Shape {
        /**
         * 组成多边形的点
         * 保持顺时针与凸边形
         */
        public points: Vector2[];
        public _areEdgeNormalsDirty = true;
        /**
         * 多边形的原始数据
         */
        public _originalPoints: Vector2[];
        public _polygonCenter: Vector2;
        /**
         * 用于优化未旋转box碰撞
         */
        public isBox: boolean;
        public isUnrotated: boolean = true;

        /**
         * 从点构造一个多边形
         * 多边形应该以顺时针方式指定 不能重复第一个/最后一个点，它们以0 0为中心
         * @param points
         * @param isBox
         */
        constructor(points: Vector2[], isBox?: boolean) {
            super();

            this.setPoints(points);
            this.isBox = isBox;
        }

        public create(vertCount: number, radius: number) {
            Polygon.buildSymmetricalPolygon(vertCount, radius);
          }

        public _edgeNormals: Vector2[];

        /**
         * 边缘法线用于SAT碰撞检测。缓存它们用于避免squareRoots
         * box只有两个边缘 因为其他两边是平行的
         */
        public get edgeNormals() {
            if (this._areEdgeNormalsDirty)
                this.buildEdgeNormals();
            return this._edgeNormals;
        }

        /**
         * 重置点并重新计算中心和边缘法线
         * @param points
         */
        public setPoints(points: Vector2[]) {
            this.points = points;
            this.recalculateCenterAndEdgeNormals();

            this._originalPoints = [];
            this.points.forEach(p => {
                this._originalPoints.push(p.clone());
            });
        }

        /**
         * 重新计算多边形中心
         * 如果点数改变必须调用该方法
         */
        public recalculateCenterAndEdgeNormals() {
            this._polygonCenter = Polygon.findPolygonCenter(this.points);
            this._areEdgeNormalsDirty = true;
        }

        /**
         * 建立多边形边缘法线
         * 它们仅由edgeNormals getter惰性创建和更新
         */
        public buildEdgeNormals() {
            // 对于box 我们只需要两条边，因为另外两条边是平行的
            let totalEdges = this.isBox ? 2 : this.points.length;
            if (this._edgeNormals == undefined || this._edgeNormals.length != totalEdges)
                this._edgeNormals = new Array(totalEdges);

            let p2: Vector2;
            for (let i = 0; i < totalEdges; i++) {
                let p1 = this.points[i];
                if (i + 1 >= this.points.length)
                    p2 = this.points[0];
                else
                    p2 = this.points[i + 1];

                let perp = Vector2Ext.perpendicular(p1, p2);
                Vector2Ext.normalize(perp);
                this._edgeNormals[i] = perp;
            }
        }

        /**
         * 建立一个对称的多边形(六边形，八角形，n角形)并返回点
         * @param vertCount
         * @param radius
         */
        public static buildSymmetricalPolygon(vertCount: number, radius: number) {
            const verts = new Array(vertCount);

            for (let i = 0; i < vertCount; i++) {
                const a = 2 * Math.PI * (i / vertCount);
                verts[i] = new Vector2(Math.cos(a) * radius, Math.sin(a) * radius);
            }

            return verts;
        }

        /**
         * 重定位多边形的点
         * @param points
         */
        public static recenterPolygonVerts(points: Vector2[]) {
            const center = this.findPolygonCenter(points);
            for (let i = 0; i < points.length; i++)
                points[i] = points[i].sub(center);
        }

        /**
         * 找到多边形的中心。注意，这对于正则多边形是准确的。不规则多边形没有中心。
         * @param points
         */
        public static findPolygonCenter(points: Vector2[]) {
            let x = 0, y = 0;

            for (let i = 0; i < points.length; i++) {
                x += points[i].x;
                y += points[i].y;
            }

            return new Vector2(x / points.length, y / points.length);
        }

        /**
         * 不知道辅助顶点，所以取每个顶点，如果你知道辅助顶点，执行climbing算法
         * @param points
         * @param direction
         */
        public static getFarthestPointInDirection(points: Vector2[], direction: Vector2): Vector2 {
            let index = 0;
            let maxDot = points[index].dot(direction);

            for (let i = 1; i < points.length; i++) {
                let dot = points[i].dot(direction);
                if (dot > maxDot) {
                    maxDot = dot;
                    index = i;
                }
            }

            return points[index];
        }

        /**
         * 迭代多边形的所有边，并得到任意边上离点最近的点。
         * 通过最近点的平方距离和它所在的边的法线返回。
         * 点应该在多边形的空间中(点-多边形.位置)
         * @param points
         * @param point
         * @param distanceSquared
         * @param edgeNormal
         */
        public static getClosestPointOnPolygonToPoint(points: Vector2[], point: Vector2): { distanceSquared: number; edgeNormal: Vector2; closestPoint: Vector2 } {
            const res = {
                distanceSquared: Number.MAX_VALUE,
                edgeNormal: Vector2.zero,
                closestPoint: Vector2.zero,
            };

            let tempDistanceSquared = 0;
            for (let i = 0; i < points.length; i++) {
                let j = i + 1;
                if (j === points.length)
                    j = 0;

                const closest = ShapeCollisionsCircle.closestPointOnLine(points[i], points[j], point);
                tempDistanceSquared = Vector2.sqrDistance(point, closest);

                if (tempDistanceSquared < res.distanceSquared) {
                    res.distanceSquared = tempDistanceSquared;
                    res.closestPoint = closest;

                    // 求直线的法线
                    const line = points[j].sub(points[i]);
                    res.edgeNormal.x = line.y;
                    res.edgeNormal.y = -line.x;
                }
            }

            res.edgeNormal = res.edgeNormal.normalize();
            return res;
        }

        /**
         * 旋转原始点并复制旋转的值到旋转的点
         * @param radians
         * @param originalPoints
         * @param rotatedPoints
         */
        public static rotatePolygonVerts(radians: number, originalPoints: Vector2[], rotatedPoints: Vector2[]) {
            let cos = Math.cos(radians);
            let sin = Math.sin(radians);

            for (let i = 0; i < originalPoints.length; i++) {
                let position = originalPoints[i];
                rotatedPoints[i] = new Vector2(position.x * cos + position.y * -sin, position.x * sin + position.y * cos);
            }
        }

        public recalculateBounds(collider: Collider) {
            // 如果我们没有旋转或不关心TRS我们使用localOffset作为中心，我们会从那开始
            this.center = collider.localOffset;

            if (collider.shouldColliderScaleAndRotateWithTransform) {
                let hasUnitScale = true;
                const tempMat: Matrix2D = new Matrix2D();
                const combinedMatrix: Matrix2D = new Matrix2D();
                Matrix2D.createTranslation(
                    this._polygonCenter.x * -1,
                    this._polygonCenter.y * -1,
                    combinedMatrix
                );

                if (!collider.entity.transform.scale.equals(Vector2.one)) {
                    Matrix2D.createScale(
                        collider.entity.scale.x,
                        collider.entity.scale.y,
                        tempMat
                    );
                    Matrix2D.multiply(combinedMatrix, tempMat, combinedMatrix);
                    hasUnitScale = false;

                    // 缩放偏移量并将其设置为中心。如果我们有旋转，它会在下面重置
                    const scaledOffset = new Vector2(
                        collider.localOffset.x * collider.entity.scale.x,
                        collider.localOffset.y * collider.entity.scale.y
                    );
                    this.center = scaledOffset;
                }

                if (collider.entity.transform.rotation != 0) {
                    Matrix2D.createRotation(
                        MathHelper.Deg2Rad * collider.entity.rotation,
                        tempMat
                    );
                    Matrix2D.multiply(combinedMatrix, tempMat, combinedMatrix);

                    // 为了处理偏移原点的旋转我们只需要将圆心在(0,0)附近移动
                    // 我们的偏移使角度为0我们还需要处理这里的比例所以我们先对偏移进行缩放以得到合适的长度。
                    const offsetAngle = Math.atan2(collider.localOffset.y * collider.entity.transform.scale.y, collider.localOffset.x * collider.entity.transform.scale.x) * MathHelper.Rad2Deg;
                    const offsetLength = hasUnitScale ? collider._localOffsetLength :
                        collider.localOffset.multiply(collider.entity.transform.scale).magnitude();
                    this.center = MathHelper.pointOnCircle(Vector2.zero, offsetLength,
                        collider.entity.transform.rotationDegrees + offsetAngle);
                }

                Matrix2D.createTranslation(
                    this._polygonCenter.x,
                    this._polygonCenter.y,
                    tempMat
                );
                Matrix2D.multiply(combinedMatrix, tempMat, combinedMatrix);

                // 最后变换原始点
                this.points = [];
                this._originalPoints.forEach(p => {
                    this.points.push(p.transform(combinedMatrix));
                });

                this.isUnrotated = collider.entity.transform.rotation == 0;

                // 如果旋转的话，我们只需要重建边的法线
                if (collider._isRotationDirty)
                    this._areEdgeNormalsDirty = true;
            }

            this.position = collider.transform.position.add(this.center);
            this.bounds = Rectangle.rectEncompassingPoints(this.points);
            this.bounds.location = this.bounds.location.add(this.position);
        }

        public overlaps(other: Shape) {
            let result = new Out<CollisionResult>();
            if (other instanceof Polygon)
                return ShapeCollisionsPolygon.polygonToPolygon(this, other, result);

            if (other instanceof Circle) {
                if (ShapeCollisionsCircle.circleToPolygon(other, this, result)) {
                    result.value.invertResult();
                    return true;
                }

                return false;
            }

            throw new Error(`overlaps of Pologon to ${other} are not supported`);
        }

        public collidesWithShape(other: Shape, result: Out<CollisionResult>): boolean {
            if (other instanceof Polygon) {
                return ShapeCollisionsPolygon.polygonToPolygon(this, other, result);
            }

            if (other instanceof Circle) {
                if (ShapeCollisionsCircle.circleToPolygon(other, this, result)) {
                    result.value.invertResult();
                    return true;
                }

                return false;
            }

            throw new Error(`overlaps of Polygon to ${other} are not supported`);
        }

        public collidesWithLine(start: Vector2, end: Vector2, hit: Out<RaycastHit>): boolean {
            return ShapeCollisionsLine.lineToPoly(start, end, this, hit);
        }

        /**
         * 本质上，这个算法所做的就是从一个点发射一条射线。
         * 如果它与奇数条多边形边相交，我们就知道它在多边形内部。
         * @param point
         */
        public containsPoint(point: Vector2) {
            // 将点归一化到多边形坐标空间中
            point = point.sub(this.position);

            let isInside = false;
            for (let i = 0, j = this.points.length - 1; i < this.points.length; j = i++) {
                if (((this.points[i].y > point.y) !== (this.points[j].y > point.y)) &&
                    (point.x < (this.points[j].x - this.points[i].x) * (point.y - this.points[i].y) / (this.points[j].y - this.points[i].y) +
                        this.points[i].x)) {
                    isInside = !isInside;
                }
            }

            return isInside;
        }

        public pointCollidesWithShape(point: Vector2, result: Out<CollisionResult>): boolean {
            return ShapeCollisionsPoint.pointToPoly(point, this, result);
        }
    }
}