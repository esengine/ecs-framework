import { Vector2 } from './Vector2';

/**
 * 2D矩形类
 *
 * 表示一个轴对齐的矩形，提供矩形相关的几何运算功能：
 * - 矩形创建和属性获取
 * - 包含检测（点、矩形）
 * - 相交检测和计算
 * - 变换和操作
 */
export class Rectangle {
    /** 矩形左上角X坐标 */
    public x: number;

    /** 矩形左上角Y坐标 */
    public y: number;

    /** 矩形宽度 */
    public width: number;

    /** 矩形高度 */
    public height: number;

    /**
   * 创建矩形
   * @param x 左上角X坐标，默认为0
   * @param y 左上角Y坐标，默认为0
   * @param width 宽度，默认为0
   * @param height 高度，默认为0
   */
    constructor(x: number = 0, y: number = 0, width: number = 0, height: number = 0) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    // 静态常量
    /** 空矩形 */
    static readonly EMPTY = new Rectangle(0, 0, 0, 0);

    // 属性获取

    /** 获取左边界 */
    get left(): number {
        return this.x;
    }

    /** 获取右边界 */
    get right(): number {
        return this.x + this.width;
    }

    /** 获取上边界 */
    get top(): number {
        return this.y;
    }

    /** 获取下边界 */
    get bottom(): number {
        return this.y + this.height;
    }

    /** 获取中心X坐标 */
    get centerX(): number {
        return this.x + this.width * 0.5;
    }

    /** 获取中心Y坐标 */
    get centerY(): number {
        return this.y + this.height * 0.5;
    }

    /** 获取中心点 */
    get center(): Vector2 {
        return new Vector2(this.centerX, this.centerY);
    }

    /** 获取左上角点 */
    get topLeft(): Vector2 {
        return new Vector2(this.x, this.y);
    }

    /** 获取右上角点 */
    get topRight(): Vector2 {
        return new Vector2(this.right, this.y);
    }

    /** 获取左下角点 */
    get bottomLeft(): Vector2 {
        return new Vector2(this.x, this.bottom);
    }

    /** 获取右下角点 */
    get bottomRight(): Vector2 {
        return new Vector2(this.right, this.bottom);
    }

    /** 获取面积 */
    get area(): number {
        return this.width * this.height;
    }

    /** 获取周长 */
    get perimeter(): number {
        return 2 * (this.width + this.height);
    }

    /** 检查是否为空矩形 */
    get isEmpty(): boolean {
        return this.width <= 0 || this.height <= 0;
    }

    /** 检查是否为正方形 */
    get isSquare(): boolean {
        return this.width === this.height && this.width > 0;
    }

    // 基础操作

    /**
   * 设置矩形属性
   * @param x 左上角X坐标
   * @param y 左上角Y坐标
   * @param width 宽度
   * @param height 高度
   * @returns 当前矩形实例（链式调用）
   */
    set(x: number, y: number, width: number, height: number): this {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        return this;
    }

    /**
   * 复制另一个矩形的值
   * @param other 源矩形
   * @returns 当前矩形实例（链式调用）
   */
    copy(other: Rectangle): this {
        this.x = other.x;
        this.y = other.y;
        this.width = other.width;
        this.height = other.height;
        return this;
    }

    /**
   * 克隆当前矩形
   * @returns 新的矩形实例
   */
    clone(): Rectangle {
        return new Rectangle(this.x, this.y, this.width, this.height);
    }

    /**
   * 设置矩形位置
   * @param x 新的X坐标
   * @param y 新的Y坐标
   * @returns 当前矩形实例（链式调用）
   */
    setPosition(x: number, y: number): this {
        this.x = x;
        this.y = y;
        return this;
    }

    /**
   * 设置矩形大小
   * @param width 新的宽度
   * @param height 新的高度
   * @returns 当前矩形实例（链式调用）
   */
    setSize(width: number, height: number): this {
        this.width = width;
        this.height = height;
        return this;
    }

    /**
   * 设置矩形中心点
   * @param centerX 中心X坐标
   * @param centerY 中心Y坐标
   * @returns 当前矩形实例（链式调用）
   */
    setCenter(centerX: number, centerY: number): this {
        this.x = centerX - this.width * 0.5;
        this.y = centerY - this.height * 0.5;
        return this;
    }

    // 变换操作

    /**
   * 平移矩形
   * @param dx X方向偏移
   * @param dy Y方向偏移
   * @returns 当前矩形实例（链式调用）
   */
    translate(dx: number, dy: number): this {
        this.x += dx;
        this.y += dy;
        return this;
    }

