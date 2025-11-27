import { TaskStatus, NodeType } from '../../Types/TaskStatus';
import { INodeExecutor, NodeExecutionContext, BindingHelper } from '../NodeExecutor';
import { NodeExecutorMetadata } from '../NodeMetadata';

/**
 * 并行节点执行器
 *
 * 同时执行所有子节点
 */
@NodeExecutorMetadata({
    implementationType: 'Parallel',
    nodeType: NodeType.Composite,
    displayName: '并行',
    description: '同时执行所有子节点',
    category: 'Composite',
    configSchema: {
        successPolicy: {
            type: 'string',
            default: 'all',
            description: '成功策略',
            options: ['all', 'one']
        },
        failurePolicy: {
            type: 'string',
            default: 'one',
            description: '失败策略',
            options: ['all', 'one']
        }
    },
    childrenConstraints: {
        min: 2
    }
})
export class ParallelExecutor implements INodeExecutor {
    execute(context: NodeExecutionContext): TaskStatus {
        const { nodeData } = context;
        const successPolicy = BindingHelper.getValue<string>(context, 'successPolicy', 'all');
        const failurePolicy = BindingHelper.getValue<string>(context, 'failurePolicy', 'one');

        if (!nodeData.children || nodeData.children.length === 0) {
            return TaskStatus.Success;
        }

        let hasRunning = false;
        let successCount = 0;
        let failureCount = 0;

        for (const childId of nodeData.children) {
            const status = context.executeChild(childId);

            if (status === TaskStatus.Running) {
                hasRunning = true;
            } else if (status === TaskStatus.Success) {
                successCount++;
            } else if (status === TaskStatus.Failure) {
                failureCount++;
            }
        }

        if (successPolicy === 'one' && successCount > 0) {
            this.stopAllChildren(context);
            return TaskStatus.Success;
        }

        if (successPolicy === 'all' && successCount === nodeData.children.length) {
            return TaskStatus.Success;
        }

        if (failurePolicy === 'one' && failureCount > 0) {
            this.stopAllChildren(context);
            return TaskStatus.Failure;
        }

        if (failurePolicy === 'all' && failureCount === nodeData.children.length) {
            return TaskStatus.Failure;
        }

        return hasRunning ? TaskStatus.Running : TaskStatus.Success;
    }

    private stopAllChildren(context: NodeExecutionContext): void {
        const { nodeData, runtime } = context;
        if (!nodeData.children) return;

        for (const childId of nodeData.children) {
            runtime.activeNodeIds.delete(childId);
            runtime.resetNodeState(childId);
        }
    }

    reset(context: NodeExecutionContext): void {
        const { nodeData, runtime } = context;
        if (!nodeData.children) return;

        for (const childId of nodeData.children) {
            runtime.resetNodeState(childId);
        }
    }
}
