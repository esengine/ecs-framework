/**
 * 位枚举
 */
export enum SegmentPart {
    LOW = 0,
    HIGH = 1,
}
/**
 * 基础 64 位段结构
 * [低32位，高32位]
 */
export type BitMask64Segment = [number,number]

/**
 * 位掩码数据结构
 * 基础模式（64位）：使用 base[lo , hi] 存储 64 位，segments 为空
 * 扩展模式（128+位）：base[lo , hi] 作为第一段，segments 存储额外的 64 位段
 * segments[0] 对应 bit 64-127，segments[1] 对应 bit 128-191，以此类推
 */
export interface BitMask64Data {
    base: BitMask64Segment;
    /** 扩展段数组，每个元素是一个 64 位段，用于超过 64 位的场景 */
    segments?: BitMask64Segment[];
}

export class BitMask64Utils {
    /** 零掩码常量，所有位都为0 */
    public static readonly ZERO: Readonly<BitMask64Data> = { base: [0, 0] };

    /**
     * 根据位索引创建64位掩码
     * @param bitIndex 位索引，范围 [0, 63]
     * @returns 包含指定位设置为1的掩码
     * @throws 当位索引超出范围时抛出错误
     */
    public static create(bitIndex: number): BitMask64Data {
        if (bitIndex < 0) {
            throw new Error(`Bit index ${bitIndex} out of range [0, ∞)`);
        }
        const mask: BitMask64Data = { base: [0, 0] };
        BitMask64Utils.setBit(mask, bitIndex);
        return mask;
    }

    /**
     * 从32位数字创建64位掩码
     * @param value 32位数字值
     * @returns 低32位为输入值、高32位为0的掩码
     */
    public static fromNumber(value: number): BitMask64Data {
        return { base: [value >>> 0, 0] };
    }

    /**
     * 检查掩码是否包含任意指定的位
     * @param mask 要检查的掩码
     * @param bits 指定的位模式
     * @returns 如果掩码包含bits中的任意位则返回true
     */
    public static hasAny(mask: BitMask64Data, bits: BitMask64Data): boolean {
        const bitsBase = bits.base;
        const maskBase = mask.base;
        const bitsSegments = bits.segments;
        const maskSegments = mask.segments;
        const baseHasAny = (maskBase[SegmentPart.LOW] & bitsBase[SegmentPart.LOW]) !== 0 || (maskBase[SegmentPart.HIGH] & bitsBase[SegmentPart.HIGH]) !== 0;
        // 基础区段就包含指定的位,或任意一个参数不含扩展区段，直接短路
        if(baseHasAny || !bitsSegments || !maskSegments) return baseHasAny;
        // 额外检查扩展区域是否包含指定的位 - 如果bitsSegments[index]不存在，会被转为NaN，NaN的位运算始终返回0
        return maskSegments.some((seg, index) => {
            const bitsSeg = bitsSegments[index];
            return bitsSeg && ((seg[SegmentPart.LOW] & bitsSeg[SegmentPart.LOW]) !== 0 || (seg[SegmentPart.HIGH] & bitsSeg[SegmentPart.HIGH]) !== 0);
        });
    }

