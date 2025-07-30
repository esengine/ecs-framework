import { IBigIntLike, BigIntFactory } from './BigIntCompatibility';

/**
 * 高性能位操作类
 * 
 * 基于BigInt实现，支持任意数量的位操作。
 * 自动适配运行环境，在不支持BigInt的环境中使用兼容实现。
 * 
 * @example
 * ```typescript
 * const bits = new Bits();
 * bits.set(0);
 * bits.set(5);
 * console.log(bits.get(0)); // true
 * console.log(bits.get(1)); // false
 * ```
 */
export class Bits {
    private _value: IBigIntLike;

    /**
     * 构造函数
     * @param initialValue 初始值，可以是IBigIntLike或数值
     */
    constructor(initialValue?: IBigIntLike | number | string) {
        if (initialValue && typeof initialValue === 'object') {
            this._value = initialValue;
        } else {
            this._value = BigIntFactory.create(initialValue || 0);
        }
    }

    /**
     * 设置指定位置的位为1
     * @param index 位索引（从0开始）
     * @throws {Error} 当索引为负数时抛出错误
     */
    public set(index: number): void {
        if (index < 0) {
            throw new Error('Bit index cannot be negative');
        }
        const mask = BigIntFactory.one().shiftLeft(index);
        this._value = this._value.or(mask);
    }

    /**
     * 清除指定位置的位（设为0）
     * @param index 位索引（从0开始）
     * @throws {Error} 当索引为负数时抛出错误
     */
    public clear(index: number): void {
        if (index < 0) {
            throw new Error('Bit index cannot be negative');
        }
        const mask = BigIntFactory.one().shiftLeft(index).not();
        this._value = this._value.and(mask);
    }

    /**
     * 获取指定位置的位值
     * @param index 位索引（从0开始）
     * @returns 位值（true表示1，false表示0）
     */
    public get(index: number): boolean {
        if (index < 0) {
            return false;
        }
        const mask = BigIntFactory.one().shiftLeft(index);
        return !this._value.and(mask).isZero();
    }

    /**
     * 检查是否包含所有指定的位
     * @param other 另一个Bits对象
     * @returns 是否包含所有指定的位
     */
    public containsAll(other: Bits): boolean {
        const intersection = this._value.and(other._value);
        return intersection.equals(other._value);
    }

    /**
     * 检查是否包含任意一个指定的位
     * @param other 另一个Bits对象
     * @returns 是否包含任意一个指定的位
     */
    public intersects(other: Bits): boolean {
        return !this._value.and(other._value).isZero();
    }

    /**
     * 检查是否不包含任何指定的位
     * @param other 另一个Bits对象
     * @returns 是否不包含任何指定的位
     */
    public excludes(other: Bits): boolean {
        return !this.intersects(other);
    }

    /**
     * 清空所有位
     */
    public clearAll(): void {
        this._value = BigIntFactory.zero();
    }

    /**
     * 检查是否为空（没有设置任何位）
     * @returns 是否为空
     */
    public isEmpty(): boolean {
        return this._value.isZero();
    }

    /**
     * 获取设置的位数量
     * @returns 设置为1的位数量
     */
    public cardinality(): number {
        let count = 0;
        let value = this._value.clone();
        
        while (!value.isZero()) {
            const one = BigIntFactory.one();
            if (!value.and(one).isZero()) {
                count++;
            }
            value = value.shiftRight(1);
        }
        
        return count;
    }

    /**
     * 位运算：与
     * @param other 另一个Bits对象
     * @returns 新的Bits对象，包含与运算结果
     */
    public and(other: Bits): Bits {
        return new Bits(this._value.and(other._value));
    }

    /**
     * 位运算：或
     * @param other 另一个Bits对象
     * @returns 新的Bits对象，包含或运算结果
     */
    public or(other: Bits): Bits {
        return new Bits(this._value.or(other._value));
    }

