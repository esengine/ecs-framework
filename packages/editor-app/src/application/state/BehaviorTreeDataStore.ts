import { create } from 'zustand';
import { BehaviorTree } from '../../domain/models/BehaviorTree';
import { ITreeState } from '../commands/ITreeState';
import { useBehaviorTreeStore } from '../../stores/behaviorTreeStore';
import { Blackboard } from '../../domain/models/Blackboard';
import { createRootNode, ROOT_NODE_ID } from '../../domain/constants/RootNode';

const createInitialTree = (): BehaviorTree => {
    const rootNode = createRootNode();
    return new BehaviorTree([rootNode], [], Blackboard.empty(), ROOT_NODE_ID);
};

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
    tree: createInitialTree(),

    setTree: (tree: BehaviorTree) => set({ tree }),

    reset: () => set({ tree: createInitialTree() })
}));

/**
 * TreeState 适配器
 * 将 Zustand Store 适配为 ITreeState 接口
 * 同步更新领域层和表现层的状态
 */
export class TreeStateAdapter implements ITreeState {
    getTree(): BehaviorTree {
        return useBehaviorTreeDataStore.getState().tree;
    }

    setTree(tree: BehaviorTree): void {
        useBehaviorTreeDataStore.getState().setTree(tree);

        const nodes = Array.from(tree.nodes);
        const connections = Array.from(tree.connections);

        useBehaviorTreeStore.getState().setNodes(nodes);
        useBehaviorTreeStore.getState().setConnections(connections);
    }
}
