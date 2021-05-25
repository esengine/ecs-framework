module es {
    export class Rectangle implements IEquatable<Rectangle> {
        /**
         * 该矩形的左上角的x坐标
         */
        public x: number = 0;

        /**
         * 该矩形的左上角的y坐标
         */
        public y: number = 0;

        /**
         * 该矩形的宽度
         */
        public width: number = 0;

        /**
         * 该矩形的高度
         */
        public height: number = 0;

        /**
         * 返回X=0, Y=0, Width=0, Height=0的矩形
         */
        public static get empty(): Rectangle {
            return new Rectangle();
        }

        /**
         * 返回一个Number.Min/Max值的矩形
         */
        public static get maxRect(): Rectangle {
            return new Rectangle(Number.MIN_VALUE / 2, Number.MIN_VALUE / 2, Number.MAX_VALUE, Number.MAX_VALUE);
        }

        /**
         * 返回此矩形左边缘的X坐标
         */
        public get left(): number {
            return this.x;
        }

        /**
         * 返回此矩形右边缘的X坐标
         */
        public get right(): number {
            return this.x + this.width;
        }

        /**
         * 返回此矩形顶边的y坐标
         */
        public get top(): number {
            return this.y;
        }

        /**
         * 返回此矩形底边的y坐标
         */
        public get bottom(): number {
            return this.y + this.height;
        }

        /**
         * 获取矩形的最大点，即右下角
         */
        public get max() {
            return new Vector2(this.right, this.bottom);
        }

        /**
         * 这个矩形的宽和高是否为0，位置是否为（0，0）
         */
        public isEmpty(): boolean {
            return ((((this.width == 0) && (this.height == 0)) && (this.x == 0)) && (this.y == 0));
        }

        /** 这个矩形的左上角坐标 */
        public get location() {
            return new Vector2(this.x, this.y);
        }

        public set location(value: Vector2) {
            this.x = value.x;
            this.y = value.y;
        }

        /**
         * 这个矩形的宽-高坐标
         */
        public get size() {
            return new Vector2(this.width, this.height);
        }

        public set size(value: Vector2) {
            this.width = value.x;
            this.height = value.y;
        }

        /** 
         * 位于这个矩形中心的一个点
         * 如果 "宽度 "或 "高度 "是奇数，则中心点将向下舍入
         */
        public get center() {
            return new Vector2(this.x + (this.width / 2), this.y + (this.height / 2));
        }

        // temp 用于计算边界的矩阵
        public _tempMat: Matrix2D;
        public _transformMat: Matrix2D;

        /**
         * 创建一个新的Rectanglestruct实例，指定位置、宽度和高度。
         * @param x 创建的矩形的左上角的X坐标
         * @param y 创建的矩形的左上角的y坐标
         * @param width 创建的矩形的宽度
         * @param height 创建的矩形的高度
         */
        constructor(x: number = 0, y: number = 0, width: number = 0, height: number = 0) {
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
        }


        /**
         * 创建一个给定最小/最大点（左上角，右下角）的矩形
         * @param minX
         * @param minY
         * @param maxX
         * @param maxY
         */
        public static fromMinMax(minX: number, minY: number, maxX: number, maxY: number) {
            return new Rectangle(minX, minY, maxX - minX, maxY - minY);
        }

        /**
         * 给定多边形的点，计算边界
         * @param points
         * @returns 来自多边形的点
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

        /**
         * 获取指定边缘的位置
         * @param edge 
         */
        public getSide(edge: Edge) {
            switch (edge) {
                case Edge.top:
                    return this.top;
                case Edge.bottom:
                    return this.bottom;
                case Edge.left:
                    return this.left;
                case Edge.right:
                    return this.right;
                default:
                    throw new Error("Argument Out Of Range");
            }
        }

        /**
         * 获取所提供的坐标是否在这个矩形的范围内
         * @param x 检查封堵点的X坐标
         * @param y 检查封堵点的Y坐标
         */
        public contains(x: number, y: number): boolean {
            return ((((this.x <= x) && (x < (this.x + this.width))) &&
                (this.y <= y)) && (y < (this.y + this.height)));
        }

        /**
         * 按指定的水平和垂直方向调整此矩形的边缘
         * @param horizontalAmount 调整左、右边缘的值
         * @param verticalAmount 调整上、下边缘的值
         */
        public inflate(horizontalAmount: number, verticalAmount: number) {
            this.x -= horizontalAmount;
            this.y -= verticalAmount;
            this.width += horizontalAmount * 2;
            this.height += verticalAmount * 2;
        }

        /**
         * 获取其他矩形是否与这个矩形相交
         * @param value 另一个用于测试的矩形
         */
        public intersects(value: Rectangle) {
            return value.left < this.right &&
                this.left < value.right &&
                value.top < this.bottom &&
                this.top < value.bottom;
        }

        public rayIntersects(ray: Ray2D, distance: Ref<number>): boolean {
            distance.value = 0;
            let maxValue = Number.MAX_VALUE;

            if (Math.abs(ray.direction.x) < 1E-06) {
                if ((ray.start.x < this.x) || (ray.start.x > this.x + this.width))
                    return false;
            } else {
                let num11 = 1 / ray.direction.x;
                let num8 = (this.x - ray.start.x) * num11;
                let num7 = (this.x + this.width - ray.start.x) * num11;
                if (num8 > num7) {
                    let num14 = num8;
                    num8 = num7;
                    num7 = num14;
                }

                distance.value = Math.max(num8, distance.value);
                maxValue = Math.min(num7, maxValue);
                if (distance.value > maxValue)
                    return false;
            }

            if (Math.abs(ray.direction.y) < 1E-06) {
                if ((ray.start.y < this.y) || (ray.start.y > this.y + this.height))
                    return false;
            } else {
                let num10 = 1 / ray.direction.y;
                let num6 = (this.y - ray.start.y) * num10;
                let num5 = (this.y + this.height - ray.start.y) * num10;
                if (num6 > num5) {
                    let num13 = num6;
                    num6 = num5;
                    num5 = num13;
                }

                distance.value = Math.max(num6, distance.value);
                maxValue = Math.max(num5, maxValue);
                if (distance.value > maxValue)
                    return false;
            }

            return true;
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

        /**
         * 返回离给定点最近的点
         * @param point 矩形上离点最近的点
         */
        public getClosestPointOnRectangleToPoint(point: Vector2) {
            // 对于每条轴，如果点在框外，就把它限制在框内，否则就不要管它
            let res = es.Vector2.zero;
            res.x = MathHelper.clamp(point.x, this.left, this.right);
            res.y = MathHelper.clamp(point.y, this.top, this.bottom);

            return res;
        }

        /**
         * 获取矩形边界上与给定点最近的点
         * @param point
         * @param edgeNormal
         * @returns 矩形边框上离点最近的点
         */
        public getClosestPointOnRectangleBorderToPoint(point: Vector2, edgeNormal: Vector2): Vector2 {
            // 对于每条轴，如果点在框外，就把它限制在框内，否则就不要管它
            let res = es.Vector2.zero;
            res.x = MathHelper.clamp(point.x, this.left, this.right);
            res.y = MathHelper.clamp(point.y, this.top, this.bottom);

            // 如果点在矩形内，我们需要将res推到边界上，因为它将在矩形内
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
         * 创建一个新的RectangleF，该RectangleF包含两个其他矩形的重叠区域
         * @param value1 
         * @param value2 
         * @returns 将两个矩形的重叠区域作为输出参数
         */
        public static intersect(value1: Rectangle, value2: Rectangle) {
            if (value1.intersects(value2)) {
                let right_side = Math.min(value1.x + value1.width, value2.x + value2.width);
                let left_side = Math.max(value1.x, value2.x);
                let top_side = Math.max(value1.y, value2.y);
                let bottom_side = Math.min(value1.y + value1.height, value2.y + value2.height);
                return new Rectangle(left_side, top_side, right_side - left_side, bottom_side - top_side);
            } else {
                return new Rectangle(0, 0, 0, 0);
            }
        }

        /**
         * 改变这个矩形的位置
         * @param offsetX 要添加到这个矩形的X坐标
         * @param offsetY 要添加到这个矩形的y坐标
         */
        public offset(offsetX: number, offsetY: number) {
            this.x += offsetX;
            this.y += offsetY;
        }

        /**
         * 创建一个完全包含两个其他矩形的新矩形
         * @param value1 
         * @param value2 
         */
        public static union(value1: Rectangle, value2: Rectangle) {
            let x = Math.min(value1.x, value2.x);
            let y = Math.min(value1.y, value2.y);
            return new Rectangle(x, y,
                Math.max(value1.right, value2.right) - x,
                Math.max(value1.bottom, value2.bottom) - y);
        }

        /**
         * 在矩形重叠的地方创建一个新的矩形
         * @param value1 
         * @param value2 
         */
        public static overlap(value1: Rectangle, value2: Rectangle): Rectangle {
            let x = Math.max(value1.x, value2.x, 0);
            let y = Math.max(value1.y, value2.y, 0);
            return new Rectangle(x, y,
                Math.max(Math.min(value1.right, value2.right) - x, 0),
                Math.max(Math.min(value1.bottom, value2.bottom) - y, 0));
        }

        public calculateBounds(parentPosition: Vector2, position: Vector2, origin: Vector2, scale: Vector2,
            rotation: number, width: number, height: number) {
            if (rotation == 0) {
                this.x = Math.trunc(parentPosition.x + position.x - origin.x * scale.x);
                this.y = Math.trunc(parentPosition.y + position.y - origin.y * scale.y);
                this.width = Math.trunc(width * scale.x);
                this.height = Math.trunc(height * scale.y);
            } else {
                // 我们需要找到我们的绝对最小/最大值，并据此创建边界
                let worldPosX = parentPosition.x + position.x;
                let worldPosY = parentPosition.y + position.y;

                // 考虑到原点，将参考点设置为世界参考
                this._transformMat = Matrix2D.createTranslation(-worldPosX - origin.x, -worldPosY - origin.y);
                this._tempMat = Matrix2D.createScale(scale.x, scale.y);
                this._transformMat = this._transformMat.multiply(this._tempMat);
                this._tempMat = Matrix2D.createRotation(rotation);
                this._transformMat = this._transformMat.multiply(this._tempMat);
                this._tempMat = Matrix2D.createTranslation(worldPosX, worldPosY);
                this._transformMat = this._transformMat.multiply(this._tempMat);

                // TODO: 我们可以把世界变换留在矩阵中，避免在世界空间中得到所有的四个角
                let topLeft = new Vector2(worldPosX, worldPosY);
                let topRight = new Vector2(worldPosX + width, worldPosY);
                let bottomLeft = new Vector2(worldPosX, worldPosY + height);
                let bottomRight = new Vector2(worldPosX + width, worldPosY + height);

                Vector2Ext.transformR(topLeft, this._transformMat, topLeft);
                Vector2Ext.transformR(topRight, this._transformMat, topRight);
                Vector2Ext.transformR(bottomLeft, this._transformMat, bottomLeft);
                Vector2Ext.transformR(bottomRight, this._transformMat, bottomRight);

                // 找出最小值和最大值，这样我们就可以计算出我们的边界框。
                let minX = Math.trunc(Math.min(topLeft.x, bottomRight.x, topRight.x, bottomLeft.x));
                let maxX = Math.trunc(Math.max(topLeft.x, bottomRight.x, topRight.x, bottomLeft.x));
                let minY = Math.trunc(Math.min(topLeft.y, bottomRight.y, topRight.y, bottomLeft.y));
                let maxY = Math.trunc(Math.max(topLeft.y, bottomRight.y, topRight.y, bottomLeft.y));

                this.location = new Vector2(minX, minY);
                this.width = Math.trunc(maxX - minX);
                this.height = Math.trunc(maxY - minY);
            }
        }

        /**
         * 返回一个横跨当前矩形和提供的三角形位置的矩形
         * @param deltaX 
         * @param deltaY 
         */
        public getSweptBroadphaseBounds(deltaX: number, deltaY: number){
            let broadphasebox = Rectangle.empty;

            broadphasebox.x = deltaX > 0 ? this.x : this.x + deltaX;
            broadphasebox.y = deltaY > 0 ? this.y : this.y + deltaY;
            broadphasebox.width = deltaX > 0 ? deltaX + this.width : this.width - deltaX;
            broadphasebox.height = deltaY > 0 ? deltaY + this.height : this.height - deltaY;

            return broadphasebox;
        }

        /**
         * 如果发生碰撞，返回true 
         * moveX和moveY将返回b1为避免碰撞而必须移动的移动量
         * @param other 
         * @param moveX 
         * @param moveY 
         */
        public collisionCheck(other: Rectangle, moveX: Ref<number>, moveY: Ref<number>){
            moveX.value = moveY.value = 0;

            let l = other.x - (this.x + this.width);
            let r = (other.x + other.width) - this.x;
            let t = (other.y - (this.y + this.height));
            let b = (other.y + other.height) - this.y;

            // 检验是否有碰撞
            if (l > 0 || r < 0 || t > 0 || b < 0)
                return false;

            // 求两边的偏移量
            moveX.value = Math.abs(l) < r ? l : r;
            moveY.value = Math.abs(t) < b ? t : b;

            // 只使用最小的偏移量
            if (Math.abs(moveX.value) < Math.abs(moveY.value))
                moveY.value = 0;
            else
                moveX.value = 0;

            return true;
        }

        /**
         * 计算两个矩形之间有符号的交点深度
         * @param rectA 
         * @param rectB 
         * @returns 两个相交的矩形之间的重叠量。
         * 这些深度值可以是负值，取决于矩形/相交的哪些边。
         * 这允许调用者确定正确的推送对象的方向，以解决碰撞问题。
         * 如果矩形不相交，则返回Vector2.Zero
         */
        public static getIntersectionDepth(rectA: Rectangle, rectB: Rectangle): Vector2 {
            // 计算半尺寸
            let halfWidthA = rectA.width / 2;
            let halfHeightA = rectA.height / 2;
            let halfWidthB = rectB.width / 2;
            let halfHeightB = rectB.height / 2;

            // 计算中心
            let centerA = new Vector2(rectA.left + halfWidthA, rectA.top + halfHeightA);
            let centerB = new Vector2(rectB.left + halfWidthB, rectB.top + halfHeightB);

            // 计算当前中心间的距离和最小非相交距离
            let distanceX = centerA.x - centerB.x;
            let distanceY = centerA.y - centerB.y;
            let minDistanceX = halfWidthA + halfWidthB;
            let minDistanceY = halfHeightA + halfHeightB;

            // 如果我们根本不相交，则返回(0，0)
            if (Math.abs(distanceX) >= minDistanceX || Math.abs(distanceY) >= minDistanceY)
                return Vector2.zero;

            // 计算并返回交叉点深度
            let depthX = distanceX > 0 ? minDistanceX - distanceX : -minDistanceX - distanceX;
            let depthY = distanceY > 0 ? minDistanceY - distanceY : -minDistanceY - distanceY;

            return new Vector2(depthX, depthY);
        }

        /**
         * 比较当前实例是否等于指定的矩形
         * @param other 
         */
        public equals(other: Rectangle) {
            return this === other;
        }

        /**
         * 获取这个矩形的哈希码
         */
        public getHashCode(): number{
            return (Math.trunc(this.x) ^ Math.trunc(this.y) ^ Math.trunc(this.width) ^ Math.trunc(this.height));
        }

        public clone(): Rectangle {
            return new Rectangle(this.x, this.y, this.width, this.height);
        }
    }
}
