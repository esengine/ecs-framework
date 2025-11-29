/**
 * Position - Immutable 2D position value object
 * 位置 - 不可变的二维位置值对象
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
     * Creates a new Position by adding offset
     * 通过添加偏移量创建新的位置
     */
    add(offset: Position): Position {
        return new Position(this._x + offset._x, this._y + offset._y);
    }

    /**
     * Creates a new Position by subtracting another position
     * 通过减去另一个位置创建新的位置
     */
    subtract(other: Position): Position {
        return new Position(this._x - other._x, this._y - other._y);
    }

    /**
     * Creates a new Position by scaling
     * 通过缩放创建新的位置
     */
    scale(factor: number): Position {
        return new Position(this._x * factor, this._y * factor);
    }

    /**
     * Calculates distance to another position
     * 计算到另一个位置的距离
     */
    distanceTo(other: Position): number {
        const dx = this._x - other._x;
        const dy = this._y - other._y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Checks equality with another position
     * 检查与另一个位置是否相等
     */
    equals(other: Position): boolean {
        return this._x === other._x && this._y === other._y;
    }

    /**
     * Creates a copy of this position
     * 创建此位置的副本
     */
    clone(): Position {
        return new Position(this._x, this._y);
    }

    /**
     * Converts to plain object for serialization
     * 转换为普通对象用于序列化
     */
    toJSON(): { x: number; y: number } {
        return { x: this._x, y: this._y };
    }

    /**
     * Creates Position from plain object
     * 从普通对象创建位置
     */
    static fromJSON(json: { x: number; y: number }): Position {
        return new Position(json.x, json.y);
    }

    /**
     * Zero position constant
     * 零位置常量
     */
    static readonly ZERO = new Position(0, 0);
}
