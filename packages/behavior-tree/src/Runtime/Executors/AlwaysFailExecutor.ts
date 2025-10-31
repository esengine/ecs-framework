import { TaskStatus, NodeType } from '../../Types/TaskStatus';
import { INodeExecutor, NodeExecutionContext } from '../NodeExecutor';
import { NodeExecutorMetadata } from '../NodeMetadata';

/**
 * 总是失败装饰器执行器
 *
 * 无论子节点结果如何都返回失败
 */
@NodeExecutorMetadata({
    implementationType: 'AlwaysFail',
    nodeType: NodeType.Decorator,
    displayName: '总是失败',
    description: '无论子节点结果如何都返回失败',
    category: 'Decorator'
})
export class AlwaysFailExecutor implements INodeExecutor {
    execute(context: NodeExecutionContext): TaskStatus {
        const { nodeData } = context;

        if (!nodeData.children || nodeData.children.length === 0) {
            return TaskStatus.Failure;
        }

        const childId = nodeData.children[0]!;
        const status = context.executeChild(childId);

        if (status === TaskStatus.Running) {
            return TaskStatus.Running;
        }

        return TaskStatus.Failure;
    }

    reset(context: NodeExecutionContext): void {
        if (context.nodeData.children && context.nodeData.children.length > 0) {
            context.runtime.resetNodeState(context.nodeData.children[0]!);
        }
    }
}
