import { TaskStatus, NodeType } from '../../Types/TaskStatus';
import { INodeExecutor, NodeExecutionContext } from '../NodeExecutor';
import { NodeExecutorMetadata } from '../NodeMetadata';

/**
 * 选择器节点执行器
 *
 * 按顺序执行子节点，任一成功则成功，全部失败才失败
 */
@NodeExecutorMetadata({
    implementationType: 'Selector',
    nodeType: NodeType.Composite,
    displayName: '选择器',
    description: '按顺序执行子节点，任一成功则成功',
    category: 'Composite',
    childrenConstraints: {
        min: 1
    }
})
export class SelectorExecutor implements INodeExecutor {
    execute(context: NodeExecutionContext): TaskStatus {
        const { nodeData, state } = context;

        if (!nodeData.children || nodeData.children.length === 0) {
            return TaskStatus.Failure;
        }

        while (state.currentChildIndex < nodeData.children.length) {
            const childId = nodeData.children[state.currentChildIndex]!;
            const status = context.executeChild(childId);

            if (status === TaskStatus.Running) {
                return TaskStatus.Running;
            }

            if (status === TaskStatus.Success) {
                state.currentChildIndex = 0;
                return TaskStatus.Success;
            }

            state.currentChildIndex++;
        }

        state.currentChildIndex = 0;
        return TaskStatus.Failure;
    }

    reset(context: NodeExecutionContext): void {
        context.state.currentChildIndex = 0;
    }
}
