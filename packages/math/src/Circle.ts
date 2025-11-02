import { Vector2 } from './Vector2';
import { Rectangle } from './Rectangle';

/**
 * 2D圆形类
 *
 * 表示一个圆形，提供圆形相关的几何运算功能：
 * - 圆形创建和属性获取
 * - 包含检测（点、圆形）
 * - 相交检测和计算
 * - 变换和操作
 */
export class Circle {
    /** 圆心X坐标 */
    public x: number;

    /** 圆心Y坐标 */
    public y: number;

    /** 半径 */
    public radius: number;

    /**
   * 创建圆形
   * @param x 圆心X坐标，默认为0
   * @param y 圆心Y坐标，默认为0
   * @param radius 半径，默认为0
   */
    constructor(x: number = 0, y: number = 0, radius: number = 0) {
        this.x = x;
        this.y = y;
        this.radius = radius;
    }

    // 静态常量
    /** 空圆形 */
    static readonly EMPTY = new Circle(0, 0, 0);

    /** 单位圆 */
    static readonly UNIT = new Circle(0, 0, 1);

    // 属性获取

    /** 获取圆心坐标 */
    get center(): Vector2 {
        return new Vector2(this.x, this.y);
    }

    /** 设置圆心坐标 */
    set center(value: Vector2) {
        this.x = value.x;
        this.y = value.y;
    }

    /** 获取直径 */
    get diameter(): number {
        return this.radius * 2;
    }

    /** 设置直径 */
    set diameter(value: number) {
        this.radius = value * 0.5;
    }

    /** 获取面积 */
    get area(): number {
        return Math.PI * this.radius * this.radius;
    }

    /** 获取周长 */
    get circumference(): number {
        return 2 * Math.PI * this.radius;
    }

    /** 获取包围矩形 */
    get bounds(): Rectangle {
        return new Rectangle(
            this.x - this.radius,
            this.y - this.radius,
            this.diameter,
            this.diameter
        );
    }

    /** 检查是否为空圆形 */
    get isEmpty(): boolean {
        return this.radius <= 0;
    }

    // 基础操作

    /**
   * 设置圆形属性
   * @param x 圆心X坐标
   * @param y 圆心Y坐标
   * @param radius 半径
   * @returns 当前圆形实例（链式调用）
   */
    set(x: number, y: number, radius: number): this {
        this.x = x;
        this.y = y;
        this.radius = radius;
        return this;
    }

    /**
   * 复制另一个圆形的值
   * @param other 源圆形
   * @returns 当前圆形实例（链式调用）
   */
    copy(other: Circle): this {
        this.x = other.x;
        this.y = other.y;
        this.radius = other.radius;
        return this;
    }

    /**
   * 克隆当前圆形
   * @returns 新的圆形实例
   */
    clone(): Circle {
        return new Circle(this.x, this.y, this.radius);
    }

    /**
   * 设置圆心位置
   * @param x 新的X坐标
   * @param y 新的Y坐标
   * @returns 当前圆形实例（链式调用）
   */
    setPosition(x: number, y: number): this {
        this.x = x;
        this.y = y;
        return this;
    }

    /**
   * 设置圆心位置（使用向量）
   * @param center 新的圆心位置
   * @returns 当前圆形实例（链式调用）
   */
    setCenter(center: Vector2): this {
        this.x = center.x;
        this.y = center.y;
        return this;
    }

    /**
   * 设置半径
   * @param radius 新的半径
   * @returns 当前圆形实例（链式调用）
   */
    setRadius(radius: number): this {
        this.radius = radius;
        return this;
    }

    // 变换操作

    /**
   * 平移圆形
   * @param dx X方向偏移
   * @param dy Y方向偏移
   * @returns 当前圆形实例（链式调用）
   */
    translate(dx: number, dy: number): this {
        this.x += dx;
        this.y += dy;
        return this;
    }

    /**
   * 平移圆形（使用向量）
   * @param offset 偏移向量
   * @returns 当前圆形实例（链式调用）
   */
    translateBy(offset: Vector2): this {
        this.x += offset.x;
        this.y += offset.y;
        return this;
    }

