/**
 * 二维向量类
 * 提供二维向量的基本数学运算
 */
export class Vector2 {
    /**
     * X坐标
     */
    public x: number;
    
    /**
     * Y坐标
     */
    public y: number;

    /**
     * 构造函数
     * @param x X坐标，默认为0
     * @param y Y坐标，默认为0
     */
    constructor(x: number = 0, y: number = 0) {
        this.x = x;
        this.y = y;
    }

    /**
     * 零向量
     */
    public static get zero(): Vector2 {
        return new Vector2(0, 0);
    }

    /**
     * 单位向量(1, 1)
     */
    public static get one(): Vector2 {
        return new Vector2(1, 1);
    }

    /**
     * 单位X向量(1, 0)
     */
    public static get unitX(): Vector2 {
        return new Vector2(1, 0);
    }

    /**
     * 单位Y向量(0, 1)
     */
    public static get unitY(): Vector2 {
        return new Vector2(0, 1);
    }

    /**
     * 向上向量(0, -1)
     */
    public static get up(): Vector2 {
        return new Vector2(0, -1);
    }

    /**
     * 向下向量(0, 1)
     */
    public static get down(): Vector2 {
        return new Vector2(0, 1);
    }

    /**
     * 向左向量(-1, 0)
     */
    public static get left(): Vector2 {
        return new Vector2(-1, 0);
    }

    /**
     * 向右向量(1, 0)
     */
    public static get right(): Vector2 {
        return new Vector2(1, 0);
    }

