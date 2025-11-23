/**
 * Asset reference for lazy loading
 * 用于懒加载的资产引用
 */

import { AssetGUID, IAssetLoadOptions, AssetState } from '../types/AssetTypes';
import { IAssetManager } from '../interfaces/IAssetManager';

/**
 * Asset reference class for lazy loading
 * 懒加载资产引用类
 */
export class AssetReference<T = unknown> {
    private _guid: AssetGUID;
    private _asset?: T;
    private _loadPromise?: Promise<T>;
    private _manager?: IAssetManager;
    private _isReleased = false;
    private _autoRelease = false;

    /**
     * Constructor
     * 构造函数
     */
    constructor(guid: AssetGUID, manager?: IAssetManager) {
        this._guid = guid;
        this._manager = manager;
    }

    /**
     * Get asset GUID
     * 获取资产GUID
     */
    get guid(): AssetGUID {
        return this._guid;
    }

    /**
     * Check if asset is loaded
     * 检查资产是否已加载
     */
    get isLoaded(): boolean {
        return this._asset !== undefined && !this._isReleased;
    }

    /**
     * Get asset synchronously (returns null if not loaded)
     * 同步获取资产（如果未加载则返回null）
     */
    get asset(): T | null {
        return this._asset ?? null;
    }

    /**
     * Set asset manager
     * 设置资产管理器
     */
    setManager(manager: IAssetManager): void {
        this._manager = manager;
    }

    /**
     * Load asset asynchronously
     * 异步加载资产
     */
    async loadAsync(options?: IAssetLoadOptions): Promise<T> {
        if (this._isReleased) {
            throw new Error(`Asset reference ${this._guid} has been released`);
        }

        // 如果已经加载，直接返回 / Return if already loaded
        if (this._asset !== undefined) {
            return this._asset;
        }

        // 如果正在加载，返回加载Promise / Return loading promise if loading
        if (this._loadPromise) {
            return this._loadPromise;
        }

        if (!this._manager) {
            throw new Error('Asset manager not set for AssetReference');
        }

        // 开始加载 / Start loading
        this._loadPromise = this.performLoad(options);

        try {
            const asset = await this._loadPromise;
            return asset;
        } finally {
            this._loadPromise = undefined;
        }
    }

    /**
     * Perform asset loading
     * 执行资产加载
     */
    private async performLoad(options?: IAssetLoadOptions): Promise<T> {
        if (!this._manager) {
            throw new Error('Asset manager not set');
        }

        const result = await this._manager.loadAsset<T>(this._guid, options);
        this._asset = result.asset;

        // 增加引用计数 / Increase reference count
        this._manager.addReference(this._guid);

        return this._asset;
    }

    /**
     * Release asset reference
     * 释放资产引用
     */
    release(): void {
        if (this._isReleased) return;

        if (this._manager && this._asset !== undefined) {
            // 减少引用计数 / Decrease reference count
            this._manager.removeReference(this._guid);

            // 如果引用计数为0，可以考虑卸载 / Consider unloading if reference count is 0
            const refInfo = this._manager.getReferenceInfo(this._guid);
            if (refInfo && refInfo.referenceCount === 0 && this._autoRelease) {
                this._manager.unloadAsset(this._guid);
            }
        }

        this._asset = undefined;
        this._isReleased = true;
    }

    /**
     * Set auto-release mode
     * 设置自动释放模式
     */
    setAutoRelease(autoRelease: boolean): void {
        this._autoRelease = autoRelease;
    }

    /**
     * Validate reference
     * 验证引用
     */
    validate(): boolean {
        if (!this._manager) return false;

        const state = this._manager.getAssetState(this._guid);
        return state !== AssetState.Failed;
    }

    /**
     * Get asset state
     * 获取资产状态
     */
    getState(): AssetState {
        if (this._isReleased) return AssetState.Unloaded;
        if (!this._manager) return AssetState.Unloaded;

        return this._manager.getAssetState(this._guid);
    }