    /**
   * 缩放矩形（从中心缩放）
   * @param scaleX X方向缩放因子
   * @param scaleY Y方向缩放因子，默认等于scaleX
   * @returns 当前矩形实例（链式调用）
   */
    scale(scaleX: number, scaleY: number = scaleX): this {
        const centerX = this.centerX;
        const centerY = this.centerY;
        this.width *= scaleX;
        this.height *= scaleY;
        return this.setCenter(centerX, centerY);
    }

    /**
   * 扩展矩形
   * @param amount 扩展量（正值扩大，负值缩小）
   * @returns 当前矩形实例（链式调用）
   */
    inflate(amount: number): this {
        this.x -= amount;
        this.y -= amount;
        this.width += amount * 2;
        this.height += amount * 2;
        return this;
    }

    /**
   * 扩展矩形（分别指定水平和垂直方向）
   * @param horizontal 水平方向扩展量
   * @param vertical 垂直方向扩展量
   * @returns 当前矩形实例（链式调用）
   */
    inflateXY(horizontal: number, vertical: number): this {
        this.x -= horizontal;
        this.y -= vertical;
        this.width += horizontal * 2;
        this.height += vertical * 2;
        return this;
    }

    // 包含检测

    /**
   * 检查是否包含指定点
   * @param point 点
   * @returns 是否包含
   */
    containsPoint(point: Vector2): boolean {
        return point.x >= this.x && point.x <= this.right &&
           point.y >= this.y && point.y <= this.bottom;
    }

    /**
   * 检查是否包含指定坐标
   * @param x X坐标
   * @param y Y坐标
   * @returns 是否包含
   */
    contains(x: number, y: number): boolean {
        return x >= this.x && x <= this.right &&
           y >= this.y && y <= this.bottom;
    }

    /**
   * 检查是否完全包含另一个矩形
   * @param other 另一个矩形
   * @returns 是否完全包含
   */
    containsRect(other: Rectangle): boolean {
        return this.x <= other.x && this.y <= other.y &&
           this.right >= other.right && this.bottom >= other.bottom;
    }

    // 相交检测

    /**
   * 检查是否与另一个矩形相交
   * @param other 另一个矩形
   * @returns 是否相交
   */
    intersects(other: Rectangle): boolean {
        return this.x < other.right && this.right > other.x &&
           this.y < other.bottom && this.bottom > other.y;
    }

    /**
   * 计算与另一个矩形的相交矩形
   * @param other 另一个矩形
   * @returns 相交矩形，如果不相交返回空矩形
   */
    intersection(other: Rectangle): Rectangle {
        if (!this.intersects(other)) {
            return Rectangle.EMPTY.clone();
        }

        const x = Math.max(this.x, other.x);
        const y = Math.max(this.y, other.y);
        const right = Math.min(this.right, other.right);
        const bottom = Math.min(this.bottom, other.bottom);

        return new Rectangle(x, y, right - x, bottom - y);
    }

    /**
   * 计算与另一个矩形的并集矩形
   * @param other 另一个矩形
   * @returns 并集矩形
   */
    union(other: Rectangle): Rectangle {
        const x = Math.min(this.x, other.x);
        const y = Math.min(this.y, other.y);
        const right = Math.max(this.right, other.right);
        const bottom = Math.max(this.bottom, other.bottom);

        return new Rectangle(x, y, right - x, bottom - y);
    }

    /**
   * 计算相交面积
   * @param other 另一个矩形
   * @returns 相交面积
   */
    intersectionArea(other: Rectangle): number {
        const intersection = this.intersection(other);
        return intersection.isEmpty ? 0 : intersection.area;
    }

    // 距离计算

