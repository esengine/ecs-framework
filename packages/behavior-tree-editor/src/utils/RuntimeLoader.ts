import { BehaviorTreeAssetManager, type BehaviorTreeData } from '@esengine/behavior-tree';
import { BehaviorTreeSerializer } from '../infrastructure/serialization/BehaviorTreeSerializer';
import { BehaviorTree } from '../domain/models/BehaviorTree';

/**
 * 运行时加载配置
 */
export interface RuntimeLoaderConfig {
    assetManager: BehaviorTreeAssetManager;
}

/**
 * 行为树运行时加载器
 *
 * 提供便捷的方法将编辑器导出的行为树加载到运行时
 *
 * @example
 * ```typescript
 * const assetManager = Core.services.resolve(BehaviorTreeAssetManager);
 * const loader = new RuntimeLoader({ assetManager });
 *
 * // 从JSON字符串加载
 * const treeData = loader.loadFromJSON(jsonString);
 *
 * // 从文件加载（需要提供读取方法）
 * const jsonContent = await readFile('path/to/tree.btree');
 * const treeData = loader.loadFromJSON(jsonContent);
 *
 * // 使用加载的行为树
 * const entity = scene.createEntity('AI');
 * const btComponent = entity.addComponent(BehaviorTreeRuntimeComponent);
 * btComponent.setTreeData(treeData);
 * ```
 */
export class RuntimeLoader {
    private assetManager: BehaviorTreeAssetManager;
    private serializer: BehaviorTreeSerializer;

    constructor(config: RuntimeLoaderConfig) {
        this.assetManager = config.assetManager;
        this.serializer = new BehaviorTreeSerializer();
    }

    /**
     * 从编辑器JSON字符串加载行为树
     *
     * @param json 编辑器保存的JSON字符串
     * @returns 加载的行为树数据
     */
    loadFromJSON(json: string): BehaviorTreeData {
        return this.assetManager.loadFromEditorJSON(json);
    }

    /**
     * 批量加载多个行为树
     *
     * @param jsonList JSON字符串列表
     * @returns 成功加载的数量
     */
    loadMultiple(jsonList: string[]): number {
        return this.assetManager.loadMultipleFromEditorJSON(jsonList);
    }

    /**
     * 获取已加载的行为树
     *
     * @param assetId 资产ID
     * @returns 行为树数据，如果未找到返回undefined
     */
    getTree(assetId: string): BehaviorTreeData | undefined {
        return this.assetManager.getAsset(assetId);
    }

    /**
     * 检查行为树是否已加载
     *
     * @param assetId 资产ID
     * @returns 是否已加载
     */
    isLoaded(assetId: string): boolean {
        return this.assetManager.hasAsset(assetId);
    }

    /**
     * 卸载行为树
     *
     * @param assetId 资产ID
     * @returns 是否成功卸载
     */
    unload(assetId: string): boolean {
        return this.assetManager.unloadAsset(assetId);
    }

    /**
     * 清空所有已加载的行为树
     */
    clearAll(): void {
        this.assetManager.clearAll();
    }

    /**
     * 获取所有已加载的行为树ID
     *
     * @returns 资产ID列表
     */
    getAllLoadedIds(): string[] {
        return this.assetManager.getAllAssetIds();
    }

    /**
     * 获取已加载的行为树数量
     *
     * @returns 数量
     */
    getLoadedCount(): number {
        return this.assetManager.getAssetCount();
    }

    /**
     * 验证JSON格式是否有效
     *
     * @param json JSON字符串
     * @returns 验证结果
     */
    validateJSON(json: string): { valid: boolean; error?: string } {
        try {
            const obj = JSON.parse(json);

            if (!obj.nodes || !Array.isArray(obj.nodes)) {
                return { valid: false, error: '缺少nodes字段或格式不正确' };
            }

            if (!obj.metadata) {
                return { valid: false, error: '缺少metadata字段' };
            }

            if (obj.nodes.length === 0) {
                return { valid: false, error: '行为树没有节点' };
            }

            return { valid: true };
        } catch (error) {
            return {
                valid: false,
                error: error instanceof Error ? error.message : '无效的JSON格式'
            };
        }
    }

    /**
     * 从编辑器BehaviorTree对象导出为运行时资产JSON
     *
     * @param tree 编辑器行为树对象
     * @returns JSON字符串
     */
    exportTreeToJSON(tree: BehaviorTree): string {
        const result = this.serializer.exportToRuntimeAsset(tree, 'json');
        if (typeof result !== 'string') {
            throw new Error('导出失败：期望字符串格式');
        }
        return result;
    }

    /**
     * 从编辑器BehaviorTree对象导出为运行时资产二进制
     *
     * @param tree 编辑器行为树对象
     * @returns 二进制数据
     */
    exportTreeToBinary(tree: BehaviorTree): Uint8Array {
        const result = this.serializer.exportToRuntimeAsset(tree, 'binary');
        if (!(result instanceof Uint8Array)) {
            throw new Error('导出失败：期望二进制格式');
        }
        return result;
    }
}

/**
 * 创建运行时加载器的工厂函数
 *
 * @param assetManager 行为树资产管理器
 * @returns 运行时加载器实例
 *
 * @example
 * ```typescript
 * const loader = createRuntimeLoader(assetManager);
 * ```
 */
export function createRuntimeLoader(assetManager: BehaviorTreeAssetManager): RuntimeLoader {
    return new RuntimeLoader({ assetManager });
}
