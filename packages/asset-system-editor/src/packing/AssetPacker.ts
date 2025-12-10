/**
 * Asset Packer
 * 资产打包器
 *
 * Collects and packs assets into bundles for runtime loading.
 * 收集并将资产打包成运行时加载的包。
 */

import {
    AssetGUID,
    AssetType,
    IBundleManifest,
    IBundleAssetInfo,
    IRuntimeCatalog,
    IRuntimeBundleInfo,
    IRuntimeAssetLocation,
    IAssetToPack,
    IBundlePackOptions,
    hashBuffer
} from '@esengine/asset-system';
import { IAssetMeta } from '../meta/AssetMetaFile';

/**
 * Packing result
 * 打包结果
 */
export interface IPackingResult {
    /** Generated bundles | 生成的包 */
    bundles: IPackedBundle[];
    /** Runtime catalog | 运行时目录 */
    catalog: IRuntimeCatalog;
    /** Total size in bytes | 总大小 */
    totalSize: number;
    /** Number of assets packed | 打包的资产数量 */
    assetCount: number;
    /** Packing duration in ms | 打包耗时 */
    duration: number;
}

/**
 * Packed bundle
 * 已打包的包
 */
export interface IPackedBundle {
    /** Bundle name | 包名称 */
    name: string;
    /** Bundle data | 包数据 */
    data: ArrayBuffer;
    /** Bundle manifest | 包清单 */
    manifest: IBundleManifest;
}

/**
 * Asset file reader interface
 * 资产文件读取器接口
 */
export interface IAssetFileReader {
    readBinary(path: string): Promise<ArrayBuffer>;
    readText(path: string): Promise<string>;
    exists(path: string): Promise<boolean>;
}

/**
 * Asset Packer
 * 资产打包器
 */
export class AssetPacker {
    private _fileReader: IAssetFileReader | null = null;
    private _assets: IAssetToPack[] = [];
    private _metas = new Map<AssetGUID, IAssetMeta>();

    /**
     * Set file reader for loading asset data
     * 设置用于加载资产数据的文件读取器
     */
    setFileReader(reader: IAssetFileReader): void {
        this._fileReader = reader;
    }

    /**
     * Add asset to pack
     * 添加要打包的资产
     */
    addAsset(asset: IAssetToPack, meta?: IAssetMeta): void {
        this._assets.push(asset);
        if (meta) {
            this._metas.set(asset.guid, meta);
        }
    }

    /**
     * Add multiple assets
     * 添加多个资产
     */
    addAssets(assets: IAssetToPack[]): void {
        for (const asset of assets) {
            this.addAsset(asset);
        }
    }

    /**
     * Clear all added assets
     * 清除所有已添加的资产
     */
    clear(): void {
        this._assets = [];
        this._metas.clear();
    }

    /**
     * Pack assets into bundles
     * 将资产打包成包
     */
    async pack(options: IBundlePackOptions = { name: 'main' }): Promise<IPackingResult> {
        const startTime = Date.now();

        // Group assets for bundling
        const groups = this._groupAssets(options);

        // Pack each group into a bundle
        const bundles: IPackedBundle[] = [];
        const catalogAssets: Record<AssetGUID, IRuntimeAssetLocation> = {};
        const catalogBundles: Record<string, IRuntimeBundleInfo> = {};

        for (const [bundleName, assets] of groups) {
            const packed = await this._packBundle(bundleName, assets, options);
            bundles.push(packed);

            // Add to catalog
            catalogBundles[bundleName] = {
                url: `assets/${bundleName}.bundle`,
                size: packed.data.byteLength,
                hash: await hashBuffer(packed.data),
                // 预加载核心资产包（可通过配置扩展） | Preload core bundles (extensible via config)
                preload: options.preloadBundles?.includes(bundleName) ??
                         (bundleName === 'core' || bundleName === 'main')
            };

            // Add asset locations
            for (const assetInfo of packed.manifest.assets) {
                catalogAssets[assetInfo.guid] = {
                    bundle: bundleName,
                    offset: assetInfo.offset,
                    size: assetInfo.size,
                    type: assetInfo.type,
                    name: assetInfo.name
                };
            }
        }

        // Create catalog
        const catalog: IRuntimeCatalog = {
            version: '1.0',
            createdAt: Date.now(),
            bundles: catalogBundles,
            assets: catalogAssets
        };

        const totalSize = bundles.reduce((sum, b) => sum + b.data.byteLength, 0);

        return {
            bundles,
            catalog,
            totalSize,
            assetCount: this._assets.length,
            duration: Date.now() - startTime
        };
    }

    /**
     * Pack assets by type (textures.bundle, audio.bundle, etc.)
     * 按类型打包资产
     */
    async packByType(): Promise<IPackingResult> {
        return this.pack({
            name: 'main',
            groupByType: true
        });
    }

