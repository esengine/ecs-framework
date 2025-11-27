import { TaskStatus, NodeType } from '../../Types/TaskStatus';
import { INodeExecutor, NodeExecutionContext, BindingHelper } from '../NodeExecutor';
import { NodeExecutorMetadata } from '../NodeMetadata';

/**
 * 执行动作执行器
 *
 * 执行自定义动作逻辑
 */
@NodeExecutorMetadata({
    implementationType: 'ExecuteAction',
    nodeType: NodeType.Action,
    displayName: '执行动作',
    description: '执行自定义动作逻辑',
    category: 'Action',
    configSchema: {
        actionName: {
            type: 'string',
            default: '',
            description: '动作名称（黑板中action_前缀的函数）'
        }
    }
})
export class ExecuteAction implements INodeExecutor {
    execute(context: NodeExecutionContext): TaskStatus {
        const { runtime, entity } = context;
        const actionName = BindingHelper.getValue<string>(context, 'actionName', '');

        if (!actionName) {
            return TaskStatus.Failure;
        }

        const actionFunction = runtime.getBlackboardValue<(entity: NodeExecutionContext['entity']) => TaskStatus>(`action_${actionName}`);

        if (!actionFunction || typeof actionFunction !== 'function') {
            return TaskStatus.Failure;
        }

        try {
            return actionFunction(entity);
        } catch (error) {
            console.error(`ExecuteAction failed: ${error}`);
            return TaskStatus.Failure;
        }
    }
}
