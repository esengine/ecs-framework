/**
 * 64位掩码兼容层
 */

/**
 * 位掩码接口
 */
export interface IBigIntLike {
    valueOf(): number;
    toString(radix?: number): string;
    and(other: IBigIntLike): IBigIntLike;
    or(other: IBigIntLike): IBigIntLike;
    xor(other: IBigIntLike): IBigIntLike;
    not(maxBits?: number): IBigIntLike;
    shiftLeft(bits: number): IBigIntLike;
    shiftRight(bits: number): IBigIntLike;
    equals(other: IBigIntLike): boolean;
    isZero(): boolean;
    clone(): IBigIntLike;
}



/**
 * 掩码工厂类
 */
export class BigIntFactory {
    private static _cachedZero: IBigIntLike | null = null;
    private static _cachedOne: IBigIntLike | null = null;
    
    public static create(value: number | string = 0): IBigIntLike {
        return new BitMask64(value);
    }
    
    public static zero(): IBigIntLike {
        if (!this._cachedZero) {
            this._cachedZero = new BitMask64(0);
        }
        return this._cachedZero.clone();
    }
    
    public static one(): IBigIntLike {
        if (!this._cachedOne) {
            this._cachedOne = new BitMask64(1);
        }
        return this._cachedOne.clone();
    }
    
    public static fromBinaryString(binary: string): IBigIntLike {
        return new BitMask64('0b' + binary);
    }
    
    public static fromHexString(hex: string): IBigIntLike {
        return new BitMask64(hex);
    }
    
}


/**
 * 64位掩码结构
 */
export interface BitMask64Data {
    lo: number;
    hi: number;
}

/**
 * 64位掩码工具类
 */
export class BitMask64Utils {
    /** 零掩码常量 */
    public static readonly ZERO: BitMask64Data = { lo: 0, hi: 0 };

    /**
     * 创建掩码
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
     * 从数值创建掩码
     */
    public static fromNumber(value: number): BitMask64Data {
        return { lo: value >>> 0, hi: 0 };
    }

    /**
     * 检查是否有任意位
     */
    public static hasAny(mask: BitMask64Data, bits: BitMask64Data): boolean {
        return (mask.lo & bits.lo) !== 0 || (mask.hi & bits.hi) !== 0;
    }

    /**
     * 检查是否有所有位
     */
    public static hasAll(mask: BitMask64Data, bits: BitMask64Data): boolean {
        return (mask.lo & bits.lo) === bits.lo && (mask.hi & bits.hi) === bits.hi;
    }

    /**
     * 检查是否没有任何位
     */
    public static hasNone(mask: BitMask64Data, bits: BitMask64Data): boolean {
        return (mask.lo & bits.lo) === 0 && (mask.hi & bits.hi) === 0;
    }

    /**
     * 检查是否为零
     */
    public static isZero(mask: BitMask64Data): boolean {
        return mask.lo === 0 && mask.hi === 0;
    }

    /**
     * 检查是否相等
     */
    public static equals(a: BitMask64Data, b: BitMask64Data): boolean {
        return a.lo === b.lo && a.hi === b.hi;
    }

    /**
     * 原地设置位（修改原掩码）
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
     * 原地清除位（修改原掩码）
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
     * 原地或运算（修改原掩码）
     */
    public static orInPlace(target: BitMask64Data, other: BitMask64Data): void {
        target.lo |= other.lo;
        target.hi |= other.hi;
    }

    /**
     * 原地与运算（修改原掩码）
     */
    public static andInPlace(target: BitMask64Data, other: BitMask64Data): void {
        target.lo &= other.lo;
        target.hi &= other.hi;
    }

    /**
     * 原地异或运算（修改原掩码）
     */
    public static xorInPlace(target: BitMask64Data, other: BitMask64Data): void {
        target.lo ^= other.lo;
        target.hi ^= other.hi;
    }

    /**
     * 原地清零
     */
    public static clear(mask: BitMask64Data): void {
        mask.lo = 0;
        mask.hi = 0;
    }

    /**
     * 复制掩码
     */
    public static copy(from: BitMask64Data, to: BitMask64Data): void {
        to.lo = from.lo;
        to.hi = from.hi;
    }

    /**
     * 创建副本
     */
    public static clone(mask: BitMask64Data): BitMask64Data {
        return { lo: mask.lo, hi: mask.hi };
    }

