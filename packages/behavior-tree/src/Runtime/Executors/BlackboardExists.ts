import { TaskStatus, NodeType } from '../../Types/TaskStatus';
import { INodeExecutor, NodeExecutionContext, BindingHelper } from '../NodeExecutor';
import { NodeExecutorMetadata } from '../NodeMetadata';

/**
 * 黑板存在检查条件执行器
 *
 * 检查黑板中是否存在指定的键
 */
@NodeExecutorMetadata({
    implementationType: 'BlackboardExists',
    nodeType: NodeType.Condition,
    displayName: '黑板存在',
    description: '检查黑板中是否存在指定的键',
    category: 'Condition',
    configSchema: {
        key: {
            type: 'string',
            default: '',
            description: '黑板变量名'
        },
        checkNull: {
            type: 'boolean',
            default: false,
            description: '检查是否为null'
        }
    }
})
export class BlackboardExists implements INodeExecutor {
    execute(context: NodeExecutionContext): TaskStatus {
        const { runtime } = context;
        const key = BindingHelper.getValue<string>(context, 'key', '');
        const checkNull = BindingHelper.getValue<boolean>(context, 'checkNull', false);

        if (!key) {
            return TaskStatus.Failure;
        }

        const value = runtime.getBlackboardValue(key);

        if (value === undefined) {
            return TaskStatus.Failure;
        }

        if (checkNull && value === null) {
            return TaskStatus.Failure;
        }

        return TaskStatus.Success;
    }
}
