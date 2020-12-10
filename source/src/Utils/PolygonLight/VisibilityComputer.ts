///<reference path="../Collections/LinkList.ts" />
module es {
    /**
     * 类，它可以计算出一个网格，表示从给定的一组遮挡物的原点可以看到哪些区域。使用方法如下。
	 *
	 * - 调用 begin
	 * - 添加任何遮挡物
	 * - 调用end来获取可见度多边形。当调用end时，所有的内部存储都会被清空。
     */
    export class VisibilityComputer {
        /** 
         *  在近似圆的时候要用到的线的总数。只需要一个180度的半球，所以这将是近似该半球的线段数
         */
        public lineCountForCircleApproximation: number = 10;

        public _radius: number = 0;
        public _origin: Vector2 = Vector2.zero;
        public _isSpotLight: boolean = false;
        public _spotStartAngle: number = 0;
        public _spotEndAngle: number = 0;

        public _endPoints: EndPoint[] = [];
        public _segments: Segment[] = [];
        public _radialComparer: EndPointComparer;

        public static _cornerCache: Vector2[] = [];
        public static _openSegments: LinkedList<Segment> = new LinkedList<Segment>();

        constructor(origin?: Vector2, radius?: number){
            this._origin = origin;
            this._radius = radius;
            this._radialComparer = new EndPointComparer();
        }

        /**
         * 增加了一个对撞机作为PolyLight的遮蔽器
         * @param collider 
         */
        public addColliderOccluder(collider: Collider) {
            // 特殊情况下，BoxColliders没有旋转
            if (collider instanceof BoxCollider && collider.rotation == 0) {
                this.addSquareOccluder(collider.bounds);
                return;
            }

            if (collider instanceof PolygonCollider) {
                let poly = collider.shape as Polygon;
                for (let i = 0; i < poly.points.length; i ++) {
                    let firstIndex = i - 1;
                    if (i == 0)
                        firstIndex += poly.points.length;
                    this.addLineOccluder(Vector2.add(poly.points[firstIndex], poly.position), 
                        Vector2.add(poly.points[i], poly.position));
                }
            } else if(collider instanceof CircleCollider) {
                this.addCircleOccluder(collider.absolutePosition, collider.radius);
            }
        }

        /**
         * 增加了一个圆形的遮挡器
         * @param position 
         * @param radius 
         */
        public addCircleOccluder(position: Vector2, radius: number){
            let dirToCircle = Vector2.subtract(position, this._origin);
            let angle = Math.atan2(dirToCircle.y, dirToCircle.x);

            let stepSize = Math.PI / this.lineCountForCircleApproximation;
            let startAngle = angle + MathHelper.PiOver2;
            let lastPt = MathHelper.angleToVector(startAngle, radius).add(position);
            for (let i = 1; i < this.lineCountForCircleApproximation; i ++) {
                let nextPt = MathHelper.angleToVector(startAngle + i * stepSize, radius).add(position);
                this.addLineOccluder(lastPt, nextPt);
                lastPt = nextPt;
            }
        }

        /**
         * 增加一个线型遮挡器
         * @param p1 
         * @param p2 
         */
        public addLineOccluder(p1: Vector2, p2: Vector2) {
            this.addSegment(p1, p2);
        }

        /**
         * 增加一个方形的遮挡器
         * @param bounds 
         */
        public addSquareOccluder(bounds: Rectangle) {
            let tr = new Vector2(bounds.right, bounds.top);
            let bl = new Vector2(bounds.left, bounds.bottom);
            let br = new Vector2(bounds.right, bounds.bottom);

            this.addSegment(bounds.location, tr);
            this.addSegment(tr, br);
            this.addSegment(br, bl);
            this.addSegment(bl, bounds.location);
        }

        /**
         * 添加一个段，第一个点在可视化中显示，但第二个点不显示。
         * 每个端点都是两个段的一部分，但我们希望只显示一次
         * @param p1 
         * @param p2 
         */
        public addSegment(p1: Vector2, p2: Vector2) {
            let segment = new Segment();
            let endPoint1 = new EndPoint();
            let endPoint2 = new EndPoint();

            endPoint1.position = p1;
            endPoint1.segment = segment;

            endPoint2.position = p2;
            endPoint2.segment = segment;

            segment.p1 = endPoint1;
            segment.p2 = endPoint2;

            this._segments.push(segment);
            this._endPoints.push(endPoint1);
            this._endPoints.push(endPoint2);
        }

        /**
         * 移除所有的遮挡物
         */
        public clearOccluders(){
            this._segments.length = 0;
            this._endPoints.length = 0;
        }

        /**
         * 为计算机计算当前的聚光做好准备
         * @param origin 
         * @param radius 
         */
        public begin(origin: Vector2, radius: number){
            this._origin = origin;
            this._radius = radius;
            this._isSpotLight = false;
        }

