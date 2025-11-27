import { TaskStatus, NodeType } from '../../Types/TaskStatus';
import { INodeExecutor, NodeExecutionContext } from '../NodeExecutor';
import { NodeExecutorMetadata } from '../NodeMetadata';

/**
 * 直到失败装饰器执行器
 *
 * 重复执行子节点直到失败
 */
@NodeExecutorMetadata({
    implementationType: 'UntilFail',
    nodeType: NodeType.Decorator,
    displayName: '直到失败',
    description: '重复执行子节点直到失败',
    category: 'Decorator'
})
export class UntilFailExecutor implements INodeExecutor {
    execute(context: NodeExecutionContext): TaskStatus {
        const { nodeData, runtime } = context;

        if (!nodeData.children || nodeData.children.length === 0) {
            return TaskStatus.Success;
        }

        const childId = nodeData.children[0]!;
        const status = context.executeChild(childId);

        if (status === TaskStatus.Running) {
            return TaskStatus.Running;
        }

        if (status === TaskStatus.Failure) {
            return TaskStatus.Failure;
        }

        runtime.resetNodeState(childId);
        return TaskStatus.Running;
    }

    reset(context: NodeExecutionContext): void {
        if (context.nodeData.children && context.nodeData.children.length > 0) {
            context.runtime.resetNodeState(context.nodeData.children[0]!);
        }
    }
}
