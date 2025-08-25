/**
 * 32位哈希算法实现
 * 
 * 提供高性能的32位哈希算法，用于一致性校验和快速比较
 */

/**
 * Murmur3 32位哈希算法
 * 
 * 高性能、低碰撞率的非加密哈希算法，适用于哈希表、一致性校验等场景
 * 
 * @param bytes 要哈希的字节数据
 * @param seed 哈希种子，默认为0
 * @returns 32位无符号整数哈希值
 */
export function murmur3_32(bytes: Uint8Array, seed: number = 0): number {
    let h = seed ^ bytes.length;
    let i = 0;
    
    // 处理4字节块
    while (bytes.length - i >= 4) {
        let k = (bytes[i] | (bytes[i + 1] << 8) | (bytes[i + 2] << 16) | (bytes[i + 3] << 24)) >>> 0;
        k = Math.imul(k, 0xcc9e2d51);
        k = (k << 15) | (k >>> 17);
        k = Math.imul(k, 0x1b873593);
        h ^= k;
        h = (h << 13) | (h >>> 19);
        h = (Math.imul(h, 5) + 0xe6546b64) >>> 0;
        i += 4;
    }
    
    // 处理剩余字节
    let k = 0;
    switch (bytes.length & 3) {
        case 3:
            k ^= bytes[i + 2] << 16;
        case 2:
            k ^= bytes[i + 1] << 8;
        case 1:
            k ^= bytes[i];
            k = Math.imul(k, 0xcc9e2d51);
            k = (k << 15) | (k >>> 17);
            k = Math.imul(k, 0x1b873593);
            h ^= k;
    }
    
    // 最终混合
    h ^= bytes.length;
    h ^= h >>> 16;
    h = Math.imul(h, 0x85ebca6b);
    h ^= h >>> 13;
    h = Math.imul(h, 0xc2b2ae35);
    h ^= h >>> 16;
    
    return h >>> 0;
}

/**
 * 将字符串转换为UTF-8字节数组
 * @param str 输入字符串
 * @returns UTF-8字节数组
 */
export function stringToUtf8Bytes(str: string): Uint8Array {
    const encoder = new TextEncoder();
    return encoder.encode(str);
}

/**
 * 将数字转换为小端序字节数组
 * @param num 输入数字
 * @returns 4字节的小端序数组
 */
export function numberToBytes(num: number): Uint8Array {
    const buffer = new ArrayBuffer(4);
    const view = new DataView(buffer);
    view.setUint32(0, num >>> 0, true); // little endian
    return new Uint8Array(buffer);
}

/**
 * 拼接多个字节数组
 * @param arrays 要拼接的字节数组列表
 * @returns 拼接后的字节数组
 */
export function concatBytes(...arrays: Uint8Array[]): Uint8Array {
    const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    
    for (const array of arrays) {
        result.set(array, offset);
        offset += array.length;
    }
    
    return result;
}

/**
 * 计算字符串的Murmur3哈希值（便捷方法）
 * @param str 输入字符串
 * @param seed 哈希种子
 * @returns 32位哈希值
 */
export function hashString(str: string, seed: number = 0): number {
    return murmur3_32(stringToUtf8Bytes(str), seed);
}

/**
 * 计算多个数值的组合哈希（便捷方法）
 * @param numbers 数值数组
 * @param seed 哈希种子
 * @returns 32位哈希值
 */
export function hashNumbers(numbers: number[], seed: number = 0): number {
    const bytes = concatBytes(...numbers.map(numberToBytes));
    return murmur3_32(bytes, seed);
}