        /**
         * 计算可见性多边形，并返回三角形扇形的顶点（减去中心顶点）。返回的数组来自ListPool
         */
        public end(): Vector2[] {
            let output = ListPool.obtain<Vector2>();
            this.updateSegments();
            this._endPoints.sort(this._radialComparer.compare);

            let currentAngle = 0;
            // 在扫描开始时，我们想知道哪些段是活动的。
            // 最简单的方法是先进行一次段的收集，然后再进行一次段的收集和处理。
            // 然而，更有效的方法是通过所有的段，找出哪些段与最初的扫描线相交，然后对它们进行分类
            for (let pass = 0; pass < 2; pass ++) {
                for (let p of this._endPoints) {
                    let currentOld = VisibilityComputer._openSegments.size() == 0 ? null : VisibilityComputer._openSegments.getHead().element;

                    if (p.begin) {
                        // 在列表中的正确位置插入
                        let node = VisibilityComputer._openSegments.getHead();
                        while (node != null && this.isSegmentInFrontOf(p.segment, node.element, this._origin))
                            node = node.next;

                        if (node == null)
                            VisibilityComputer._openSegments.push(p.segment);
                        else
                            VisibilityComputer._openSegments.insert(p.segment, VisibilityComputer._openSegments.indexOf(node.element));
                    } else {
                        VisibilityComputer._openSegments.remove(p.segment);
                    }

                    let currentNew = null;
                    if (VisibilityComputer._openSegments.size() != 0)
                        currentNew = VisibilityComputer._openSegments.getHead().element;

                    if (currentOld != currentNew) {
                        if (pass == 1) {
                            if (!this._isSpotLight || (VisibilityComputer.between(currentAngle, this._spotStartAngle, this._spotEndAngle) &&
                                VisibilityComputer.between(p.angle, this._spotStartAngle, this._spotEndAngle)))
                                    this.addTriangle(output, currentAngle, p.angle, currentOld);
                        }

                        currentAngle = p.angle;
                    }
                }
            }

            VisibilityComputer._openSegments.clear();
            this.clearOccluders();

            return output;
        }

        public addTriangle(triangles: Vector2[], angle1: number, angle2: number, segment: Segment) {
            let p1 = this._origin.clone();
            let p2 = new Vector2(this._origin.x + Math.cos(angle1), this._origin.y + Math.sin(angle1));
            let p3 = Vector2.zero;
            let p4 = Vector2.zero;

            if (segment != null){
                // 将三角形停在相交线段上
                p3.x = segment.p1.position.x;
                p3.y = segment.p1.position.y;
                p4.x = segment.p2.position.x;
                p4.y = segment.p2.position.y;
            } else {
                p3.x = this._origin.x + Math.cos(angle1) * this._radius * 2;
                p3.y = this._origin.y + Math.sin(angle1) * this._radius * 2;
                p4.x = this._origin.x + Math.cos(angle2) * this._radius * 2;
                p4.y = this._origin.y + Math.sin(angle2) * this._radius * 2;
            }

            let pBegin = VisibilityComputer.lineLineIntersection(p3, p4, p1, p2);

            p2.x = this._origin.x + Math.cos(angle2);
            p2.y = this._origin.y + Math.sin(angle2);

            let pEnd = VisibilityComputer.lineLineIntersection(p3, p4, p1, p2);

            triangles.push(pBegin);
            triangles.push(pEnd);
        }

