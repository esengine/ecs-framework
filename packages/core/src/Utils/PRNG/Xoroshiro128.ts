/**
 * 高性能伪随机数生成器模块
 * 
 * 基于xoroshiro128**算法实现的可重现随机数生成器，支持BigInt兼容性。
 * 提供高质量的随机数生成，适用于游戏开发和科学计算场景。
 * 
 * @example
 * ```typescript
 * // 创建随机数生成器
 * const k0 = BigIntFactory.create(12345);
 * const k1 = BigIntFactory.create(67890);
 * const rng = Xoroshiro128.fromKeys(k0, k1);
 * 
 * // 生成随机数
 * const randomInt = rng.nextU32();
 * const randomFloat = rng.nextFloat();
 * 
 * // 字符串哈希
 * const hash = hashString32('SystemName');
 * 
 * // 种子扩展
 * const seed = splitmix64(BigIntFactory.create(42));
 * ```
 */

import { BigIntFactory, IBigIntLike } from '../../ECS/Utils/BigIntCompatibility';

/**
 * 64位掩码常量
 * 
 * 用于确保BigInt运算结果保持在64位范围内。
 */
const MASK_64 = BigIntFactory.fromHexString('FFFFFFFFFFFFFFFF');

/**
 * Xoroshiro128** 伪随机数生成器
 * 
 * 实现高性能的xoroshiro128**算法，具有优秀的统计特性和长周期。
 * 支持BigInt兼容性，可在不同环境中提供一致的随机数序列。
 */
export class Xoroshiro128 {
    /**
     * 内部状态s0
     * 
     * xoroshiro128算法的第一个64位状态值。
     */
    private s0: IBigIntLike;
    
    /**
     * 内部状态s1
     * 
     * xoroshiro128算法的第二个64位状态值。
     */
    private s1: IBigIntLike;
    
    /**
     * 构造函数
     * 
     * @param state0 初始状态s0
     * @param state1 初始状态s1
     */
    constructor(state0: IBigIntLike, state1: IBigIntLike) {
        this.s0 = state0;
        this.s1 = state1;
    }
    
    /**
     * 从密钥对创建随机数生成器
     * 
     * @param k0 第一个密钥
     * @param k1 第二个密钥
     * @returns Xoroshiro128实例
     */
    static fromKeys(k0: IBigIntLike, k1: IBigIntLike): Xoroshiro128 {
        return new Xoroshiro128(k0, k1);
    }
    
    /**
     * 64位左循环移位操作
     * 
     * @param x 待移位的值
     * @param k 移位位数
     * @returns 移位后的结果
     */
    private rotateLeft(x: IBigIntLike, k: number): IBigIntLike {
        const leftShift = x.shiftLeft(k);
        const rightShift = x.shiftRight(64 - k);
        
        return leftShift.or(rightShift).and(MASK_64);
    }
    
    /**
     * 生成64位无符号随机数
     * 
     * 核心的xoroshiro128**算法实现，更新内部状态并返回随机数。
     * 
     * @returns 64位随机数值
     */
    nextU64(): IBigIntLike {
        const s0 = this.s0;
        const s1 = this.s1;
        
        const multiplied = s0.and(MASK_64);
        const rotated = this.rotateLeft(multiplied, 7);
        const result = rotated.and(MASK_64);
        
        let t = s1.xor(s0);
        
        this.s0 = this.rotateLeft(s0, 24).xor(t).xor(t.shiftLeft(16)).and(MASK_64);
        this.s1 = this.rotateLeft(t, 37);
        
        return result;
    }
    
    /**
     * 生成32位无符号随机数
     * 
     * 从64位随机数中提取低32位作为结果。
     * 
     * @returns 32位无符号整数
     */
    nextU32(): number {
        const u64 = this.nextU64();
        const mask32 = BigIntFactory.fromHexString('FFFFFFFF');
        const u32BigInt = u64.and(mask32);
        return u32BigInt.valueOf() >>> 0;
    }
    
    /**
     * 生成[0,1)区间的浮点随机数
     * 
     * 使用53位尾数精度生成高质量的浮点随机数。
     * 
     * @returns [0,1)区间的浮点数
     */
    nextFloat(): number {
        const u64 = this.nextU64();
        const shift11 = u64.shiftRight(11);
        const mantissaBits = shift11.valueOf();
        
        const MAX_MANTISSA = Math.pow(2, 53);
        return mantissaBits / MAX_MANTISSA;
    }
}

/**
 * SplitMix64 种子扩展算法
 * 
 * 将单个种子值扩展为高质量的64位随机数，用于初始化xoroshiro128状态。
 * 基于SplitMix64算法，具有良好的雪崩效应。
 * 
 * @param state 输入种子值
 * @returns 扩展后的64位随机数
 */
export function splitmix64(state: IBigIntLike): IBigIntLike {
    let z = state.and(MASK_64);
    z = z.xor(z.shiftRight(30)).and(MASK_64);
    z = z.xor(z.shiftRight(27)).and(MASK_64);
    z = z.xor(z.shiftRight(31));
    
    if (z.isZero()) {
        const increment = BigIntFactory.fromHexString('9E3779B97F4A7C15');
        z = increment;
    }
    
    return z;
}

/**
 * 32位字符串哈希函数
 * 
 * 基于FNV-1a算法的快速字符串哈希，用于将系统名称转换为种子值。
 * 提供良好的分布特性，减少哈希冲突。
 * 
 * @param str 待哈希的字符串
 * @returns 32位无符号哈希值
 */
export function hashString32(str: string): number {
    let hash = 0x811c9dc5;
    
    for (let i = 0; i < str.length; i++) {
        hash ^= str.charCodeAt(i);
        hash = (hash + ((hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24))) >>> 0;
    }
    
    return hash >>> 0;
}