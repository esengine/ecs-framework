module es {
    export enum PointSectors {
        center = 0,
        top = 1,
        bottom = 2,
        topLeft = 9,
        topRight = 5,
        left = 8,
        right = 4,
        bottomLeft = 10,
        bottomRight = 6
    }

    export class Collisions {
        public static lineToLine(a1: Vector2, a2: Vector2, b1: Vector2, b2: Vector2): boolean {
            const b = a2.sub(a1);
            const d = b2.sub(b1);
            const bDotDPerp = b.x * d.y - b.y * d.x;

            // 如果b*d = 0，表示这两条直线平行，因此有无穷个交点
            if (bDotDPerp == 0)
                return false;

            const c = b1.sub(a1);
            const t = (c.x * d.y - c.y * d.x) / bDotDPerp;
            if (t < 0 || t > 1) {
                return false;
            }

            const u = (c.x * b.y - c.y * b.x) / bDotDPerp;
            if (u < 0 || u > 1) {
                return false;
            }

            return true;
        }

        public static lineToLineIntersection(a1: Vector2, a2: Vector2, b1: Vector2, b2: Vector2, intersection: Vector2 = es.Vector2.zero): boolean {
            intersection.x = 0;
            intersection.y = 0;

            const b = a2.sub(a1);
            const d = b2.sub(b1);
            const bDotDPerp = b.x * d.y - b.y * d.x;

            // 如果b*d = 0，表示这两条直线平行，因此有无穷个交点
            if (bDotDPerp == 0)
                return false;

            const c = b1.sub(a1);
            const t = (c.x * d.y - c.y * d.x) / bDotDPerp;
            if (t < 0 || t > 1)
                return false;

            const u = (c.x * b.y - c.y * b.x) / bDotDPerp;
            if (u < 0 || u > 1)
                return false;

            const temp = a1.add(b.scale(t));
            intersection.x = temp.x;
            intersection.y = temp.y;

            return true;
        }

        public static closestPointOnLine(lineA: Vector2, lineB: Vector2, closestTo: Vector2) {
            const v = lineB.sub(lineA);
            const w = closestTo.sub(lineA);
            let t = w.dot(v) / v.dot(v);
            t = MathHelper.clamp(t, 0, 1);

            return lineA.add(v.scale(t));
        }

        public static circleToCircle(circleCenter1: Vector2, circleRadius1: number, circleCenter2: Vector2, circleRadius2: number): boolean {
            return Vector2.sqrDistance(circleCenter1, circleCenter2) < (circleRadius1 + circleRadius2) * (circleRadius1 + circleRadius2);
        }

        public static circleToLine(circleCenter: Vector2, radius: number, lineFrom: Vector2, lineTo: Vector2): boolean {
            return Vector2.sqrDistance(circleCenter, this.closestPointOnLine(lineFrom, lineTo, circleCenter)) < radius * radius;
        }

        public static circleToPoint(circleCenter: Vector2, radius: number, point: Vector2): boolean {
            return Vector2.sqrDistance(circleCenter, point) < radius * radius;
        }

        public static rectToCircle(rect: Rectangle, cPosition: Vector2, cRadius: number): boolean {
            // 检查矩形是否包含圆的中心点
            if (this.rectToPoint(rect.x, rect.y, rect.width, rect.height, cPosition))
                return true;

            // 对照相关边缘检查圆圈
            let edgeFrom: Vector2;
            let edgeTo: Vector2;
            const sector = this.getSector(rect.x, rect.y, rect.width, rect.height, cPosition);

            if ((sector & PointSectors.top) !== 0) {
                edgeFrom = new Vector2(rect.x, rect.y);
                edgeTo = new Vector2(rect.x + rect.width, rect.y);
                if (this.circleToLine(cPosition, cRadius, edgeFrom, edgeTo))
                    return true;
            }

            if ((sector & PointSectors.bottom) !== 0) {
                edgeFrom = new Vector2(rect.x, rect.y + rect.width);
                edgeTo = new Vector2(rect.x + rect.width, rect.y + rect.height);
                if (this.circleToLine(cPosition, cRadius, edgeFrom, edgeTo))
                    return true;
            }

            if ((sector & PointSectors.left) !== 0) {
                edgeFrom = new Vector2(rect.x, rect.y);
                edgeTo = new Vector2(rect.x, rect.y + rect.height);
                if (this.circleToLine(cPosition, cRadius, edgeFrom, edgeTo))
                    return true;
            }

            if ((sector & PointSectors.right) !== 0) {
                edgeFrom = new Vector2(rect.x + rect.width, rect.y);
                edgeTo = new Vector2(rect.x + rect.width, rect.y + rect.height);
                if (this.circleToLine(cPosition, cRadius, edgeFrom, edgeTo))
                    return true;
            }

            return false;
        }

        /**
         * 检查矩形和线段之间是否相交
         * @param rect - 要检查的矩形
         * @param lineFrom - 线段起点
         * @param lineTo - 线段终点
         * @returns 如果相交返回 true，否则返回 false
         */
        public static rectToLine(rect: Rectangle, lineFrom: Vector2, lineTo: Vector2): boolean {
            // 获取起点和终点所在矩形的位置
            const fromSector = this.getSector(rect.x, rect.y, rect.width, rect.height, lineFrom);
            const toSector = this.getSector(rect.x, rect.y, rect.width, rect.height, lineTo);

            // 起点或终点位于矩形内部
            if (fromSector == PointSectors.center || toSector == PointSectors.center) {
                return true;
            }

            // 起点和终点都在矩形外部的同一区域
            if ((fromSector & toSector) != 0) {
                return false;
            }

            // 到这里说明起点和终点分别在矩形的两个不同区域，需要检查线段是否与矩形的边相交

            // 枚举起点和终点所在区域
            const both = fromSector | toSector;

            // 逐条检查矩形的四条边是否与线段相交
            if ((both & PointSectors.top) != 0) {
                if (this.lineToLine(
                    new Vector2(rect.x, rect.y),
                    new Vector2(rect.x + rect.width, rect.y),
                    lineFrom,
                    lineTo
                )) {
                    return true;
                }
            }

            if ((both & PointSectors.bottom) != 0) {
                if (this.lineToLine(
                    new Vector2(rect.x, rect.y + rect.height),
                    new Vector2(rect.x + rect.width, rect.y + rect.height),
                    lineFrom,
                    lineTo
                )) {
                    return true;
                }
            }

            if ((both & PointSectors.left) != 0) {
                if (this.lineToLine(
                    new Vector2(rect.x, rect.y),
                    new Vector2(rect.x, rect.y + rect.height),
                    lineFrom,
                    lineTo
                )) {
                    return true;
                }
            }

            if ((both & PointSectors.right) != 0) {
                if (this.lineToLine(
                    new Vector2(rect.x + rect.width, rect.y),
                    new Vector2(rect.x + rect.width, rect.y + rect.height),
                    lineFrom,
                    lineTo
                )) {
                    return true;
                }
            }

            return false;
        }

        public static rectToPoint(rX: number, rY: number, rW: number, rH: number, point: Vector2) {
            return point.x >= rX && point.y >= rY && point.x < rX + rW && point.y < rY + rH;
        }

        /**
         * 位标志和帮助使用Cohen–Sutherland算法
         *
         * 位标志:
         * 1001 1000 1010
         * 0001 0000 0010
         * 0101 0100 0110
         * @param rX
         * @param rY
         * @param rW
         * @param rH
         * @param point
         */
        public static getSector(rX: number, rY: number, rW: number, rH: number, point: Vector2): PointSectors {
            let sector = PointSectors.center;

            if (point.x < rX)
                sector |= PointSectors.left;
            else if (point.x >= rX + rW)
                sector |= PointSectors.right;

            if (point.y < rY)
                sector |= PointSectors.top;
            else if (point.y >= rY + rH)
                sector |= PointSectors.bottom;

            return sector;
        }
    }
}
