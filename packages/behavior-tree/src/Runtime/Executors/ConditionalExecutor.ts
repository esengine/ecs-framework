import { TaskStatus, NodeType, AbortType } from '../../Types/TaskStatus';
import { INodeExecutor, NodeExecutionContext, BindingHelper } from '../NodeExecutor';
import { NodeExecutorMetadata } from '../NodeMetadata';

/**
 * 条件装饰器执行器
 *
 * 根据条件决定是否执行子节点
 * 支持动态优先级和中止机制
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
        },
        abortType: {
            type: 'string',
            default: 'none',
            description: '中止类型',
            options: ['none', 'self', 'lower-priority', 'both']
        }
    }
})
export class ConditionalExecutor implements INodeExecutor {
    execute(context: NodeExecutionContext): TaskStatus {
        const { nodeData, runtime, state } = context;

        if (!nodeData.children || nodeData.children.length === 0) {
            return TaskStatus.Failure;
        }

        const blackboardKey = BindingHelper.getValue<string>(context, 'blackboardKey', '');
        const expectedValue = BindingHelper.getValue(context, 'expectedValue');
        const operator = BindingHelper.getValue<string>(context, 'operator', 'equals');
        const abortType = (nodeData.abortType || AbortType.None) as AbortType;

        if (!blackboardKey) {
            return TaskStatus.Failure;
        }

        const actualValue = runtime.getBlackboardValue(blackboardKey);
        const conditionMet = this.evaluateCondition(actualValue, expectedValue, operator);

        const wasRunning = state.status === TaskStatus.Running;

        if (abortType !== AbortType.None) {
            if (!state.observedKeys || state.observedKeys.length === 0) {
                state.observedKeys = [blackboardKey];
                this.setupObserver(context, blackboardKey, expectedValue, operator, abortType);
            }

            if (state.lastConditionResult !== undefined && state.lastConditionResult !== conditionMet) {
                if (conditionMet) {
                    this.handleConditionBecameTrue(context, abortType);
                } else if (wasRunning) {
                    this.handleConditionBecameFalse(context, abortType);
                }
            }
        }

        state.lastConditionResult = conditionMet;

        if (!conditionMet) {
            return TaskStatus.Failure;
        }

        const childId = nodeData.children[0]!;
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

    /**
     * 设置黑板观察者
     */
    private setupObserver(
        context: NodeExecutionContext,
        blackboardKey: string,
        expectedValue: any,
        operator: string,
        abortType: AbortType
    ): void {
        const { nodeData, runtime } = context;

        runtime.observeBlackboard(nodeData.id, [blackboardKey], (_key, newValue) => {
            const conditionMet = this.evaluateCondition(newValue, expectedValue, operator);
            const lastResult = context.state.lastConditionResult;

            if (lastResult !== undefined && lastResult !== conditionMet) {
                if (conditionMet) {
                    this.handleConditionBecameTrue(context, abortType);
                } else {
                    this.handleConditionBecameFalse(context, abortType);
                }
            }

            context.state.lastConditionResult = conditionMet;
        });
    }

    /**
     * 处理条件变为true
     */
    private handleConditionBecameTrue(context: NodeExecutionContext, abortType: AbortType): void {
        if (abortType === AbortType.LowerPriority || abortType === AbortType.Both) {
            this.requestAbortLowerPriority(context);
        }
    }

    /**
     * 处理条件变为false
     */
    private handleConditionBecameFalse(context: NodeExecutionContext, abortType: AbortType): void {
        const { nodeData, runtime } = context;

        if (abortType === AbortType.Self || abortType === AbortType.Both) {
            if (nodeData.children && nodeData.children.length > 0) {
                runtime.requestAbort(nodeData.children[0]!);
            }
        }
    }

    /**
     * 请求中止低优先级节点
     */
    private requestAbortLowerPriority(context: NodeExecutionContext): void {
        const { runtime } = context;
        runtime.requestAbort('__lower_priority__');
    }

    reset(context: NodeExecutionContext): void {
        const { nodeData, runtime, state } = context;

        if (state.observedKeys && state.observedKeys.length > 0) {
            runtime.unobserveBlackboard(nodeData.id);
            delete state.observedKeys;
        }

        delete state.lastConditionResult;

        if (nodeData.children && nodeData.children.length > 0) {
            runtime.resetNodeState(nodeData.children[0]!);
        }
    }
}
