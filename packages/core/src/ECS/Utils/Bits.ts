import { SegmentPart, BitMask64Data, BitMask64Utils } from './BigIntCompatibility';

/**
 * 位集合类，用于高效的位操作
 * 支持任意位的位运算操作.
 */
export class Bits {
    /** 存储位数据的掩码，支持扩展 */
    private _value: BitMask64Data;

    /**
     * 构造函数，创建位集合
     * @param initialValue 初始值，可以是BitMask64Data对象、数字或字符串
     */
    constructor(initialValue?: BitMask64Data | number | string) {
        if (initialValue && typeof initialValue === 'object') {
            this._value = BitMask64Utils.clone(initialValue);
        } else if (typeof initialValue === 'number') {
            this._value = BitMask64Utils.fromNumber(initialValue);
        } else if (typeof initialValue === 'string') {
            const num = parseInt(initialValue, 10);
            this._value = BitMask64Utils.fromNumber(num);
        } else {
            this._value = BitMask64Utils.clone(BitMask64Utils.ZERO);
        }
    }

    /**
     * 设置指定位为1
     * 自动扩展：当索引超过 64 时，自动扩展到 128/256 位
     * @param index 位索引（0-based）
     * @throws 当位索引为负数时抛出错误
     */
    public set(index: number): void {
        if (index < 0) {
            throw new Error('Bit index cannot be negative');
        }

        BitMask64Utils.setBit(this._value, index);
    }

    /**
     * 清除指定位为0
     * @param index 位索引
     * @throws 当位索引为负数时抛出错误
     */
    public clear(index: number): void {
        if (index < 0) {
            throw new Error('Bit index cannot be negative');
        }

        BitMask64Utils.clearBit(this._value, index);
    }

    /**
     * 获取指定位的值
     * @param index 位索引
     * @returns 如果位被设置为1则返回true，否则返回false
     */
    public get(index: number): boolean {
        return BitMask64Utils.getBit(this._value, index);
    }

    /**
     * 检查是否包含另一个位集合的所有位
     * @param other 另一个位集合
     * @returns 如果包含other的所有设置位则返回true
     */
    public containsAll(other: Bits): boolean {
        return BitMask64Utils.hasAll(this._value, other._value);
    }

    /**
     * 检查是否与另一个位集合有交集
     * @param other 另一个位集合
     * @returns 如果有共同的设置位则返回true
     */
    public intersects(other: Bits): boolean {
        return BitMask64Utils.hasAny(this._value, other._value);
    }

    /**
     * 检查是否与另一个位集合没有交集
     * @param other 另一个位集合
     * @returns 如果没有共同的设置位则返回true
     */
    public excludes(other: Bits): boolean {
        return BitMask64Utils.hasNone(this._value, other._value);
    }

    /**
     * 清除所有位为0
     */
    public clearAll(): void {
        BitMask64Utils.clear(this._value);
    }

    /**
     * 检查位集合是否为空
     * @returns 如果所有位都为0则返回true
     */
    public isEmpty(): boolean {
        return BitMask64Utils.isZero(this._value);
    }

    /**
     * 计算设置为1的位数
     * @returns 设置位的总数
     */
    public cardinality(): number {
        return BitMask64Utils.popCount(this._value);
    }

    /**
     * 与另一个位集合执行按位与操作
     * @param other 另一个位集合
     * @returns 新的位集合，包含按位与的结果
     */
    public and(other: Bits): Bits {
        const result = new Bits();
        BitMask64Utils.copy(this._value, result._value);
        BitMask64Utils.andInPlace(result._value, other._value);
        return result;
    }

    /**
     * 与另一个位集合执行按位或操作
     * @param other 另一个位集合
     * @returns 新的位集合，包含按位或的结果
     */
    public or(other: Bits): Bits {
        const result = new Bits();
        BitMask64Utils.copy(this._value, result._value);
        BitMask64Utils.orInPlace(result._value, other._value);
        return result;
    }

    /**
     * 与另一个位集合执行按位异或操作
     * @param other 另一个位集合
     * @returns 新的位集合，包含按位异或的结果
     */
    public xor(other: Bits): Bits {
        const result = new Bits();
        BitMask64Utils.copy(this._value, result._value);
        BitMask64Utils.xorInPlace(result._value, other._value);
        return result;
    }

    /**
     * 执行按位取反操作
     * @param maxBits 最大位数，默认为64
     * @returns 新的位集合，包含按位取反的结果
     */
    public not(maxBits: number = 64): Bits {
        if (maxBits > 64) {
            maxBits = 64;
        }

        const result = new Bits();
        BitMask64Utils.copy(this._value, result._value);

        if (maxBits <= 32) {
            const mask = (1 << maxBits) - 1;
            result._value.base[SegmentPart.LOW] = (~result._value.base[SegmentPart.LOW]) & mask;
            result._value.base[SegmentPart.HIGH] = 0;
        } else {
            result._value.base[SegmentPart.LOW] = ~result._value.base[SegmentPart.LOW];
            if (maxBits < 64) {
                const remainingBits = maxBits - 32;
                const mask = (1 << remainingBits) - 1;
                result._value.base[SegmentPart.HIGH] = (~result._value.base[SegmentPart.HIGH]) & mask;
            } else {
                result._value.base[SegmentPart.HIGH] = ~result._value.base[SegmentPart.HIGH];
            }
        }

        return result;
    }

