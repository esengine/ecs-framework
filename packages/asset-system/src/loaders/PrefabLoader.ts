/**
 * 预制体资产加载器
 * Prefab asset loader
 */

import { AssetType } from '../types/AssetTypes';
import type { IAssetLoader, IAssetParseContext } from '../interfaces/IAssetLoader';
import type { IAssetContent, AssetContentType } from '../interfaces/IAssetReader';
import type {
    IPrefabAsset,
    IPrefabData,
    SerializedPrefabEntity
} from '../interfaces/IPrefabAsset';
import { PREFAB_FORMAT_VERSION } from '../interfaces/IPrefabAsset';

/**
 * 预制体加载器实现
 * Prefab loader implementation
 */
export class PrefabLoader implements IAssetLoader<IPrefabAsset> {
    readonly supportedType = AssetType.Prefab;
    readonly supportedExtensions = ['.prefab'];
    readonly contentType: AssetContentType = 'text';

    /**
     * 从文本内容解析预制体
     * Parse prefab from text content
     */
    async parse(content: IAssetContent, context: IAssetParseContext): Promise<IPrefabAsset> {
        if (!content.text) {
            throw new Error('Prefab content is empty');
        }

        let prefabData: IPrefabData;
        try {
            prefabData = JSON.parse(content.text) as IPrefabData;
        } catch (error) {
            throw new Error(`Failed to parse prefab JSON: ${(error as Error).message}`);
        }

        // 验证预制体格式 | Validate prefab format
        this.validatePrefabData(prefabData);

        // 版本兼容性检查 | Version compatibility check
        if (prefabData.version > PREFAB_FORMAT_VERSION) {
            console.warn(
                `Prefab version ${prefabData.version} is newer than supported version ${PREFAB_FORMAT_VERSION}. ` +
                `Some features may not work correctly.`
            );
        }

        // 构建资产对象 | Build asset object
        const prefabAsset: IPrefabAsset = {
            data: prefabData,
            guid: context.metadata.guid,
            path: context.metadata.path,

            // 快捷访问属性 | Quick access properties
            get root(): SerializedPrefabEntity {
                return prefabData.root;
            },
            get componentTypes(): string[] {
                return prefabData.metadata.componentTypes;
            },
            get referencedAssets(): string[] {
                return prefabData.metadata.referencedAssets;
            }
        };

        return prefabAsset;
    }

    /**
     * 释放已加载的资产
     * Dispose loaded asset
     */
    dispose(asset: IPrefabAsset): void {
        // 清空预制体数据 | Clear prefab data
        (asset as { data: IPrefabData | null }).data = null;
    }

    /**
     * 验证预制体数据格式
     * Validate prefab data format
     */
    private validatePrefabData(data: unknown): asserts data is IPrefabData {
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid prefab data: expected object');
        }

        const prefab = data as Partial<IPrefabData>;

        // 验证版本号 | Validate version
        if (typeof prefab.version !== 'number') {
            throw new Error('Invalid prefab data: missing or invalid version');
        }

        // 验证元数据 | Validate metadata
        if (!prefab.metadata || typeof prefab.metadata !== 'object') {
            throw new Error('Invalid prefab data: missing or invalid metadata');
        }

        const metadata = prefab.metadata;
        if (typeof metadata.name !== 'string') {
            throw new Error('Invalid prefab data: missing or invalid metadata.name');
        }
        if (!Array.isArray(metadata.componentTypes)) {
            throw new Error('Invalid prefab data: missing or invalid metadata.componentTypes');
        }
        if (!Array.isArray(metadata.referencedAssets)) {
            throw new Error('Invalid prefab data: missing or invalid metadata.referencedAssets');
        }

        // 验证根实体 | Validate root entity
        if (!prefab.root || typeof prefab.root !== 'object') {
            throw new Error('Invalid prefab data: missing or invalid root entity');
        }

        this.validateSerializedEntity(prefab.root);

        // 验证组件类型注册表 | Validate component type registry
        if (!Array.isArray(prefab.componentTypeRegistry)) {
            throw new Error('Invalid prefab data: missing or invalid componentTypeRegistry');
        }
    }

    /**
     * 验证序列化实体格式
     * Validate serialized entity format
     */
    private validateSerializedEntity(entity: unknown): void {
        if (!entity || typeof entity !== 'object') {
            throw new Error('Invalid entity data: expected object');
        }

        const e = entity as Partial<SerializedPrefabEntity>;

        if (typeof e.id !== 'number') {
            throw new Error('Invalid entity data: missing or invalid id');
        }
        if (typeof e.name !== 'string') {
            throw new Error('Invalid entity data: missing or invalid name');
        }
        if (!Array.isArray(e.components)) {
            throw new Error('Invalid entity data: missing or invalid components array');
        }
        if (!Array.isArray(e.children)) {
            throw new Error('Invalid entity data: missing or invalid children array');
        }

        // 递归验证子实体 | Recursively validate child entities
        for (const child of e.children) {
            this.validateSerializedEntity(child);
        }
    }
}
