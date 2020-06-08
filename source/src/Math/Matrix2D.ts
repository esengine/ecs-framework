/**
 * 表示右手3 * 3的浮点矩阵，可以存储平移、缩放和旋转信息。
 */
class Matrix2D {
    public m11: number;
    public m12: number;

    public m21: number;
    public m22: number;

    public m31: number;
    public m32: number;

    private static _identity: Matrix2D = new Matrix2D(1, 0, 0, 1, 0, 0);

    /**
     * 单位矩阵
     */
    public static get identity(){
        return Matrix2D._identity;
    }

    constructor(m11: number, m12: number, m21: number, m22: number, m31: number, m32: number){
        this.m11 = m11;
        this.m12 = m12;

        this.m21 = m21;
        this.m22 = m22;
        
        this.m31 = m31;
        this.m32 = m32;
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
        return MathHelper.ToDegrees(this.rotation);
    }

    public set rotationDegrees(value: number){
        this.rotation = MathHelper.ToRadians(value);
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
        let m11 = ( matrix1.m11 * matrix2.m11 ) + ( matrix1.m12 * matrix2.m21 );
        let m12 = ( matrix1.m11 * matrix2.m12 ) + ( matrix1.m12 * matrix2.m22 );

        let m21 = ( matrix1.m21 * matrix2.m11 ) + ( matrix1.m22 * matrix2.m21 );
        let m22 = ( matrix1.m21 * matrix2.m12 ) + ( matrix1.m22 * matrix2.m22 );

        let m31 = ( matrix1.m31 * matrix2.m11 ) + ( matrix1.m32 * matrix2.m21 ) + matrix2.m31;
        let m32 = ( matrix1.m31 * matrix2.m12 ) + ( matrix1.m32 * matrix2.m22 ) + matrix2.m32;

        matrix1.m11 = m11;
        matrix1.m12 = m12;

        matrix1.m21 = m21;
        matrix1.m22 = m22;

        matrix1.m31 = m31;
        matrix1.m32 = m32;
        return matrix1;
    }
}