/**
 * Asset Utilities
 * 资产工具函数
 *
 * Provides common utilities for asset management:
 * - GUID validation and generation
 * - Content hashing
 * 提供资产管理的通用工具：
 * - GUID 验证和生成
 * - 内容哈希
 */

import type { AssetGUID } from '../types/AssetTypes';

// ============================================================================
// GUID Utilities
// GUID 工具
// ============================================================================

/**
 * UUID v4 regex pattern
 * UUID v4 正则表达式
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Check if a string is a valid UUID v4 format
 * 检查字符串是否为有效的 UUID v4 格式
 */
export function isValidGUID(guid: string): boolean {
    return UUID_REGEX.test(guid);
}

/**
 * Generate a new UUID v4
 * 生成新的 UUID v4
 *
 * Uses crypto.randomUUID() if available, otherwise falls back to manual generation.
 * 如果可用则使用 crypto.randomUUID()，否则回退到手动生成。
 */
export function generateGUID(): AssetGUID {
    // Use native crypto if available (Node.js, modern browsers)
    // 如果可用则使用原生 crypto（Node.js、现代浏览器）
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }

    // Fallback: manual UUID v4 generation
    // 回退：手动生成 UUID v4
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

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
