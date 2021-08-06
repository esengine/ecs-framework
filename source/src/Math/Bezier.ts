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
            return p0.scale(oneMinusT * oneMinusT)
                .addEqual(p1.scale(2 * oneMinusT * t))
                .addEqual(p2.scale(t * t));
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
            const oneMinusT = 1 - t;
            return start.scale(oneMinusT * oneMinusT * oneMinusT)
                .addEqual(firstControlPoint.scale(3 * oneMinusT * oneMinusT * t))
                .addEqual(secondControlPoint.scale(3 * oneMinusT * t * t))
                .addEqual(end.scale(t * t * t));
        }

        /**
         * 得到二次贝塞尔函数的一阶导数
         * @param p0
         * @param p1
         * @param p2
         * @param t
         */
        public static getFirstDerivative(p0: Vector2, p1: Vector2, p2: Vector2, t: number) {
            return p1.sub(p0).scale(2 * (1 - t))
                .addEqual(p2.sub(p1).scale(2 * t));
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
            return firstControlPoint.sub(start).scale(3 * oneMunusT * oneMunusT)
                .addEqual(secondControlPoint.sub(firstControlPoint).scale(6 * oneMunusT * t))
                .addEqual(end.sub(secondControlPoint).scale(3 * t * t));
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
            let points = ListPool.obtain<Vector2>(Vector2);
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
            let pt12 = Vector2.divideScaler(start.add(firstCtrlPoint), 2);
            let pt23 = Vector2.divideScaler(firstCtrlPoint.add(secondCtrlPoint), 2);
            let pt34 = Vector2.divideScaler(secondCtrlPoint.add(end), 2);

            // 计算新半直线的中点
            let pt123 = Vector2.divideScaler(pt12.add(pt23), 2);
            let pt234 = Vector2.divideScaler(pt23.add(pt34), 2);

            // 最后再细分最后两个中点。如果我们满足我们的距离公差，这将是我们使用的最后一点。
            let pt1234 = Vector2.divideScaler(pt123.add(pt234), 2);

            // 试着用一条直线来近似整个三次曲线
            let deltaLine = end.sub(start);

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