    /**
     * Clone reference
     * 克隆引用
     */
    clone(): AssetReference<T> {
        const newRef = new AssetReference<T>(this._guid, this._manager);
        newRef.setAutoRelease(this._autoRelease);
        return newRef;
    }

    /**
     * Convert to JSON
     * 转换为JSON
     */
    toJSON(): { guid: AssetGUID } {
        return { guid: this._guid };
    }

    /**
     * Create from JSON
     * 从JSON创建
     */
    static fromJSON<T = unknown>(
        json: { guid: AssetGUID },
        manager?: IAssetManager
    ): AssetReference<T> {
        return new AssetReference<T>(json.guid, manager);
    }
}

/**
 * Weak asset reference that doesn't prevent unloading
 * 不阻止卸载的弱资产引用
 */
export class WeakAssetReference<T = unknown> {
    private _guid: AssetGUID;
    private _manager?: IAssetManager;

    constructor(guid: AssetGUID, manager?: IAssetManager) {
        this._guid = guid;
        this._manager = manager;
    }

    /**
     * Get asset GUID
     * 获取资产GUID
     */
    get guid(): AssetGUID {
        return this._guid;
    }

    /**
     * Try get asset without loading
     * 尝试获取资产而不加载
     */
    tryGet(): T | null {
        if (!this._manager) return null;
        return this._manager.getAsset<T>(this._guid);
    }

    /**
     * Load asset if not loaded
     * 如果未加载则加载资产
     */
    async loadAsync(options?: IAssetLoadOptions): Promise<T> {
        if (!this._manager) {
            throw new Error('Asset manager not set');
        }

        const result = await this._manager.loadAsset<T>(this._guid, options);
        // 不增加引用计数 / Don't increase reference count for weak reference
        return result.asset;
    }

    /**
     * Check if asset is loaded
     * 检查资产是否已加载
     */
    isLoaded(): boolean {
        if (!this._manager) return false;
        return this._manager.isLoaded(this._guid);
    }

    /**
     * Set asset manager
     * 设置资产管理器
     */
    setManager(manager: IAssetManager): void {
        this._manager = manager;
    }
}

/**
 * Asset reference array for managing multiple references
 * 用于管理多个引用的资产引用数组
 */
export class AssetReferenceArray<T = unknown> {
    private _references: AssetReference<T>[] = [];
    private _manager?: IAssetManager;

    constructor(guids: AssetGUID[] = [], manager?: IAssetManager) {
        this._manager = manager;
        this._references = guids.map((guid) => new AssetReference<T>(guid, manager));
    }

    /**
     * Add reference
     * 添加引用
     */
    add(guid: AssetGUID): void {
        this._references.push(new AssetReference<T>(guid, this._manager));
    }

    /**
     * Remove reference
     * 移除引用
     */
    remove(guid: AssetGUID): boolean {
        const index = this._references.findIndex((ref) => ref.guid === guid);
        if (index >= 0) {
            this._references[index].release();
            this._references.splice(index, 1);
            return true;
        }
        return false;
    }

    /**
     * Load all assets
     * 加载所有资产
     */
    async loadAllAsync(options?: IAssetLoadOptions): Promise<T[]> {
        const promises = this._references.map((ref) => ref.loadAsync(options));
        return Promise.all(promises);
    }

    /**
     * Release all references
     * 释放所有引用
     */
    releaseAll(): void {
        this._references.forEach((ref) => ref.release());
        this._references = [];
    }

    /**
     * Get all loaded assets
     * 获取所有已加载的资产
     */
    getLoadedAssets(): T[] {
        return this._references
            .filter((ref) => ref.isLoaded)
            .map((ref) => ref.asset!)
            .filter((asset) => asset !== null);
    }

    /**
     * Get reference count
     * 获取引用数量
     */
    get count(): number {
        return this._references.length;
    }

    /**
     * Set asset manager
     * 设置资产管理器
     */
    setManager(manager: IAssetManager): void {
        this._manager = manager;
        this._references.forEach((ref) => ref.setManager(manager));
    }
}
