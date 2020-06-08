/** 2d 向量 */
class Vector2 {
    public x: number = 0;
    public y: number = 0;

    private static readonly unitVector2 = new Vector2(1, 1);

    public static get One(){
        return this.unitVector2;
    }

    /**
     * 从两个值构造一个带有X和Y的二维向量。
     * @param x 二维空间中的x坐标
     * @param y 二维空间的y坐标
     */
    constructor(x: number, y: number){
        this.x = x;
        this.y = y;
    }

    public static add(value1: Vector2, value2: Vector2){
        value1.x += value2.x;
        value1.y += value2.y;
        return value1;
    }

    public static divide(value1: Vector2, value2: Vector2){
        value1.x /= value2.x;
        value1.y /= value2.y;
        return value1;
    }

    public static multiply(value1: Vector2, value2: Vector2){
        value1.x *= value2.x;
        value1.y *= value2.y;
        return value1;
    }

    public static subtract(value1: Vector2, value2: Vector2){
        value1.x -= value2.x;
        value1.y -= value2.y;
        return value1;
    }

    /** 变成一个方向相同的单位向量 */
    public normalize(){
        let val = 1 / Math.sqrt((this.x * this.x) + (this.y * this.y));
        this.x *= val;
        this.y *= val;
    }

    public static transform(position: Vector2, matrix: Matrix2D){
        return new Vector2((position.x * matrix.m11) + (position.y * matrix.m21), (position.x * matrix.m12) + (position.y * matrix.m22));
    }
}