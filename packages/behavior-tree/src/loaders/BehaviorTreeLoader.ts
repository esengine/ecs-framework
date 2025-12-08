/**
 * Behavior Tree Asset Loader
 * 行为树资产加载器
 *
 * 实现 IAssetLoader 接口，用于通过 AssetManager 加载行为树文件
 */

import type {
    IAssetLoader,
    IAssetParseContext,
    IAssetContent,
    AssetContentType
} from '@esengine/asset-system';
import { Core } from '@esengine/ecs-framework';
import { BehaviorTreeData } from '../execution/BehaviorTreeData';
import { BehaviorTreeAssetManager } from '../execution/BehaviorTreeAssetManager';
import { EditorToBehaviorTreeDataConverter } from '../Serialization/EditorToBehaviorTreeDataConverter';
import { BehaviorTreeAssetType } from '../constants';

/**
 * 行为树资产接口
 */
export interface IBehaviorTreeAsset {
    /** 行为树数据 */
    data: BehaviorTreeData;
    /** 文件路径 */
    path: string;
}

/**
 * 行为树加载器
 * Behavior tree loader implementing IAssetLoader interface
 */
export class BehaviorTreeLoader implements IAssetLoader<IBehaviorTreeAsset> {
    readonly supportedType = BehaviorTreeAssetType;
    readonly supportedExtensions = ['.btree'];
    readonly contentType: AssetContentType = 'text';

    /**
     * 从内容解析行为树资产
     * Parse behavior tree asset from content
     */
    async parse(content: IAssetContent, context: IAssetParseContext): Promise<IBehaviorTreeAsset> {
        if (!content.text) {
            throw new Error('Behavior tree content is empty');
        }

        // 转换为运行时数据
        const treeData = EditorToBehaviorTreeDataConverter.fromEditorJSON(content.text);

        // 使用文件路径作为 ID
        const assetPath = context.metadata.path;
        treeData.id = assetPath;

        // 同时注册到 BehaviorTreeAssetManager
        // Also register to BehaviorTreeAssetManager for legacy code that uses it directly
        // (e.g., loadFromEditorJSON, or code that doesn't use AssetManager)
        const btAssetManager = Core.services.tryResolve(BehaviorTreeAssetManager);
        if (btAssetManager) {
            btAssetManager.loadAsset(treeData);
        }

        return {
            data: treeData,
            path: assetPath
        };
    }

    /**
     * 释放资产
     * Dispose asset
     */
    dispose(asset: IBehaviorTreeAsset): void {
        // 从 BehaviorTreeAssetManager 卸载
        const btAssetManager = Core.services.tryResolve(BehaviorTreeAssetManager);
        if (btAssetManager && asset.data) {
            btAssetManager.unloadAsset(asset.data.id);
        }
    }
}
