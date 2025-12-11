/**
 * Asset System for ECS Framework
 * ECS框架的资产系统
 *
 * Runtime-focused asset management:
 * - Asset loading and caching
 * - GUID-based asset resolution
 * - Bundle loading
 *
 * For editor-side functionality (meta files, packing), use @esengine/asset-system-editor
 */

// Service tokens (谁定义接口，谁导出 Token)
export { AssetManagerToken, PrefabServiceToken, type IAssetManager, type IPrefabService, type IPrefabAsset, type IPrefabData, type IPrefabMetadata } from './tokens';

// Types
export * from './types/AssetTypes';

// Bundle format (shared types for runtime and editor)
export * from './bundle/BundleFormat';

// Runtime catalog
export { RuntimeCatalog, runtimeCatalog } from './runtime/RuntimeCatalog';

// Interfaces
export * from './interfaces/IAssetLoader';
export * from './interfaces/IAssetManager';
export * from './interfaces/IAssetReader';
export * from './interfaces/IResourceComponent';

// Core
export { AssetManager } from './core/AssetManager';
export { AssetCache } from './core/AssetCache';
export { AssetDatabase } from './core/AssetDatabase';
export { AssetLoadQueue } from './core/AssetLoadQueue';
export { AssetReference, WeakAssetReference, AssetReferenceArray } from './core/AssetReference';
export { AssetPathResolver, globalPathResolver } from './core/AssetPathResolver';
export type { IAssetPathConfig } from './core/AssetPathResolver';

// Loaders
export { AssetLoaderFactory } from './loaders/AssetLoaderFactory';
export { TextureLoader } from './loaders/TextureLoader';
export { JsonLoader } from './loaders/JsonLoader';
export { TextLoader } from './loaders/TextLoader';
export { BinaryLoader } from './loaders/BinaryLoader';
export { AudioLoader } from './loaders/AudioLoader';
export { PrefabLoader } from './loaders/PrefabLoader';

// Integration
export { EngineIntegration } from './integration/EngineIntegration';
export type { IEngineBridge } from './integration/EngineIntegration';

// Services
export { SceneResourceManager } from './services/SceneResourceManager';
export type { IResourceLoader } from './services/SceneResourceManager';

// Utils
export { UVHelper } from './utils/UVHelper';
export {
    isValidGUID,
    generateGUID,
    hashBuffer,
    hashString,
    hashFileInfo
} from './utils/AssetUtils';

// Default instance
import { AssetManager } from './core/AssetManager';

/**
 * Default asset manager instance
 * 默认资产管理器实例
 */
export const assetManager = new AssetManager();

/**
 * Initialize asset system with catalog
 * 使用目录初始化资产系统
 */
export function initializeAssetSystem(catalog?: IAssetCatalog): AssetManager {
    if (catalog) {
        return new AssetManager(catalog);
    }
    return assetManager;
}

// Re-export IAssetCatalog for initializeAssetSystem signature
import type { IAssetCatalog } from './types/AssetTypes';