    /**
     * Group assets for bundling
     * 分组资产以便打包
     */
    private _groupAssets(options: IBundlePackOptions): Map<string, IAssetToPack[]> {
        const groups = new Map<string, IAssetToPack[]>();

        if (options.groupByType) {
            // Group by asset type
            for (const asset of this._assets) {
                const bundleName = this._getBundleNameForType(asset.type);
                const group = groups.get(bundleName) || [];
                group.push(asset);
                groups.set(bundleName, group);
            }
        } else {
            // Single bundle
            groups.set(options.name, [...this._assets]);
        }

        // Handle max size splitting
        if (options.maxSize) {
            const splitGroups = new Map<string, IAssetToPack[]>();

            for (const [name, assets] of groups) {
                let currentSize = 0;
                let partIndex = 0;
                let currentGroup: IAssetToPack[] = [];

                for (const asset of assets) {
                    const assetSize = asset.data?.byteLength || 0;

                    if (currentSize + assetSize > options.maxSize && currentGroup.length > 0) {
                        splitGroups.set(`${name}_${partIndex}`, currentGroup);
                        partIndex++;
                        currentGroup = [];
                        currentSize = 0;
                    }

                    currentGroup.push(asset);
                    currentSize += assetSize;
                }

                if (currentGroup.length > 0) {
                    const finalName = partIndex > 0 ? `${name}_${partIndex}` : name;
                    splitGroups.set(finalName, currentGroup);
                }
            }

            return splitGroups;
        }

        return groups;
    }

    /**
     * Get bundle name for asset type
     * 获取资产类型的包名称
     */
    private _getBundleNameForType(type: AssetType): string {
        const typeGroups: Record<string, string[]> = {
            textures: ['texture'],
            audio: ['audio'],
            data: ['json', 'text', 'binary', 'scene', 'prefab'],
            fonts: ['font'],
            shaders: ['shader', 'material'],
            tilemaps: ['tilemap', 'tileset'],
            scripts: ['behavior-tree', 'blueprint']
        };

        for (const [bundleName, types] of Object.entries(typeGroups)) {
            if (types.includes(type)) {
                return bundleName;
            }
        }

        return 'misc';
    }

    /**
     * Pack a single bundle
     * 打包单个包
     */
    private async _packBundle(
        name: string,
        assets: IAssetToPack[],
        _options: IBundlePackOptions
    ): Promise<IPackedBundle> {
        const assetInfos: IBundleAssetInfo[] = [];
        const dataChunks: ArrayBuffer[] = [];
        let currentOffset = 0;

        // Load and pack each asset
        for (const asset of assets) {
            let data = asset.data;

            // Load data if not provided
            if (!data && this._fileReader) {
                try {
                    data = await this._fileReader.readBinary(asset.path);
                } catch (e) {
                    console.warn(`[AssetPacker] Failed to load asset: ${asset.path}`, e);
                    continue;
                }
            }

            if (!data) {
                console.warn(`[AssetPacker] No data for asset: ${asset.guid}`);
                continue;
            }

            // Align to 4 bytes
            const padding = (4 - (data.byteLength % 4)) % 4;
            const paddedSize = data.byteLength + padding;

            assetInfos.push({
                guid: asset.guid,
                name: asset.name,
                type: asset.type,
                offset: currentOffset,
                size: data.byteLength
            });

            // Add data with padding
            dataChunks.push(data);
            if (padding > 0) {
                dataChunks.push(new ArrayBuffer(padding));
            }

            currentOffset += paddedSize;
        }

        // Combine all data
        const totalSize = dataChunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
        const bundleData = new Uint8Array(totalSize);
        let offset = 0;

        for (const chunk of dataChunks) {
            bundleData.set(new Uint8Array(chunk), offset);
            offset += chunk.byteLength;
        }

        // Create manifest
        const manifest: IBundleManifest = {
            name,
            version: '1.0',
            hash: await hashBuffer(bundleData.buffer),
            compression: 'none',
            size: bundleData.byteLength,
            assets: assetInfos,
            dependencies: [],
            createdAt: Date.now()
        };

        return {
            name,
            data: bundleData.buffer,
            manifest
        };
    }

}

/**
 * Collect assets referenced by a scene
 * 收集场景引用的资产
 */
export async function collectSceneAssets(
    sceneData: unknown,
    _metaManager: { getPathByGUID: (guid: AssetGUID) => string | undefined }
): Promise<AssetGUID[]> {
    const guids = new Set<AssetGUID>();

    // Recursively find all GUID references
    function findGUIDs(obj: unknown): void {
        if (!obj || typeof obj !== 'object') return;

        if (Array.isArray(obj)) {
            for (const item of obj) {
                findGUIDs(item);
            }
            return;
        }

        const record = obj as Record<string, unknown>;

        // Check for GUID fields
        for (const [key, value] of Object.entries(record)) {
            if (key.endsWith('Guid') || key.endsWith('GUID') || key === 'guid') {
                if (typeof value === 'string' && isValidGUID(value)) {
                    guids.add(value);
                }
            } else if (typeof value === 'object') {
                findGUIDs(value);
            }
        }
    }

    findGUIDs(sceneData);
    return Array.from(guids);
}

/**
 * Validate GUID format
 * 验证 GUID 格式
 */
function isValidGUID(guid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(guid);
}
