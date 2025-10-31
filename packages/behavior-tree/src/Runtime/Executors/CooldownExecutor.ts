import { TaskStatus, NodeType } from '../../Types/TaskStatus';
import { INodeExecutor, NodeExecutionContext, BindingHelper } from '../NodeExecutor';
import { NodeExecutorMetadata } from '../NodeMetadata';

/**
 * 冷却装饰器执行器
 *
 * 子节点执行成功后进入冷却时间
 */
@NodeExecutorMetadata({
    implementationType: 'Cooldown',
    nodeType: NodeType.Decorator,
    displayName: '冷却',
    description: '子节点执行成功后进入冷却时间',
    category: 'Decorator',
    configSchema: {
        cooldownTime: {
            type: 'number',
            default: 1.0,
            description: '冷却时间（秒）',
            min: 0,
            supportBinding: true
        }
    }
})
export class CooldownExecutor implements INodeExecutor {
    execute(context: NodeExecutionContext): TaskStatus {
        const { nodeData, state, totalTime } = context;

        if (!nodeData.children || nodeData.children.length === 0) {
            return TaskStatus.Failure;
        }

        const cooldownTime = BindingHelper.getValue<number>(context, 'cooldownTime', 1.0);

        if (state.lastExecutionTime !== undefined) {
            const timeSinceLastExecution = totalTime - state.lastExecutionTime;
            if (timeSinceLastExecution < cooldownTime) {
                return TaskStatus.Failure;
            }
        }

        const childId = nodeData.children[0]!;
        const status = context.executeChild(childId);

        if (status === TaskStatus.Running) {
            return TaskStatus.Running;
        }

        if (status === TaskStatus.Success) {
            state.lastExecutionTime = totalTime;
            return TaskStatus.Success;
        }

        return TaskStatus.Failure;
    }

    reset(context: NodeExecutionContext): void {
        delete context.state.lastExecutionTime;
        if (context.nodeData.children && context.nodeData.children.length > 0) {
            context.runtime.resetNodeState(context.nodeData.children[0]!);
        }
    }
}
