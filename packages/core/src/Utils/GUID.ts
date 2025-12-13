/**
 * GUID 生成工具
 *
 * 提供跨平台的 UUID v4 生成功能，用于实体持久化标识。
 * 优先使用 crypto.randomUUID()，降级使用 Math.random() 实现。
 *
 * GUID generation utility.
 * Provides cross-platform UUID v4 generation for entity persistent identification.
 * Uses crypto.randomUUID() when available, falls back to Math.random() implementation.
 */

/**
 * 生成 UUID v4 格式的 GUID
 *
 * Generate a UUID v4 format GUID.
 *
 * @returns 36 字符的 UUID 字符串 (例如: "550e8400-e29b-41d4-a716-446655440000")
 *
 * @example
 * ```typescript
 * const id = generateGUID();
 * console.log(id); // "550e8400-e29b-41d4-a716-446655440000"
 * ```
 */
export function generateGUID(): string {
    // 优先使用原生 crypto API（浏览器和 Node.js 19+）
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }

    // 降级方案：使用 crypto.getRandomValues 或 Math.random
    return generateGUIDFallback();
}

/**
 * 降级 GUID 生成实现
 *
 * Fallback GUID generation using crypto.getRandomValues or Math.random.
 */
function generateGUIDFallback(): string {
    // 尝试使用 crypto.getRandomValues
    if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
        const bytes = new Uint8Array(16);
        crypto.getRandomValues(bytes);

        // 设置版本号 (version 4)
        bytes[6] = (bytes[6]! & 0x0f) | 0x40;
        // 设置变体 (variant 1)
        bytes[8] = (bytes[8]! & 0x3f) | 0x80;

        return formatUUID(bytes);
    }

    // 最终降级：使用 Math.random（不推荐，但可用）
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

/**
 * 格式化 16 字节数组为 UUID 字符串
 *
 * Format 16-byte array to UUID string.
 */
function formatUUID(bytes: Uint8Array): string {
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/**
 * 验证字符串是否为有效的 UUID 格式
 *
 * Validate if a string is a valid UUID format.
 *
 * @param value - 要验证的字符串
 * @returns 如果是有效的 UUID 格式返回 true
 */
export function isValidGUID(value: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
}

/**
 * 空 GUID 常量
 *
 * Empty GUID constant (all zeros).
 */
export const EMPTY_GUID = '00000000-0000-0000-0000-000000000000';
