/**
 * Behavior Tree Asset Loader
 * 行为树资产加载器
 *
 * 实现 IAssetLoader 接口，用于通过 AssetManager 加载行为树文件
 */

import type {
    IAssetLoader,
    IAssetMetadata,
    IAssetLoadOptions,
    IAssetLoadResult
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

    /**
     * 加载行为树资产
     * Load behavior tree asset
     */
    async load(
        path: string,
        metadata: IAssetMetadata,
        _options?: IAssetLoadOptions
    ): Promise<IAssetLoadResult<IBehaviorTreeAsset>> {
        // 获取文件系统服务
        const IFileSystemServiceKey = Symbol.for('IFileSystemService');
        const fileSystem = Core.services.tryResolve(IFileSystemServiceKey) as IFileSystem | null;

        if (!fileSystem) {
            throw new Error('FileSystem service not available');
        }

        // 读取文件内容
        const content = await fileSystem.readFile(path);

        // 转换为运行时数据
        const treeData = EditorToBehaviorTreeDataConverter.fromEditorJSON(content);

        // 使用文件路径作为 ID
        treeData.id = path;

        // 注册到 BehaviorTreeAssetManager（保持兼容性）
        const btAssetManager = Core.services.tryResolve(BehaviorTreeAssetManager);
        if (btAssetManager) {
            btAssetManager.loadAsset(treeData);
        }

        const asset: IBehaviorTreeAsset = {
            data: treeData,
            path
        };

        return {
            asset,
            handle: 0, // 由 AssetManager 分配
            metadata,
            loadTime: 0
        };
    }

    /**
     * 检查是否可以加载
     * Check if can load this asset
     */
    canLoad(path: string, _metadata: IAssetMetadata): boolean {
        return path.endsWith('.btree');
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

/**
 * 文件系统接口（简化版，仅用于类型）
 */
interface IFileSystem {
    readFile(path: string): Promise<string>;
    exists(path: string): Promise<boolean>;
}
