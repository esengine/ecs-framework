/**
 * Asset cache implementation
 * 资产缓存实现
 */

import { AssetGUID } from '../types/AssetTypes';

/**
 * Cache entry
 * 缓存条目
 */
interface CacheEntry {
    guid: AssetGUID;
    asset: unknown;
    lastAccessTime: number;
    accessCount: number;
}

/**
 * Asset cache implementation
 * 资产缓存实现
 */
export class AssetCache {
    private readonly _cache = new Map<AssetGUID, CacheEntry>();

    constructor() {
        // 无配置，无限制缓存 / No config, unlimited cache
    }

    /**
     * Get cached asset
     * 获取缓存的资产
     */
    get<T = unknown>(guid: AssetGUID): T | null {
        const entry = this._cache.get(guid);
        if (!entry) return null;

        // 更新访问信息 / Update access info
        entry.lastAccessTime = Date.now();
        entry.accessCount++;

        return entry.asset as T;
    }

    /**
     * Set cached asset
     * 设置缓存的资产
     */
    set<T = unknown>(guid: AssetGUID, asset: T): void {
        const now = Date.now();
        const entry: CacheEntry = {
            guid,
            asset,
            lastAccessTime: now,
            accessCount: 1
        };

        // 如果已存在，更新 / Update if exists
        const oldEntry = this._cache.get(guid);
        if (oldEntry) {
            entry.accessCount = oldEntry.accessCount + 1;
        }

        this._cache.set(guid, entry);
    }

    /**
     * Check if asset is cached
     * 检查资产是否缓存
     */
    has(guid: AssetGUID): boolean {
        return this._cache.has(guid);
    }

    /**
     * Remove asset from cache
     * 从缓存移除资产
     */
    remove(guid: AssetGUID): void {
        this._cache.delete(guid);
    }

    /**
     * Clear all cache
     * 清空所有缓存
     */
    clear(): void {
        this._cache.clear();
    }

    /**
     * Get cache size
     * 获取缓存大小
     */
    getSize(): number {
        return this._cache.size;
    }

    /**
     * Get all cached GUIDs
     * 获取所有缓存的GUID
     */
    getAllGuids(): AssetGUID[] {
        return Array.from(this._cache.keys());
    }

    /**
     * Get cache statistics
     * 获取缓存统计
     */
    getStatistics(): {
        count: number;
        entries: Array<{
            guid: AssetGUID;
            accessCount: number;
            lastAccessTime: number;
        }>;
        } {
        const entries = Array.from(this._cache.values()).map((entry) => ({
            guid: entry.guid,
            accessCount: entry.accessCount,
            lastAccessTime: entry.lastAccessTime
        }));

        return {
            count: this._cache.size,
            entries
        };
    }
}
