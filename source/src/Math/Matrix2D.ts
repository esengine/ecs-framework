module es {
    /**
     * 表示右手3 * 3的浮点矩阵，可以存储平移、缩放和旋转信息。
     */
    export class Matrix2D extends egret.Matrix{
        public get m11(): number{
            return this.a;
        }
        public set m11(value: number){
            this.a = value;
        }
        public get m12(): number{
            return this.b;
        }
        public set m12(value: number){
            this.b = value;
        }
        public get m21(): number{
            return this.c;
        }
        public set m21(value: number){
            this.c = value;
        }
        public get m22(): number{
            return this.d;
        }
        public set m22(value: number){
            this.d = value;
        }
        public get m31(): number {
            return this.tx;
        }
        public set m31(value: number){
            this.tx = value;
        }
        public get m32(): number{
            return this.ty;
        }
        public set m32(value: number){
            this.ty = value;
        }

        public static create(): Matrix2D{
            return egret.Matrix.create() as Matrix2D;
        }

        public identity(): Matrix2D{
            super.identity();
            return this;
        }

        public translate(dx: number, dy: number): Matrix2D {
            super.translate(dx, dy);
            return this;
        }

        public scale(sx: number, sy: number): Matrix2D {
            super.scale(sx, sy);
            return this;
        }

        public rotate(angle: number): Matrix2D {
            super.rotate(angle);
            return this;
        }

        public invert(): Matrix2D {
            super.invert();
            return this;
        }

        /**
         * 创建一个新的matrix, 它包含两个矩阵的和。
         * @param matrix
         */
        public add(matrix: Matrix2D): Matrix2D{
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

        public divide(matrix: Matrix2D): Matrix2D{
            this.m11 /= matrix.m11;
            this.m12 /= matrix.m12;

            this.m21 /= matrix.m21;
            this.m22 /= matrix.m22;

            this.m31 /= matrix.m31;
            this.m32 /= matrix.m32;

            return this;
        }

        public multiply(matrix: Matrix2D): Matrix2D{
            let m11 = ( this.m11 * matrix.m11 ) + ( this.m12 * matrix.m21 );
            let m12 = ( this.m11 * matrix.m12 ) + ( this.m12 * matrix.m22 );

            let m21 = ( this.m21 * matrix.m11 ) + ( this.m22 * matrix.m21 );
            let m22 = ( this.m21 * matrix.m12 ) + ( this.m22 * matrix.m22 );

            let m31 = ( this.m31 * matrix.m11 ) + ( this.m32 * matrix.m21 ) + matrix.m31;
            let m32 = ( this.m31 * matrix.m12 ) + ( this.m32 * matrix.m22 ) + matrix.m32;

            this.m11 = m11;
            this.m12 = m12;

            this.m21 = m21;
            this.m22 = m22;

            this.m31 = m31;
            this.m32 = m32;

            return this;
        }

        public determinant(){
            return this.m11 * this.m22 - this.m12 * this.m21;
        }
    }
}
