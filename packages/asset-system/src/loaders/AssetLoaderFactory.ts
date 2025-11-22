/**
 * Asset loader factory implementation
 * 资产加载器工厂实现
 */

import { AssetType } from '../types/AssetTypes';
import { IAssetLoader, IAssetLoaderFactory } from '../interfaces/IAssetLoader';
import { TextureLoader } from './TextureLoader';
import { JsonLoader } from './JsonLoader';
import { TextLoader } from './TextLoader';
import { BinaryLoader } from './BinaryLoader';

/**
 * Asset loader factory
 * 资产加载器工厂
 */
export class AssetLoaderFactory implements IAssetLoaderFactory {
    private readonly _loaders = new Map<AssetType, IAssetLoader>();

    constructor() {
        // 注册默认加载器 / Register default loaders
        this.registerDefaultLoaders();
    }

    /**
     * Register default loaders
     * 注册默认加载器
     */
    private registerDefaultLoaders(): void {
        // 纹理加载器 / Texture loader
        this._loaders.set(AssetType.Texture, new TextureLoader());

        // JSON加载器 / JSON loader
        this._loaders.set(AssetType.Json, new JsonLoader());

        // 文本加载器 / Text loader
        this._loaders.set(AssetType.Text, new TextLoader());

        // 二进制加载器 / Binary loader
        this._loaders.set(AssetType.Binary, new BinaryLoader());

        // TODO: 添加更多默认加载器 / Add more default loaders
        // - MeshLoader
        // - AudioLoader
        // - MaterialLoader
        // - PrefabLoader
        // - SceneLoader
    }

    /**
     * Create loader for specific asset type
     * 为特定资产类型创建加载器
     */
    createLoader(type: AssetType): IAssetLoader | null {
        return this._loaders.get(type) || null;
    }

    /**
     * Register custom loader
     * 注册自定义加载器
     */
    registerLoader(type: AssetType, loader: IAssetLoader): void {
        this._loaders.set(type, loader);
    }

    /**
     * Unregister loader
     * 注销加载器
     */
    unregisterLoader(type: AssetType): void {
        this._loaders.delete(type);
    }

    /**
     * Check if loader exists for type
     * 检查类型是否有加载器
     */
    hasLoader(type: AssetType): boolean {
        return this._loaders.has(type);
    }

    /**
     * Get all registered loaders
     * 获取所有注册的加载器
     */
    getRegisteredTypes(): AssetType[] {
        return Array.from(this._loaders.keys());
    }

    /**
     * Clear all loaders
     * 清空所有加载器
     */
    clear(): void {
        this._loaders.clear();
    }
}