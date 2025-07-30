/**
 * BigInt兼容性抽象层
 * 
 * 为不支持BigInt的环境提供兼容实现，确保ECS框架在所有平台上都能正常运行。
 * 自动检测运行时环境的BigInt支持情况，并提供统一的接口。
 * 
 * @example
 * ```typescript
 * // 创建兼容的BigInt值
 * const value = BigIntFactory.create(123);
 * 
 * // 位运算
 * const result = value.or(BigIntFactory.create(456));
 * 
 * // 检查兼容性
 * console.log(BigIntFactory.isNativeSupported()); // true/false
 * ```
 */

/**
 * BigInt兼容接口
 * 
 * 定义了BigInt的基本操作接口，支持原生BigInt和兼容实现的统一调用。
 */
export interface IBigIntLike {
    /**
     * 获取数值表示
     * @returns 数值
     */
    valueOf(): number;
    
    /**
     * 转换为字符串
     * @param radix 进制，支持2、10、16
     * @returns 字符串表示
     */
    toString(radix?: number): string;
    
    /**
     * 位运算：与
     * @param other 另一个BigInt值
     * @returns 运算结果
     */
    and(other: IBigIntLike): IBigIntLike;
    
    /**
     * 位运算：或
     * @param other 另一个BigInt值
     * @returns 运算结果
     */
    or(other: IBigIntLike): IBigIntLike;
    
    /**
     * 位运算：异或
     * @param other 另一个BigInt值
     * @returns 运算结果
     */
    xor(other: IBigIntLike): IBigIntLike;
    
    /**
     * 位运算：非
     * @param maxBits 最大位数限制
     * @returns 运算结果
     */
    not(maxBits?: number): IBigIntLike;
    
    /**
     * 左移位运算
     * @param bits 移位数
     * @returns 运算结果
     */
    shiftLeft(bits: number): IBigIntLike;
    
    /**
     * 右移位运算
     * @param bits 移位数
     * @returns 运算结果
     */
    shiftRight(bits: number): IBigIntLike;
    
    /**
     * 相等比较
     * @param other 另一个BigInt值
     * @returns 是否相等
     */
    equals(other: IBigIntLike): boolean;
    
    /**
     * 检查是否为零
     * @returns 是否为零
     */
    isZero(): boolean;
    
    /**
     * 创建副本
     * @returns 新的实例
     */
    clone(): IBigIntLike;
}

/**
 * 原生BigInt包装器
 * 
 * 为支持BigInt的环境提供统一接口包装。
 */
class NativeBigInt implements IBigIntLike {
    constructor(private value: bigint) {}
    
    valueOf(): number {
        return Number(this.value);
    }
    
    toString(radix?: number): string {
        if (radix !== undefined && radix !== 10 && radix !== 16 && radix !== 2) {
            throw new Error('Only radix 2, 10, and 16 are supported');
        }
        const result = this.value.toString(radix);
        if (radix === 16) {
            return result.toUpperCase();
        }
        return result;
    }
    
    and(other: IBigIntLike): IBigIntLike {
        const otherBigInt = other instanceof NativeBigInt ? other.value : BigInt(other.valueOf());
        return new NativeBigInt(this.value & otherBigInt);
    }
    
    or(other: IBigIntLike): IBigIntLike {
        const otherBigInt = other instanceof NativeBigInt ? other.value : BigInt(other.valueOf());
        return new NativeBigInt(this.value | otherBigInt);
    }
    
    xor(other: IBigIntLike): IBigIntLike {
        const otherBigInt = other instanceof NativeBigInt ? other.value : BigInt(other.valueOf());
        return new NativeBigInt(this.value ^ otherBigInt);
    }
    
    not(maxBits: number = 64): IBigIntLike {
        const mask = (BigInt(1) << BigInt(maxBits)) - BigInt(1);
        return new NativeBigInt((~this.value) & mask);
    }
    
    shiftLeft(bits: number): IBigIntLike {
        return new NativeBigInt(this.value << BigInt(bits));
    }
    
    shiftRight(bits: number): IBigIntLike {
        return new NativeBigInt(this.value >> BigInt(bits));
    }
    
