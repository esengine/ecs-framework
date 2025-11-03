/**
 * 尺寸值对象
 * 表示宽度和高度
 */
export class Size {
    private readonly _width: number;
    private readonly _height: number;

    constructor(width: number, height: number) {
        if (width < 0 || height < 0) {
            throw new Error('Size dimensions must be non-negative');
        }
        this._width = width;
        this._height = height;
    }

    get width(): number {
        return this._width;
    }

    get height(): number {
        return this._height;
    }

    /**
     * 获取面积
     */
    get area(): number {
        return this._width * this._height;
    }

    /**
     * 缩放尺寸
     */
    scale(factor: number): Size {
        return new Size(this._width * factor, this._height * factor);
    }

    /**
     * 值对象相等性比较
     */
    equals(other: Size): boolean {
        return this._width === other._width && this._height === other._height;
    }

    /**
     * 转换为普通对象
     */
    toObject(): { width: number; height: number } {
        return { width: this._width, height: this._height };
    }

    /**
     * 从普通对象创建
     */
    static fromObject(obj: { width: number; height: number }): Size {
        return new Size(obj.width, obj.height);
    }
}
