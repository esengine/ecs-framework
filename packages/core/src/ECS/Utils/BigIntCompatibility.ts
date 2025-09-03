/**
 * 64位掩码兼容层
 */

/**
 * 64位掩码数据结构，使用两个32位整数表示
 */
export interface BitMask64Data {
    /** 低32位 */
    lo: number;
    /** 高32位 */
    hi: number;
}

export class BitMask64Utils {
    /** 零掩码常量，所有位都为0 */
    public static readonly ZERO: BitMask64Data = { lo: 0, hi: 0 };

    /**
     * 根据位索引创建64位掩码
     * @param bitIndex 位索引，范围 [0, 63]
     * @returns 包含指定位设置为1的掩码
     * @throws 当位索引超出范围时抛出错误
     */
    public static create(bitIndex: number): BitMask64Data {
        if (bitIndex < 0 || bitIndex >= 64) {
            throw new Error(`Bit index ${bitIndex} out of range [0, 63]`);
        }
        
        if (bitIndex < 32) {
            return { lo: 1 << bitIndex, hi: 0 };
        } else {
            return { lo: 0, hi: 1 << (bitIndex - 32) };
        }
    }

    /**
     * 从32位数字创建64位掩码
     * @param value 32位数字值
     * @returns 低32位为输入值、高32位为0的掩码
     */
    public static fromNumber(value: number): BitMask64Data {
        return { lo: value >>> 0, hi: 0 };
    }

    /**
     * 检查掩码是否包含任意指定的位
     * @param mask 要检查的掩码
     * @param bits 指定的位模式
     * @returns 如果掩码包含bits中的任意位则返回true
     */
    public static hasAny(mask: BitMask64Data, bits: BitMask64Data): boolean {
        return (mask.lo & bits.lo) !== 0 || (mask.hi & bits.hi) !== 0;
    }

    /**
     * 检查掩码是否包含所有指定的位
     * @param mask 要检查的掩码
     * @param bits 指定的位模式
     * @returns 如果掩码包含bits中的所有位则返回true
     */
    public static hasAll(mask: BitMask64Data, bits: BitMask64Data): boolean {
        return (mask.lo & bits.lo) === bits.lo && (mask.hi & bits.hi) === bits.hi;
    }

    /**
     * 检查掩码是否不包含任何指定的位
     * @param mask 要检查的掩码
     * @param bits 指定的位模式
     * @returns 如果掩码不包含bits中的任何位则返回true
     */
    public static hasNone(mask: BitMask64Data, bits: BitMask64Data): boolean {
        return (mask.lo & bits.lo) === 0 && (mask.hi & bits.hi) === 0;
    }

    /**
     * 检查掩码是否为零
     * @param mask 要检查的掩码
     * @returns 如果掩码所有位都为0则返回true
     */
    public static isZero(mask: BitMask64Data): boolean {
        return mask.lo === 0 && mask.hi === 0;
    }

    /**
     * 检查两个掩码是否相等
     * @param a 第一个掩码
     * @param b 第二个掩码
     * @returns 如果两个掩码完全相等则返回true
     */
    public static equals(a: BitMask64Data, b: BitMask64Data): boolean {
        return a.lo === b.lo && a.hi === b.hi;
    }

    /**
     * 设置掩码中指定位为1
     * @param mask 要修改的掩码（原地修改）
     * @param bitIndex 位索引，范围 [0, 63]
     * @throws 当位索引超出范围时抛出错误
     */
    public static setBit(mask: BitMask64Data, bitIndex: number): void {
        if (bitIndex < 0 || bitIndex >= 64) {
            throw new Error(`Bit index ${bitIndex} out of range [0, 63]`);
        }
        
        if (bitIndex < 32) {
            mask.lo |= (1 << bitIndex);
        } else {
            mask.hi |= (1 << (bitIndex - 32));
        }
    }

    /**
     * 清除掩码中指定位为0
     * @param mask 要修改的掩码（原地修改）
     * @param bitIndex 位索引，范围 [0, 63]
     * @throws 当位索引超出范围时抛出错误
     */
    public static clearBit(mask: BitMask64Data, bitIndex: number): void {
        if (bitIndex < 0 || bitIndex >= 64) {
            throw new Error(`Bit index ${bitIndex} out of range [0, 63]`);
        }
        
        if (bitIndex < 32) {
            mask.lo &= ~(1 << bitIndex);
        } else {
            mask.hi &= ~(1 << (bitIndex - 32));
        }
    }

    /**
     * 对目标掩码执行按位或操作
     * @param target 目标掩码（原地修改）
     * @param other 用于按位或的掩码
     */
    public static orInPlace(target: BitMask64Data, other: BitMask64Data): void {
        target.lo |= other.lo;
        target.hi |= other.hi;
    }

    /**
     * 对目标掩码执行按位与操作
     * @param target 目标掩码（原地修改）
     * @param other 用于按位与的掩码
     */
    public static andInPlace(target: BitMask64Data, other: BitMask64Data): void {
        target.lo &= other.lo;
        target.hi &= other.hi;
    }

    /**
     * 对目标掩码执行按位异或操作
     * @param target 目标掩码（原地修改）
     * @param other 用于按位异或的掩码
     */
    public static xorInPlace(target: BitMask64Data, other: BitMask64Data): void {
        target.lo ^= other.lo;
        target.hi ^= other.hi;
    }

    /**
     * 清除掩码的所有位为0
     * @param mask 要清除的掩码（原地修改）
     */
    public static clear(mask: BitMask64Data): void {
        mask.lo = 0;
        mask.hi = 0;
    }

    /**
     * 将源掩码的值复制到目标掩码
     * @param source 源掩码
     * @param target 目标掩码（原地修改）
     */
    public static copy(source: BitMask64Data, target: BitMask64Data): void {
        target.lo = source.lo;
        target.hi = source.hi;
    }

    /**
     * 创建掩码的深拷贝
     * @param mask 要拷贝的掩码
     * @returns 新的掩码对象，内容与源掩码相同
     */
    public static clone(mask: BitMask64Data): BitMask64Data {
        return { lo: mask.lo, hi: mask.hi };
    }

    /**
     * 将掩码转换为字符串表示
     * @param mask 要转换的掩码
     * @param radix 进制，支持2（二进制）或16（十六进制），默认为2
     * @returns 掩码的字符串表示，二进制不带前缀，十六进制带0x前缀
     * @throws 当进制不支持时抛出错误
     */
    public static toString(mask: BitMask64Data, radix: number = 2): string {
        if (radix === 2) {
            if (mask.hi === 0) {
                return mask.lo.toString(2);
            } else {
                const hiBits = mask.hi.toString(2);
                const loBits = mask.lo.toString(2).padStart(32, '0');
                return hiBits + loBits;
            }
        } else if (radix === 16) {
            if (mask.hi === 0) {
                return '0x' + mask.lo.toString(16).toUpperCase();
            } else {
                const hiBits = mask.hi.toString(16).toUpperCase();
                const loBits = mask.lo.toString(16).toUpperCase().padStart(8, '0');
                return '0x' + hiBits + loBits;
            }
        } else {
            throw new Error('Only radix 2 and 16 are supported');
        }
    }

    /**
     * 计算掩码中设置为1的位数
     * @param mask 要计算的掩码
     * @returns 掩码中1的位数
     */
    public static popCount(mask: BitMask64Data): number {
        let count = 0;
        let lo = mask.lo;
        let hi = mask.hi;
        
        while (lo) {
            lo &= lo - 1;
            count++;
        }
        
        while (hi) {
            hi &= hi - 1;
            count++;
        }
        
        return count;
    }
}