        /**
         * 计算直线p1-p2与p3-p4的交点
         * @param p1 
         * @param p2 
         * @param p3 
         * @param p4 
         */
        public static lineLineIntersection(p1: Vector2, p2: Vector2, p3: Vector2, p4: Vector2){
            let s = ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x))
                / ((p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y));
            return new Vector2(p1.x + s * (p2.x - p1.x), p1.y + s * (p2.y - p1.y));
        }

        public static between(value: number, min: number, max: number) {
            value = (360 + (value % 360)) % 360;
            min = (3600000 + min) % 360;
            max = (3600000 + max) % 360;

            if (min < max)
                return min <= value && value <= max;
            
            return min <= value || value <= max;
        }

        /**
         * 辅助函数，用于沿外周线构建分段，以限制光的半径。
         */
        public loadRectangleBoundaries(){
            this.addSegment(new Vector2(this._origin.x - this._radius, this._origin.y - this._radius),
                new Vector2(this._origin.x + this._radius, this._origin.y - this._radius));
            this.addSegment(new Vector2(this._origin.x - this._radius, this._origin.y + this._radius),
                new Vector2(this._origin.x + this._radius, this._origin.y + this._radius));
            this.addSegment(new Vector2(this._origin.x - this._radius, this._origin.y - this._radius),
                new Vector2(this._origin.x - this._radius, this._origin.y + this._radius));
            this.addSegment(new Vector2(this._origin.x + this._radius, this._origin.y - this._radius),
                new Vector2(this._origin.x + this._radius, this._origin.y + this._radius));
        }

        /**
         * 助手：我们知道a段在b的前面吗？实现不反对称（也就是说，isSegmentInFrontOf(a, b) != (!isSegmentInFrontOf(b, a))）。
         * 另外要注意的是，在可见性算法中，它只需要在有限的一组情况下工作，我不认为它能处理所有的情况。
         * 见http://www.redblobgames.com/articles/visibility/segment-sorting.html
         * @param a 
         * @param b 
         * @param relativeTo 
         */
        public isSegmentInFrontOf(a: Segment, b: Segment, relativeTo: Vector2) {
            // 注意：我们稍微缩短了段，所以在这个算法中，端点的交点（共同）不计入交点。
            let a1 = VisibilityComputer.isLeftOf(a.p2.position, a.p1.position, VisibilityComputer.interpolate(b.p1.position, b.p2.position, 0.01));
            let a2 = VisibilityComputer.isLeftOf(a.p2.position, a.p1.position, VisibilityComputer.interpolate(b.p2.position, b.p1.position, 0.01));
            let a3 = VisibilityComputer.isLeftOf(a.p2.position, a.p1.position, relativeTo);

            let b1 = VisibilityComputer.isLeftOf(b.p2.position, b.p1.position, VisibilityComputer.interpolate(a.p1.position, a.p2.position, 0.01));
            let b2 = VisibilityComputer.isLeftOf(b.p2.position, b.p1.position, VisibilityComputer.interpolate(a.p2.position, a.p1.position, 0.01));
            let b3 = VisibilityComputer.isLeftOf(b.p2.position, b.p1.position, relativeTo);

            // 注：考虑A1-A2这条线。如果B1和B2都在一条边上，而relativeTo在另一条边上，那么A就在观看者和B之间。
            if (b1 == b2 && b2 != b3)
                return true;
            if (a1 == a2 && a2 == a3)
                return true;
            if (a1 == a2 && a2 != a3)
                return false;
            if (b1 == b2 && b2 == b3)
                return false;

            // 如果A1 !=A2，B1 !=B2，那么我们就有一个交点。
            // 一个更稳健的实现是在交叉点上分割段，使一部分段在前面，一部分段在后面，但无论如何我们不应该有重叠的碰撞器，所以这不是太重要
            return false;

            // 注意：以前的实现方式是a.d < b.d.，这比较简单，但当段的大小不一样时，就麻烦了。
            // 如果你是在一个网格上，而且段的大小相似，那么使用距离将是一个更简单和更快的实现。
        }

        /**
         * 返回略微缩短的向量：p * (1 - f) + q * f
         * @param p 
         * @param q 
         * @param f 
         */
        public static interpolate(p: Vector2, q: Vector2, f: number){
            return new Vector2(p.x * (1 - f) + q.x * f, p.y * (1 - f) + q.y * f);
        }

        /**
         * 返回点是否在直线p1-p2的 "左边"。
         * @param p1 
         * @param p2 
         * @param point 
         */
        public static isLeftOf(p1: Vector2, p2: Vector2, point: Vector2) {
            let cross = (p2.x - p1.x) * (point.y - p1.y)
                - (p2.y - p1.y) * (point.x - p1.x);
            
            return cross < 0;
        }

        /**
         * 处理片段，以便我们稍后对它们进行分类
         */
        public updateSegments(){
            for (let segment of this._segments) {
                // 注：未来的优化：我们可以记录象限和y/x或x/y比率，并按（象限、比率）排序，而不是调用atan2。
                // 参见<https://github.com/mikolalysenko/compare-slope>，有一个库可以做到这一点

                segment.p1.angle = Math.atan2(segment.p1.position.y - this._origin.y, segment.p1.position.x - this._origin.x);
                segment.p2.angle = Math.atan2(segment.p2.position.y - this._origin.y, segment.p2.position.x - this._origin.x);

                //  Pi和Pi之间的映射角度
                let dAngle = segment.p2.angle - segment.p1.angle;
                if (dAngle <= -Math.PI)
                    dAngle += Math.PI * 2;

                if (dAngle > Math.PI)
                    dAngle -= Math.PI * 2;

                segment.p1.begin = (dAngle > 0);
                segment.p2.begin = !segment.p1.begin;
            }

            // 如果我们有一个聚光灯，我们需要存储前两个段的角度。
            // 这些是光斑的边界，我们将用它们来过滤它们之外的任何顶点。
            if (this._isSpotLight) {
                this._spotStartAngle = this._segments[0].p2.angle;
                this._spotEndAngle = this._segments[1].p2.angle;
            }
        }
    }
}