    /**
     * 转换为字符串（调试用）
     */
    public static toString(mask: BitMask64Data, radix: number = 2): string {
        if (radix === 2) {
            const hiBits = mask.hi.toString(2).padStart(32, '0');
            const loBits = mask.lo.toString(2).padStart(32, '0');
            return hiBits + loBits;
        } else if (radix === 16) {
            const hiBits = mask.hi.toString(16).padStart(8, '0');
            const loBits = mask.lo.toString(16).padStart(8, '0');
            return '0x' + hiBits + loBits;
        } else {
            throw new Error('Only radix 2 and 16 are supported');
        }
    }

    /**
     * 计算置位数量
     */
    public static popCount(mask: BitMask64Data): number {
        const popCount32 = (n: number) => {
            n = n - ((n >>> 1) & 0x55555555);
            n = (n & 0x33333333) + ((n >>> 2) & 0x33333333);
            return (((n + (n >>> 4)) & 0x0f0f0f0f) * 0x01010101) >>> 24;
        };
        
        return popCount32(mask.lo) + popCount32(mask.hi);
    }
}

/**
 * 64位掩码类
 */
export class BitMask64 implements IBigIntLike {
    private bits: BitMask64Data;
    
    constructor(value?: number | string | BitMask64Data) {
        if (typeof value === 'number') {
            this.bits = BitMask64Utils.fromNumber(value);
        } else if (typeof value === 'string') {
            this.bits = this.fromString(value);
        } else if (value && typeof value === 'object' && 'lo' in value && 'hi' in value) {
            this.bits = BitMask64Utils.clone(value);
        } else {
            this.bits = BitMask64Utils.clone(BitMask64Utils.ZERO);
        }
    }
    
    private fromString(value: string): BitMask64Data {
        value = value.trim();
        
        if (value.startsWith('0x') || value.startsWith('0X')) {
            const hex = value.substring(2);
            const num = parseInt(hex.length <= 8 ? hex : hex.substring(hex.length - 8), 16);
            const hi = hex.length > 8 ? parseInt(hex.substring(0, hex.length - 8), 16) : 0;
            return { lo: num >>> 0, hi: hi >>> 0 };
        } else if (value.startsWith('0b') || value.startsWith('0B')) {
            const binary = value.substring(2);
            const num = parseInt(binary.length <= 32 ? binary : binary.substring(binary.length - 32), 2);
            const hi = binary.length > 32 ? parseInt(binary.substring(0, binary.length - 32), 2) : 0;
            return { lo: num >>> 0, hi: hi >>> 0 };
        } else {
            const num = parseInt(value, 10);
            return BitMask64Utils.fromNumber(num);
        }
    }
    
    valueOf(): number {
        return this.bits.lo;
    }
    
    toString(radix: number = 10): string {
        if (radix === 2 || radix === 16) {
            return BitMask64Utils.toString(this.bits, radix);
        } else if (radix === 10) {
            if (this.bits.hi === 0) {
                return this.bits.lo.toString(10);
            } else {
                return `${this.bits.hi * 4294967296 + this.bits.lo}`;
            }
        } else {
            throw new Error('Only radix 2, 10, and 16 are supported');
        }
    }
    
    and(other: BitMask64): BitMask64 {
        const result = new BitMask64();
        result.bits.lo = this.bits.lo & other.bits.lo;
        result.bits.hi = this.bits.hi & other.bits.hi;
        return result;
    }
    
    or(other: BitMask64): BitMask64 {
        const result = new BitMask64();
        result.bits.lo = this.bits.lo | other.bits.lo;
        result.bits.hi = this.bits.hi | other.bits.hi;
        return result;
    }
    
    xor(other: BitMask64): BitMask64 {
        const result = new BitMask64();
        result.bits.lo = this.bits.lo ^ other.bits.lo;
        result.bits.hi = this.bits.hi ^ other.bits.hi;
        return result;
    }
    
    not(maxBits: number = 64): BitMask64 {
        const result = new BitMask64();
        
        if (maxBits <= 32) {
            const mask = (1 << maxBits) - 1;
            result.bits.lo = (~this.bits.lo) & mask;
            result.bits.hi = 0;
        } else {
            result.bits.lo = ~this.bits.lo;
            if (maxBits < 64) {
                const remainingBits = maxBits - 32;
                const mask = (1 << remainingBits) - 1;
                result.bits.hi = (~this.bits.hi) & mask;
            } else {
                result.bits.hi = ~this.bits.hi;
            }
        }
        
        return result;
    }
    