    /**
     * 位运算：异或
     * @param other 另一个Bits对象
     * @returns 新的Bits对象，包含异或运算结果
     */
    public xor(other: Bits): Bits {
        return new Bits(this._value.xor(other._value));
    }

    /**
     * 位运算：非
     * @param maxBits 最大位数限制，默认64位
     * @returns 新的Bits对象，包含非运算结果
     */
    public not(maxBits: number = 64): Bits {
        return new Bits(this._value.not(maxBits));
    }

    /**
     * 复制另一个Bits对象
     * @param other 要复制的Bits对象
     */
    public copyFrom(other: Bits): void {
        this._value = other._value.clone();
    }

    /**
     * 创建当前Bits的副本
     * @returns 新的Bits对象副本
     */
    public clone(): Bits {
        return new Bits(this._value.clone());
    }

    /**
     * 获取原始值
     * @returns 原始的IBigIntLike值
     */
    public getValue(): IBigIntLike {
        return this._value;
    }

    /**
     * 设置原始值
     * @param value 新的值，可以是IBigIntLike或数值
     */
    public setValue(value: IBigIntLike | number | string): void {
        if (typeof value === 'object') {
            this._value = value;
        } else {
            this._value = BigIntFactory.create(value);
        }
    }

    /**
     * 获取调试信息
     * @returns 返回显示设置位索引的字符串
     */
    public toString(): string {
        const bits: string[] = [];
        let index = 0;
        let value = this._value.clone();
        
        while (!value.isZero()) {
            const one = BigIntFactory.one();
            if (!value.and(one).isZero()) {
                bits.push(index.toString());
            }
            value = value.shiftRight(1);
            index++;
        }
        
        return `Bits[${bits.join(', ')}]`;
    }

    /**
     * 获取二进制表示
     * @param maxBits 最大位数，默认64位
     * @returns 二进制字符串表示
     */
    public toBinaryString(maxBits: number = 64): string {
        let result = '';
        for (let i = maxBits - 1; i >= 0; i--) {
            result += this.get(i) ? '1' : '0';
            if (i % 8 === 0 && i > 0) {
                result += ' ';
            }
        }
        return result;
    }

    /**
     * 获取十六进制表示
     * @returns 十六进制字符串表示
     */
    public toHexString(): string {
        return '0x' + this._value.toString(16).toUpperCase();
    }

    /**
     * 从二进制字符串创建Bits
     * @param binaryString 二进制字符串
     * @returns 新的Bits对象
     */
    public static fromBinaryString(binaryString: string): Bits {
        const cleanString = binaryString.replace(/\s/g, '');
        const value = BigIntFactory.fromBinaryString(cleanString);
        return new Bits(value);
    }

    /**
     * 从十六进制字符串创建Bits
     * @param hexString 十六进制字符串
     * @returns 新的Bits对象
     */
    public static fromHexString(hexString: string): Bits {
        const value = BigIntFactory.fromHexString(hexString);
        return new Bits(value);
    }

    /**
     * 比较两个Bits对象是否相等
     * @param other 另一个Bits对象
     * @returns 是否相等
     */
    public equals(other: Bits): boolean {
        return this._value.equals(other._value);
    }

    /**
     * 获取最高位的索引
     * @returns 最高位的索引，如果为空则返回-1
     */
    public getHighestBitIndex(): number {
        if (this._value.isZero()) {
            return -1;
        }
        
        let index = 0;
        let value = this._value.clone();
        
        while (!value.shiftRight(1).isZero()) {
            value = value.shiftRight(1);
            index++;
        }
        
        return index;
    }

    /**
     * 获取最低位的索引
     * @returns 最低位的索引，如果为空则返回-1
     */
    public getLowestBitIndex(): number {
        if (this._value.isZero()) {
            return -1;
        }
        
        let index = 0;
        let value = this._value.clone();
        const one = BigIntFactory.one();
        
        while (value.and(one).isZero()) {
            value = value.shiftRight(1);
            index++;
        }
        
        return index;
    }
}