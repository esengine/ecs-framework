import { TaskStatus, NodeType } from '../../Types/TaskStatus';
import { INodeExecutor, NodeExecutionContext, BindingHelper } from '../NodeExecutor';
import { NodeExecutorMetadata } from '../NodeMetadata';

/**
 * 设置黑板值动作执行器
 *
 * 设置黑板中的变量值
 */
@NodeExecutorMetadata({
    implementationType: 'SetBlackboardValue',
    nodeType: NodeType.Action,
    displayName: '设置黑板值',
    description: '设置黑板中的变量值',
    category: 'Action',
    configSchema: {
        key: {
            type: 'string',
            default: '',
            description: '黑板变量名'
        },
        value: {
            type: 'object',
            description: '要设置的值',
            supportBinding: true
        }
    }
})
export class SetBlackboardValue implements INodeExecutor {
    execute(context: NodeExecutionContext): TaskStatus {
        const { runtime } = context;
        const key = BindingHelper.getValue<string>(context, 'key', '');
        const value = BindingHelper.getValue(context, 'value');

        if (!key) {
            return TaskStatus.Failure;
        }

        runtime.setBlackboardValue(key, value);

        return TaskStatus.Success;
    }
}
