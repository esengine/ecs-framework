/**
 * Web 平台存储子系统
 */

import type {
    IPlatformStorageSubsystem,
    StorageInfo
} from '@esengine/platform-common';

/**
 * Web 平台存储子系统实现
 */
export class WebStorageSubsystem implements IPlatformStorageSubsystem {
    getStorageSync<T = any>(key: string): T | undefined {
        try {
            const value = localStorage.getItem(key);
            if (value === null) {
                return undefined;
            }
            return JSON.parse(value) as T;
        } catch {
            return undefined;
        }
    }

    setStorageSync<T = any>(key: string, value: T): void {
        localStorage.setItem(key, JSON.stringify(value));
    }

    removeStorageSync(key: string): void {
        localStorage.removeItem(key);
    }

    clearStorageSync(): void {
        localStorage.clear();
    }

    getStorageInfoSync(): StorageInfo {
        const keys: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key) {
                keys.push(key);
            }
        }

        let currentSize = 0;
        for (const key of keys) {
            const value = localStorage.getItem(key);
            if (value) {
                currentSize += key.length + value.length;
            }
        }

        return {
            keys,
            currentSize: Math.ceil(currentSize / 1024),
            limitSize: 5 * 1024
        };
    }

    async getStorage<T = any>(key: string): Promise<T | undefined> {
        return this.getStorageSync<T>(key);
    }

    async setStorage<T = any>(key: string, value: T): Promise<void> {
        this.setStorageSync(key, value);
    }

    async removeStorage(key: string): Promise<void> {
        this.removeStorageSync(key);
    }

    async clearStorage(): Promise<void> {
        this.clearStorageSync();
    }
}
