/**
 * Asset System Editor
 * 资产系统编辑器模块
 *
 * Editor-side asset management:
 * - Meta files (.meta) management
 * - Asset packing and bundling
 * - Import settings
 *
 * 编辑器端资产管理：
 * - 元数据文件 (.meta) 管理
 * - 资产打包和捆绑
 * - 导入设置
 */

// Meta file management | 元数据文件管理
export {
    AssetMetaManager,
    type IAssetMeta,
    type IImportSettings,
    type IMetaFileSystem,
    getMetaFilePath,
    inferAssetType,
    getDefaultImportSettings,
    createAssetMeta,
    serializeAssetMeta,
    parseAssetMeta
} from './meta/AssetMetaFile';

// Re-export utilities from asset-system | 从 asset-system 重导出工具函数
export { generateGUID, isValidGUID } from '@esengine/asset-system';

// Asset packing
export {
    AssetPacker,
    collectSceneAssets,
    type IPackingResult,
    type IPackedBundle,
    type IAssetFileReader
} from './packing/AssetPacker';