    /**
   * 缩放圆形
   * @param scale 缩放因子
   * @returns 当前圆形实例（链式调用）
   */
    scale(scale: number): this {
        this.radius *= scale;
        return this;
    }

    /**
   * 扩展圆形
   * @param amount 扩展量（正值扩大半径，负值缩小半径）
   * @returns 当前圆形实例（链式调用）
   */
    inflate(amount: number): this {
        this.radius += amount;
        return this;
    }

    // 包含检测

    /**
   * 检查是否包含指定点
   * @param point 点
   * @returns 是否包含
   */
    containsPoint(point: Vector2): boolean {
        const dx = point.x - this.x;
        const dy = point.y - this.y;
        return dx * dx + dy * dy <= this.radius * this.radius;
    }

    /**
   * 检查是否包含指定坐标
   * @param x X坐标
   * @param y Y坐标
   * @returns 是否包含
   */
    contains(x: number, y: number): boolean {
        const dx = x - this.x;
        const dy = y - this.y;
        return dx * dx + dy * dy <= this.radius * this.radius;
    }

    /**
   * 检查是否完全包含另一个圆形
   * @param other 另一个圆形
   * @returns 是否完全包含
   */
    containsCircle(other: Circle): boolean {
        const distance = this.distanceToCircle(other);
        return distance + other.radius <= this.radius;
    }

    /**
   * 检查点是否在圆的边界上
   * @param point 点
   * @param epsilon 容差，默认为Number.EPSILON
   * @returns 是否在边界上
   */
    pointOnBoundary(point: Vector2, epsilon: number = Number.EPSILON): boolean {
        const distance = this.distanceToPoint(point);
        return Math.abs(distance - this.radius) < epsilon;
    }

    // 相交检测

    /**
   * 检查是否与另一个圆形相交
   * @param other 另一个圆形
   * @returns 是否相交
   */
    intersects(other: Circle): boolean {
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        const distanceSquared = dx * dx + dy * dy;
        const radiusSum = this.radius + other.radius;
        return distanceSquared <= radiusSum * radiusSum;
    }

    /**
   * 检查是否与矩形相交
   * @param rect 矩形
   * @returns 是否相交
   */
    intersectsRect(rect: Rectangle): boolean {
    // 找到矩形上离圆心最近的点
        const closestX = Math.max(rect.x, Math.min(this.x, rect.right));
        const closestY = Math.max(rect.y, Math.min(this.y, rect.bottom));

        // 计算圆心到最近点的距离
        const dx = this.x - closestX;
        const dy = this.y - closestY;

        return dx * dx + dy * dy <= this.radius * this.radius;
    }

    /**
   * 计算与另一个圆形的相交面积
   * @param other 另一个圆形
   * @returns 相交面积
   */
    intersectionArea(other: Circle): number {
        const d = this.distanceToCircle(other);

        // 不相交
        if (d >= this.radius + other.radius) {
            return 0;
        }

        // 一个圆完全包含另一个圆
        if (d <= Math.abs(this.radius - other.radius)) {
            const smallerRadius = Math.min(this.radius, other.radius);
            return Math.PI * smallerRadius * smallerRadius;
        }

        // 部分相交
        const r1 = this.radius;
        const r2 = other.radius;

        const part1 = r1 * r1 * Math.acos((d * d + r1 * r1 - r2 * r2) / (2 * d * r1));
        const part2 = r2 * r2 * Math.acos((d * d + r2 * r2 - r1 * r1) / (2 * d * r2));
        const part3 = 0.5 * Math.sqrt((-d + r1 + r2) * (d + r1 - r2) * (d - r1 + r2) * (d + r1 + r2));

        return part1 + part2 - part3;
    }

    // 距离计算

