module es {
    /** 2d 向量 */
    export class Vector2 implements IEquatable<Vector2> {
        public x: number = 0;
        public y: number = 0;

        /**
         * 从两个值构造一个带有X和Y的二维向量。
         * @param x 二维空间中的x坐标
         * @param y 二维空间的y坐标
         */
        constructor(x: number = 0, y: number = 0) {
            this.x = x;
            this.y = y;
        }

        public static get zero() {
            return new Vector2(0, 0);
        }

        public static get one() {
            return new Vector2(1, 1);
        }

        public static get unitX() {
            return new Vector2(1, 0);
        }

        public static get unitY() {
            return new Vector2(0, 1);
        }

        public static get up() {
            return new Vector2(0, -1);
        }

        public static get down() {
            return new Vector2(0, 1);
        }

        public static get left() {
            return new Vector2(-1, 0);
        }

        public static get right() {
            return new Vector2(1, 0);
        }

        /**
         *
         * @param value1
         * @param value2
         */
        public static add(value1: Vector2, value2: Vector2) {
            let result: Vector2 = Vector2.zero;
            result.x = value1.x + value2.x;
            result.y = value1.y + value2.y;
            return result;
        }

        /**
         *
         * @param value1
         * @param value2
         */
        public static divide(value1: Vector2, value2: Vector2) {
            let result: Vector2 = Vector2.zero;
            result.x = value1.x / value2.x;
            result.y = value1.y / value2.y;
            return result;
        }

        public static divideScaler(value1: Vector2, value2: number) {
            let result: Vector2 = Vector2.zero;
            result.x = value1.x / value2;
            result.y = value1.y / value2;
            return result;
        }

        /**
         * 返回两个向量之间距离的平方
         * @param value1
         * @param value2
         */
        public static sqrDistance(value1: Vector2, value2: Vector2) {
            return Math.pow(value1.x - value2.x, 2) + Math.pow(value1.y - value2.y, 2);
        }

        /**
         * 将指定的值限制在一个范围内
         * @param value1
         * @param min
         * @param max
         */
        public static clamp(value1: Vector2, min: Vector2, max: Vector2) {
            return new Vector2(MathHelper.clamp(value1.x, min.x, max.x),
                MathHelper.clamp(value1.y, min.y, max.y));
        }

        /**
         * 创建一个新的Vector2，其中包含指定向量的线性插值
         * @param value1 第一个向量
         * @param value2 第二个向量
         * @param amount 加权值(0.0-1.0之间)
         * @returns 指定向量的线性插值结果
         */
        public static lerp(value1: Vector2, value2: Vector2, amount: number) {
            return new Vector2(MathHelper.lerp(value1.x, value2.x, amount), MathHelper.lerp(value1.y, value2.y, amount));
        }

        /**
         * 创建一个新的Vector2，其中包含指定矢量的线性插值
         * @param value1 
         * @param value2 
         * @param amount 
         * @returns 
         */
        public static lerpPrecise(value1: Vector2, value2: Vector2, amount: number) {
            return new Vector2(MathHelper.lerpPrecise(value1.x, value2.x, amount),
                MathHelper.lerpPrecise(value1.y, value2.y, amount));
        }

        /**
         * 创建一个新的Vector2，该Vector2包含了通过指定的Matrix进行的二维向量变换。
         * @param position
         * @param matrix
         */
        public static transform(position: Vector2, matrix: Matrix2D) {
            return new Vector2((position.x * matrix.m11) + (position.y * matrix.m21) + matrix.m31,
                (position.x * matrix.m12) + (position.y * matrix.m22) + matrix.m32);
        }

        /**
         * 创建一个新的Vector2，其中包含由指定的Matrix转换的指定法线
         * @param normal 
         * @param matrix 
         */
        public static transformNormal(normal: Vector2, matrix: Matrix) {
            return new Vector2((normal.x * matrix.m11) + (normal.y * matrix.m21),
                (normal.x * matrix.m12) + (normal.y * matrix.m22));
        }

        /**
         * 返回两个向量之间的距离
         * @param value1
         * @param value2
         * @returns 两个向量之间的距离
         */
        public static distance(vec1: Vector2, vec2: Vector2): number {
            return Math.sqrt(Math.pow(vec1.x - vec2.x, 2) + Math.pow(vec1.y - vec2.y, 2));
        }

        /**
         * 返回两个向量之间的角度，单位是度数
         * @param from
         * @param to
         */
        public static angle(from: Vector2, to: Vector2): number {
            from = from.normalize();
            to = to.normalize();
            return Math.acos(MathHelper.clamp(from.dot(to), -1, 1)) * MathHelper.Rad2Deg;
        }

        /**
         * 创建一个包含指定向量反转的新Vector2
         * @param value
         * @returns 矢量反演的结果
         */
        public static negate(value: Vector2) {
            value.x = -value.x;
            value.y = -value.y;

            return value;
        }

        /**
         * 创建一个新的Vector2，其中包含给定矢量和法线的反射矢量
         * @param vector 
         * @param normal 
         * @returns 
         */
        public static reflect(vector: Vector2, normal: Vector2) {
            let result: Vector2 = es.Vector2.zero;
            let val = 2 * ((vector.x * normal.x) + (vector.y * normal.y));
            result.x = vector.x - (normal.x * val);
            result.y = vector.y - (normal.y * val);
            return result;
        }

        /**
         * 创建一个新的Vector2，其中包含指定矢量的三次插值
         * @param value1 
         * @param value2 
         * @param amount 
         * @returns 
         */
        public static smoothStep(value1: Vector2, value2: Vector2, amount: number) {
            return new Vector2(MathHelper.smoothStep(value1.x, value2.x, amount),
                MathHelper.smoothStep(value1.y, value2.y, amount));
        }

