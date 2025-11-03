/**
 * 位置值对象
 * 表示二维空间中的坐标点
 */
export class Position {
    private readonly _x: number;
    private readonly _y: number;

    constructor(x: number, y: number) {
        this._x = x;
        this._y = y;
    }

    get x(): number {
        return this._x;
    }

    get y(): number {
        return this._y;
    }

    /**
     * 创建新的位置，加上偏移量
     */
    add(offset: Position): Position {
        return new Position(this._x + offset._x, this._y + offset._y);
    }

    /**
     * 创建新的位置，减去偏移量
     */
    subtract(other: Position): Position {
        return new Position(this._x - other._x, this._y - other._y);
    }

    /**
     * 计算到另一个位置的距离
     */
    distanceTo(other: Position): number {
        const dx = this._x - other._x;
        const dy = this._y - other._y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * 值对象相等性比较
     */
    equals(other: Position): boolean {
        return this._x === other._x && this._y === other._y;
    }

    /**
     * 转换为普通对象
     */
    toObject(): { x: number; y: number } {
        return { x: this._x, y: this._y };
    }

    /**
     * 从普通对象创建
     */
    static fromObject(obj: { x: number; y: number }): Position {
        return new Position(obj.x, obj.y);
    }

    /**
     * 创建零位置
     */
    static zero(): Position {
        return new Position(0, 0);
    }
}
