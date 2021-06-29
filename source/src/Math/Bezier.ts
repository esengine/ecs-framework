module es {
    /** 
     * 三次方和二次方贝塞尔帮助器(cubic and quadratic bezier helper)
     */
    export class Bezier {
        /**
         * 求解二次曲折线
         * @param p0
         * @param p1
         * @param p2
         * @param t
         */
        public static getPoint(p0: Vector2, p1: Vector2, p2: Vector2, t: number): Vector2 {
            t = MathHelper.clamp01(t);
            let oneMinusT = 1 - t;
            return new Vector2(oneMinusT * oneMinusT).multiply(p0)
                .addEqual(new Vector2(2 * oneMinusT * t).multiply(p1))
                .addEqual(new Vector2(t * t).multiply(p2));
        }

        /**
         * 求解一个立方体曲率
         * @param start 
         * @param firstControlPoint 
         * @param secondControlPoint 
         * @param end
         * @param t 
         */
        public static getPointThree(start: Vector2, firstControlPoint: Vector2, secondControlPoint: Vector2, 
            end: Vector2, t: number): Vector2 {
            t = MathHelper.clamp01(t);
            let oneMinusT = 1 - t;
            return new Vector2(oneMinusT * oneMinusT * oneMinusT).multiply(start)
                .addEqual(new Vector2(3 * oneMinusT * oneMinusT * t).multiply(firstControlPoint))
                .addEqual(new Vector2(3 * oneMinusT * t * t).multiply(secondControlPoint))
                .addEqual(new Vector2(t * t * t).multiply(end));
        }

        /**
         * 得到二次贝塞尔函数的一阶导数
         * @param p0
         * @param p1
         * @param p2
         * @param t
         */
        public static getFirstDerivative(p0: Vector2, p1: Vector2, p2: Vector2, t: number) {
            return new Vector2(2 * (1 - t)).multiply(Vector2.subtract(p1, p0))
                .addEqual(new Vector2(2 * t).multiply(Vector2.subtract(p2, p1)));
        }

        /**
         * 得到一个三次贝塞尔函数的一阶导数
         * @param start
         * @param firstControlPoint
         * @param secondControlPoint
         * @param end
         * @param t
         */
        public static getFirstDerivativeThree(start: Vector2, firstControlPoint: Vector2, secondControlPoint: Vector2,
                                              end: Vector2, t: number) {
            t = MathHelper.clamp01(t);
            let oneMunusT = 1 - t;
            return new Vector2(3 * oneMunusT * oneMunusT).multiply(Vector2.subtract(firstControlPoint, start))
                .addEqual(new Vector2(6 * oneMunusT * t).multiply(Vector2.subtract(secondControlPoint, firstControlPoint)))
                .addEqual(new Vector2(3 * t * t).multiply(Vector2.subtract(end, secondControlPoint)));
        }

        /**
         * 递归地细分bezier曲线，直到满足距离校正
         * 在这种算法中，平面切片的点要比曲面切片少。返回完成后应返回到ListPool的合并列表。
         * @param start
         * @param firstCtrlPoint
         * @param secondCtrlPoint
         * @param end
         * @param distanceTolerance
         */
        public static getOptimizedDrawingPoints(start: Vector2, firstCtrlPoint: Vector2, secondCtrlPoint: Vector2,
                                                end: Vector2, distanceTolerance: number = 1) {
            let points = ListPool.obtain<Vector2>();
            points.push(start);
            this.recursiveGetOptimizedDrawingPoints(start, firstCtrlPoint, secondCtrlPoint, end, points, distanceTolerance);
            points.push(end);

            return points;
        }

        /**
         * 递归地细分bezier曲线，直到满足距离校正。在这种算法中，平面切片的点要比曲面切片少。
         * @param start
         * @param firstCtrlPoint
         * @param secondCtrlPoint
         * @param end
         * @param points
         * @param distanceTolerance
         */
        private static recursiveGetOptimizedDrawingPoints(start: Vector2, firstCtrlPoint: Vector2, secondCtrlPoint: Vector2,
                                                          end: Vector2, points: Vector2[], distanceTolerance: number) {
            // 计算线段的所有中点
            let pt12 = Vector2.divideScaler(Vector2.add(start, firstCtrlPoint), 2);
            let pt23 = Vector2.divideScaler(Vector2.add(firstCtrlPoint, secondCtrlPoint), 2);
            let pt34 = Vector2.divideScaler(Vector2.add(secondCtrlPoint, end), 2);

            // 计算新半直线的中点
            let pt123 = Vector2.divideScaler(Vector2.add(pt12, pt23), 2);
            let pt234 = Vector2.divideScaler(Vector2.add(pt23, pt34), 2);

            // 最后再细分最后两个中点。如果我们满足我们的距离公差，这将是我们使用的最后一点。
            let pt1234 = Vector2.divideScaler(Vector2.add(pt123, pt234), 2);

            // 试着用一条直线来近似整个三次曲线
            let deltaLine = Vector2.subtract(end, start);

            let d2 = Math.abs(((firstCtrlPoint.x, end.x) * deltaLine.y - (firstCtrlPoint.y - end.y) * deltaLine.x));
            let d3 = Math.abs(((secondCtrlPoint.x - end.x) * deltaLine.y - (secondCtrlPoint.y - end.y) * deltaLine.x));

            if ((d2 + d3) * (d2 + d3) < distanceTolerance * (deltaLine.x * deltaLine.x + deltaLine.y * deltaLine.y)) {
                points.push(pt1234);
                return;
            }

            // 继续细分
            this.recursiveGetOptimizedDrawingPoints(start, pt12, pt123, pt1234, points, distanceTolerance);
            this.recursiveGetOptimizedDrawingPoints(pt1234, pt234, pt34, end, points, distanceTolerance);
        }
    }
}
