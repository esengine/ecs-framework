import { BehaviorTreeData } from './BehaviorTreeData';
import { createLogger, IService } from '@esengine/ecs-framework';
import { EditorToBehaviorTreeDataConverter } from '../Serialization/EditorToBehaviorTreeDataConverter';

const logger = createLogger('BehaviorTreeAssetManager');

/**
 * 行为树资产管理器（服务）
 *
 * 管理所有共享的BehaviorTreeData
 * 多个实例可以引用同一份数据
 *
 * 使用方式：
 * ```typescript
 * // 注册服务
 * Core.services.registerSingleton(BehaviorTreeAssetManager);
 *
 * // 使用服务
 * const assetManager = Core.services.resolve(BehaviorTreeAssetManager);
 * ```
 */
export class BehaviorTreeAssetManager implements IService {
    /**
     * 已加载的行为树资产
     */
    private assets: Map<string, BehaviorTreeData> = new Map();

    /**
     * 加载行为树资产
     */
    loadAsset(asset: BehaviorTreeData): void {
        if (this.assets.has(asset.id)) {
            logger.warn(`行为树资产已存在，将被覆盖: ${asset.id}`);
        }
        this.assets.set(asset.id, asset);
        logger.info(`行为树资产已加载: ${asset.name} (${asset.nodes.size}个节点)`);
    }

    /**
     * 从编辑器 JSON 格式加载行为树资产
     *
     * @param json 编辑器导出的 JSON 字符串
     * @returns 加载的行为树数据
     *
     * @example
     * ```typescript
     * const assetManager = Core.services.resolve(BehaviorTreeAssetManager);
     * const jsonContent = await readFile('path/to/tree.btree');
     * const treeData = assetManager.loadFromEditorJSON(jsonContent);
     * ```
     */
    loadFromEditorJSON(json: string): BehaviorTreeData {
        try {
            const treeData = EditorToBehaviorTreeDataConverter.fromEditorJSON(json);
            this.loadAsset(treeData);
            return treeData;
        } catch (error) {
            logger.error('从编辑器JSON加载失败:', error);
            throw error;
        }
    }

    /**
     * 批量加载多个行为树资产（从编辑器JSON）
     *
     * @param jsonDataList JSON字符串列表
     * @returns 成功加载的资产数量
     */
    loadMultipleFromEditorJSON(jsonDataList: string[]): number {
        let successCount = 0;
        for (const json of jsonDataList) {
            try {
                this.loadFromEditorJSON(json);
                successCount++;
            } catch (error) {
                logger.error('批量加载时出错:', error);
            }
        }
        logger.info(`批量加载完成: ${successCount}/${jsonDataList.length} 个资产`);
        return successCount;
    }

    /**
     * 获取行为树资产
     */
    getAsset(assetId: string): BehaviorTreeData | undefined {
        return this.assets.get(assetId);
    }

    /**
     * 检查资产是否存在
     */
    hasAsset(assetId: string): boolean {
        return this.assets.has(assetId);
    }

    /**
     * 卸载行为树资产
     */
    unloadAsset(assetId: string): boolean {
        const result = this.assets.delete(assetId);
        if (result) {
            logger.info(`行为树资产已卸载: ${assetId}`);
        }
        return result;
    }

    /**
     * 清空所有资产
     */
    clearAll(): void {
        this.assets.clear();
        logger.info('所有行为树资产已清空');
    }

    /**
     * 获取已加载资产数量
     */
    getAssetCount(): number {
        return this.assets.size;
    }

    /**
     * 获取所有资产ID
     */
    getAllAssetIds(): string[] {
        return Array.from(this.assets.keys());
    }

    /**
     * 释放资源（实现IService接口）
     */
    dispose(): void {
        this.clearAll();
    }
}
