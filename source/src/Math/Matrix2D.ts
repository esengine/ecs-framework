/**
 * 表示右手3 * 3的浮点矩阵，可以存储平移、缩放和旋转信息。
 */
class Matrix2D {
    public m11: number = 0;
    public m12: number = 0;

    public m21: number = 0;
    public m22: number = 0;

    public m31: number = 0;
    public m32: number = 0;

    private static _identity: Matrix2D = new Matrix2D(1, 0, 0, 1, 0, 0);

    /**
     * 单位矩阵
     */
    public static get identity(){
        return Matrix2D._identity;
    }

    constructor(m11?: number, m12?: number, m21?: number, m22?: number, m31?: number, m32?: number){
        this.m11 = m11 ? m11 : 1;
        this.m12 = m12 ? m12 : 0;

        this.m21 = m21 ? m21 : 0;
        this.m22 = m22 ? m22 : 1;
        
        this.m31 = m31 ? m31 : 0;
        this.m32 = m32 ? m32 : 0;
    }

    /** 存储在这个矩阵中的位置 */
    public get translation(){
        return new Vector2(this.m31, this.m32);
    }

    public set translation(value: Vector2){
        this.m31 = value.x;
        this.m32 = value.y;
    }

    /** 以弧度表示的旋转存储在这个矩阵中 */
    public get rotation(){
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
     * 以度为单位的旋转存储在这个矩阵中
     */
    public get rotationDegrees(){
        return MathHelper.toDegrees(this.rotation);
    }

    public set rotationDegrees(value: number){
        this.rotation = MathHelper.toRadians(value);
    }

    public get scale(){
        return new Vector2(this.m11, this.m22);
    }

    public set scale(value: Vector2){
        this.m11 = value.x;
        this.m12 = value.y;
    }

    /**
     * 创建一个新的matrix, 它包含两个矩阵的和。
     * @param matrix1 
     * @param matrix2 
     */
    public static add(matrix1: Matrix2D, matrix2: Matrix2D){
        matrix1.m11 += matrix2.m11;
        matrix1.m12 += matrix2.m12;

        matrix1.m21 += matrix2.m21;
        matrix1.m22 += matrix2.m22;

        matrix1.m31 += matrix2.m31;
        matrix1.m32 += matrix2.m32;

        return matrix1;
    }

    public static divide(matrix1: Matrix2D, matrix2: Matrix2D){
        matrix1.m11 /= matrix2.m11;
        matrix1.m12 /= matrix2.m12;

        matrix1.m21 /= matrix2.m21;
        matrix1.m22 /= matrix2.m22;

        matrix1.m31 /= matrix2.m31;
        matrix1.m32 /= matrix2.m32;

        return matrix1;
    }

    public static multiply(matrix1: Matrix2D, matrix2: Matrix2D){
        let result = new Matrix2D();

        let m11 = ( matrix1.m11 * matrix2.m11 ) + ( matrix1.m12 * matrix2.m21 );
        let m12 = ( matrix1.m11 * matrix2.m12 ) + ( matrix1.m12 * matrix2.m22 );

        let m21 = ( matrix1.m21 * matrix2.m11 ) + ( matrix1.m22 * matrix2.m21 );
        let m22 = ( matrix1.m21 * matrix2.m12 ) + ( matrix1.m22 * matrix2.m22 );

        let m31 = ( matrix1.m31 * matrix2.m11 ) + ( matrix1.m32 * matrix2.m21 ) + matrix2.m31;
        let m32 = ( matrix1.m31 * matrix2.m12 ) + ( matrix1.m32 * matrix2.m22 ) + matrix2.m32;

        result.m11 = m11;
        result.m12 = m12;

        result.m21 = m21;
        result.m22 = m22;

        result.m31 = m31;
        result.m32 = m32;

        return result;
    }

    public static multiplyTranslation(matrix: Matrix2D, x: number, y: number){
        let trans = Matrix2D.createTranslation(x, y);
        return Matrix2D.multiply(matrix, trans);
    }

    public determinant(){
        return this.m11 * this.m22 - this.m12 * this.m21;
    }

    public static invert(matrix: Matrix2D, result: Matrix2D = new Matrix2D()){
        let det = 1 / matrix.determinant();

        result.m11 = matrix.m22 * det;
        result.m12 = -matrix.m12 * det;

        result.m21 = -matrix.m21 * det;
        result.m22 = matrix.m11 * det;

        result.m31 = (matrix.m32 * matrix.m21 - matrix.m31 * matrix.m22) * det;
        result.m32 = -(matrix.m32 * matrix.m11 - matrix.m31 * matrix.m12) * det;

        return result;
    }

    public static createTranslation(xPosition: number, yPosition: number, result?: Matrix2D){
        result = result ? result : new Matrix2D();
        
        result.m11 = 1;
        result.m12 = 0;

        result.m21 = 0;
        result.m22 = 1;

        result.m31 = xPosition;
        result.m32 = yPosition;

        return result;
    }

    public static createRotation(radians: number, result?: Matrix2D){
        result = new Matrix2D();

        let val1 = Math.cos(radians);
        let val2 = Math.sin(radians);

        result.m11 = val1;
        result.m12 = val2;
        result.m21 = -val2;
        result.m22 = val1;

        return result;
    }

    public static createScale(xScale: number, yScale: number, result: Matrix2D = new Matrix2D()){
        result.m11 = xScale;
        result.m12 = 0;

        result.m21 = 0;
        result.m22 = yScale;

        result.m31 = 0;
        result.m32 = 0;

        return result;
    }

    public toEgretMatrix(): egret.Matrix{
        let matrix = new egret.Matrix(this.m11, this.m12, this.m21, this.m22, this.m31, this.m32);
        return matrix;
    }
}