    /**
   * 计算点到矩形的最短距离
   * @param point 点
   * @returns 最短距离
   */
    distanceToPoint(point: Vector2): number {
        const dx = Math.max(0, Math.max(this.x - point.x, point.x - this.right));
        const dy = Math.max(0, Math.max(this.y - point.y, point.y - this.bottom));
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
   * 计算两个矩形间的最短距离
   * @param other 另一个矩形
   * @returns 最短距离（相交时为0）
   */
    distanceToRect(other: Rectangle): number {
        if (this.intersects(other)) {
            return 0;
        }

        const dx = Math.max(0, Math.max(this.x - other.right, other.x - this.right));
        const dy = Math.max(0, Math.max(this.y - other.bottom, other.y - this.bottom));
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
   * 获取矩形上距离指定点最近的点
   * @param point 指定点
   * @returns 最近点
   */
    closestPointTo(point: Vector2): Vector2 {
        return new Vector2(
            Math.max(this.x, Math.min(this.right, point.x)),
            Math.max(this.y, Math.min(this.bottom, point.y))
        );
    }

    // 比较操作

    /**
   * 检查两个矩形是否相等
   * @param other 另一个矩形
   * @param epsilon 容差，默认为Number.EPSILON
   * @returns 是否相等
   */
    equals(other: Rectangle, epsilon: number = Number.EPSILON): boolean {
        return Math.abs(this.x - other.x) < epsilon &&
           Math.abs(this.y - other.y) < epsilon &&
           Math.abs(this.width - other.width) < epsilon &&
           Math.abs(this.height - other.height) < epsilon;
    }

    /**
   * 检查两个矩形是否完全相等
   * @param other 另一个矩形
   * @returns 是否完全相等
   */
    exactEquals(other: Rectangle): boolean {
        return this.x === other.x && this.y === other.y &&
           this.width === other.width && this.height === other.height;
    }

    // 静态方法

    /**
   * 从中心点和大小创建矩形
   * @param centerX 中心X坐标
   * @param centerY 中心Y坐标
   * @param width 宽度
   * @param height 高度
   * @returns 新的矩形实例
   */
    static fromCenter(centerX: number, centerY: number, width: number, height: number): Rectangle {
        return new Rectangle(centerX - width * 0.5, centerY - height * 0.5, width, height);
    }

    /**
   * 从两个点创建矩形
   * @param point1 第一个点
   * @param point2 第二个点
   * @returns 新的矩形实例
   */
    static fromPoints(point1: Vector2, point2: Vector2): Rectangle {
        const x = Math.min(point1.x, point2.x);
        const y = Math.min(point1.y, point2.y);
        const width = Math.abs(point2.x - point1.x);
        const height = Math.abs(point2.y - point1.y);
        return new Rectangle(x, y, width, height);
    }

    /**
   * 从点数组创建包围矩形
   * @param points 点数组
   * @returns 包围矩形
   */
    static fromPointArray(points: Vector2[]): Rectangle {
        if (points.length === 0) {
            return Rectangle.EMPTY.clone();
        }

        let minX = points[0].x;
        let minY = points[0].y;
        let maxX = points[0].x;
        let maxY = points[0].y;

        for (let i = 1; i < points.length; i++) {
            minX = Math.min(minX, points[i].x);
            minY = Math.min(minY, points[i].y);
            maxX = Math.max(maxX, points[i].x);
            maxY = Math.max(maxY, points[i].y);
        }

        return new Rectangle(minX, minY, maxX - minX, maxY - minY);
    }

    /**
   * 创建正方形
   * @param x 左上角X坐标
   * @param y 左上角Y坐标
   * @param size 边长
   * @returns 新的正方形矩形
   */
    static square(x: number, y: number, size: number): Rectangle {
        return new Rectangle(x, y, size, size);
    }

    /**
   * 线性插值两个矩形
   * @param a 起始矩形
   * @param b 目标矩形
   * @param t 插值参数（0到1）
   * @returns 新的插值结果矩形
   */
    static lerp(a: Rectangle, b: Rectangle, t: number): Rectangle {
        return new Rectangle(
            a.x + (b.x - a.x) * t,
            a.y + (b.y - a.y) * t,
            a.width + (b.width - a.width) * t,
            a.height + (b.height - a.height) * t
        );
    }

    // 字符串转换

    /**
   * 转换为字符串
   * @returns 字符串表示
   */
    toString(): string {
        return `Rectangle(${this.x.toFixed(2)}, ${this.y.toFixed(2)}, ${this.width.toFixed(2)}, ${this.height.toFixed(2)})`;
    }

    /**
   * 转换为数组
   * @returns [x, y, width, height] 数组
   */
    toArray(): [number, number, number, number] {
        return [this.x, this.y, this.width, this.height];
    }

    /**
   * 转换为普通对象
   * @returns {x, y, width, height} 对象
   */
    toObject(): { x: number; y: number; width: number; height: number } {
        return { x: this.x, y: this.y, width: this.width, height: this.height };
    }

    /**
   * 获取四个顶点
   * @returns 顶点数组 [topLeft, topRight, bottomRight, bottomLeft]
   */
    getVertices(): Vector2[] {
        return [
            this.topLeft,
            this.topRight,
            this.bottomRight,
            this.bottomLeft
        ];
    }
}
