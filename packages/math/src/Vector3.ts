/**
 * 3D 向量数据接口
 *
 * 轻量级数据结构，用于组件属性和序列化。
 * Lightweight data structure for component properties and serialization.
 */
export interface IVector3 {
    x: number;
    y: number;
    z: number;
}

/**
 * 3D向量类
 *
 * 提供完整的3D向量运算功能，包括：
 * - 基础运算（加减乘除）
 * - 向量运算（点积、叉积、归一化）
 * - 几何运算（距离、角度、投影）
 * - 变换操作（旋转、反射、插值）
 */
export class Vector3 implements IVector3 {
    /** X分量 */
    public x: number;

    /** Y分量 */
    public y: number;

    /** Z分量 */
    public z: number;

    /**
   * 创建3D向量
   * @param x X分量，默认为0
   * @param y Y分量，默认为0
   * @param z Z分量，默认为0
   */
    constructor(x: number = 0, y: number = 0, z: number = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    // 静态常量
    /** 零向量 (0, 0, 0) */
    static readonly ZERO = new Vector3(0, 0, 0);

    /** 单位向量 (1, 1, 1) */
    static readonly ONE = new Vector3(1, 1, 1);

    /** 右方向向量 (1, 0, 0) */
    static readonly RIGHT = new Vector3(1, 0, 0);

    /** 左方向向量 (-1, 0, 0) */
    static readonly LEFT = new Vector3(-1, 0, 0);

    /** 上方向向量 (0, 1, 0) */
    static readonly UP = new Vector3(0, 1, 0);

    /** 下方向向量 (0, -1, 0) */
    static readonly DOWN = new Vector3(0, -1, 0);

    /** 前方向向量 (0, 0, 1) */
    static readonly FORWARD = new Vector3(0, 0, 1);

    /** 后方向向量 (0, 0, -1) */
    static readonly BACK = new Vector3(0, 0, -1);

    // 基础属性

    /**
   * 获取向量长度（模）
   */
    get length(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    }

    /**
   * 获取向量长度的平方
   */
    get lengthSquared(): number {
        return this.x * this.x + this.y * this.y + this.z * this.z;
    }

    /**
   * 检查是否为零向量
   */
    get isZero(): boolean {
        return this.x === 0 && this.y === 0 && this.z === 0;
    }

    /**
   * 检查是否为单位向量
   */
    get isUnit(): boolean {
        const lenSq = this.lengthSquared;
        return Math.abs(lenSq - 1) < Number.EPSILON;
    }

    // 基础运算

    /**
   * 设置向量分量
   * @param x X分量
   * @param y Y分量
   * @param z Z分量
   * @returns 当前向量实例（链式调用）
   */
    set(x: number, y: number, z: number): this {
        this.x = x;
        this.y = y;
        this.z = z;
        return this;
    }

    /**
   * 复制另一个向量的值
   * @param other 源向量
   * @returns 当前向量实例（链式调用）
   */
    copy(other: Vector3): this {
        this.x = other.x;
        this.y = other.y;
        this.z = other.z;
        return this;
    }

    /**
   * 克隆当前向量
   * @returns 新的向量实例
   */
    clone(): Vector3 {
        return new Vector3(this.x, this.y, this.z);
    }

    /**
   * 向量加法
   * @param other 另一个向量
   * @returns 当前向量实例（链式调用）
   */
    add(other: Vector3): this {
        this.x += other.x;
        this.y += other.y;
        this.z += other.z;
        return this;
    }

    /**
   * 向量减法
   * @param other 另一个向量
   * @returns 当前向量实例（链式调用）
   */
    subtract(other: Vector3): this {
        this.x -= other.x;
        this.y -= other.y;
        this.z -= other.z;
        return this;
    }

    /**
   * 向量数乘
   * @param scalar 标量
   * @returns 当前向量实例（链式调用）
   */
    multiply(scalar: number): this {
        this.x *= scalar;
        this.y *= scalar;
        this.z *= scalar;
        return this;
    }

    /**
   * 向量数除
   * @param scalar 标量
   * @returns 当前向量实例（链式调用）
   */
    divide(scalar: number): this {
        if (scalar === 0) {
            throw new Error('不能除以零');
        }
        this.x /= scalar;
        this.y /= scalar;
        this.z /= scalar;
        return this;
    }

    /**
   * 向量取反
   * @returns 当前向量实例（链式调用）
   */
    negate(): this {
        this.x = -this.x;
        this.y = -this.y;
        this.z = -this.z;
        return this;
    }

    // 向量运算

    /**
   * 计算与另一个向量的点积
   * @param other 另一个向量
   * @returns 点积值
   */
    dot(other: Vector3): number {
        return this.x * other.x + this.y * other.y + this.z * other.z;
    }

    /**
   * 计算与另一个向量的叉积
   * @param other 另一个向量
   * @returns 新的叉积向量
   */
    cross(other: Vector3): Vector3 {
        return new Vector3(
            this.y * other.z - this.z * other.y,
            this.z * other.x - this.x * other.z,
            this.x * other.y - this.y * other.x
        );
    }

    /**
   * 向量归一化（转换为单位向量）
   * @returns 当前向量实例（链式调用）
   */
    normalize(): this {
        const len = this.length;
        if (len === 0) {
            return this;
        }
        return this.divide(len);
    }

    /**
   * 获取归一化后的向量（不修改原向量）
   * @returns 新的单位向量
   */
    normalized(): Vector3 {
        return this.clone().normalize();
    }

    // 几何运算

    /**
   * 计算到另一个向量的距离
   * @param other 另一个向量
   * @returns 距离值
   */
    distanceTo(other: Vector3): number {
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        const dz = this.z - other.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    /**
   * 计算到另一个向量的距离平方
   * @param other 另一个向量
   * @returns 距离平方值
   */
    distanceToSquared(other: Vector3): number {
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        const dz = this.z - other.z;
        return dx * dx + dy * dy + dz * dz;
    }

    /**
   * 计算与另一个向量的夹角（弧度）
   * @param other 另一个向量
   * @returns 夹角（0到π）
   */
    angleTo(other: Vector3): number {
        const dot = this.dot(other);
        const lenProduct = this.length * other.length;
        if (lenProduct === 0) return 0;
        return Math.acos(Math.max(-1, Math.min(1, dot / lenProduct)));
    }

    /**
   * 计算向量在另一个向量上的投影
   * @param onto 投影目标向量
   * @returns 新的投影向量
   */
    projectOnto(onto: Vector3): Vector3 {
        const dot = this.dot(onto);
        const lenSq = onto.lengthSquared;
        if (lenSq === 0) return new Vector3();
        return onto.clone().multiply(dot / lenSq);
    }

    // 插值和限制

    /**
   * 线性插值
   * @param target 目标向量
   * @param t 插值参数（0到1）
   * @returns 当前向量实例（链式调用）
   */
    lerp(target: Vector3, t: number): this {
        this.x += (target.x - this.x) * t;
        this.y += (target.y - this.y) * t;
        this.z += (target.z - this.z) * t;
        return this;
    }

    /**
   * 限制向量长度
   * @param maxLength 最大长度
   * @returns 当前向量实例（链式调用）
   */
    clampLength(maxLength: number): this {
        const lenSq = this.lengthSquared;
        if (lenSq > maxLength * maxLength) {
            return this.normalize().multiply(maxLength);
        }
        return this;
    }

    // 比较操作

    /**
   * 检查两个向量是否相等
   * @param other 另一个向量
   * @param epsilon 容差，默认为Number.EPSILON
   * @returns 是否相等
   */
    equals(other: Vector3, epsilon: number = Number.EPSILON): boolean {
        return Math.abs(this.x - other.x) < epsilon &&
           Math.abs(this.y - other.y) < epsilon &&
           Math.abs(this.z - other.z) < epsilon;
    }

    /**
   * 检查两个向量是否完全相等
   * @param other 另一个向量
   * @returns 是否完全相等
   */
    exactEquals(other: Vector3): boolean {
        return this.x === other.x && this.y === other.y && this.z === other.z;
    }

    // 静态方法

    /**
   * 向量加法（静态方法）
   * @param a 向量a
   * @param b 向量b
   * @returns 新的结果向量
   */
    static add(a: Vector3, b: Vector3): Vector3 {
        return new Vector3(a.x + b.x, a.y + b.y, a.z + b.z);
    }

    /**
   * 向量减法（静态方法）
   * @param a 向量a
   * @param b 向量b
   * @returns 新的结果向量
   */
    static subtract(a: Vector3, b: Vector3): Vector3 {
        return new Vector3(a.x - b.x, a.y - b.y, a.z - b.z);
    }

    /**
   * 向量数乘（静态方法）
   * @param vector 向量
   * @param scalar 标量
   * @returns 新的结果向量
   */
    static multiply(vector: Vector3, scalar: number): Vector3 {
        return new Vector3(vector.x * scalar, vector.y * scalar, vector.z * scalar);
    }

    /**
   * 向量点积（静态方法）
   * @param a 向量a
   * @param b 向量b
   * @returns 点积值
   */
    static dot(a: Vector3, b: Vector3): number {
        return a.x * b.x + a.y * b.y + a.z * b.z;
    }

    /**
   * 向量叉积（静态方法）
   * @param a 向量a
   * @param b 向量b
   * @returns 新的叉积向量
   */
    static cross(a: Vector3, b: Vector3): Vector3 {
        return new Vector3(
            a.y * b.z - a.z * b.y,
            a.z * b.x - a.x * b.z,
            a.x * b.y - a.y * b.x
        );
    }

    /**
   * 计算两点间距离（静态方法）
   * @param a 点a
   * @param b 点b
   * @returns 距离值
   */
    static distance(a: Vector3, b: Vector3): number {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dz = a.z - b.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    /**
   * 线性插值（静态方法）
   * @param a 起始向量
   * @param b 目标向量
   * @param t 插值参数（0到1）
   * @returns 新的插值结果向量
   */
    static lerp(a: Vector3, b: Vector3, t: number): Vector3 {
        return new Vector3(
            a.x + (b.x - a.x) * t,
            a.y + (b.y - a.y) * t,
            a.z + (b.z - a.z) * t
        );
    }

    // 字符串转换

    /**
   * 转换为字符串
   * @returns 字符串表示
   */
    toString(): string {
        return `Vector3(${this.x.toFixed(3)}, ${this.y.toFixed(3)}, ${this.z.toFixed(3)})`;
    }

    /**
   * 转换为数组
   * @returns [x, y, z] 数组
   */
    toArray(): [number, number, number] {
        return [this.x, this.y, this.z];
    }

    /**
   * 转换为普通对象
   * @returns {x, y, z} 对象
   */
    toObject(): { x: number; y: number; z: number } {
        return { x: this.x, y: this.y, z: this.z };
    }
}
