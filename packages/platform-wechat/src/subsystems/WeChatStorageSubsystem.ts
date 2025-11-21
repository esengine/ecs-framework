/**
 * 微信小游戏存储子系统
 */

import type {
    IPlatformStorageSubsystem,
    StorageInfo
} from '@esengine/platform-common';
import { getWx, promisify } from '../utils';

/**
 * 微信小游戏存储子系统实现
 */
export class WeChatStorageSubsystem implements IPlatformStorageSubsystem {
    getStorageSync<T = any>(key: string): T | undefined {
        try {
            return getWx().getStorageSync<T>(key);
        } catch {
            return undefined;
        }
    }

    setStorageSync<T = any>(key: string, value: T): void {
        getWx().setStorageSync(key, value);
    }

    removeStorageSync(key: string): void {
        getWx().removeStorageSync(key);
    }

    clearStorageSync(): void {
        getWx().clearStorageSync();
    }

    getStorageInfoSync(): StorageInfo {
        const info = getWx().getStorageInfoSync();
        return {
            keys: info.keys,
            currentSize: info.currentSize,
            limitSize: info.limitSize
        };
    }

    async getStorage<T = any>(key: string): Promise<T | undefined> {
        try {
            const res = await promisify<{ data: T }>(
                getWx().getStorage.bind(getWx()),
                { key }
            );
            return res.data;
        } catch {
            return undefined;
        }
    }

    async setStorage<T = any>(key: string, value: T): Promise<void> {
        await promisify(getWx().setStorage.bind(getWx()), { key, data: value });
    }

    async removeStorage(key: string): Promise<void> {
        await promisify(getWx().removeStorage.bind(getWx()), { key });
    }

    async clearStorage(): Promise<void> {
        await promisify(getWx().clearStorage.bind(getWx()), {});
    }
}
