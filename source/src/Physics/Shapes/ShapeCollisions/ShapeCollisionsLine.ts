module es {
    export class ShapeCollisionsLine {
        public static lineToPoly(start: Vector2, end: Vector2, polygon: Polygon, hit: RaycastHit = new RaycastHit()): boolean {
            let normal = Vector2.zero;
            let intersectionPoint = Vector2.zero;
            let fraction = Number.MAX_VALUE;
            let hasIntersection = false;

            for (let j = polygon.points.length - 1, i = 0; i < polygon.points.length; j = i, i ++){
                let edge1 = Vector2.add(polygon.position, polygon.points[j]);
                let edge2 = Vector2.add(polygon.position, polygon.points[i]);
                let intersection: Vector2 = Vector2.zero;
                if (this.lineToLine(edge1, edge2, start, end, intersection)){
                    hasIntersection = true;

                    // TODO: 这是得到分数的正确和最有效的方法吗?
                    // 先检查x分数。如果是NaN，就用y代替
                    let distanceFraction = (intersection.x - start.x) / (end.x - start.x);
                    if (Number.isNaN(distanceFraction) || Math.abs(distanceFraction) == Infinity)
                        distanceFraction = (intersection.y - start.y) / (end.y - start.y);

                    if (distanceFraction < fraction){
                        let edge = Vector2.subtract(edge2, edge1);
                        normal = new Vector2(edge.y, -edge.x);
                        fraction = distanceFraction;
                        intersectionPoint = intersection;
                    }
                }
            }

            if (hasIntersection){
                normal.normalize();
                let distance = Vector2.distance(start, intersectionPoint);
                hit.setValuesNonCollider(fraction, distance, intersectionPoint, normal);
                return true;
            }

            return false;
        }

        public static lineToLine(a1: Vector2, a2: Vector2, b1: Vector2, b2: Vector2, intersection: Vector2){
            let b = Vector2.subtract(a2, a1);
            let d = Vector2.subtract(b2, b1);
            let bDotDPerp = b.x * d.y - b.y * d.x;

            // 如果b*d = 0，表示这两条直线平行，因此有无穷个交点
            if (bDotDPerp == 0)
                return false;

            let c = Vector2.subtract(b1, a1);
            let t = (c.x * d.y - c.y * d.x) / bDotDPerp;
            if (t < 0 || t > 1)
                return false;

            let u = (c.x * b.y - c.y * b.x) / bDotDPerp;
            if (u < 0 || u > 1)
                return false;

            let r = Vector2.add(a1, Vector2.multiplyScaler(b, t));
            intersection.x = r.x;
            intersection.y = r.y;

            return true;
        }

        public static lineToCircle(start: Vector2, end: Vector2, s: Circle, hit: RaycastHit): boolean{
            // 计算这里的长度并分别对d进行标准化，因为如果我们命中了我们需要它来得到分数
            let lineLength = Vector2.distance(start, end);
            let d = Vector2.divideScaler(Vector2.subtract(end, start), lineLength);
            let m = Vector2.subtract(start, s.position);
            let b = Vector2.dot(m, d);
            let c = Vector2.dot(m, m) - s.radius * s.radius;

            // 如果r的原点在s之外，(c>0)和r指向s (b>0) 则返回
            if (c > 0 && b > 0)
                return false;

            let discr = b * b - c;
            // 线不在圆圈上
            if (discr < 0)
                return false;

            // 射线相交圆
            hit.fraction = -b - Math.sqrt(discr);

            // 如果分数为负数，射线从圈内开始，
            if (hit.fraction < 0)
                hit.fraction = 0;

            hit.point = Vector2.add(start, Vector2.multiplyScaler(d, hit.fraction));
            hit.distance = Vector2.distance(start, hit.point);
            hit.normal = Vector2.normalize(Vector2.subtract(hit.point, s.position));
            hit.fraction = hit.distance / lineLength;

            return true;
        }
    }
}