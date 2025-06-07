import { Vector2 } from './Vector2';

/**
 * 矩形类
 * 表示一个二维矩形区域，提供基本的几何操作
 */
export class Rectangle {
    /**
     * 矩形左上角的X坐标
     */
    public x: number = 0;

    /**
     * 矩形左上角的Y坐标
     */
    public y: number = 0;

    /**
     * 矩形的宽度
     */
    public width: number = 0;

    /**
     * 矩形的高度
     */
    public height: number = 0;

    /**
     * 构造函数
     * @param x 左上角X坐标
     * @param y 左上角Y坐标
     * @param width 宽度
     * @param height 高度
     */
    constructor(x: number = 0, y: number = 0, width: number = 0, height: number = 0) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    /**
     * 返回空矩形实例
     */
    public static get empty(): Rectangle {
        return new Rectangle();
    }

    /**
     * 获取矩形左边界的X坐标
     */
    public get left(): number {
        return this.x;
    }

    /**
     * 获取矩形右边界的X坐标
     */
    public get right(): number {
        return this.x + this.width;
    }

    /**
     * 获取矩形上边界的Y坐标
     */
    public get top(): number {
        return this.y;
    }

    /**
     * 获取矩形下边界的Y坐标
     */
    public get bottom(): number {
        return this.y + this.height;
    }

    /**
     * 获取矩形的中心点坐标
     */
    public get center(): Vector2 {
        return new Vector2(this.x + this.width / 2, this.y + this.height / 2);
    }

    /**
     * 获取或设置矩形的位置（左上角坐标）
     */
    public get location(): Vector2 {
        return new Vector2(this.x, this.y);
    }

    public set location(value: Vector2) {
        this.x = value.x;
        this.y = value.y;
    }

    /**
     * 获取或设置矩形的尺寸
     */
    public get size(): Vector2 {
        return new Vector2(this.width, this.height);
    }

    public set size(value: Vector2) {
        this.width = value.x;
        this.height = value.y;
    }

    /**
     * 检查指定点是否在矩形内
     * @param x 点的X坐标
     * @param y 点的Y坐标
     * @returns 如果点在矩形内返回true，否则返回false
     */
    public contains(x: number, y: number): boolean;
    /**
     * 检查指定点是否在矩形内
     * @param point 要检查的点
     * @returns 如果点在矩形内返回true，否则返回false
     */
    public contains(point: Vector2): boolean;
    public contains(xOrPoint: number | Vector2, y?: number): boolean {
        if (typeof xOrPoint === 'number') {
            return xOrPoint >= this.x && xOrPoint < this.right && y! >= this.y && y! < this.bottom;
        } else {
            return this.contains(xOrPoint.x, xOrPoint.y);
        }
    }

    /**
     * 检查当前矩形是否与另一个矩形相交
     * @param other 要检查的矩形
     * @returns 如果两个矩形相交返回true，否则返回false
     */
    public intersects(other: Rectangle): boolean {
        return other.left < this.right && this.left < other.right && 
               other.top < this.bottom && this.top < other.bottom;
    }

    /**
     * 获取当前矩形与另一个矩形的交集
     * @param other 要计算交集的矩形
     * @returns 交集矩形，如果不相交则返回空矩形
     */
    public intersection(other: Rectangle): Rectangle {
        const x1 = Math.max(this.x, other.x);
        const x2 = Math.min(this.right, other.right);
        const y1 = Math.max(this.y, other.y);
        const y2 = Math.min(this.bottom, other.bottom);

        if (x2 >= x1 && y2 >= y1) {
            return new Rectangle(x1, y1, x2 - x1, y2 - y1);
        }

        return Rectangle.empty;
    }

    /**
     * 计算包含两个矩形的最小矩形
     * @param rect1 第一个矩形
     * @param rect2 第二个矩形
     * @returns 包含两个矩形的最小矩形
     */
    public static union(rect1: Rectangle, rect2: Rectangle): Rectangle {
        const x = Math.min(rect1.x, rect2.x);
        const y = Math.min(rect1.y, rect2.y);
        const right = Math.max(rect1.right, rect2.right);
        const bottom = Math.max(rect1.bottom, rect2.bottom);
        
        return new Rectangle(x, y, right - x, bottom - y);
    }

    /**
     * 按指定偏移量移动矩形
     * @param offsetX X轴偏移量
     * @param offsetY Y轴偏移量
     */
    public offset(offsetX: number, offsetY: number): void {
        this.x += offsetX;
        this.y += offsetY;
    }

    /**
     * 按指定量扩展矩形
     * @param horizontalAmount 水平扩展量
     * @param verticalAmount 垂直扩展量
     */
    public inflate(horizontalAmount: number, verticalAmount: number): void {
        this.x -= horizontalAmount;
        this.y -= verticalAmount;
        this.width += horizontalAmount * 2;
        this.height += verticalAmount * 2;
    }

    /**
     * 检查矩形是否为空（所有值都为0）
     * @returns 如果矩形为空返回true，否则返回false
     */
    public isEmpty(): boolean {
        return this.width === 0 && this.height === 0 && this.x === 0 && this.y === 0;
    }

    /**
     * 比较两个矩形是否相等
     * @param other 要比较的矩形
     * @returns 如果两个矩形相等返回true，否则返回false
     */
    public equals(other: Rectangle): boolean {
        return this.x === other.x && this.y === other.y && 
               this.width === other.width && this.height === other.height;
    }

    /**
     * 创建当前矩形的副本
     * @returns 矩形的副本
     */
    public clone(): Rectangle {
        return new Rectangle(this.x, this.y, this.width, this.height);
    }
} 