    /**
   * 计算圆心到点的距离
   * @param point 点
   * @returns 距离
   */
    distanceToPoint(point: Vector2): number {
        const dx = point.x - this.x;
        const dy = point.y - this.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
   * 计算圆形边界到点的最短距离
   * @param point 点
   * @returns 最短距离（点在圆内时为负值）
   */
    distanceToPointFromBoundary(point: Vector2): number {
        return this.distanceToPoint(point) - this.radius;
    }

    /**
   * 计算两个圆心之间的距离
   * @param other 另一个圆形
   * @returns 圆心距离
   */
    distanceToCircle(other: Circle): number {
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
   * 计算两个圆形边界之间的最短距离
   * @param other 另一个圆形
   * @returns 最短距离（相交时为负值）
   */
    distanceToCircleFromBoundary(other: Circle): number {
        return this.distanceToCircle(other) - this.radius - other.radius;
    }

    /**
   * 计算圆形到矩形的最短距离
   * @param rect 矩形
   * @returns 最短距离
   */
    distanceToRect(rect: Rectangle): number {
        return Math.max(0, rect.distanceToPoint(this.center) - this.radius);
    }

    /**
   * 获取圆形上距离指定点最近的点
   * @param point 指定点
   * @returns 最近点
   */
    closestPointTo(point: Vector2): Vector2 {
        const direction = Vector2.subtract(point, this.center);
        if (direction.isZero) {
            // 点在圆心，返回圆上任意点
            return new Vector2(this.x + this.radius, this.y);
        }
        return this.center.clone().add(direction.normalized().multiply(this.radius));
    }

    /**
   * 获取圆形上距离指定点最远的点
   * @param point 指定点
   * @returns 最远点
   */
    farthestPointFrom(point: Vector2): Vector2 {
        const direction = Vector2.subtract(point, this.center);
        if (direction.isZero) {
            // 点在圆心，返回圆上任意点
            return new Vector2(this.x - this.radius, this.y);
        }
        return this.center.clone().subtract(direction.normalized().multiply(this.radius));
    }

    // 几何运算

    /**
   * 获取指定角度上的圆周点
   * @param angle 角度（弧度）
   * @returns 圆周点
   */
    getPointAtAngle(angle: number): Vector2 {
        return new Vector2(
            this.x + this.radius * Math.cos(angle),
            this.y + this.radius * Math.sin(angle)
        );
    }

    /**
   * 获取点相对于圆心的角度
   * @param point 点
   * @returns 角度（弧度）
   */
    getAngleToPoint(point: Vector2): number {
        return Math.atan2(point.y - this.y, point.x - this.x);
    }

    /**
   * 获取圆形与直线的交点
   * @param lineStart 直线起点
   * @param lineEnd 直线终点
   * @returns 交点数组（0-2个点）
   */
    getLineIntersections(lineStart: Vector2, lineEnd: Vector2): Vector2[] {
        const dx = lineEnd.x - lineStart.x;
        const dy = lineEnd.y - lineStart.y;
        const fx = lineStart.x - this.x;
        const fy = lineStart.y - this.y;

        const a = dx * dx + dy * dy;
        const b = 2 * (fx * dx + fy * dy);
        const c = fx * fx + fy * fy - this.radius * this.radius;

        const discriminant = b * b - 4 * a * c;

        if (discriminant < 0) {
            return []; // 无交点
        }

        if (discriminant === 0) {
            // 一个交点（切线）
            const t = -b / (2 * a);
            return [new Vector2(lineStart.x + t * dx, lineStart.y + t * dy)];
        }

        // 两个交点
        const sqrt = Math.sqrt(discriminant);
        const t1 = (-b - sqrt) / (2 * a);
        const t2 = (-b + sqrt) / (2 * a);

        return [
            new Vector2(lineStart.x + t1 * dx, lineStart.y + t1 * dy),
            new Vector2(lineStart.x + t2 * dx, lineStart.y + t2 * dy)
        ];
    }

    // 比较操作

    /**
   * 检查两个圆形是否相等
   * @param other 另一个圆形
   * @param epsilon 容差，默认为Number.EPSILON
   * @returns 是否相等
   */
    equals(other: Circle, epsilon: number = Number.EPSILON): boolean {
        return Math.abs(this.x - other.x) < epsilon &&
           Math.abs(this.y - other.y) < epsilon &&
           Math.abs(this.radius - other.radius) < epsilon;
    }

    /**
   * 检查两个圆形是否完全相等
   * @param other 另一个圆形
   * @returns 是否完全相等
   */
    exactEquals(other: Circle): boolean {
        return this.x === other.x && this.y === other.y && this.radius === other.radius;
    }

    // 静态方法

    /**
   * 从直径创建圆形
   * @param x 圆心X坐标
   * @param y 圆心Y坐标
   * @param diameter 直径
   * @returns 新的圆形实例
   */
    static fromDiameter(x: number, y: number, diameter: number): Circle {
        return new Circle(x, y, diameter * 0.5);
    }

    /**
   * 从三个点创建外接圆
   * @param p1 第一个点
   * @param p2 第二个点
   * @param p3 第三个点
   * @returns 外接圆，如果三点共线返回null
   */
    static fromThreePoints(p1: Vector2, p2: Vector2, p3: Vector2): Circle | null {
        const ax = p1.x; const ay = p1.y;
        const bx = p2.x; const by = p2.y;
        const cx = p3.x; const cy = p3.y;

        const d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));

        if (Math.abs(d) < Number.EPSILON) {
            return null; // 三点共线
        }

        const ux = ((ax * ax + ay * ay) * (by - cy) + (bx * bx + by * by) * (cy - ay) + (cx * cx + cy * cy) * (ay - by)) / d;
        const uy = ((ax * ax + ay * ay) * (cx - bx) + (bx * bx + by * by) * (ax - cx) + (cx * cx + cy * cy) * (bx - ax)) / d;

        const radius = Math.sqrt((ax - ux) * (ax - ux) + (ay - uy) * (ay - uy));

        return new Circle(ux, uy, radius);
    }

