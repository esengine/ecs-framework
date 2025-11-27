import { TaskStatus, NodeType } from '../../Types/TaskStatus';
import { INodeExecutor, NodeExecutionContext, BindingHelper } from '../NodeExecutor';
import { NodeExecutorMetadata } from '../NodeMetadata';

/**
 * 随机概率条件执行器
 *
 * 根据概率返回成功或失败
 */
@NodeExecutorMetadata({
    implementationType: 'RandomProbability',
    nodeType: NodeType.Condition,
    displayName: '随机概率',
    description: '根据概率返回成功或失败',
    category: 'Condition',
    configSchema: {
        probability: {
            type: 'number',
            default: 0.5,
            description: '成功概率（0-1）',
            min: 0,
            max: 1,
            supportBinding: true
        }
    }
})
export class RandomProbability implements INodeExecutor {
    execute(context: NodeExecutionContext): TaskStatus {
        const probability = BindingHelper.getValue<number>(context, 'probability', 0.5);

        const clampedProbability = Math.max(0, Math.min(1, probability));

        if (Math.random() < clampedProbability) {
            return TaskStatus.Success;
        }

        return TaskStatus.Failure;
    }
}
