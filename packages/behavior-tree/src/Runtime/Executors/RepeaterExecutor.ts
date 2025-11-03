import { TaskStatus, NodeType } from '../../Types/TaskStatus';
import { INodeExecutor, NodeExecutionContext, BindingHelper } from '../NodeExecutor';
import { NodeExecutorMetadata } from '../NodeMetadata';

/**
 * 重复装饰器执行器
 *
 * 重复执行子节点指定次数
 */
@NodeExecutorMetadata({
    implementationType: 'Repeater',
    nodeType: NodeType.Decorator,
    displayName: '重复',
    description: '重复执行子节点指定次数',
    category: 'Decorator',
    configSchema: {
        repeatCount: {
            type: 'number',
            default: 1,
            description: '重复次数（-1表示无限循环）',
            supportBinding: true
        },
        endOnFailure: {
            type: 'boolean',
            default: false,
            description: '子节点失败时是否结束'
        }
    },
    childrenConstraints: {
        min: 1,
        max: 1
    }
})
export class RepeaterExecutor implements INodeExecutor {
    execute(context: NodeExecutionContext): TaskStatus {
        const { nodeData, state, runtime } = context;
        const repeatCount = BindingHelper.getValue<number>(context, 'repeatCount', 1);
        const endOnFailure = BindingHelper.getValue<boolean>(context, 'endOnFailure', false);

        if (!nodeData.children || nodeData.children.length === 0) {
            return TaskStatus.Success;
        }

        const childId = nodeData.children[0]!;

        if (!state.repeatCount) {
            state.repeatCount = 0;
        }

        const status = context.executeChild(childId);

        if (status === TaskStatus.Running) {
            return TaskStatus.Running;
        }

        if (status === TaskStatus.Failure && endOnFailure) {
            state.repeatCount = 0;
            return TaskStatus.Failure;
        }

        state.repeatCount++;
        runtime.resetNodeState(childId);

        const shouldContinue = (repeatCount === -1) || (state.repeatCount < repeatCount);

        if (shouldContinue) {
            return TaskStatus.Running;
        } else {
            state.repeatCount = 0;
            return TaskStatus.Success;
        }
    }

    reset(context: NodeExecutionContext): void {
        delete context.state.repeatCount;
        if (context.nodeData.children && context.nodeData.children.length > 0) {
            context.runtime.resetNodeState(context.nodeData.children[0]!);
        }
    }
}
