import { TaskStatus } from '../../Types/TaskStatus';
import { INodeExecutor, NodeExecutionContext } from '../NodeExecutor';

/**
 * 等待动作执行器
 *
 * 等待指定时间后返回成功
 */
export class WaitActionExecutor implements INodeExecutor {
    execute(context: NodeExecutionContext): TaskStatus {
        const { state, nodeData, totalTime } = context;
        const duration = nodeData.config['duration'] as number || 1.0;

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
