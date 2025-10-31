import { TaskStatus, NodeType } from '../../Types/TaskStatus';
import { INodeExecutor, NodeExecutionContext } from '../NodeExecutor';
import { NodeExecutorMetadata } from '../NodeMetadata';

/**
 * 总是成功装饰器执行器
 *
 * 无论子节点结果如何都返回成功
 */
@NodeExecutorMetadata({
    implementationType: 'AlwaysSucceed',
    nodeType: NodeType.Decorator,
    displayName: '总是成功',
    description: '无论子节点结果如何都返回成功',
    category: 'Decorator'
})
export class AlwaysSucceedExecutor implements INodeExecutor {
    execute(context: NodeExecutionContext): TaskStatus {
        const { nodeData } = context;

        if (!nodeData.children || nodeData.children.length === 0) {
            return TaskStatus.Success;
        }

        const childId = nodeData.children[0]!;
        const status = context.executeChild(childId);

        if (status === TaskStatus.Running) {
            return TaskStatus.Running;
        }

        return TaskStatus.Success;
    }

    reset(context: NodeExecutionContext): void {
        if (context.nodeData.children && context.nodeData.children.length > 0) {
            context.runtime.resetNodeState(context.nodeData.children[0]!);
        }
    }
}
