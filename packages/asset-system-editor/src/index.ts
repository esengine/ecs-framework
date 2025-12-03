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

// Meta file management
export {
    AssetMetaManager,
    type IAssetMeta,
    type IImportSettings,
    type IMetaFileSystem,
    generateGUID,
    getMetaFilePath,
    inferAssetType,
    getDefaultImportSettings,
    createAssetMeta,
    serializeAssetMeta,
    parseAssetMeta,
    isValidGUID
} from './meta/AssetMetaFile';

// Asset packing
export {
    AssetPacker,
    collectSceneAssets,
    type IPackingResult,
    type IPackedBundle,
    type IAssetFileReader
} from './packing/AssetPacker';