    /**
     * 获取向量长度
     */
    public get length(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    /**
     * 获取向量长度的平方
     */
    public get lengthSquared(): number {
        return this.x * this.x + this.y * this.y;
    }

    /**
     * 设置向量的值
     * @param x X坐标
     * @param y Y坐标
     */
    public set(x: number, y: number): Vector2 {
        this.x = x;
        this.y = y;
        return this;
    }

    /**
     * 复制另一个向量的值
     * @param other 另一个向量
     */
    public copyFrom(other: Vector2): Vector2 {
        this.x = other.x;
        this.y = other.y;
        return this;
    }

    /**
     * 克隆向量
     */
    public clone(): Vector2 {
        return new Vector2(this.x, this.y);
    }

    /**
     * 向量加法
     * @param other 另一个向量
     */
    public add(other: Vector2): Vector2 {
        return new Vector2(this.x + other.x, this.y + other.y);
    }

    /**
     * 向量减法
     * @param other 另一个向量
     */
    public subtract(other: Vector2): Vector2 {
        return new Vector2(this.x - other.x, this.y - other.y);
    }

    /**
     * 向量乘法（标量）
     * @param scalar 标量
     */
    public multiply(scalar: number): Vector2 {
        return new Vector2(this.x * scalar, this.y * scalar);
    }

    /**
     * 向量除法（标量）
     * @param scalar 标量
     */
    public divide(scalar: number): Vector2 {
        return new Vector2(this.x / scalar, this.y / scalar);
    }

    /**
     * 向量点积
     * @param other 另一个向量
     */
    public dot(other: Vector2): number {
        return this.x * other.x + this.y * other.y;
    }

    /**
     * 向量叉积（2D中返回标量）
     * @param other 另一个向量
     */
    public cross(other: Vector2): number {
        return this.x * other.y - this.y * other.x;
    }

    /**
     * 归一化向量
     */
    public normalize(): Vector2 {
        const length = this.length;
        if (length === 0) {
            return Vector2.zero;
        }
        return new Vector2(this.x / length, this.y / length);
    }

    /**
     * 获取到另一个向量的距离
     * @param other 另一个向量
     */
    public distanceTo(other: Vector2): number {
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * 获取到另一个向量的距离的平方
     * @param other 另一个向量
     */
    public distanceSquaredTo(other: Vector2): number {
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        return dx * dx + dy * dy;
    }

    /**
     * 检查向量是否相等
     * @param other 另一个向量
     * @param tolerance 容差
     */
    public equals(other: Vector2, tolerance: number = 0.0001): boolean {
        return Math.abs(this.x - other.x) < tolerance && Math.abs(this.y - other.y) < tolerance;
    }

    /**
     * 获取向量的角度（弧度）
     */
    public angle(): number {
        return Math.atan2(this.y, this.x);
    }

    /**
     * 旋转向量
     * @param radians 旋转角度（弧度）
     */
    public rotate(radians: number): Vector2 {
        const cos = Math.cos(radians);
        const sin = Math.sin(radians);
        return new Vector2(
            this.x * cos - this.y * sin,
            this.x * sin + this.y * cos
        );
    }

    /**
     * 线性插值
     * @param other 目标向量
     * @param t 插值参数(0-1)
     */
    public lerp(other: Vector2, t: number): Vector2 {
        return new Vector2(
            this.x + (other.x - this.x) * t,
            this.y + (other.y - this.y) * t
        );
    }

    /**
     * 四舍五入
     */
    public round(): Vector2 {
        return new Vector2(Math.round(this.x), Math.round(this.y));
    }

    /**
     * 向下取整
     */
    public floor(): Vector2 {
        return new Vector2(Math.floor(this.x), Math.floor(this.y));
    }

    /**
     * 向上取整
     */
    public ceil(): Vector2 {
        return new Vector2(Math.ceil(this.x), Math.ceil(this.y));
    }

    /**
     * 转换为字符串
     */
    public toString(): string {
        return `(${this.x.toFixed(2)}, ${this.y.toFixed(2)})`;
    }

    // 静态方法

    /**
     * 向量加法
     * @param a 向量A
     * @param b 向量B
     */
    public static add(a: Vector2, b: Vector2): Vector2 {
        return new Vector2(a.x + b.x, a.y + b.y);
    }

    /**
     * 向量减法
     * @param a 向量A
     * @param b 向量B
     */
    public static subtract(a: Vector2, b: Vector2): Vector2 {
        return new Vector2(a.x - b.x, a.y - b.y);
    }

    /**
     * 向量乘法
     * @param a 向量A
     * @param b 向量B或标量
     */
    public static multiply(a: Vector2, b: Vector2 | number): Vector2 {
        if (typeof b === 'number') {
            return new Vector2(a.x * b, a.y * b);
        } else {
            return new Vector2(a.x * b.x, a.y * b.y);
        }
    }

    /**
     * 向量除法
     * @param a 向量A
     * @param b 向量B或标量
     */
    public static divide(a: Vector2, b: Vector2 | number): Vector2 {
        if (typeof b === 'number') {
            return new Vector2(a.x / b, a.y / b);
        } else {
            return new Vector2(a.x / b.x, a.y / b.y);
        }
    }

    /**
     * 向量点积
     * @param a 向量A
     * @param b 向量B
     */
    public static dot(a: Vector2, b: Vector2): number {
        return a.x * b.x + a.y * b.y;
    }

    /**
     * 向量叉积
     * @param a 向量A
     * @param b 向量B
     */
    public static cross(a: Vector2, b: Vector2): number {
        return a.x * b.y - a.y * b.x;
    }

    /**
     * 向量距离
     * @param a 向量A
     * @param b 向量B
     */
    public static distance(a: Vector2, b: Vector2): number {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * 向量距离的平方
     * @param a 向量A
     * @param b 向量B
     */
    public static distanceSquared(a: Vector2, b: Vector2): number {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        return dx * dx + dy * dy;
    }

    /**
     * 线性插值
     * @param a 起始向量
     * @param b 目标向量
     * @param t 插值参数(0-1)
     */
    public static lerp(a: Vector2, b: Vector2, t: number): Vector2 {
        return new Vector2(
            a.x + (b.x - a.x) * t,
            a.y + (b.y - a.y) * t
        );
    }

    /**
     * 四舍五入
     * @param vector 向量
     */
    public static round(vector: Vector2): Vector2 {
        return new Vector2(Math.round(vector.x), Math.round(vector.y));
    }

    /**
     * 从角度创建向量
     * @param radians 角度（弧度）
     * @param length 长度，默认为1
     */
    public static fromAngle(radians: number, length: number = 1): Vector2 {
        return new Vector2(Math.cos(radians) * length, Math.sin(radians) * length);
    }

    /**
     * 反射向量
     * @param vector 入射向量
     * @param normal 法向量
     */
    public static reflect(vector: Vector2, normal: Vector2): Vector2 {
        const dot = Vector2.dot(vector, normal);
        return Vector2.subtract(vector, Vector2.multiply(normal, 2 * dot));
    }
}
