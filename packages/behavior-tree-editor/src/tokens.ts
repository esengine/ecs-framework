/**
 * Behavior Tree Editor Service Tokens
 * 行为树编辑器服务令牌
 *
 * 遵循"谁定义接口，谁导出 Token"的原则。
 * Following the "who defines interface, who exports token" principle.
 */

import { createServiceToken } from '@esengine/ecs-framework';
import type { IService } from '@esengine/ecs-framework';
import type { BehaviorTree } from './domain/models/BehaviorTree';

/**
 * 行为树服务接口
 * Behavior Tree Service Interface
 */
export interface IBehaviorTreeService extends IService {
    /**
     * 创建新的行为树
     * Create a new behavior tree
     */
    createNew(): Promise<void>;

    /**
     * 从文件加载行为树
     * Load behavior tree from file
     * @param filePath 文件路径 | File path
     */
    loadFromFile(filePath: string): Promise<void>;

    /**
     * 保存行为树到文件
     * Save behavior tree to file
     * @param filePath 文件路径 | File path
     * @param metadata 可选的元数据 | Optional metadata
     */
    saveToFile(filePath: string, metadata?: { name: string; description: string }): Promise<void>;

    /**
     * 获取当前行为树
     * Get current behavior tree
     */
    getCurrentTree(): BehaviorTree;

    /**
     * 设置行为树
     * Set behavior tree
     * @param tree 行为树 | Behavior tree
     */
    setTree(tree: BehaviorTree): void;
}

/**
 * 行为树服务令牌
 * Behavior Tree Service Token
 *
 * @example
 * ```typescript
 * import { BehaviorTreeServiceToken } from '@esengine/behavior-tree-editor';
 * import { PluginAPI } from '@esengine/editor-runtime';
 *
 * const service = PluginAPI.resolve(BehaviorTreeServiceToken);
 * await service.loadFromFile('/path/to/tree.btree');
 * ```
 */
export const BehaviorTreeServiceToken = createServiceToken<IBehaviorTreeService>('behaviorTreeService');
