import { TaskStatus, NodeType } from '../../Types/TaskStatus';
import { INodeExecutor, NodeExecutionContext } from '../NodeExecutor';
import { NodeExecutorMetadata } from '../NodeMetadata';

/**
 * 根节点执行器
 *
 * 行为树的入口节点，执行其唯一的子节点
 */
@NodeExecutorMetadata({
    implementationType: 'Root',
    nodeType: NodeType.Root,
    displayName: '根节点',
    description: '行为树的入口节点',
    category: 'Root',
    childrenConstraints: {
        min: 1,
        max: 1
    }
})
export class RootExecutor implements INodeExecutor {
    execute(context: NodeExecutionContext): TaskStatus {
        const { nodeData } = context;

        // 根节点必须有且仅有一个子节点
        if (!nodeData.children || nodeData.children.length === 0) {
            return TaskStatus.Failure;
        }

        const childId = nodeData.children[0]!;
        return context.executeChild(childId);
    }

    reset(_context: NodeExecutionContext): void {
        // 根节点没有需要重置的状态
    }
}