    /**
   * 从点数组创建最小包围圆
   * @param points 点数组
   * @returns 最小包围圆
   */
    static fromPointArray(points: Vector2[]): Circle {
        if (points.length === 0) {
            return Circle.EMPTY.clone();
        }

        if (points.length === 1) {
            return new Circle(points[0].x, points[0].y, 0);
        }

        // 使用Welzl算法的简化版本
        // 这里使用更简单的方法：找到包围所有点的圆
        let minX = points[0].x, minY = points[0].y;
        let maxX = points[0].x, maxY = points[0].y;

        for (const point of points) {
            minX = Math.min(minX, point.x);
            minY = Math.min(minY, point.y);
            maxX = Math.max(maxX, point.x);
            maxY = Math.max(maxY, point.y);
        }

        const centerX = (minX + maxX) * 0.5;
        const centerY = (minY + maxY) * 0.5;
        const center = new Vector2(centerX, centerY);

        let maxDistance = 0;
        for (const point of points) {
            const distance = Vector2.distance(center, point);
            maxDistance = Math.max(maxDistance, distance);
        }

        return new Circle(centerX, centerY, maxDistance);
    }

    /**
   * 线性插值两个圆形
   * @param a 起始圆形
   * @param b 目标圆形
   * @param t 插值参数（0到1）
   * @returns 新的插值结果圆形
   */
    static lerp(a: Circle, b: Circle, t: number): Circle {
        return new Circle(
            a.x + (b.x - a.x) * t,
            a.y + (b.y - a.y) * t,
            a.radius + (b.radius - a.radius) * t
        );
    }

    // 字符串转换

    /**
   * 转换为字符串
   * @returns 字符串表示
   */
    toString(): string {
        return `Circle(${this.x.toFixed(2)}, ${this.y.toFixed(2)}, r=${this.radius.toFixed(2)})`;
    }

    /**
   * 转换为数组
   * @returns [x, y, radius] 数组
   */
    toArray(): [number, number, number] {
        return [this.x, this.y, this.radius];
    }

    /**
   * 转换为普通对象
   * @returns {x, y, radius} 对象
   */
    toObject(): { x: number; y: number; radius: number } {
        return { x: this.x, y: this.y, radius: this.radius };
    }
}