    equals(other: IBigIntLike): boolean {
        const otherBigInt = other instanceof NativeBigInt ? other.value : BigInt(other.valueOf());
        return this.value === otherBigInt;
    }
    
    isZero(): boolean {
        return this.value === BigInt(0);
    }
    
    clone(): IBigIntLike {
        return new NativeBigInt(this.value);
    }
}

/**
 * 数组模拟BigInt实现
 * 
 * 为不支持BigInt的环境提供兼容实现，使用32位数组模拟大整数运算。
 * 性能略低于原生BigInt，但保证功能一致性。
 */
class ArrayBigInt implements IBigIntLike {
    private chunks: number[] = []; // 32位块数组
    private static readonly CHUNK_SIZE = 32;
    private static readonly CHUNK_MASK = 0xFFFFFFFF;
    private static readonly CHUNK_MAX = 0x100000000; // 2^32
    
    /**
     * 构造函数
     * @param value 初始值，可以是数值、字符串或数组
     */
    constructor(value: number | string | number[] = 0) {
        if (typeof value === 'number') {
            this.fromNumber(value);
        } else if (typeof value === 'string') {
            this.fromString(value);
        } else {
            this.chunks = value.slice();
        }
        this.normalize();
    }
    
    /**
     * 从数值初始化
     * @param value 数值
     */
    private fromNumber(value: number): void {
        this.chunks = [];
        
        // 处理负数（在位运算中通常不会遇到）
        if (value < 0) {
            value = Math.abs(value);
        }
        
        if (value === 0) {
            this.chunks = [0];
            return;
        }
        
        while (value > 0) {
            this.chunks.push(value & ArrayBigInt.CHUNK_MASK);
            value = Math.floor(value / ArrayBigInt.CHUNK_MAX);
        }
    }
    
    /**
     * 从字符串初始化
     * @param value 字符串（支持十进制、十六进制、二进制）
     */
    private fromString(value: string): void {
        value = value.trim();
        
        if (value.startsWith('0x') || value.startsWith('0X')) {
            // 十六进制
            this.fromHexString(value.substring(2));
        } else if (value.startsWith('0b') || value.startsWith('0B')) {
            // 二进制
            this.fromBinaryString(value.substring(2));
        } else {
            // 十进制
            this.fromDecimalString(value);
        }
    }
    
    /**
     * 从十六进制字符串初始化
     * @param hex 十六进制字符串
     */
    private fromHexString(hex: string): void {
        this.chunks = [0];
        
        for (let i = hex.length - 1; i >= 0; i -= 8) {
            const start = Math.max(0, i - 7);
            const chunk = parseInt(hex.substring(start, i + 1), 16);
            this.chunks.push(chunk);
        }
        
        this.normalize();
    }
    
    /**
     * 从二进制字符串初始化
     * @param binary 二进制字符串
     */
    private fromBinaryString(binary: string): void {
        this.chunks = [0];
        
        for (let i = binary.length - 1; i >= 0; i -= 32) {
            const start = Math.max(0, i - 31);
            const chunk = parseInt(binary.substring(start, i + 1), 2);
            this.chunks.push(chunk);
        }
        
        this.normalize();
    }
    
    /**
     * 从十进制字符串初始化
     * @param decimal 十进制字符串
     */
    private fromDecimalString(decimal: string): void {
        // 简化实现，直接转换为数值（在ECS位运算场景中通常是小数值）
        const num = parseInt(decimal, 10);
        this.fromNumber(num);
    }
    
    /**
     * 规范化数组，移除前导零
     */
    private normalize(): void {
        while (this.chunks.length > 1 && this.chunks[this.chunks.length - 1] === 0) {
            this.chunks.pop();
        }
        
        if (this.chunks.length === 0) {
            this.chunks = [0];
        }
    }
    
    valueOf(): number {
        let result = 0;
        let multiplier = 1;
        
        for (const chunk of this.chunks) {
            result += chunk * multiplier;
            multiplier *= ArrayBigInt.CHUNK_MAX;
            
            // 防止溢出
            if (multiplier > Number.MAX_SAFE_INTEGER) {
                break;
            }
        }
        
        return result;
    }
    
