/**
 * 基础 64 位段结构
 */
export interface BitMask64Segment {
    /** 低32位（bit 0-31） */
    lo: number;
    /** 高32位（bit 32-63） */
    hi: number;
}

/**
 * 位掩码数据结构
 * 基础模式（64位）：使用 lo + hi 存储 64 位，segments 为空
 * 扩展模式（128+位）：lo + hi 作为第一段，segments 存储额外的 64 位段
 * segments[0] 对应 bit 64-127，segments[1] 对应 bit 128-191，以此类推
 */
export interface BitMask64Data {
    /** 低32位（bit 0-31） */
    lo: number;
    /** 高32位（bit 32-63） */
    hi: number;
    /** 扩展段数组，每个元素是一个 64 位段，用于超过 64 位的场景 */
    segments?: BitMask64Segment[];
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
     * 支持扩展模式，自动处理超过 64 位的掩码
     * @param mask 要检查的掩码
     * @param bits 指定的位模式
     * @returns 如果掩码包含bits中的所有位则返回true
     */
    public static hasAll(mask: BitMask64Data, bits: BitMask64Data): boolean {
        // 检查第一个 64 位段
        if ((mask.lo & bits.lo) !== bits.lo || (mask.hi & bits.hi) !== bits.hi) {
            return false;
        }

        // 如果 bits 没有扩展段，检查完成
        if (!bits.segments || bits.segments.length === 0) {
            return true;
        }

        // 如果 bits 有扩展段但 mask 没有，返回 false
        if (!mask.segments || mask.segments.length === 0) {
            // 检查 bits 的扩展段是否全为 0
            return bits.segments.every(seg => BitMask64Utils.isZero(seg));
        }

        // 检查每个扩展段
        const minSegments = Math.min(mask.segments.length, bits.segments.length);
        for (let i = 0; i < minSegments; i++) {
            const maskSeg = mask.segments[i];
            const bitsSeg = bits.segments[i];
            if ((maskSeg.lo & bitsSeg.lo) !== bitsSeg.lo || (maskSeg.hi & bitsSeg.hi) !== bitsSeg.hi) {
                return false;
            }
        }

        // 如果 bits 有更多段，检查这些段是否为空
        for (let i = minSegments; i < bits.segments.length; i++) {
            if (!BitMask64Utils.isZero(bits.segments[i])) {
                return false;
            }
        }

        return true;
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
    public static isZero(mask: BitMask64Data | BitMask64Segment): boolean {
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

    /**
     * 设置扩展位（支持超过 64 位的索引）
     * @param mask 要修改的掩码（原地修改）
     * @param bitIndex 位索引（可以超过 63）
     */
    public static setBitExtended(mask: BitMask64Data, bitIndex: number): void {
        if (bitIndex < 0) {
            throw new Error('Bit index cannot be negative');
        }

        if (bitIndex < 64) {
            BitMask64Utils.setBit(mask, bitIndex);
            return;
        }

        // 计算段索引和段内位索引
        const segmentIndex = Math.floor(bitIndex / 64) - 1;
        const localBitIndex = bitIndex % 64;

        // 确保 segments 数组存在
        if (!mask.segments) {
            mask.segments = [];
        }

        // 扩展 segments 数组
        while (mask.segments.length <= segmentIndex) {
            mask.segments.push({ lo: 0, hi: 0 });
        }

        // 设置对应段的位
        const segment = mask.segments[segmentIndex];
        if (localBitIndex < 32) {
            segment.lo |= (1 << localBitIndex);
        } else {
            segment.hi |= (1 << (localBitIndex - 32));
        }
    }

    /**
     * 获取扩展位（支持超过 64 位的索引）
     * @param mask 要检查的掩码
     * @param bitIndex 位索引（可以超过 63）
     * @returns 如果位被设置则返回 true
     */
    public static getBitExtended(mask: BitMask64Data, bitIndex: number): boolean {
        if (bitIndex < 0) {
            return false;
        }

        if (bitIndex < 64) {
            const testMask = BitMask64Utils.create(bitIndex);
            return BitMask64Utils.hasAny(mask, testMask);
        }

        if (!mask.segments) {
            return false;
        }

        const segmentIndex = Math.floor(bitIndex / 64) - 1;
        if (segmentIndex >= mask.segments.length) {
            return false;
        }

        const localBitIndex = bitIndex % 64;
        const segment = mask.segments[segmentIndex];

        if (localBitIndex < 32) {
            return (segment.lo & (1 << localBitIndex)) !== 0;
        } else {
            return (segment.hi & (1 << (localBitIndex - 32))) !== 0;
        }
    }

    /**
     * 清除扩展位（支持超过 64 位的索引）
     * @param mask 要修改的掩码（原地修改）
     * @param bitIndex 位索引（可以超过 63）
     */
    public static clearBitExtended(mask: BitMask64Data, bitIndex: number): void {
        if (bitIndex < 0) {
            return;
        }

        if (bitIndex < 64) {
            BitMask64Utils.clearBit(mask, bitIndex);
            return;
        }

        if (!mask.segments) {
            return;
        }

        const segmentIndex = Math.floor(bitIndex / 64) - 1;
        if (segmentIndex >= mask.segments.length) {
            return;
        }

        const localBitIndex = bitIndex % 64;
        const segment = mask.segments[segmentIndex];

        if (localBitIndex < 32) {
            segment.lo &= ~(1 << localBitIndex);
        } else {
            segment.hi &= ~(1 << (localBitIndex - 32));
        }
    }
}