module es {
    /**
     * 三角剖分
     */
    export class Triangulator {
        /**
         * 最后一次三角调用中使用的点列表的三角形列表项的索引
         */
        public triangleIndices: number[] = [];

        private _triPrev: number[] = new Array<number>(12);
        private _triNext: number[] = new Array<number>(12);

        public static testPointTriangle(point: Vector2, a: Vector2, b: Vector2, c: Vector2): boolean {
            if (Vector2Ext.cross(Vector2.subtract(point, a), Vector2.subtract(b, a)) < 0)
                return false;

            if (Vector2Ext.cross(Vector2.subtract(point, b), Vector2.subtract(c, b)) < 0)
                return false;

            if (Vector2Ext.cross(Vector2.subtract(point, c), Vector2.subtract(a, c)) < 0)
                return false;

            return true;
        }

        /**
         * 计算一个三角形列表，该列表完全覆盖给定点集所包含的区域。如果点不是CCW，则将arePointsCCW参数传递为false
         * @param points 定义封闭路径的点列表
         * @param arePointsCCW
         */
        public triangulate(points: Vector2[], arePointsCCW: boolean = true) {
            let count = points.length;

            // 设置前一个链接和下一个链接
            this.initialize(count);

            // 非三角的多边形断路器
            let iterations = 0;

            // 从0开始
            let index = 0;

            // 继续移除所有的三角形，直到只剩下一个三角形
            while (count > 3 && iterations < 500) {
                iterations++;

                let isEar = true;
                let a = points[this._triPrev[index]];
                let b = points[index];
                let c = points[this._triNext[index]];

                if (Vector2Ext.isTriangleCCW(a, b, c)) {
                    let k = this._triNext[this._triNext[index]];
                    do {
                        if (Triangulator.testPointTriangle(points[k], a, b, c)) {
                            isEar = false;
                            break;
                        }

                        k = this._triNext[k];
                    } while (k != this._triPrev[index]);
                } else {
                    isEar = false;
                }

                if (isEar) {
                    this.triangleIndices.push(this._triPrev[index]);
                    this.triangleIndices.push(index);
                    this.triangleIndices.push(this._triNext[index]);

                    // 删除vert通过重定向相邻vert的上一个和下一个链接，从而减少vertext计数
                    this._triNext[this._triPrev[index]] = this._triNext[index];
                    this._triPrev[this._triNext[index]] = this._triPrev[index];
                    count--;

                    // 接下来访问前一个vert
                    index = this._triPrev[index];
                } else {
                    index = this._triNext[index];
                }
            }

            this.triangleIndices.push(this._triPrev[index]);
            this.triangleIndices.push(index);
            this.triangleIndices.push(this._triNext[index]);

            if (!arePointsCCW)
                this.triangleIndices.reverse();
        }

        private initialize(count: number) {
            this.triangleIndices.length = 0;

            if (this._triNext.length < count) {
                this._triNext.reverse();
                this._triNext = new Array<number>(Math.max(this._triNext.length * 2, count));
            }
            if (this._triPrev.length < count) {
                this._triPrev.reverse();
                this._triPrev = new Array<number>(Math.max(this._triPrev.length * 2, count));
            }

            for (let i = 0; i < count; i++) {
                this._triPrev[i] = i - 1;
                this._triNext[i] = i + 1;
            }

            this._triPrev[0] = count - 1;
            this._triNext[count - 1] = 0;
        }
    }
}
