/**
 * 32位哈希算法实现
 * 
 * 提供简单的32位哈希算法，用于一致性校验
 */

/**
 * MurmurHash3-32位哈希算法
 * 
 * 高质量、高性能的32位哈希算法，适用于数据完整性校验
 * 
 * @param bytes 要哈希的字节数据
 * @param seed 哈希种子，默认为0
 * @returns 32位无符号整数哈希值
 */
export function murmur3_32(bytes: Uint8Array, seed: number = 0): number {
    const c1 = 0xcc9e2d51;
    const c2 = 0x1b873593;
    let hash = seed;
    let k1: number;
    
    const nblocks = Math.floor(bytes.length / 4);
    
    // 处理完整的4字节块
    for (let i = 0; i < nblocks; i++) {
        const offset = i * 4;
        k1 = (bytes[offset] |
              (bytes[offset + 1] << 8) |
              (bytes[offset + 2] << 16) |
              (bytes[offset + 3] << 24)) >>> 0;
        
        k1 = Math.imul(k1, c1);
        k1 = ((k1 << 15) | (k1 >>> 17)) >>> 0;
        k1 = Math.imul(k1, c2);
        
        hash ^= k1;
        hash = ((hash << 13) | (hash >>> 19)) >>> 0;
        hash = Math.imul(hash, 5) + 0xe6546b64;
    }
    
    // 处理剩余字节
    const tail = bytes.length - (nblocks * 4);
    if (tail > 0) {
        k1 = 0;
        const tailStart = nblocks * 4;
        
        if (tail >= 3) k1 ^= bytes[tailStart + 2] << 16;
        if (tail >= 2) k1 ^= bytes[tailStart + 1] << 8;
        if (tail >= 1) {
            k1 ^= bytes[tailStart];
            k1 = Math.imul(k1, c1);
            k1 = ((k1 << 15) | (k1 >>> 17)) >>> 0;
            k1 = Math.imul(k1, c2);
            hash ^= k1;
        }
    }
    
    // 最终化
    hash ^= bytes.length;
    hash ^= hash >>> 16;
    hash = Math.imul(hash, 0x85ebca6b);
    hash ^= hash >>> 13;
    hash = Math.imul(hash, 0xc2b2ae35);
    hash ^= hash >>> 16;
    
    return hash >>> 0;
}

/**
 * 计算字符串的哈希值（便捷方法）
 * @param str 输入字符串
 * @param seed 哈希种子
 * @returns 32位哈希值
 */
export function hashString(str: string, seed: number = 0): number {
    const encoder = new TextEncoder();
    return murmur3_32(encoder.encode(str), seed);
}