    /**
     * 从另一个位集合复制值
     * @param other 源位集合
     */
    public copyFrom(other: Bits): void {
        BitMask64Utils.copy(other._value, this._value);
    }

    /**
     * 创建当前位集合的深拷贝
     * @returns 新的位集合，内容与当前位集合相同
     */
    public clone(): Bits {
        return new Bits(this._value);
    }

    /**
     * 获取内部的64位掩码数据
     * @returns 内部存储的BitMask64Data对象
     */
    public getValue(): BitMask64Data {
        return this._value;
    }

    /**
     * 设置位集合的值
     * @param value 新值，可以是BitMask64Data对象、数字或字符串
     */
    public setValue(value: BitMask64Data | number | string): void {
        if (typeof value === 'object') {
            BitMask64Utils.copy(value, this._value);
        } else if (typeof value === 'number') {
            this._value = BitMask64Utils.fromNumber(value);
        } else {
            const num = parseInt(value, 10);
            this._value = BitMask64Utils.fromNumber(num);
        }
    }

    /**
     * 将位集合转换为可读字符串
     * @returns 格式为"Bits[index1, index2, ...]"的字符串
     */
    public toString(): string {
        const bits: string[] = [];
        for (let i = 0; i < 64; i++) {
            if (this.get(i)) {
                bits.push(i.toString());
            }
        }
        return `Bits[${bits.join(', ')}]`;
    }

    /**
     * 将位集合转换为二进制字符串
     * @param maxBits 最大位数，默认为64
     * @returns 二进制字符串表示，每8位用空格分隔
     */
    public toBinaryString(maxBits: number = 0): string {
        if(maxBits == 0){
            maxBits = 64 + (this._value.segments ? this._value.segments.length * 64 : 0);
        }
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
     * 将位集合转换为十六进制字符串
     * @returns 十六进制字符串表示，带0x前缀
     */
    public toHexString(): string {
        return BitMask64Utils.toString(this._value, 16);
    }

    /**
     * 从二进制字符串创建位集合
     * @param binaryString 二进制字符串，可以包含空格
     * @returns 新的位集合对象
     */
    public static fromBinaryString(binaryString: string): Bits {
        const cleanString = binaryString.replace(/\s/g, '');
        let data: BitMask64Data;
        if (cleanString.length <= 32) {
            const num = parseInt(cleanString, 2);
            data = { base: [num >>> 0, 0] };
        } else {
            const loBits = cleanString.substring(cleanString.length - 32);
            const hiBits = cleanString.substring(0, cleanString.length - 32);
            const lo = parseInt(loBits, 2);
            const hi = parseInt(hiBits, 2);
            data = { base: [lo >>> 0, hi >>> 0] };
        }
        return new Bits(data);
    }

    /**
     * 从十六进制字符串创建位集合
     * @param hexString 十六进制字符串，可以带或不带0x前缀
     * @returns 新的位集合对象
     */
    public static fromHexString(hexString: string): Bits {
        const cleanString = hexString.replace(/^0x/i, '');
        let data: BitMask64Data;
        if (cleanString.length <= 8) {
            const num = parseInt(cleanString, 16);
            data = { base: [num >>> 0, 0] };
        } else {
            const loBits = cleanString.substring(cleanString.length - 8);
            const hiBits = cleanString.substring(0, cleanString.length - 8);
            const lo = parseInt(loBits, 16);
            const hi = parseInt(hiBits, 16);
            data = { base: [lo >>> 0, hi >>> 0] };
        }
        return new Bits(data);
    }

    /**
     * 检查是否与另一个位集合相等
     * @param other 另一个位集合
     * @returns 如果两个位集合完全相同则返回true
     */
    public equals(other: Bits): boolean {
        return BitMask64Utils.equals(this._value, other._value);
    }

    /**
     * 获取最高位设置位的索引
     * @returns 最高位设置位的索引，如果位集合为空则返回-1
     */
    public getHighestBitIndex(): number {
        if (BitMask64Utils.isZero(this._value)) {
            return -1;
        }

        if (this._value.base[SegmentPart.HIGH] !== 0) {
            for (let i = 31; i >= 0; i--) {
                if ((this._value.base[SegmentPart.HIGH] & (1 << i)) !== 0) {
                    return i + 32;
                }
            }
        }

        for (let i = 31; i >= 0; i--) {
            if ((this._value.base[SegmentPart.LOW] & (1 << i)) !== 0) {
                return i;
            }
        }

        return -1;
    }

    /**
     * 获取最低位设置位的索引
     * @returns 最低位设置位的索引，如果位集合为空则返回-1
     */
    public getLowestBitIndex(): number {
        if (BitMask64Utils.isZero(this._value)) {
            return -1;
        }

        for (let i = 0; i < 32; i++) {
            if ((this._value.base[SegmentPart.LOW] & (1 << i)) !== 0) {
                return i;
            }
        }

        for (let i = 0; i < 32; i++) {
            if ((this._value.base[SegmentPart.HIGH] & (1 << i)) !== 0) {
                return i + 32;
            }
        }

        return -1;
    }
}
