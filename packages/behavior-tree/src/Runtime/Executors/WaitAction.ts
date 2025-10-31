import { TaskStatus, NodeType } from '../../Types/TaskStatus';
import { INodeExecutor, NodeExecutionContext, BindingHelper } from '../NodeExecutor';
import { NodeExecutorMetadata } from '../NodeMetadata';

/**
 * 等待动作执行器
 *
 * 等待指定时间后返回成功
 */
@NodeExecutorMetadata({
    implementationType: 'Wait',
    nodeType: NodeType.Action,
    displayName: '等待',
    description: '等待指定时间后返回成功',
    category: 'Action',
    configSchema: {
        duration: {
            type: 'number',
            default: 1.0,
            description: '等待时长（秒）',
            min: 0,
            supportBinding: true
        }
    }
})
export class WaitAction implements INodeExecutor {
    execute(context: NodeExecutionContext): TaskStatus {
        const { state, totalTime } = context;
        const duration = BindingHelper.getValue<number>(context, 'duration', 1.0);

        if (!state.startTime) {
            state.startTime = totalTime;
            return TaskStatus.Running;
        }

        if (totalTime - state.startTime >= duration) {
            return TaskStatus.Success;
        }

        return TaskStatus.Running;
    }

    reset(context: NodeExecutionContext): void {
        delete context.state.startTime;
    }
}
