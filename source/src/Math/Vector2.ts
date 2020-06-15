/** 2d 向量 */
class Vector2 {
    public x: number = 0;
    public y: number = 0;

    private static readonly unitYVector = new Vector2(0, 1);
    private static readonly unitXVector = new Vector2(1, 0);
    private static readonly unitVector2 = new Vector2(1, 1);
    private static readonly zeroVector2 = new Vector2(0, 0);
    public static get zero(){
        return Vector2.zeroVector2;
    }

    public static get one(){
        return Vector2.unitVector2;
    }

    public static get unitX(){
        return Vector2.unitXVector;
    }

    public static get unitY(){
        return Vector2.unitYVector;
    }

    /**
     * 从两个值构造一个带有X和Y的二维向量。
     * @param x 二维空间中的x坐标
     * @param y 二维空间的y坐标
     */
    constructor(x? : number, y?: number){
        this.x = x ? x : 0;
        this.y = y ? y : this.x;
    }

    public static add(value1: Vector2, value2: Vector2){
        let result: Vector2 = new Vector2(0, 0);
        result.x = value1.x + value2.x;
        result.y = value1.y + value2.y;
        return result;
    }

    public static divide(value1: Vector2, value2: Vector2){
        let result: Vector2 = new Vector2(0, 0);
        result.x = value1.x / value2.x;
        result.y = value1.y / value2.y;
        return value1;
    }

    public static multiply(value1: Vector2, value2: Vector2){
        let result: Vector2 = new Vector2(0, 0);
        result.x = value1.x * value2.x;
        result.y = value1.y * value2.y;
        return result;
    }

    public static subtract(value1: Vector2, value2: Vector2){
        let result: Vector2 = new Vector2(0, 0);
        result.x = value1.x - value2.x;
        result.y = value1.y - value2.y;
        return value1;
    }

    /** 变成一个方向相同的单位向量 */
    public normalize(){
        let val = 1 / Math.sqrt((this.x * this.x) + (this.y * this.y));
        this.x *= val;
        this.y *= val;
    }

    public length(){
        return Math.sqrt((this.x * this.x) + (this.y * this.y));
    }

    public static normalize(value: Vector2){
        let val = 1 / Math.sqrt((value.x * value.x) + (value.y * value.y));
        value.x *= val;
        value.y *= val;
        return value;
    }

    /**
     * 返回两个向量的点积
     * @param value1 
     * @param value2 
     */
    public static dot(value1: Vector2, value2: Vector2): number{
        return (value1.x * value2.x) + (value1.y * value2.y);
    }

    /**
     * 返回两个向量之间距离的平方
     * @param value1 
     * @param value2 
     */
    public static distanceSquared(value1: Vector2, value2: Vector2){
        let v1 = value1.x - value2.x, v2 = value1.y - value2.y;
        return (v1 * v1) + (v2 * v2);
    }

    public static lerp(value1: Vector2, value2: Vector2, amount: number){
        return new Vector2(MathHelper.lerp(value1.x, value2.x, amount), MathHelper.lerp(value1.y, value2.y, amount));
    }

    public static transform(position: Vector2, matrix: Matrix2D){
        return new Vector2((position.x * matrix.m11) + (position.y * matrix.m21), (position.x * matrix.m12) + (position.y * matrix.m22));
    }

    public static distance(value1: Vector2, value2: Vector2){
        let v1 = value1.x - value2.x, v2 = value1.y - value2.y;
        return Math.sqrt((v1 * v1) + (v2 * v2));
    }

    public static negate(value: Vector2){
        let result: Vector2 = new Vector2();
        result.x = -value.x;
        result.y = -value.y;

        return result;
    }
}