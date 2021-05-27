module es {
    /**
     * 表示右手3 * 3的浮点矩阵，可以存储平移、缩放和旋转信息。
     */
    export class Matrix2D implements IEquatable<Matrix2D> {
        public m11: number = 0; // x 缩放
        public m12: number = 0;

        public m21: number = 0;
        public m22: number = 0;

        public m31: number = 0;
        public m32: number = 0;

        /**
         * 返回标识矩阵
         */
        public static get identity(): Matrix2D {
            return new Matrix2D(1, 0, 0, 1, 0, 0);
        }

        /**
         * 储存在该矩阵中的位置
         */
        public get translation(): Vector2 {
            return new Vector2(this.m31, this.m32);
        }

        public set translation(value: Vector2) {
            this.m31 = value.x;
            this.m32 = value.y;
        }

        /**
         * 以弧度为单位的旋转，存储在这个矩阵中
         */
        public get rotation(): number {
            return Math.atan2(this.m21, this.m11);
        }

        public set rotation(value: number){
            let val1 = Math.cos(value);
            let val2 = Math.sin(value);

            this.m11 = val1;
            this.m12 = val2;
            this.m21 = -val2;
            this.m22 = val1;
        }

        /**
         * 矩阵中存储的旋转度数
         */
        public get rotationDegrees() {
            return MathHelper.toDegrees(this.rotation);
        }

        public set rotationDegrees(value: number) {
            this.rotation = MathHelper.toRadians(value);
        }

        /**
         * 储存在这个矩阵中的缩放
         */
        public get scale(): Vector2 {
            return new Vector2(this.m11, this.m22);
        }

        public set scale(value: Vector2) {
            this.m11 = value.x;
            this.m22 = value.y;
        }

        /**
         * 构建一个矩阵
         * @param m11 
         * @param m12 
         * @param m21 
         * @param m22 
         * @param m31 
         * @param m32 
         */
        constructor(m11: number, m12: number, m21: number, m22: number, m31: number, m32: number){
            this.m11 = m11;
            this.m12 = m12;
            
            this.m21 = m21;
            this.m22 = m22;
            
            this.m31 = m31;
            this.m32 = m32;
        }

        /**
         * 创建一个新的围绕Z轴的旋转矩阵2D
         * @param radians 
         */
        public static createRotation(radians: number){
            let result: Matrix2D = this.identity;

            let val1 = Math.cos(radians);
            let val2 = Math.sin(radians);

            result.m11 = val1;
            result.m12 = val2;
            result.m21 = -val2;
            result.m22 = val1;

            return result;
        }

        public static createRotationOut(radians: number, result: Matrix2D) {
            let val1 = Math.cos(radians);
            let val2 = Math.sin(radians);

            result.m11 = val1;
            result.m12 = val2;
            result.m21 = -val2;
            result.m22 = val1;
        }

        /**
         * 创建一个新的缩放矩阵2D
         * @param xScale 
         * @param yScale 
         */
        public static createScale(xScale: number, yScale: number){
            let result: Matrix2D = this.identity;
            result.m11 = xScale;
            result.m12 = 0;

            result.m21 = 0;
            result.m22 = yScale;

            result.m31 = 0;
            result.m32 = 0;

            return result;
        }

        public static createScaleOut(xScale: number, yScale: number, result: Matrix2D) {
            result.m11 = xScale;
            result.m12 = 0;

            result.m21 = 0;
            result.m22 = yScale;

            result.m31 = 0;
            result.m32 = 0;
        }

        /**
         * 创建一个新的平移矩阵2D
         * @param xPosition 
         * @param yPosition 
         */
        public static createTranslation(xPosition: number, yPosition: number) {
            let result: Matrix2D = this.identity;
            result.m11 = 1;
            result.m12 = 0;

            result.m21 = 0;
            result.m22 = 1;

            result.m31 = xPosition;
            result.m32 = yPosition;

            return result;
        }

        public static createTranslationOut(position: Vector2, result: Matrix2D) {
            result.m11 = 1;
            result.m12 = 0;

            result.m21 = 0;
            result.m22 = 1;

            result.m31 = position.x;
            result.m32 = position.y;
        }

        public static invert(matrix: Matrix2D) {
            let det = 1 / matrix.determinant();

            let result = this.identity;
            result.m11 = matrix.m22 * det;
            result.m12 = -matrix.m12 * det;

            result.m21 = -matrix.m21 * det;
            result.m22 = matrix.m11 * det;

            result.m31 = (matrix.m32 * matrix.m21 - matrix.m31 * matrix.m22) * det;
            result.m32 = -(matrix.m32 * matrix.m11 - matrix.m31 * matrix.m12) * det;

            return result;
        }

        /**
         * 创建一个新的matrix, 它包含两个矩阵的和。
         * @param matrix
         */
        public add(matrix: Matrix2D): Matrix2D {
            this.m11 += matrix.m11;
            this.m12 += matrix.m12;

            this.m21 += matrix.m21;
            this.m22 += matrix.m22;

            this.m31 += matrix.m31;
            this.m32 += matrix.m32;

            return this;
        }

        public substract(matrix: Matrix2D): Matrix2D {
            this.m11 -= matrix.m11;
            this.m12 -= matrix.m12;

            this.m21 -= matrix.m21;
            this.m22 -= matrix.m22;

            this.m31 -= matrix.m31;
            this.m32 -= matrix.m32;

            return this;
        }

        public divide(matrix: Matrix2D): Matrix2D {
            this.m11 /= matrix.m11;
            this.m12 /= matrix.m12;

            this.m21 /= matrix.m21;
            this.m22 /= matrix.m22;

            this.m31 /= matrix.m31;
            this.m32 /= matrix.m32;

            return this;
        }

        public multiply(matrix: Matrix2D): Matrix2D {
            let m11 = (this.m11 * matrix.m11) + (this.m12 * matrix.m21);
            let m12 = (this.m11 * matrix.m12) + (this.m12 * matrix.m22);

            let m21 = (this.m21 * matrix.m11) + (this.m22 * matrix.m21);
            let m22 = (this.m21 * matrix.m12) + (this.m22 * matrix.m22);

            let m31 = (this.m31 * matrix.m11) + (this.m32 * matrix.m21) + matrix.m31;
            let m32 = (this.m31 * matrix.m12) + (this.m32 * matrix.m22) + matrix.m32;

            this.m11 = m11;
            this.m12 = m12;

            this.m21 = m21;
            this.m22 = m22;

            this.m31 = m31;
            this.m32 = m32;

            return this;
        }

        public static multiply(matrix1: Matrix2D, matrix2: Matrix2D, result: Matrix2D) {
            let m11 = (matrix1.m11 * matrix2.m11) + (matrix1.m12 * matrix2.m21);
            let m12 = (matrix1.m11 * matrix2.m12) + (matrix1.m12 * matrix2.m22);

            let m21 = (matrix1.m21 * matrix2.m11) + (matrix1.m22 * matrix2.m21);
            let m22 = (matrix1.m21 * matrix2.m12) + (matrix1.m22 * matrix2.m22);

            let m31 = (matrix1.m31 * matrix2.m11) + (matrix1.m32 * matrix2.m21) + matrix2.m31;
            let m32 = (matrix1.m31 * matrix2.m12) + (matrix1.m32 * matrix2.m22) + matrix2.m32;

            result.m11 = m11;
            result.m12 = m12;

            result.m21 = m21;
            result.m22 = m22;

            result.m31 = m31;
            result.m32 = m32;

            return result;
        }

        public determinant() {
            return this.m11 * this.m22 - this.m12 * this.m21;
        }

        /**
         * 创建一个新的Matrix2D，包含指定矩阵中的线性插值。
         * @param matrix1 
         * @param matrix2 
         * @param amount 
         */
        public static lerp(matrix1: Matrix2D, matrix2: Matrix2D, amount: number){
            matrix1.m11 = matrix1.m11 + ((matrix2.m11 - matrix1.m11) * amount);
            matrix1.m12 = matrix1.m12 + ((matrix2.m12 - matrix1.m12) * amount);
            
            matrix1.m21 = matrix1.m21 + ((matrix2.m21 - matrix1.m21) * amount);
            matrix1.m22 = matrix1.m22 + ((matrix2.m22 - matrix1.m22) * amount);

            matrix1.m31 = matrix1.m31 + ((matrix2.m31 - matrix1.m31) * amount);
            matrix1.m32 = matrix1.m32 + ((matrix2.m32 - matrix1.m32) * amount);
            return matrix1;
        }

        /**
         * 交换矩阵的行和列
         * @param matrix 
         */
        public static transpose(matrix: Matrix2D) {
            let ret: Matrix2D = this.identity;
            ret.m11 = matrix.m11;
            ret.m12 = matrix.m21;

            ret.m21 = matrix.m12;
            ret.m22 = matrix.m22;

            ret.m31 = 0;
            ret.m32 = 0;
            return ret;
        }

        public mutiplyTranslation(x: number, y: number){
            let trans = Matrix2D.createTranslation(x, y);
            return MatrixHelper.mutiply(this, trans);
        }

        /**
         * 比较当前实例是否等于指定的Matrix2D
         * @param other 
         */
        public equals(other: Matrix2D){
            return this == other;
        }

        public static toMatrix(mat: Matrix2D) {
            let matrix = new Matrix();
            matrix.m11 = mat.m11;
            matrix.m12 = mat.m12;
            matrix.m13 = 0;
            matrix.m14 = 0;
            matrix.m21 = mat.m21;
            matrix.m22 = mat.m22;
            matrix.m23 = 0;
            matrix.m24 = 0;
            matrix.m31 = 0;
            matrix.m32 = 0;
            matrix.m33 = 1;
            matrix.m34 = 0;
            matrix.m41 = mat.m31;
            matrix.m42 = mat.m32;
            matrix.m43 = 0;
            matrix.m44 = 1;
            return matrix;
        }

        public toString() {
            return `{m11:${this.m11} m12:${this.m12} m21:${this.m21} m22:${this.m22} m31:${this.m31} m32:${this.m32}}`
        }
    }
}