    toString(radix: number = 10): string {
        if (radix !== 10 && radix !== 16 && radix !== 2) {
            throw new Error('Only radix 2, 10, and 16 are supported');
        }
        
        if (this.isZero()) {
            return '0';
        }
        
        if (radix === 10) {
            // 简化实现，转换为数值
            return this.valueOf().toString(10);
        } else if (radix === 16) {
            let result = '';
            for (let i = this.chunks.length - 1; i >= 0; i--) {
                const hex = this.chunks[i].toString(16);
                result += i === this.chunks.length - 1 ? hex : hex.padStart(8, '0');
            }
            return result.toUpperCase();
        } else if (radix === 2) {
            let result = '';
            for (let i = this.chunks.length - 1; i >= 0; i--) {
                const binary = this.chunks[i].toString(2);
                result += i === this.chunks.length - 1 ? binary : binary.padStart(32, '0');
            }
            return result;
        }
        
        return this.valueOf().toString(radix);
    }
    
    and(other: IBigIntLike): IBigIntLike {
        const otherArray = other as ArrayBigInt;
        const maxLength = Math.max(this.chunks.length, otherArray.chunks.length);
        const result: number[] = [];
        
        for (let i = 0; i < maxLength; i++) {
            const a = i < this.chunks.length ? this.chunks[i] : 0;
            const b = i < otherArray.chunks.length ? otherArray.chunks[i] : 0;
            result.push(a & b);
        }
        
        return new ArrayBigInt(result);
    }
    
    or(other: IBigIntLike): IBigIntLike {
        const otherArray = other as ArrayBigInt;
        const maxLength = Math.max(this.chunks.length, otherArray.chunks.length);
        const result: number[] = [];
        
        for (let i = 0; i < maxLength; i++) {
            const a = i < this.chunks.length ? this.chunks[i] : 0;
            const b = i < otherArray.chunks.length ? otherArray.chunks[i] : 0;
            result.push(a | b);
        }
        
        return new ArrayBigInt(result);
    }
    
    xor(other: IBigIntLike): IBigIntLike {
        const otherArray = other as ArrayBigInt;
        const maxLength = Math.max(this.chunks.length, otherArray.chunks.length);
        const result: number[] = [];
        
        for (let i = 0; i < maxLength; i++) {
            const a = i < this.chunks.length ? this.chunks[i] : 0;
            const b = i < otherArray.chunks.length ? otherArray.chunks[i] : 0;
            result.push(a ^ b);
        }
        
        return new ArrayBigInt(result);
    }
    
    not(maxBits: number = 64): IBigIntLike {
        const maxChunks = Math.ceil(maxBits / ArrayBigInt.CHUNK_SIZE);
        const result: number[] = [];
        
        for (let i = 0; i < maxChunks; i++) {
            const chunk = i < this.chunks.length ? this.chunks[i] : 0;
            
            if (i === maxChunks - 1) {
                // 最后一个块需要处理剩余位数
                const remainingBits = maxBits % ArrayBigInt.CHUNK_SIZE;
                if (remainingBits > 0) {
                    const mask = (1 << remainingBits) - 1;
                    result.push((~chunk) & mask);
                } else {
                    result.push((~chunk) & ArrayBigInt.CHUNK_MASK);
                }
            } else {
                result.push((~chunk) & ArrayBigInt.CHUNK_MASK);
            }
        }
        
        return new ArrayBigInt(result);
    }
    
    shiftLeft(bits: number): IBigIntLike {
        if (bits === 0) {
            return this.clone();
        }
        
        if (bits < 0) {
            return this.shiftRight(-bits);
        }
        
        const chunkShift = Math.floor(bits / ArrayBigInt.CHUNK_SIZE);
        const bitShift = bits % ArrayBigInt.CHUNK_SIZE;
        
        const result: number[] = new Array(chunkShift).fill(0);
        
        if (bitShift === 0) {
            // 整块移位
            result.push(...this.chunks);
        } else {
            // 部分位移位
            let carry = 0;
            for (const chunk of this.chunks) {
                const shifted = (chunk << bitShift) | carry;
                result.push(shifted & ArrayBigInt.CHUNK_MASK);
                carry = chunk >>> (ArrayBigInt.CHUNK_SIZE - bitShift);
            }
            
            if (carry > 0) {
                result.push(carry);
            }
        }
        
        return new ArrayBigInt(result);
    }
    
