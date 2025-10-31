import { TaskStatus, NodeType } from '../../Types/TaskStatus';
import { INodeExecutor, NodeExecutionContext, BindingHelper } from '../NodeExecutor';
import { NodeExecutorMetadata } from '../NodeMetadata';

/**
 * 并行选择器执行器
 *
 * 并行执行子节点，任一成功则成功
 */
@NodeExecutorMetadata({
    implementationType: 'ParallelSelector',
    nodeType: NodeType.Composite,
    displayName: '并行选择器',
    description: '并行执行子节点，任一成功则成功',
    category: 'Composite',
    configSchema: {
        failurePolicy: {
            type: 'string',
            default: 'all',
            description: '失败策略',
            options: ['all', 'one']
        }
    }
})
export class ParallelSelectorExecutor implements INodeExecutor {
    execute(context: NodeExecutionContext): TaskStatus {
        const { nodeData } = context;
        const failurePolicy = BindingHelper.getValue<string>(context, 'failurePolicy', 'all');

        if (!nodeData.children || nodeData.children.length === 0) {
            return TaskStatus.Failure;
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

        if (successCount > 0) {
            this.stopAllChildren(context);
            return TaskStatus.Success;
        }

        if (failurePolicy === 'one' && failureCount > 0) {
            this.stopAllChildren(context);
            return TaskStatus.Failure;
        }

        if (failurePolicy === 'all' && failureCount === nodeData.children.length) {
            return TaskStatus.Failure;
        }

        return hasRunning ? TaskStatus.Running : TaskStatus.Failure;
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
