/**
 * 高性能位操作类
 * 基于BigInt实现，支持任意数量的位操作
 */
export class Bits {
    private _value: bigint = 0n;

    constructor(initialValue: bigint = 0n) {
        this._value = initialValue;
    }

    /**
     * 设置指定位置的位为1
     */
    public set(index: number): void {
        if (index < 0) {
            throw new Error('Bit index cannot be negative');
        }
        this._value |= (1n << BigInt(index));
    }

    /**
     * 清除指定位置的位（设为0）
     */
    public clear(index: number): void {
        if (index < 0) {
            throw new Error('Bit index cannot be negative');
        }
        this._value &= ~(1n << BigInt(index));
    }

    /**
     * 获取指定位置的位值
     */
    public get(index: number): boolean {
        if (index < 0) {
            return false;
        }
        return (this._value & (1n << BigInt(index))) !== 0n;
    }

    /**
     * 检查是否包含所有指定的位
     */
    public containsAll(other: Bits): boolean {
        return (this._value & other._value) === other._value;
    }

    /**
     * 检查是否包含任意一个指定的位
     */
    public intersects(other: Bits): boolean {
        return (this._value & other._value) !== 0n;
    }

    /**
     * 检查是否不包含任何指定的位
     */
    public excludes(other: Bits): boolean {
        return !this.intersects(other);
    }

    /**
     * 清空所有位
     */
    public clearAll(): void {
        this._value = 0n;
    }

    /**
     * 检查是否为空（没有设置任何位）
     */
    public isEmpty(): boolean {
        return this._value === 0n;
    }

    /**
     * 获取设置的位数量
     */
    public cardinality(): number {
        let count = 0;
        let value = this._value;
        
        while (value > 0n) {
            if (value & 1n) {
                count++;
            }
            value >>= 1n;
        }
        
        return count;
    }

    /**
     * 位运算：与
     */
    public and(other: Bits): Bits {
        return new Bits(this._value & other._value);
    }

    /**
     * 位运算：或
     */
    public or(other: Bits): Bits {
        return new Bits(this._value | other._value);
    }

    /**
     * 位运算：异或
     */
    public xor(other: Bits): Bits {
        return new Bits(this._value ^ other._value);
    }

    /**
     * 位运算：非
     */
    public not(maxBits: number = 64): Bits {
        const mask = (1n << BigInt(maxBits)) - 1n;
        return new Bits((~this._value) & mask);
    }

    /**
     * 复制另一个Bits对象
     */
    public copyFrom(other: Bits): void {
        this._value = other._value;
    }

    /**
     * 创建当前Bits的副本
     */
    public clone(): Bits {
        return new Bits(this._value);
    }

    /**
     * 获取原始BigInt值
     */
    public getValue(): bigint {
        return this._value;
    }

    /**
     * 设置原始BigInt值
     */
    public setValue(value: bigint): void {
        this._value = value;
    }

    /**
     * 获取调试信息
     */
    public toString(): string {
        const bits: string[] = [];
        let index = 0;
        let value = this._value;
        
        while (value > 0n) {
            if (value & 1n) {
                bits.push(index.toString());
            }
            value >>= 1n;
            index++;
        }
        
        return `Bits[${bits.join(', ')}]`;
    }

    /**
     * 获取二进制表示
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
     */
    public toHexString(): string {
        return '0x' + this._value.toString(16).toUpperCase();
    }

    /**
     * 从二进制字符串创建Bits
     */
    public static fromBinaryString(binaryString: string): Bits {
        const cleanString = binaryString.replace(/\s/g, '');
        const value = BigInt('0b' + cleanString);
        return new Bits(value);
    }

    /**
     * 从十六进制字符串创建Bits
     */
    public static fromHexString(hexString: string): Bits {
        const cleanString = hexString.replace(/^0x/i, '');
        const value = BigInt('0x' + cleanString);
        return new Bits(value);
    }

    /**
     * 比较两个Bits对象是否相等
     */
    public equals(other: Bits): boolean {
        return this._value === other._value;
    }

    /**
     * 获取最高位的索引
     */
    public getHighestBitIndex(): number {
        if (this._value === 0n) {
            return -1;
        }
        
        let index = 0;
        let value = this._value;
        
        while (value > 1n) {
            value >>= 1n;
            index++;
        }
        
        return index;
    }

    /**
     * 获取最低位的索引
     */
    public getLowestBitIndex(): number {
        if (this._value === 0n) {
            return -1;
        }
        
        let index = 0;
        let value = this._value;
        
        while ((value & 1n) === 0n) {
            value >>= 1n;
            index++;
        }
        
        return index;
    }
}