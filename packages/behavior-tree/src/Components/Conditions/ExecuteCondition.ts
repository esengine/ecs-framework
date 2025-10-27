import { Component, ECSComponent, Entity } from '@esengine/ecs-framework';
import { Serializable, Serialize, IgnoreSerialization } from '@esengine/ecs-framework';
import { NodeType } from '../../Types/TaskStatus';
import { BehaviorNode, BehaviorProperty } from '../../Decorators/BehaviorNodeDecorator';
import { BlackboardComponent } from '../BlackboardComponent';

/**
 * 自定义条件函数类型
 */
export type CustomConditionFunction = (
    entity: Entity,
    blackboard?: BlackboardComponent,
    deltaTime?: number
) => boolean;

/**
 * 执行自定义条件组件
 *
 * 允许用户提供自定义的条件检查函数
 */
@BehaviorNode({
    displayName: '自定义条件',
    category: '条件',
    type: NodeType.Condition,
    icon: 'Code',
    description: '执行自定义条件代码',
    color: '#9C27B0'
})
@ECSComponent('ExecuteCondition')
@Serializable({ version: 1 })
export class ExecuteCondition extends Component {
    @BehaviorProperty({
        label: '条件代码',
        type: 'code',
        description: 'JavaScript 代码，返回 boolean',
        required: true
    })
    @Serialize()
    conditionCode?: string;

    @Serialize()
    parameters: Record<string, any> = {};

    @BehaviorProperty({
        label: '反转结果',
        type: 'boolean'
    })
    @Serialize()
    invertResult: boolean = false;

    /** 编译后的函数（不序列化） */
    @IgnoreSerialization()
    private compiledFunction?: CustomConditionFunction;

    /**
     * 获取或编译条件函数
     */
    getFunction(): CustomConditionFunction | undefined {
        if (!this.compiledFunction && this.conditionCode) {
            try {
                const func = new Function(
                    'entity',
                    'blackboard',
                    'deltaTime',
                    'parameters',
                    `
                    try {
                        ${this.conditionCode}
                    } catch (error) {
                        return false;
                    }
                    `
                );

                this.compiledFunction = (entity, blackboard, deltaTime) => {
                    return Boolean(func(entity, blackboard, deltaTime, this.parameters));
                };
            } catch (error) {
                return undefined;
            }
        }

        return this.compiledFunction;
    }

    /**
     * 设置自定义函数（运行时使用）
     */
    setFunction(func: CustomConditionFunction): void {
        this.compiledFunction = func;
    }
}
