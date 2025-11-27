import { TaskStatus, NodeType } from '../../Types/TaskStatus';
import { INodeExecutor, NodeExecutionContext, BindingHelper } from '../NodeExecutor';
import { NodeExecutorMetadata } from '../NodeMetadata';

/**
 * 黑板比较条件执行器
 *
 * 比较黑板中的值
 */
@NodeExecutorMetadata({
    implementationType: 'BlackboardCompare',
    nodeType: NodeType.Condition,
    displayName: '黑板比较',
    description: '比较黑板中的值',
    category: 'Condition',
    configSchema: {
        key: {
            type: 'string',
            default: '',
            description: '黑板变量名'
        },
        compareValue: {
            type: 'object',
            description: '比较值',
            supportBinding: true
        },
        operator: {
            type: 'string',
            default: 'equals',
            description: '比较运算符',
            options: ['equals', 'notEquals', 'greaterThan', 'lessThan', 'greaterOrEqual', 'lessOrEqual']
        }
    }
})
export class BlackboardCompare implements INodeExecutor {
    execute(context: NodeExecutionContext): TaskStatus {
        const { runtime } = context;
        const key = BindingHelper.getValue<string>(context, 'key', '');
        const compareValue = BindingHelper.getValue(context, 'compareValue');
        const operator = BindingHelper.getValue<string>(context, 'operator', 'equals');

        if (!key) {
            return TaskStatus.Failure;
        }

        const actualValue = runtime.getBlackboardValue(key);

        if (this.compare(actualValue, compareValue, operator)) {
            return TaskStatus.Success;
        }

        return TaskStatus.Failure;
    }

    private compare(actualValue: any, compareValue: any, operator: string): boolean {
        switch (operator) {
            case 'equals':
                return actualValue === compareValue;
            case 'notEquals':
                return actualValue !== compareValue;
            case 'greaterThan':
                return actualValue > compareValue;
            case 'lessThan':
                return actualValue < compareValue;
            case 'greaterOrEqual':
                return actualValue >= compareValue;
            case 'lessOrEqual':
                return actualValue <= compareValue;
            default:
                return false;
        }
    }
}
