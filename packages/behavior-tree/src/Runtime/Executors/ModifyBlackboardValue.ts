import { TaskStatus, NodeType } from '../../Types/TaskStatus';
import { INodeExecutor, NodeExecutionContext, BindingHelper } from '../NodeExecutor';
import { NodeExecutorMetadata } from '../NodeMetadata';

/**
 * 修改黑板值动作执行器
 *
 * 对黑板中的数值进行运算
 */
@NodeExecutorMetadata({
    implementationType: 'ModifyBlackboardValue',
    nodeType: NodeType.Action,
    displayName: '修改黑板值',
    description: '对黑板中的数值进行运算',
    category: 'Action',
    configSchema: {
        key: {
            type: 'string',
            default: '',
            description: '黑板变量名'
        },
        operation: {
            type: 'string',
            default: 'add',
            description: '运算类型',
            options: ['add', 'subtract', 'multiply', 'divide', 'set']
        },
        value: {
            type: 'number',
            default: 0,
            description: '操作数',
            supportBinding: true
        }
    }
})
export class ModifyBlackboardValue implements INodeExecutor {
    execute(context: NodeExecutionContext): TaskStatus {
        const { runtime } = context;
        const key = BindingHelper.getValue<string>(context, 'key', '');
        const operation = BindingHelper.getValue<string>(context, 'operation', 'add');
        const value = BindingHelper.getValue<number>(context, 'value', 0);

        if (!key) {
            return TaskStatus.Failure;
        }

        const currentValue = runtime.getBlackboardValue<number>(key) || 0;
        let newValue: number;

        switch (operation) {
            case 'add':
                newValue = currentValue + value;
                break;
            case 'subtract':
                newValue = currentValue - value;
                break;
            case 'multiply':
                newValue = currentValue * value;
                break;
            case 'divide':
                newValue = value !== 0 ? currentValue / value : currentValue;
                break;
            case 'set':
                newValue = value;
                break;
            default:
                return TaskStatus.Failure;
        }

        runtime.setBlackboardValue(key, newValue);

        return TaskStatus.Success;
    }
}
