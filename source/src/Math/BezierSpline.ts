module es {
    /**
     * 提供了一系列立方贝塞尔点，并提供了帮助方法来访问贝塞尔
     */
    export class BezierSpline {
        public _points: Vector2[] = [];
        public _curveCount: number = 0;

        /**
         * 在这个过程中，t被修改为在曲线段的范围内。
         * @param t 
         */
        public pointIndexAtTime(t: Ref<number>): number {
            let i = 0;
            if (t.value >= 1) {
                t.value = 1;
                i = this._points.length - 4;
            } else {
                t.value = MathHelper.clamp01(t.value) * this._curveCount;
                i = ~~t;
                t.value -= i;
                i *= 3;
            }

            return i;
        }

        /**
         * 设置一个控制点，考虑到这是否是一个共享点，如果是，则适当调整
         * @param index 
         * @param point 
         */
        public setControlPoint(index: number, point: Vector2) {
            if (index % 3 == 0) {
                let delta = Vector2.subtract(point, this._points[index]);
                if (index > 0)
                    this._points[index - 1].addEqual(delta);
                
                if (index + 1 < this._points.length)
                    this._points[index + 1].addEqual(delta);
            }

            this._points[index] = point;
        }

        /**
         * 得到时间t的贝塞尔曲线上的点
         * @param t 
         */
        public getPointAtTime(t: number): Vector2{
            let i = this.pointIndexAtTime(new Ref(t));
            return Bezier.getPointThree(this._points[i], this._points[i + 1], this._points[i + 2],
                    this._points[i + 3], t);
        }

        /**
         * 得到贝塞尔在时间t的速度（第一导数）
         * @param t 
         */
        public getVelocityAtTime(t: number): Vector2 {
            let i = this.pointIndexAtTime(new Ref(t));
            return Bezier.getFirstDerivativeThree(this._points[i], this._points[i + 1], this._points[i + 2],
                this._points[i + 3], t);
        }

        /**
         * 得到时间t时贝塞尔的方向（归一化第一导数）
         * @param t 
         */
        public getDirectionAtTime(t: number) {
            return Vector2.normalize(this.getVelocityAtTime(t));
        }

        /**
         * 在贝塞尔曲线上添加一条曲线
         * @param start 
         * @param firstControlPoint 
         * @param secondControlPoint 
         * @param end 
         */
        public addCurve(start: Vector2, firstControlPoint: Vector2, secondControlPoint: Vector2, end: Vector2) {
            // 只有当这是第一条曲线时，我们才会添加起始点。对于其他所有的曲线，前一个曲线的终点应该等于新曲线的起点。
            if (this._points.length == 0)
                this._points.push(start);
            
            this._points.push(firstControlPoint);
            this._points.push(secondControlPoint);
            this._points.push(end);

            this._curveCount = (this._points.length - 1) / 3;
        }

        /**
         * 重置bezier，移除所有点
         */
        public reset() {
            this._points.length = 0;
        }

        /**
         * 将splitine分解成totalSegments部分，并返回使用线条绘制所需的所有点
         * @param totalSegments 
         */
        public getDrawingPoints(totalSegments: number): Vector2[] {
            let points: Vector2[] = [];
            for (let i = 0; i < totalSegments; i ++) {
                let t = i / totalSegments;
                points[i] = this.getPointAtTime(t);
            }

            return points;
        }
    }
}