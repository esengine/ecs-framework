import { TaskStatus, NodeType } from '../../Types/TaskStatus';
import { INodeExecutor, NodeExecutionContext, BindingHelper } from '../NodeExecutor';
import { NodeExecutorMetadata } from '../NodeMetadata';

/**
 * 超时装饰器执行器
 *
 * 限制子节点的执行时间
 */
@NodeExecutorMetadata({
    implementationType: 'Timeout',
    nodeType: NodeType.Decorator,
    displayName: '超时',
    description: '限制子节点的执行时间',
    category: 'Decorator',
    configSchema: {
        timeout: {
            type: 'number',
            default: 1.0,
            description: '超时时间（秒）',
            min: 0,
            supportBinding: true
        }
    }
})
export class TimeoutExecutor implements INodeExecutor {
    execute(context: NodeExecutionContext): TaskStatus {
        const { nodeData, state, totalTime } = context;

        if (!nodeData.children || nodeData.children.length === 0) {
            return TaskStatus.Failure;
        }

        const timeout = BindingHelper.getValue<number>(context, 'timeout', 1.0);

        if (state.startTime === undefined) {
            state.startTime = totalTime;
        }

        const elapsedTime = totalTime - state.startTime;
        if (elapsedTime >= timeout) {
            delete state.startTime;
            return TaskStatus.Failure;
        }

        const childId = nodeData.children[0]!;
        const status = context.executeChild(childId);

        if (status === TaskStatus.Running) {
            return TaskStatus.Running;
        }

        delete state.startTime;
        return status;
    }

    reset(context: NodeExecutionContext): void {
        delete context.state.startTime;
        if (context.nodeData.children && context.nodeData.children.length > 0) {
            context.runtime.resetNodeState(context.nodeData.children[0]!);
        }
    }
}