        public setTo(x: number, y: number) {
            this.x = x;
            this.y = y;
        }

        public negate(): Vector2 {
            return this.scale(-1);
        }

        /**
         *
         * @param value
         */
        public add(v: Vector2): Vector2 {
            return new Vector2(this.x + v.x, this.y + v.y);
        }

        public addEqual(v: Vector2): Vector2 {
            this.x += v.x;
            this.y += v.y;
            return this;
        }

        /**
         *
         * @param value
         */
        public divide(value: Vector2): Vector2 {
            return new Vector2(this.x / value.x, this.y / value.y);
        }

        public divideScaler(value: number): Vector2 {
            return new Vector2(this.x / value, this.y / value);
        }

        /**
         *
         * @param value
         */
        public multiply(value: Vector2): Vector2 {
            return new Vector2(value.x * this.x, value.y * this.y);
        }

        /**
         * 
         * @param value 
         * @returns 
         */
        public multiplyScaler(value: number): Vector2 {
            this.x *= value;
            this.y *= value;
            return this;
        }

        /**
         * 从当前Vector2减去一个Vector2
         * @param value 要减去的Vector2
         * @returns 当前Vector2
         */
        public sub(value: Vector2) {
            return new Vector2(this.x - value.x, this.y - value.y);
        }

        public subEqual(v: Vector2): Vector2 {
            this.x -= v.x;
            this.y -= v.y;
            return this;
        }

        public dot(v: Vector2): number {
            return this.x * v.x + this.y * v.y;
        }

        /**
         * 
         * @param size 
         * @returns 
         */
        public scale(size: number): Vector2 {
            return new Vector2(this.x * size, this.y * size);
        }

        public scaleEqual(size: number): Vector2 {
            this.x *= size;
            this.y *= size;
            return this;
        }

        public transform(matrix: Matrix2D): Vector2 {
            return new Vector2(
              this.x * matrix.m11 + this.y * matrix.m21 + matrix.m31,
              this.x * matrix.m12 + this.y * matrix.m22 + matrix.m32
            );
          }

        public normalize(): Vector2 {
            const d = this.distance();
            if (d > 0) {
                return new Vector2(this.x / d, this.y / d);
            } else {
                return new Vector2(0, 1);
            }
        }

        /** 
         * 将这个Vector2变成一个方向相同的单位向量
         */
        public normalizeEqual(): Vector2 {
            const d = this.distance();
            if (d > 0) {
                this.setTo(this.x / d, this.y / d);
                return this;
            } else {
                this.setTo(0, 1);
                return this;
            }
        }

        public magnitude(): number {
            return this.distance();
        }

        public distance(v?: Vector2): number {
            if (!v) {
                v = Vector2.zero;
            }

            return Math.sqrt(Math.pow(this.x - v.x, 2) + Math.pow(this.y - v.y, 2));
        }

        /**
         * 返回该Vector2的平方长度
         * @returns 这个Vector2的平方长度
         */
        public lengthSquared(): number {
            return (this.x * this.x) + (this.y * this.y);
        }

        /** 
         * 四舍五入X和Y值
         */
        public round(): Vector2 {
            return new Vector2(Math.round(this.x), Math.round(this.y));
        }

        /**
         * 返回以自己为中心点的左右角，单位为度
         * @param left 
         * @param right 
         */
        public angleBetween(left: Vector2, right: Vector2) {
            let one = left.sub(this);
            let two = right.sub(this);
            return Vector2Ext.angle(one, two);
        }

        /**
         * 比较当前实例是否等于指定的对象
         * @param other 要比较的对象
         * @returns 如果实例相同true 否则false 
         */
        public equals(other: Vector2, tolerance: number = 0.001): boolean {
            return Math.abs(this.x - other.x) <= tolerance && Math.abs(this.y - other.y) <= tolerance;
        }

        public isValid(): boolean {
            return MathHelper.isValid(this.x) && MathHelper.isValid(this.y);
        }

        /**
         * 创建一个新的Vector2，其中包含来自两个向量的最小值
         * @param value1 
         * @param value2 
         * @returns 
         */
        public static min(value1: Vector2, value2: Vector2) {
            return new Vector2(value1.x < value2.x ? value1.x : value2.x,
                value1.y < value2.y ? value1.y : value2.y);
        }

        /**
         * 创建一个新的Vector2，其中包含两个向量的最大值
         * @param value1 
         * @param value2 
         * @returns 
         */
        public static max(value1: Vector2, value2: Vector2) {
            return new Vector2(value1.x > value2.x ? value1.x : value2.x,
                value1.y > value2.y ? value1.y : value2.y);
        }

        /**
         * 创建一个新的Vector2，其中包含Hermite样条插值
         * @param value1 
         * @param tangent1 
         * @param value2 
         * @param tangent2 
         * @param amount 
         * @returns 
         */
        public static hermite(value1: Vector2, tangent1: Vector2, value2: Vector2, tangent2: Vector2, amount: number) {
            return new Vector2(MathHelper.hermite(value1.x, tangent1.x, value2.x, tangent2.x, amount),
                MathHelper.hermite(value1.y, tangent1.y, value2.y, tangent2.y, amount));
        }

        public static unsignedAngle(from: Vector2, to: Vector2, round: boolean = true) {
            from.normalizeEqual();
            to.normalizeEqual();
            const angle =
                Math.acos(MathHelper.clamp(from.dot(to), -1, 1)) * MathHelper.Rad2Deg;
            return round ? Math.round(angle) : angle;
        }


        public clone(): Vector2 {
            return new Vector2(this.x, this.y);
        }
    }
}
