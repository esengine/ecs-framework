/**
 * Engine integration for asset system
 * 资产系统的引擎集成
 */

import { AssetManager } from '../core/AssetManager';
import { AssetGUID } from '../types/AssetTypes';
import { ITextureAsset } from '../interfaces/IAssetLoader';
import { globalPathResolver } from '../core/AssetPathResolver';

/**
 * Engine bridge interface
 * 引擎桥接接口
 */
export interface IEngineBridge {
    /**
     * Load texture to GPU
     * 加载纹理到GPU
     */
    loadTexture(id: number, url: string): Promise<void>;

    /**
     * Load multiple textures
     * 批量加载纹理
     */
    loadTextures(requests: Array<{ id: number; url: string }>): Promise<void>;

    /**
     * Unload texture from GPU
     * 从GPU卸载纹理
     */
    unloadTexture(id: number): void;

    /**
     * Get texture info
     * 获取纹理信息
     */
    getTextureInfo(id: number): { width: number; height: number } | null;
}

/**
 * Asset system engine integration
 * 资产系统引擎集成
 */
export class EngineIntegration {
    private _assetManager: AssetManager;
    private _engineBridge?: IEngineBridge;
    private _textureIdMap = new Map<AssetGUID, number>();
    private _pathToTextureId = new Map<string, number>();

    constructor(assetManager: AssetManager, engineBridge?: IEngineBridge) {
        this._assetManager = assetManager;
        this._engineBridge = engineBridge;
    }

    /**
     * Set engine bridge
     * 设置引擎桥接
     */
    setEngineBridge(bridge: IEngineBridge): void {
        this._engineBridge = bridge;
    }

    /**
     * Load texture for component
     * 为组件加载纹理
     *
     * AssetManager 内部会处理路径解析，这里只需传入原始路径。
     * AssetManager handles path resolution internally, just pass the original path here.
     */
    async loadTextureForComponent(texturePath: string): Promise<number> {
        // 检查缓存（使用原始路径作为键）
        // Check cache (using original path as key)
        const existingId = this._pathToTextureId.get(texturePath);
        if (existingId) {
            return existingId;
        }

        // 通过资产系统加载（AssetManager 内部会解析路径）
        // Load through asset system (AssetManager resolves path internally)
        const result = await this._assetManager.loadAssetByPath<ITextureAsset>(texturePath);
        const textureAsset = result.asset;

        // 如果有引擎桥接，上传到GPU
        // Upload to GPU if bridge exists
        // 使用 globalPathResolver 将路径转换为引擎可用的 URL
        // Use globalPathResolver to convert path to engine-compatible URL
        if (this._engineBridge && textureAsset.data) {
            const engineUrl = globalPathResolver.resolve(texturePath);
            await this._engineBridge.loadTexture(textureAsset.textureId, engineUrl);
        }

        // 缓存映射（使用原始路径作为键，避免重复解析）
        // Cache mapping (using original path as key to avoid re-resolving)
        this._pathToTextureId.set(texturePath, textureAsset.textureId);

        return textureAsset.textureId;
    }

    /**
     * Load texture by GUID
     * 通过GUID加载纹理
     */
    async loadTextureByGuid(guid: AssetGUID): Promise<number> {
        // 检查是否已有纹理ID / Check if texture ID exists
        const existingId = this._textureIdMap.get(guid);
        if (existingId) {
            return existingId;
        }

        // 通过资产系统加载 / Load through asset system
        const result = await this._assetManager.loadAsset<ITextureAsset>(guid);
        const textureAsset = result.asset;

        // 如果有引擎桥接，上传到GPU / Upload to GPU if bridge exists
        if (this._engineBridge && textureAsset.data) {
            const metadata = result.metadata;
            await this._engineBridge.loadTexture(textureAsset.textureId, metadata.path);
        }

        // 缓存映射 / Cache mapping
        this._textureIdMap.set(guid, textureAsset.textureId);

        return textureAsset.textureId;
    }

    /**
     * Batch load textures
     * 批量加载纹理
     */
    async loadTexturesBatch(paths: string[]): Promise<Map<string, number>> {
        const results = new Map<string, number>();

        // 收集需要加载的纹理 / Collect textures to load
        const toLoad: string[] = [];
        for (const path of paths) {
            const existingId = this._pathToTextureId.get(path);
            if (existingId) {
                results.set(path, existingId);
            } else {
                toLoad.push(path);
            }
        }

        if (toLoad.length === 0) {
            return results;
        }

        // 并行加载所有纹理 / Load all textures in parallel
        const loadPromises = toLoad.map(async (path) => {
            try {
                const id = await this.loadTextureForComponent(path);
                results.set(path, id);
            } catch (error) {
                console.error(`Failed to load texture: ${path}`, error);
                results.set(path, 0); // 使用默认纹理ID / Use default texture ID
            }
        });

        await Promise.all(loadPromises);
        return results;
    }

    /**
     * 批量加载资源（通用方法，支持 IResourceLoader 接口）
     * Load resources in batch (generic method for IResourceLoader interface)
     *
     * @param paths 资源路径数组 / Array of resource paths
     * @param type 资源类型 / Resource type
     * @returns 路径到运行时 ID 的映射 / Map of paths to runtime IDs
     */
    async loadResourcesBatch(paths: string[], type: 'texture' | 'audio' | 'font' | 'data'): Promise<Map<string, number>> {
        // 目前只支持纹理 / Currently only supports textures
        if (type === 'texture') {
            return this.loadTexturesBatch(paths);
        }

        // 其他资源类型暂未实现 / Other resource types not yet implemented
        console.warn(`[EngineIntegration] Resource type '${type}' not yet supported`);
        return new Map();
    }

    /**
     * Unload texture
     * 卸载纹理
     */
    unloadTexture(textureId: number): void {
        // 从引擎卸载 / Unload from engine
        if (this._engineBridge) {
            this._engineBridge.unloadTexture(textureId);
        }

        // 清理映射 / Clean up mappings
        for (const [path, id] of this._pathToTextureId.entries()) {
            if (id === textureId) {
                this._pathToTextureId.delete(path);
                break;
            }
        }

        for (const [guid, id] of this._textureIdMap.entries()) {
            if (id === textureId) {
                this._textureIdMap.delete(guid);
                // 也从资产管理器卸载 / Also unload from asset manager
                this._assetManager.unloadAsset(guid);
                break;
            }
        }
    }

    /**
     * Get texture ID for path
     * 获取路径的纹理ID
     */
    getTextureId(path: string): number | null {
        return this._pathToTextureId.get(path) || null;
    }

    /**
     * Preload textures for scene
     * 为场景预加载纹理
     */
    async preloadSceneTextures(texturePaths: string[]): Promise<void> {
        await this.loadTexturesBatch(texturePaths);
    }

    /**
     * Clear all texture mappings
     * 清空所有纹理映射
     */
    clearTextureMappings(): void {
        this._textureIdMap.clear();
        this._pathToTextureId.clear();
    }

    /**
     * Get statistics
     * 获取统计信息
     */
    getStatistics(): {
        loadedTextures: number;
        } {
        return {
            loadedTextures: this._pathToTextureId.size
        };
    }
}
