module es {
    export class Rectangle extends egret.Rectangle {
        /**
         * 获取矩形的最大点，即右下角
         */
        public get max() {
            return new Vector2(this.right, this.bottom);
        }

        /** 中心点坐标 */
        public get center() {
            return new Vector2(this.x + (this.width / 2), this.y + (this.height / 2));
        }

        /** 左上角的坐标 */
        public get location() {
            return new Vector2(this.x, this.y);
        }
        /** 左上角的坐标 */
        public set location(value: Vector2) {
            this.x = value.x;
            this.y = value.y;
        }

        public get size() {
            return new Vector2(this.width, this.height);
        }

        public set size(value: Vector2) {
            this.width = value.x;
            this.height = value.y;
        }

        /**
         * 是否与另一个矩形相交
         * @param value
         */
        public intersects(value: egret.Rectangle) {
            return value.left < this.right &&
                this.left < value.right &&
                value.top < this.bottom &&
                this.top < value.bottom;
        }

        /**
         * 获取所提供的矩形是否在此矩形的边界内
         * @param value
         */
        public containsRect(value: Rectangle) {
            return ((((this.x <= value.x) && (value.x < (this.x + this.width))) &&
                (this.y <= value.y)) &&
                (value.y < (this.y + this.height)));
        }

        public getHalfSize() {
            return new Vector2(this.width * 0.5, this.height * 0.5);
        }

        /**
         * 创建一个矩形的最小/最大点(左上角，右下角的点)
         * @param minX
         * @param minY
         * @param maxX
         * @param maxY
         */
        public static fromMinMax(minX: number, minY: number, maxX: number, maxY: number) {
            return new Rectangle(minX, minY, maxX - minX, maxY - minY);
        }

        /**
         * 获取矩形边界上与给定点最近的点
         * @param point
         * @param edgeNormal
         */
        public getClosestPointOnRectangleBorderToPoint(point: Vector2, edgeNormal: Vector2): Vector2 {
            edgeNormal = Vector2.zero;

            // 对于每个轴，如果点在盒子外面
            let res = new Vector2();
            res.x = MathHelper.clamp(point.x, this.left, this.right);
            res.y = MathHelper.clamp(point.y, this.top, this.bottom);

            // 如果点在矩形内，我们需要推res到边界，因为它将在矩形内
            if (this.contains(res.x, res.y)) {
                let dl = res.x - this.left;
                let dr = this.right - res.x;
                let dt = res.y - this.top;
                let db = this.bottom - res.y;

                let min = Math.min(dl, dr, dt, db);
                if (min == dt) {
                    res.y = this.top;
                    edgeNormal.y = -1;
                } else if (min == db) {
                    res.y = this.bottom;
                    edgeNormal.y = 1;
                } else if (min == dl) {
                    res.x = this.left;
                    edgeNormal.x = -1;
                } else {
                    res.x = this.right;
                    edgeNormal.x = 1;
                }
            } else {
                if (res.x == this.left) edgeNormal.x = -1;
                if (res.x == this.right) edgeNormal.x = 1;
                if (res.y == this.top) edgeNormal.y = -1;
                if (res.y == this.bottom) edgeNormal.y = 1;
            }

            return res;
        }

        /**
         *
         */
        public getClosestPointOnBoundsToOrigin() {
            let max = this.max;
            let minDist = Math.abs(this.location.x);
            let boundsPoint = new Vector2(this.location.x, 0);

            if (Math.abs(max.x) < minDist) {
                minDist = Math.abs(max.x);
                boundsPoint.x = max.x;
                boundsPoint.y = 0;
            }

            if (Math.abs(max.y) < minDist) {
                minDist = Math.abs(max.y);
                boundsPoint.x = 0;
                boundsPoint.y = max.y;
            }

            if (Math.abs(this.location.y) < minDist) {
                minDist = Math.abs(this.location.y);
                boundsPoint.x = 0;
                boundsPoint.y = this.location.y;
            }

            return boundsPoint;
        }

        public calculateBounds(parentPosition: Vector2, position: Vector2, origin: Vector2, scale: Vector2, rotation: number, width: number, height: number){
            this.x = parentPosition.x + position.x - origin.x * scale.x;
            this.y = parentPosition.y + position.y - origin.y * scale.y;
            this.width = width * scale.x;
            this.height = height * scale.y;
        }

        /**
         * 将egret矩形转化为Rectangle
         * @param rect
         */
        public setEgretRect(rect: egret.Rectangle): Rectangle{
            this.x = rect.x;
            this.y = rect.y;
            this.width = rect.width;
            this.height = rect.height;
            return this;
        }

        /**
         * 给定多边形的点，计算边界
         * @param points
         */
        public static rectEncompassingPoints(points: Vector2[]) {
            // 我们需要求出x/y的最小值/最大值
            let minX = Number.POSITIVE_INFINITY;
            let minY = Number.POSITIVE_INFINITY;
            let maxX = Number.NEGATIVE_INFINITY;
            let maxY = Number.NEGATIVE_INFINITY;

            for (let i = 0; i < points.length; i++) {
                let pt = points[i];

                if (pt.x < minX) minX = pt.x;
                if (pt.x > maxX) maxX = pt.x;

                if (pt.y < minY) minY = pt.y;
                if (pt.y > maxY) maxY = pt.y;
            }

            return this.fromMinMax(minX, minY, maxX, maxY);
        }
    }
}