    shiftLeft(bits: number): BitMask64 {
        const result = new BitMask64();
        
        if (bits === 0) {
            BitMask64Utils.copy(this.bits, result.bits);
            return result;
        }
        
        if (bits >= 64) {
            BitMask64Utils.clear(result.bits);
            return result;
        }
        
        if (bits >= 32) {
            result.bits.hi = this.bits.lo << (bits - 32);
            result.bits.lo = 0;
        } else {
            result.bits.hi = (this.bits.hi << bits) | (this.bits.lo >>> (32 - bits));
            result.bits.lo = this.bits.lo << bits;
        }
        
        return result;
    }
    
    shiftRight(bits: number): BitMask64 {
        const result = new BitMask64();
        
        if (bits === 0) {
            BitMask64Utils.copy(this.bits, result.bits);
            return result;
        }
        
        if (bits >= 64) {
            BitMask64Utils.clear(result.bits);
            return result;
        }
        
        if (bits >= 32) {
            result.bits.lo = this.bits.hi >>> (bits - 32);
            result.bits.hi = 0;
        } else {
            result.bits.lo = (this.bits.lo >>> bits) | (this.bits.hi << (32 - bits));
            result.bits.hi = this.bits.hi >>> bits;
        }
        
        return result;
    }
    
    equals(other: BitMask64): boolean {
        return BitMask64Utils.equals(this.bits, other.bits);
    }
    
    isZero(): boolean {
        return BitMask64Utils.isZero(this.bits);
    }
    
    clone(): BitMask64 {
        return new BitMask64(this.bits);
    }
    
    // 判定方法
    hasAny(other: BitMask64): boolean {
        return BitMask64Utils.hasAny(this.bits, other.bits);
    }
    
    hasAll(other: BitMask64): boolean {
        return BitMask64Utils.hasAll(this.bits, other.bits);
    }
    
    hasNone(other: BitMask64): boolean {
        return BitMask64Utils.hasNone(this.bits, other.bits);
    }
    
    // 原地修改方法
    orInPlace(other: BitMask64): this {
        BitMask64Utils.orInPlace(this.bits, other.bits);
        return this;
    }
    
    andInPlace(other: BitMask64): this {
        BitMask64Utils.andInPlace(this.bits, other.bits);
        return this;
    }
    
    xorInPlace(other: BitMask64): this {
        BitMask64Utils.xorInPlace(this.bits, other.bits);
        return this;
    }
    
    setBitInPlace(bitIndex: number): this {
        BitMask64Utils.setBit(this.bits, bitIndex);
        return this;
    }
    
    clearBitInPlace(bitIndex: number): this {
        BitMask64Utils.clearBit(this.bits, bitIndex);
        return this;
    }
    
    clearInPlace(): this {
        BitMask64Utils.clear(this.bits);
        return this;
    }
    
    copyFrom(other: BitMask64): this {
        BitMask64Utils.copy(other.bits, this.bits);
        return this;
    }
    
    getRawMask(): BitMask64Data {
        return this.bits;
    }
    
    static create(bitIndex: number): BitMask64 {
        const result = new BitMask64();
        result.bits = BitMask64Utils.create(bitIndex);
        return result;
    }
    
    static fromNumber(value: number): BitMask64 {
        return new BitMask64(value);
    }
    
    static zero(): BitMask64 {
        return new BitMask64();
    }
}

/**
 * 掩码工厂类
 */
export class BitMask64Factory {
    private static _cachedZero: BitMask64 | null = null;
    private static _cachedOne: BitMask64 | null = null;
    
    public static create(value: number | string = 0): BitMask64 {
        return new BitMask64(value);
    }
    
    public static zero(): BitMask64 {
        if (!this._cachedZero) {
            this._cachedZero = new BitMask64(0);
        }
        return this._cachedZero.clone();
    }
    
    public static one(): BitMask64 {
        if (!this._cachedOne) {
            this._cachedOne = new BitMask64(1);
        }
        return this._cachedOne.clone();
    }
    
    public static fromBitIndex(bitIndex: number): BitMask64 {
        return BitMask64.create(bitIndex);
    }
}