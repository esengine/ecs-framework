import { TaskStatus, NodeType } from '../../Types/TaskStatus';
import { INodeExecutor, NodeExecutionContext } from '../NodeExecutor';
import { NodeExecutorMetadata } from '../NodeMetadata';

/**
 * 序列节点执行器
 *
 * 按顺序执行子节点，全部成功才成功，任一失败则失败
 */
@NodeExecutorMetadata({
    implementationType: 'Sequence',
    nodeType: NodeType.Composite,
    displayName: '序列',
    description: '按顺序执行子节点，全部成功才成功',
    category: 'Composite',
    childrenConstraints: {
        min: 1
    }
})
export class SequenceExecutor implements INodeExecutor {
    execute(context: NodeExecutionContext): TaskStatus {
        const { nodeData, state } = context;

        if (!nodeData.children || nodeData.children.length === 0) {
            return TaskStatus.Success;
        }

        while (state.currentChildIndex < nodeData.children.length) {
            const childId = nodeData.children[state.currentChildIndex]!;
            const status = context.executeChild(childId);

            if (status === TaskStatus.Running) {
                return TaskStatus.Running;
            }

            if (status === TaskStatus.Failure) {
                state.currentChildIndex = 0;
                return TaskStatus.Failure;
            }

            state.currentChildIndex++;
        }

        state.currentChildIndex = 0;
        return TaskStatus.Success;
    }

    reset(context: NodeExecutionContext): void {
        context.state.currentChildIndex = 0;
    }
}
