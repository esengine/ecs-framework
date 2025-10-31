import { TaskStatus, NodeType } from '../../Types/TaskStatus';
import { INodeExecutor, NodeExecutionContext, BindingHelper } from '../NodeExecutor';
import { NodeExecutorMetadata } from '../NodeMetadata';

/**
 * 执行条件执行器
 *
 * 执行自定义条件逻辑
 */
@NodeExecutorMetadata({
    implementationType: 'ExecuteCondition',
    nodeType: NodeType.Condition,
    displayName: '执行条件',
    description: '执行自定义条件逻辑',
    category: 'Condition',
    configSchema: {
        conditionName: {
            type: 'string',
            default: '',
            description: '条件名称（黑板中condition_前缀的函数）'
        }
    }
})
export class ExecuteCondition implements INodeExecutor {
    execute(context: NodeExecutionContext): TaskStatus {
        const { runtime, entity } = context;
        const conditionName = BindingHelper.getValue<string>(context, 'conditionName', '');

        if (!conditionName) {
            return TaskStatus.Failure;
        }

        const conditionFunction = runtime.getBlackboardValue<(entity: NodeExecutionContext['entity']) => boolean>(`condition_${conditionName}`);

        if (!conditionFunction || typeof conditionFunction !== 'function') {
            return TaskStatus.Failure;
        }

        try {
            return conditionFunction(entity) ? TaskStatus.Success : TaskStatus.Failure;
        } catch (error) {
            console.error(`ExecuteCondition failed: ${error}`);
            return TaskStatus.Failure;
        }
    }
}
