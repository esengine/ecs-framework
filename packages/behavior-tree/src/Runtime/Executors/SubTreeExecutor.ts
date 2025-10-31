import { TaskStatus, NodeType } from '../../Types/TaskStatus';
import { INodeExecutor, NodeExecutionContext, BindingHelper } from '../NodeExecutor';
import { NodeExecutorMetadata } from '../NodeMetadata';
import { BehaviorTreeAssetManager } from '../BehaviorTreeAssetManager';
import { Core } from '@esengine/ecs-framework';

/**
 * SubTree执行器
 *
 * 引用并执行其他行为树，实现模块化和复用
 */
@NodeExecutorMetadata({
    implementationType: 'SubTree',
    nodeType: NodeType.Action,
    displayName: '子树',
    description: '引用并执行其他行为树',
    category: 'Special',
    configSchema: {
        treeAssetId: {
            type: 'string',
            default: '',
            description: '要执行的行为树资产ID',
            supportBinding: true
        },
        shareBlackboard: {
            type: 'boolean',
            default: true,
            description: '是否共享黑板数据'
        }
    }
})
export class SubTreeExecutor implements INodeExecutor {
    private assetManager: BehaviorTreeAssetManager | null = null;

    private getAssetManager(): BehaviorTreeAssetManager {
        if (!this.assetManager) {
            this.assetManager = Core.services.resolve(BehaviorTreeAssetManager);
        }
        return this.assetManager;
    }

    execute(context: NodeExecutionContext): TaskStatus {
        const { runtime, state, entity } = context;

        const treeAssetId = BindingHelper.getValue<string>(context, 'treeAssetId', '');
        const shareBlackboard = BindingHelper.getValue<boolean>(context, 'shareBlackboard', true);

        if (!treeAssetId) {
            return TaskStatus.Failure;
        }

        const assetManager = this.getAssetManager();
        const subTreeData = assetManager.getAsset(treeAssetId);

        if (!subTreeData) {
            console.warn(`未找到子树资产: ${treeAssetId}`);
            return TaskStatus.Failure;
        }

        const rootNode = subTreeData.nodes.get(subTreeData.rootNodeId);
        if (!rootNode) {
            console.warn(`子树根节点未找到: ${subTreeData.rootNodeId}`);
            return TaskStatus.Failure;
        }

        if (!shareBlackboard && state.status !== TaskStatus.Running) {
            if (subTreeData.blackboardVariables) {
                for (const [key, value] of subTreeData.blackboardVariables.entries()) {
                    if (!runtime.hasBlackboardKey(key)) {
                        runtime.setBlackboardValue(key, value);
                    }
                }
            }
        }

        const subTreeContext: NodeExecutionContext = {
            entity,
            nodeData: rootNode,
            state: runtime.getNodeState(rootNode.id),
            runtime,
            treeData: subTreeData,
            deltaTime: context.deltaTime,
            totalTime: context.totalTime,
            executeChild: (childId: string) => {
                const childData = subTreeData.nodes.get(childId);
                if (!childData) {
                    console.warn(`子树节点未找到: ${childId}`);
                    return TaskStatus.Failure;
                }

                const childContext: NodeExecutionContext = {
                    entity,
                    nodeData: childData,
                    state: runtime.getNodeState(childId),
                    runtime,
                    treeData: subTreeData,
                    deltaTime: context.deltaTime,
                    totalTime: context.totalTime,
                    executeChild: subTreeContext.executeChild
                };

                return this.executeSubTreeNode(childContext);
            }
        };

        return this.executeSubTreeNode(subTreeContext);
    }

    private executeSubTreeNode(context: NodeExecutionContext): TaskStatus {
        const { nodeData, runtime } = context;

        const state = runtime.getNodeState(nodeData.id);

        if (!nodeData.children || nodeData.children.length === 0) {
            return TaskStatus.Success;
        }

        const childId = nodeData.children[state.currentChildIndex]!;
        const childStatus = context.executeChild(childId);

        if (childStatus === TaskStatus.Running) {
            return TaskStatus.Running;
        }

        if (childStatus === TaskStatus.Failure) {
            state.currentChildIndex = 0;
            return TaskStatus.Failure;
        }

        state.currentChildIndex++;

        if (state.currentChildIndex >= nodeData.children.length) {
            state.currentChildIndex = 0;
            return TaskStatus.Success;
        }

        return TaskStatus.Running;
    }

    reset(context: NodeExecutionContext): void {
        const treeAssetId = BindingHelper.getValue<string>(context, 'treeAssetId', '');

        if (treeAssetId) {
            const assetManager = this.getAssetManager();
            const subTreeData = assetManager.getAsset(treeAssetId);

            if (subTreeData) {
                const rootNode = subTreeData.nodes.get(subTreeData.rootNodeId);
                if (rootNode) {
                    context.runtime.resetNodeState(rootNode.id);

                    if (rootNode.children) {
                        for (const childId of rootNode.children) {
                            context.runtime.resetNodeState(childId);
                        }
                    }
                }
            }
        }
    }
}
