import { TaskStatus, NodeType } from '../../Types/TaskStatus';
import { INodeExecutor, NodeExecutionContext } from '../NodeExecutor';
import { NodeExecutorMetadata } from '../NodeMetadata';

/**
 * 反转装饰器执行器
 *
 * 反转子节点的执行结果
 */
@NodeExecutorMetadata({
    implementationType: 'Inverter',
    nodeType: NodeType.Decorator,
    displayName: '反转',
    description: '反转子节点的执行结果',
    category: 'Decorator',
    childrenConstraints: {
        min: 1,
        max: 1
    }
})
export class InverterExecutor implements INodeExecutor {
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

        if (status === TaskStatus.Success) {
            return TaskStatus.Failure;
        }

        if (status === TaskStatus.Failure) {
            return TaskStatus.Success;
        }

        return TaskStatus.Failure;
    }

    reset(context: NodeExecutionContext): void {
        if (context.nodeData.children && context.nodeData.children.length > 0) {
            context.runtime.resetNodeState(context.nodeData.children[0]!);
        }
    }
}
