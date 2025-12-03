/**
 * Material asset loader.
 * 材质资产加载器。
 */

import {
    AssetType,
    IAssetContent,
    IAssetParseContext
} from '@esengine/asset-system';
import type { IAssetLoader, AssetContentType } from '@esengine/asset-system';
import { Material } from '../Material';

/**
 * Material asset data structure.
 * 材质资产数据结构。
 */
export interface IMaterialAssetData {
    /** Material instance. | 材质实例。 */
    material: Material;
    /** Material definition data. | 材质定义数据。 */
    definition: Record<string, unknown>;
}

/**
 * Material file loader.
 * 材质文件加载器。
 */
export class MaterialLoader implements IAssetLoader<IMaterialAssetData> {
    readonly supportedType = AssetType.Material;
    readonly supportedExtensions = ['.mat'];
    readonly contentType: AssetContentType = 'text';

    /**
     * Parse material from content.
     * 从内容解析材质。
     */
    async parse(content: IAssetContent, context: IAssetParseContext): Promise<IMaterialAssetData> {
        if (!content.text) {
            throw new Error('Material content is empty');
        }

        const data = JSON.parse(content.text);

        // Support wrapper format: { material: {...} }
        const materialDef = data.material || data;

        // Create material from definition.
        const material = Material.fromDefinition(materialDef);

        return {
            material,
            definition: materialDef
        };
    }

    /**
     * Dispose material asset.
     * 释放材质资产。
     */
    dispose(_asset: IMaterialAssetData): void {
        // Material cleanup if needed.
    }
}
