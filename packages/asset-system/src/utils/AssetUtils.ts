/**
 * Asset Utilities
 * 资产工具函数
 *
 * Provides common utilities for asset management:
 * - GUID validation and generation (re-exported from core)
 * - Content hashing
 * 提供资产管理的通用工具：
 * - GUID 验证和生成（从 core 重导出）
 * - 内容哈希
 */

// Re-export GUID utilities from core (single source of truth)
// 从 core 重导出 GUID 工具（单一来源）
export { generateGUID, isValidGUID } from '@esengine/ecs-framework';

// ============================================================================
// Hash Utilities
// 哈希工具
// ============================================================================

/**
 * Compute SHA-256 hash of an ArrayBuffer
 * 计算 ArrayBuffer 的 SHA-256 哈希
 *
 * Returns first 16 hex characters of the hash.
 * 返回哈希的前 16 个十六进制字符。
 *
 * @param buffer - The buffer to hash
 * @returns Hash string (16 hex characters)
 */
export async function hashBuffer(buffer: ArrayBuffer): Promise<string> {
    // Use Web Crypto API if available
    // 如果可用则使用 Web Crypto API
    if (typeof crypto !== 'undefined' && crypto.subtle) {
        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
    }

    // Fallback: simple DJB2 hash
    // 回退：简单的 DJB2 哈希
    const view = new Uint8Array(buffer);
    let hash = 5381;
    for (let i = 0; i < view.length; i++) {
        hash = ((hash << 5) + hash) ^ view[i];
    }
    return Math.abs(hash).toString(16).padStart(16, '0');
}

/**
 * Compute hash of a string
 * 计算字符串的哈希
 *
 * @param str - The string to hash
 * @returns Hash string (8 hex characters)
 */
export function hashString(str: string): string {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
}

/**
 * Compute content hash from file path and size
 * 从文件路径和大小计算内容哈希
 *
 * This is a lightweight hash for quick comparison, not cryptographically secure.
 * 这是一个用于快速比较的轻量级哈希，不具有加密安全性。
 *
 * @param path - File path
 * @param size - File size in bytes
 * @returns Hash string (8 hex characters)
 */
export function hashFileInfo(path: string, size: number): string {
    return hashString(`${path}:${size}`);
}
