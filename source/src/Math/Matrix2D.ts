module es {
    export var matrixPool = [];
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

        /**
         * 从对象池中取出或创建一个新的Matrix对象。
         */
        public static create(): Matrix2D{
            let matrix = matrixPool.pop();
            if (!matrix)
                matrix = new Matrix2D();
            return matrix;
        }

        public identity(): Matrix2D{
            this.a = this.d = 1;
            this.b = this.c = this.tx = this.ty = 0;
            return this;
        }

        public translate(dx: number, dy: number): Matrix2D {
            this.tx += dx;
            this.ty += dy;
            return this;
        }

        public scale(sx: number, sy: number): Matrix2D {
            if (sx !== 1){
                this.a *= sx;
                this.c *= sx;
                this.tx *= sx;
            }
            if (sy !== 1){
                this.b *= sy;
                this.d *= sy;
                this.ty *= sy;
            }
            return this;
        }

        public rotate(angle: number): Matrix2D {
            angle = +angle;
            if (angle !== 0) {
                angle = angle / DEG_TO_RAD;
                let u = Math.cos(angle);
                let v = Math.sin(angle);
                let ta = this.a;
                let tb = this.b;
                let tc = this.c;
                let td = this.d;
                let ttx = this.tx;
                let tty = this.ty;
                this.a = ta * u - tb * v;
                this.b = ta * v + tb * u;
                this.c = tc * u - td * v;
                this.d = tc * v + td * u;
                this.tx = ttx * u - tty * v;
                this.ty = ttx * v + tty * u;
            }
            return this;
        }

        public invert(): Matrix2D {
            this.$invertInto(this);
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

        public release(matrix: Matrix2D) {
            if (!matrix)
                return;
            matrixPool.push(matrix);
        }
    }
}