    shiftRight(bits: number): IBigIntLike {
        if (bits === 0) {
            return this.clone();
        }
        
        if (bits < 0) {
            return this.shiftLeft(-bits);
        }
        
        const chunkShift = Math.floor(bits / ArrayBigInt.CHUNK_SIZE);
        const bitShift = bits % ArrayBigInt.CHUNK_SIZE;
        
        if (chunkShift >= this.chunks.length) {
            return new ArrayBigInt(0);
        }
        
        const result: number[] = [];
        
        if (bitShift === 0) {
            // 整块移位
            for (let i = chunkShift; i < this.chunks.length; i++) {
                result.push(this.chunks[i]);
            }
        } else {
            // 部分位移位
            let carry = 0;
            for (let i = this.chunks.length - 1; i >= chunkShift; i--) {
                const chunk = this.chunks[i];
                const shifted = (carry << (ArrayBigInt.CHUNK_SIZE - bitShift)) | (chunk >>> bitShift);
                result.unshift(shifted);
                carry = chunk & ((1 << bitShift) - 1);
            }
        }
        
        return new ArrayBigInt(result.length > 0 ? result : [0]);
    }
    
    equals(other: IBigIntLike): boolean {
        if (!(other instanceof ArrayBigInt)) {
            return false;
        }
        
        if (this.chunks.length !== other.chunks.length) {
            return false;
        }
        
        for (let i = 0; i < this.chunks.length; i++) {
            if (this.chunks[i] !== other.chunks[i]) {
                return false;
            }
        }
        
        return true;
    }
    
    isZero(): boolean {
        return this.chunks.length === 1 && this.chunks[0] === 0;
    }
    
    clone(): IBigIntLike {
        return new ArrayBigInt(this.chunks.slice());
    }
}

/**
 * BigInt工厂类
 * 
 * 自动检测运行时环境的BigInt支持情况，并提供统一的创建接口。
 * 在支持BigInt的环境中使用原生实现，在不支持的环境中使用兼容实现。
 */
export class BigIntFactory {
    private static _supportsBigInt: boolean | null = null;
    private static _cachedZero: IBigIntLike | null = null;
    private static _cachedOne: IBigIntLike | null = null;
    // 缓存检测结果以避免重复检测
    
    /**
     * 检查是否支持原生BigInt
     * @returns 是否支持原生BigInt
     */
    public static isNativeSupported(): boolean {
        if (this._supportsBigInt === null) {
            this._supportsBigInt = this.detectBigIntSupport();
        }
        return this._supportsBigInt;
    }
    
    /**
     * 检测BigInt支持情况
     * @returns 是否支持BigInt
     */
    private static detectBigIntSupport(): boolean {
        try {
            // 检查BigInt构造函数是否存在
            if (typeof BigInt === 'undefined') {
                return false;
            }
            
            // 检查基本BigInt操作
            const test1 = BigInt(1);
            const test2 = BigInt(2);
            const result = test1 | test2;
            
            // 检查字面量支持
            const literal = eval('1n'); // 使用eval避免语法错误
            
            // 检查类型
            if (typeof result !== 'bigint' || typeof literal !== 'bigint') {
                return false;
            }
            
            // 检查基本运算
            const shifted = test1 << BigInt(1);
            const compared = test1 === BigInt(1);
            
            return typeof shifted === 'bigint' && compared === true;
        } catch (error) {
            // 任何异常都表示不支持
            return false;
        }
    }
    
    /**
     * 创建BigInt兼容值
     * @param value 初始值
     * @returns IBigIntLike实例
     */
    public static create(value: number | string | bigint = 0): IBigIntLike {
        if (this.isNativeSupported()) {
            let bigintValue: bigint;
            
            if (typeof value === 'bigint') {
                bigintValue = value;
            } else if (typeof value === 'string') {
                bigintValue = BigInt(value);
            } else {
                bigintValue = BigInt(value);
            }
            
            return new NativeBigInt(bigintValue);
        } else {
            // 转换bigint类型到兼容类型
            let compatValue: number | string;
            
            if (typeof value === 'bigint') {
                compatValue = value.toString();
            } else {
                compatValue = value;
            }
            
            return new ArrayBigInt(compatValue);
        }
    }
    
