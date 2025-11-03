import { create } from 'zustand';
import { BehaviorTree } from '../../domain/models/BehaviorTree';
import { ITreeState } from '../commands/ITreeState';

/**
 * 行为树数据状态
 * 管理核心业务数据
 */
interface BehaviorTreeDataState {
    /**
     * 当前行为树
     */
    tree: BehaviorTree;

    /**
     * 设置行为树
     */
    setTree: (tree: BehaviorTree) => void;

    /**
     * 重置为空树
     */
    reset: () => void;
}

/**
 * 行为树数据 Store
 * 实现 ITreeState 接口，供命令使用
 */
export const useBehaviorTreeDataStore = create<BehaviorTreeDataState>((set) => ({
    tree: BehaviorTree.empty(),

    setTree: (tree: BehaviorTree) => set({ tree }),

    reset: () => set({ tree: BehaviorTree.empty() })
}));

/**
 * TreeState 适配器
 * 将 Zustand Store 适配为 ITreeState 接口
 */
export class TreeStateAdapter implements ITreeState {
    getTree(): BehaviorTree {
        return useBehaviorTreeDataStore.getState().tree;
    }

    setTree(tree: BehaviorTree): void {
        useBehaviorTreeDataStore.getState().setTree(tree);
    }
}