    /**
     * 检查掩码是否包含所有指定的位
     * @param mask 要检查的掩码
     * @param bits 指定的位模式
     * @returns 如果掩码包含bits中的所有位则返回true
     */
    public static hasAll(mask: BitMask64Data, bits: BitMask64Data): boolean {
        const maskBase = mask.base;
        const bitsBase = bits.base;
        const maskSegments = mask.segments;
        const bitsSegments = bits.segments;
        const baseHasAll = (maskBase[SegmentPart.LOW] & bitsBase[SegmentPart.LOW]) === bitsBase[SegmentPart.LOW] && (maskBase[SegmentPart.HIGH] & bitsBase[SegmentPart.HIGH]) === bitsBase[SegmentPart.HIGH];
        // 基础区域就不包含指定的位，或bits没有扩展区段，直接短路。
        if(!baseHasAll || !bitsSegments) return baseHasAll;

        // 扩展区段的hasAll匹配逻辑
        const maskSegmentsLength = maskSegments?.length ?? 0;
        // 对mask/bits中都存在的区段，进行hasAll判断
        if(maskSegments){
            for (let i = 0; i < Math.min(maskSegmentsLength,bitsSegments.length); i++) {
                const maskSeg = maskSegments[i]!;
                const bitsSeg = bitsSegments[i]!;
                if((maskSeg[SegmentPart.LOW] & bitsSeg[SegmentPart.LOW]) !== bitsSeg[SegmentPart.LOW] || (maskSeg[SegmentPart.HIGH] & bitsSeg[SegmentPart.HIGH]) !== bitsSeg[SegmentPart.HIGH]){
                    // 存在不匹配的位，直接短路
                    return false;
                }
            }
        }
        // 对mask中不存在，但bits中存在的区段，进行isZero判断
        for (let i = maskSegmentsLength; i < bitsSegments.length; i++) {
            const bitsSeg = bitsSegments[i]!;
            if(bitsSeg[SegmentPart.LOW] !== 0 || bitsSeg[SegmentPart.HIGH] !== 0){
                // 存在不为0的区段，直接短路
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
        const maskBase = mask.base;
        const bitsBase = bits.base;
        const maskSegments = mask.segments;
        const bitsSegments = bits.segments;
        const baseHasNone = (maskBase[SegmentPart.LOW] & bitsBase[SegmentPart.LOW]) === 0 && (maskBase[SegmentPart.HIGH] & bitsBase[SegmentPart.HIGH]) === 0;
        //不含扩展区域，或基础区域就包含指定的位，或bits不含拓展区段，直接短路。
        if(!maskSegments || !baseHasNone || !bitsSegments) return baseHasNone;
        // 额外检查扩展区域是否都包含指定的位 - 此时bitsSegments存在,如果bitsSegments[index]不存在，会被转为NaN，NaN的位运算始终返回0
        return maskSegments.every((seg, index) => {
            const bitsSeg = bitsSegments[index];
            if (!bitsSeg) return true;
            return (seg[SegmentPart.LOW] & bitsSeg[SegmentPart.LOW]) === 0 && (seg[SegmentPart.HIGH] & bitsSeg[SegmentPart.HIGH]) === 0;
        });
    }

    /**
     * 检查掩码是否为零
     * @param mask 要检查的掩码
     * @returns 如果掩码所有位都为0则返回true
     */
    public static isZero(mask: BitMask64Data): boolean {
        const baseIsZero = mask.base[SegmentPart.LOW] === 0 && mask.base[SegmentPart.HIGH] === 0;
        if(!mask.segments || !baseIsZero){
            // 不含扩展区域，或基础区域值就不为0，直接短路
            return baseIsZero;
        }
        // 额外检查扩展区域是否都为0
        return mask.segments.every((seg) => seg[SegmentPart.LOW] === 0 && seg[SegmentPart.HIGH] === 0);
    }

    /**
     * 检查两个掩码是否相等
     * @param a 第一个掩码
     * @param b 第二个掩码
     * @returns 如果两个掩码完全相等则返回true
     */
    public static equals(a: BitMask64Data, b: BitMask64Data): boolean {
        const baseEquals = a.base[SegmentPart.LOW] === b.base[SegmentPart.LOW] && a.base[SegmentPart.HIGH] === b.base[SegmentPart.HIGH];
        // base不相等，或ab都没有扩展区域位，直接返回base比较结果
        if(!baseEquals || (!a.segments && !b.segments)) return baseEquals;
        // 不能假设a，b的segments都存在或长度相同.
        const aSegments = a.segments ?? [];
        const bSegments = b.segments ?? [];
        for (let i = 0; i < Math.max(aSegments.length, bSegments.length); i++) {
            const aSeg: BitMask64Segment | undefined = aSegments[i]; // 可能为undefined
            const bSeg: BitMask64Segment | undefined = bSegments[i]; // 可能为undefined
            if(aSeg && !bSeg){
                //bSeg不存在，则必须要求aSeg全为0
                if(aSeg[SegmentPart.LOW] !== 0 || aSeg[SegmentPart.HIGH] !== 0) return false;
            }else if(!aSeg && bSeg){
                //aSeg不存在，则必须要求bSeg全为0
                if(bSeg[SegmentPart.LOW] !== 0 || bSeg[SegmentPart.HIGH] !== 0) return false;
            }else if(aSeg && bSeg){
                //理想状态：aSeg/bSeg都存在
                if(aSeg[SegmentPart.LOW] !== bSeg[SegmentPart.LOW] || aSeg[SegmentPart.HIGH] !== bSeg[SegmentPart.HIGH]) return false;
            }
        }
        return true;
    }

    /**
     * 设置掩码中指定位为1，必要时自动扩展
     * @param mask 要修改的掩码（原地修改）
     * @param bitIndex 位索引，不小于零
     * @throws 当位索引超出范围时抛出错误
     */
    public static setBit(mask: BitMask64Data, bitIndex: number): void {
        if (bitIndex < 0) {
            throw new Error(`Bit index ${bitIndex} out of range [0, 63]`);
        }
        const targetSeg = BitMask64Utils.getSegmentByBitIndex(mask, bitIndex)!;
        const mod = bitIndex & 63; // bitIndex % 64 优化方案
        if(mod < 32){
            targetSeg[SegmentPart.LOW] |= (1 << mod);
        } else {
            targetSeg[SegmentPart.HIGH] |= (1 << (mod - 32));
        }
    }

    /**
     * 获取掩码中指定位，如果位超出当前掩码的区段长度，则直接返回0
     * @param mask 掩码
     * @param bitIndex 位索引，不小于零
     */
    public static getBit(mask: BitMask64Data, bitIndex: number): boolean {
        if (bitIndex < 0) {
            return false;
        }
        const targetSeg = BitMask64Utils.getSegmentByBitIndex(mask, bitIndex, false);
        if(!targetSeg) return false;
        const mod = bitIndex & 63; // bitIndex % 64 优化方案
        if(mod < 32){
            return (targetSeg[SegmentPart.LOW] & (1 << mod)) !== 0;
        } else {
            return (targetSeg[SegmentPart.HIGH] & (1 << (mod - 32))) !== 0;
        }
    }
    /**
     * 清除掩码中指定位为0，如果位超出当前掩码的区段长度，则什么也不做
     * @param mask 要修改的掩码（原地修改）
     * @param bitIndex 位索引，不小于0
     */
    public static clearBit(mask: BitMask64Data, bitIndex: number): void {
        if (bitIndex < 0) {
            throw new Error(`Bit index ${bitIndex} out of range [0, 63]`);
        }
        const targetSeg = BitMask64Utils.getSegmentByBitIndex(mask, bitIndex, false);
        if(!targetSeg) return;
        const mod = bitIndex & 63; // bitIndex % 64 优化方案
        if(mod < 32){
            targetSeg[SegmentPart.LOW] &= ~(1 << mod);
        } else {
            targetSeg[SegmentPart.HIGH] &= ~(1 << (mod - 32));
        }
    }

    /**
     * 对目标掩码执行按位或操作
     * @param target 目标掩码（原地修改）
     * @param other 用于按位或的掩码
     */
    public static orInPlace(target: BitMask64Data, other: BitMask64Data): void {
        target.base[SegmentPart.LOW] |= other.base[SegmentPart.LOW];
        target.base[SegmentPart.HIGH] |= other.base[SegmentPart.HIGH];

        // 处理扩展段
        const otherSegments = other.segments;
        if (otherSegments && otherSegments.length > 0) {
            if (!target.segments) {
                target.segments = [];
            }
            const targetSegments = target.segments;

            // 确保 target 有足够的段
            while (targetSegments.length < otherSegments.length) {
                targetSegments.push([0, 0]);
            }

            // 对每个段执行或操作
            for (let i = 0; i < otherSegments.length; i++) {
                const targetSeg = targetSegments[i]!;
                const otherSeg = otherSegments[i]!;
                targetSeg[SegmentPart.LOW] |= otherSeg[SegmentPart.LOW];
                targetSeg[SegmentPart.HIGH] |= otherSeg[SegmentPart.HIGH];
            }
        }
    }

    /**
     * 对目标掩码执行按位与操作
     * @param target 目标掩码（原地修改）
     * @param other 用于按位与的掩码
     */
    public static andInPlace(target: BitMask64Data, other: BitMask64Data): void {
        target.base[SegmentPart.LOW] &= other.base[SegmentPart.LOW];
        target.base[SegmentPart.HIGH] &= other.base[SegmentPart.HIGH];

        // 处理扩展段
        const otherSegments = other.segments;
        if (otherSegments && otherSegments.length > 0) {
            if (!target.segments) {
                target.segments = [];
            }
            const targetSegments = target.segments;
            // 确保 target 有足够的段
            while (targetSegments.length < otherSegments.length) {
                targetSegments.push([0, 0]);
            }

            // 对每个段执行与操作
            for (let i = 0; i < otherSegments.length; i++) {
                const targetSeg = targetSegments[i]!;
                const otherSeg = otherSegments[i]!;
                targetSeg[SegmentPart.LOW] &= otherSeg[SegmentPart.LOW];
                targetSeg[SegmentPart.HIGH] &= otherSeg[SegmentPart.HIGH];
            }
        }
    }

    /**
     * 对目标掩码执行按位异或操作
     * @param target 目标掩码（原地修改）
     * @param other 用于按位异或的掩码
     */
    public static xorInPlace(target: BitMask64Data, other: BitMask64Data): void {
        target.base[SegmentPart.LOW] ^= other.base[SegmentPart.LOW];
        target.base[SegmentPart.HIGH] ^= other.base[SegmentPart.HIGH];

        // 处理扩展段
        const otherSegments = other.segments;
        if (!otherSegments || otherSegments.length == 0) return;
        if (!target.segments) target.segments = [];

        const targetSegments = target.segments;
        // 确保 target 有足够的段
        while (targetSegments.length < otherSegments.length) {
            targetSegments.push([0, 0]);
        }

        // 对每个段执行异或操作
        for (let i = 0; i < otherSegments.length; i++) {
            const targetSeg = targetSegments[i]!;
            const otherSeg = otherSegments[i]!;
            targetSeg[SegmentPart.LOW] ^= otherSeg[SegmentPart.LOW];
            targetSeg[SegmentPart.HIGH] ^= otherSeg[SegmentPart.HIGH];
        }
    }

    /**
     * 清除掩码的所有位为0
     * @param mask 要清除的掩码（原地修改）
     */
    public static clear(mask: BitMask64Data): void {
        mask.base[SegmentPart.LOW] = 0;
        mask.base[SegmentPart.HIGH] = 0;
        if (mask.segments) {
            for (let i = 0; i < mask.segments.length; i++) {
                const seg = mask.segments[i]!;
                seg[SegmentPart.LOW] = 0;
                seg[SegmentPart.HIGH] = 0;
            }
        }
    }

    /**
     * 将源掩码的值复制到目标掩码，如果source包含扩展段，则target也会至少扩展到source扩展段的长度
     * @param source 源掩码
     * @param target 目标掩码（原地修改）
     */
    public static copy(source: BitMask64Data, target: BitMask64Data): void {
        BitMask64Utils.clear(target);
        target.base[SegmentPart.LOW] = source.base[SegmentPart.LOW];
        target.base[SegmentPart.HIGH] = source.base[SegmentPart.HIGH];
        // source没有扩展段，直接退出
        if(!source.segments || source.segments.length == 0) return;
        // 没有拓展段,则直接复制数组
        if(!target.segments){
            target.segments = source.segments.map((seg) => [...seg]);
            return;
        }
        // source有扩展段，target扩展段不足，则补充长度
        const copyLength = source.segments.length - target.segments.length;
        for (let i = 0; i < copyLength; i++) {
            target.segments.push([0,0]);
        }
        // 逐个重写
        const targetSegments = target.segments;
        const sourceSegments = source.segments;
        for (let i = 0; i < sourceSegments.length; i++) {
            const targetSeg = targetSegments[i]!;
            const sourSeg = sourceSegments[i]!;
            targetSeg[SegmentPart.LOW] = sourSeg[SegmentPart.LOW];
            targetSeg[SegmentPart.HIGH] = sourSeg[SegmentPart.HIGH];
        }
    }

    /**
     * 创建掩码的深拷贝
     * @param mask 要拷贝的掩码
     * @returns 新的掩码对象，内容与源掩码相同
     */
    public static clone(mask: BitMask64Data): BitMask64Data {
        return {
            base: mask.base.slice() as BitMask64Segment,
            ...(mask.segments && { segments: mask.segments.map((seg) => [...seg] as BitMask64Segment) })
        };
    }

    /**
     * 将掩码转换为字符串表示,每个区段之间将使用空格分割。
     * @param mask 要转换的掩码
     * @param radix 进制，支持2（二进制）或16（十六进制），默认为2，其他的值被视为2
     * @param printHead 打印头
     * @returns 掩码的字符串表示，二进制不带前缀，十六进制带0x前缀
     */
    public static toString(mask: BitMask64Data, radix: 2 | 16 = 2, printHead: boolean = false): string {
        if(radix != 2 && radix != 16) radix = 2;
        const totalLength = mask.segments?.length ?? 0;
        let result: string = '';
        if(printHead){
            let paddingLength = 0;
            if(radix === 2){
                paddingLength = 64 + 1 + 1;
            }else{
                paddingLength = 16 + 2 + 1;
            }
            for (let i = 0; i <= totalLength; i++) {
                const title = i === 0 ? '0 (Base):' : `${i} (${64 * i}):`;
                result += title.toString().padEnd(paddingLength);
            }
            result += '\n';
        }

        for (let i = -1; i < totalLength; i++) {
            let segResult = '';
            const bitMaskData = i == -1 ? mask.base : mask.segments![i]!;
            const hi = bitMaskData[SegmentPart.HIGH];
            const lo = bitMaskData[SegmentPart.LOW];
            if(radix == 2){
                const hiBits = hi.toString(2).padStart(32, '0');
                const loBits = lo.toString(2).padStart(32, '0');
                segResult = hiBits + '_' + loBits; //高低位之间使用_隔离
            }else{
                let hiBits = hi ? hi.toString(16).toUpperCase() : '';
                if(printHead){
                    // 存在标头，则输出高位之前需要补齐位数
                    hiBits = hiBits.padStart(8, '0');
                }
                let loBits = lo.toString(16).toUpperCase();
                if(hiBits){
                    // 存在高位 则输出低位之前需要补齐位数
                    loBits = loBits.padStart(8, '0');
                }
                segResult = '0x' + hiBits + loBits;
            }
            if(i === -1)
                result += segResult;
            else
                result += ' ' + segResult; // 不同段之间使用空格隔离
        }
        return result;
    }

    /**
     * 计算掩码中设置为1的位数
     * @param mask 要计算的掩码
     * @returns 掩码中1的位数
     */
    public static popCount(mask: BitMask64Data): number {
        let count = 0;
        for (let i = -1; i < (mask.segments?.length ?? 0); i++) {
            const bitMaskData = i == -1 ? mask.base : mask.segments![i]!;
            let lo = bitMaskData[SegmentPart.LOW];
            let hi = bitMaskData[SegmentPart.HIGH];
            while (lo) {
                lo &= lo - 1;
                count++;
            }
            while (hi) {
                hi &= hi - 1;
                count++;
            }
        }
        return count;
    }

    /**
     * 获取包含目标位的BitMask64Segment
     * @param mask 要操作的掩码
     * @param bitIndex 目标位
     * @param createNewSegment 如果bitIndex超过了当前范围，是否自动补充扩展区域，默认为真
     * @private
     */
    private static getSegmentByBitIndex(mask: BitMask64Data,bitIndex: number, createNewSegment: boolean = true): BitMask64Segment | null{
        if(bitIndex <= 63){
            // 基础位
            return mask.base;
        }else{
            // 扩展位
            let segments = mask.segments;
            if(!segments) {
                if(!createNewSegment) return null;
                segments = mask.segments = [];
            }
            const targetSegIndex = (bitIndex >> 6) - 1; // Math.floor(bitIndex / 64) - 1的位运算优化
            if(segments.length <= targetSegIndex){
                if(!createNewSegment) return null;
                const diff = targetSegIndex - segments.length + 1;
                for (let i = 0; i < diff; i++) {
                    segments.push([0, 0]);
                }
            }
            return  segments[targetSegIndex] ?? null;
        }
    }
}
