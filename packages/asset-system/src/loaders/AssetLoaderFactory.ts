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
import { AudioLoader } from './AudioLoader';
import { PrefabLoader } from './PrefabLoader';

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

        // 音频加载器 / Audio loader
        this._loaders.set(AssetType.Audio, new AudioLoader());

        // 预制体加载器 / Prefab loader
        this._loaders.set(AssetType.Prefab, new PrefabLoader());
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
     * Get asset type by file extension
     * 根据文件扩展名获取资产类型
     *
     * @param extension - File extension including dot (e.g., '.btree', '.png')
     * @returns Asset type if a loader supports this extension, null otherwise
     */
    getAssetTypeByExtension(extension: string): AssetType | null {
        const ext = extension.toLowerCase();
        for (const [type, loader] of this._loaders) {
            if (loader.supportedExtensions.some(e => e.toLowerCase() === ext)) {
                return type;
            }
        }
        return null;
    }

    /**
     * Get asset type by file path
     * 根据文件路径获取资产类型
     *
     * Checks for compound extensions (like .tilemap.json) first, then simple extensions
     *
     * @param path - File path
     * @returns Asset type if a loader supports this file, null otherwise
     */
    getAssetTypeByPath(path: string): AssetType | null {
        const lowerPath = path.toLowerCase();

        // First check compound extensions (e.g., .tilemap.json)
        for (const [type, loader] of this._loaders) {
            for (const ext of loader.supportedExtensions) {
                if (ext.includes('.') && ext.split('.').length > 2) {
                    // This is a compound extension like .tilemap.json
                    if (lowerPath.endsWith(ext.toLowerCase())) {
                        return type;
                    }
                }
            }
        }

        // Then check simple extensions
        const lastDot = path.lastIndexOf('.');
        if (lastDot !== -1) {
            const ext = path.substring(lastDot).toLowerCase();
            return this.getAssetTypeByExtension(ext);
        }

        return null;
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
