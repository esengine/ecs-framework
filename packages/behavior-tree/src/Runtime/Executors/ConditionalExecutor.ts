import { TaskStatus, NodeType } from '../../Types/TaskStatus';
import { INodeExecutor, NodeExecutionContext, BindingHelper } from '../NodeExecutor';
import { NodeExecutorMetadata } from '../NodeMetadata';

/**
 * 条件装饰器执行器
 *
 * 根据条件决定是否执行子节点
 */
@NodeExecutorMetadata({
    implementationType: 'Conditional',
    nodeType: NodeType.Decorator,
    displayName: '条件',
    description: '根据条件决定是否执行子节点',
    category: 'Decorator',
    configSchema: {
        blackboardKey: {
            type: 'string',
            default: '',
            description: '黑板变量名'
        },
        expectedValue: {
            type: 'object',
            description: '期望值',
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
export class ConditionalExecutor implements INodeExecutor {
    execute(context: NodeExecutionContext): TaskStatus {
        const { nodeData, runtime } = context;

        if (!nodeData.children || nodeData.children.length === 0) {
            return TaskStatus.Failure;
        }

        const blackboardKey = BindingHelper.getValue<string>(context, 'blackboardKey', '');
        const expectedValue = BindingHelper.getValue(context, 'expectedValue');
        const operator = BindingHelper.getValue<string>(context, 'operator', 'equals');

        if (!blackboardKey) {
            return TaskStatus.Failure;
        }

        const actualValue = runtime.getBlackboardValue(blackboardKey);
        const conditionMet = this.evaluateCondition(actualValue, expectedValue, operator);

        if (!conditionMet) {
            return TaskStatus.Failure;
        }

        const childId = nodeData.children[0];
        const status = context.executeChild(childId);

        return status;
    }

    private evaluateCondition(actualValue: any, expectedValue: any, operator: string): boolean {
        switch (operator) {
            case 'equals':
                return actualValue === expectedValue;
            case 'notEquals':
                return actualValue !== expectedValue;
            case 'greaterThan':
                return actualValue > expectedValue;
            case 'lessThan':
                return actualValue < expectedValue;
            case 'greaterOrEqual':
                return actualValue >= expectedValue;
            case 'lessOrEqual':
                return actualValue <= expectedValue;
            default:
                return false;
        }
    }

    reset(context: NodeExecutionContext): void {
        if (context.nodeData.children && context.nodeData.children.length > 0) {
            context.runtime.resetNodeState(context.nodeData.children[0]);
        }
    }
}