    /**
     * 创建零值
     * @returns 零值的IBigIntLike实例
     */
    public static zero(): IBigIntLike {
        if (!this._cachedZero) {
            this._cachedZero = this.create(0);
        }
        return this._cachedZero;
    }
    
    /**
     * 创建1值
     * @returns 1值的IBigIntLike实例
     */
    public static one(): IBigIntLike {
        if (!this._cachedOne) {
            this._cachedOne = this.create(1);
        }
        return this._cachedOne;
    }
    
    /**
     * 从二进制字符串创建
     * @param binary 二进制字符串
     * @returns IBigIntLike实例
     */
    public static fromBinaryString(binary: string): IBigIntLike {
        if (this.isNativeSupported()) {
            const value = BigInt('0b' + binary);
            return new NativeBigInt(value);
        } else {
            return new ArrayBigInt('0b' + binary);
        }
    }
    
    /**
     * 从十六进制字符串创建
     * @param hex 十六进制字符串
     * @returns IBigIntLike实例
     */
    public static fromHexString(hex: string): IBigIntLike {
        if (this.isNativeSupported()) {
            const cleanHex = hex.replace(/^0x/i, '');
            const value = BigInt('0x' + cleanHex);
            return new NativeBigInt(value);
        } else {
            return new ArrayBigInt(hex);
        }
    }
    
    /**
     * 获取环境信息
     * @returns 环境信息对象
     */
    public static getEnvironmentInfo(): EnvironmentInfo {
        return {
            supportsBigInt: this.isNativeSupported(),
            environment: this.detectEnvironment(),
            jsEngine: this.detectJSEngine()
        };
    }
    
    /**
     * 检测运行环境
     * @returns 环境类型
     */
    private static detectEnvironment(): string {
        if (typeof window !== 'undefined') {
            // 浏览器环境
            if (typeof navigator !== 'undefined') {
                const userAgent = navigator.userAgent;
                
                if (userAgent.includes('Chrome')) {
                    const match = userAgent.match(/Chrome\/(\d+)/);
                    const version = match ? parseInt(match[1]) : 0;
                    return `Chrome ${version}`;
                }
                
                if (userAgent.includes('Firefox')) {
                    const match = userAgent.match(/Firefox\/(\d+)/);
                    const version = match ? parseInt(match[1]) : 0;
                    return `Firefox ${version}`;
                }
                
                if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
                    const match = userAgent.match(/Version\/(\d+)/);
                    const version = match ? parseInt(match[1]) : 0;
                    return `Safari ${version}`;
                }
                
                return 'Browser (Unknown)';
            }
            
            return 'Browser';
        } else if (typeof global !== 'undefined') {
            // Node.js环境
            if (typeof process !== 'undefined' && process.version) {
                return `Node.js ${process.version}`;
            }
            return 'Node.js';
        } else if (typeof (globalThis as any).wx !== 'undefined') {
            // 微信小程序
            return 'WeChat MiniProgram';
        } else if (typeof (globalThis as any).cc !== 'undefined') {
            // Cocos Creator
            return 'Cocos Creator';
        } else if (typeof (globalThis as any).Laya !== 'undefined') {
            // Laya引擎
            return 'Laya Engine';
        }
        
        return 'Unknown';
    }
    
    /**
     * 检测JavaScript引擎
     * @returns JS引擎信息
     */
    private static detectJSEngine(): string {
        try {
            // V8引擎特征检测
            if (typeof process !== 'undefined' && process.versions && process.versions.v8) {
                return `V8 ${process.versions.v8}`;
            }
            
            // SpiderMonkey特征检测
            if (typeof (globalThis as any).Components !== 'undefined') {
                return 'SpiderMonkey';
            }
            
            // JavaScriptCore特征检测
            if (typeof window !== 'undefined' && typeof (window as any).safari !== 'undefined') {
                return 'JavaScriptCore';
            }
            
            return 'Unknown';
        } catch {
            return 'Unknown';
        }
    }
    
}

/**
 * 环境信息接口
 */
export interface EnvironmentInfo {
    /** 是否支持BigInt */
    supportsBigInt: boolean;
    /** 运行环境 */
    environment: string;
    /** JavaScript引擎 */
    jsEngine: string;
}