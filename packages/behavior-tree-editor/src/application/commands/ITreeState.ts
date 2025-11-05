import { BehaviorTree } from '../../domain/models/BehaviorTree';

/**
 * 行为树状态接口
 * 命令通过此接口操作状态
 */
export interface ITreeState {
    /**
     * 获取当前行为树
     */
    getTree(): BehaviorTree;

    /**
     * 设置行为树
     */
    setTree(tree: BehaviorTree): void;
}
