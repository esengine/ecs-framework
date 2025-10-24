import { Component, ECSComponent } from '@esengine/ecs-framework';
import { Serializable, Serialize } from '@esengine/ecs-framework';
import { NodeType } from '../../Types/TaskStatus';
import { BehaviorNode, BehaviorProperty } from '../../Decorators/BehaviorNodeDecorator';

/**
 * 比较运算符
 */
export enum CompareOperator {
    /** 等于 */
    Equal = 'equal',
    /** 不等于 */
    NotEqual = 'notEqual',
    /** 大于 */
    Greater = 'greater',
    /** 大于等于 */
    GreaterOrEqual = 'greaterOrEqual',
    /** 小于 */
    Less = 'less',
    /** 小于等于 */
    LessOrEqual = 'lessOrEqual',
    /** 包含（字符串/数组） */
    Contains = 'contains',
    /** 正则匹配 */
    Matches = 'matches'
}

/**
 * 黑板变量比较条件组件
 *
 * 比较黑板变量与指定值或另一个变量
 */
@BehaviorNode({
    displayName: '比较变量',
    category: '条件',
    type: NodeType.Condition,
    icon: 'Scale',
    description: '比较黑板变量与指定值',
    color: '#2196F3'
})
@ECSComponent('BlackboardCompareCondition')
@Serializable({ version: 1 })
export class BlackboardCompareCondition extends Component {
    @BehaviorProperty({
        label: '变量名',
        type: 'variable',
        required: true
    })
    @Serialize()
    variableName: string = '';

    @BehaviorProperty({
        label: '运算符',
        type: 'select',
        options: [
            { label: '等于', value: 'equal' },
            { label: '不等于', value: 'notEqual' },
            { label: '大于', value: 'greater' },
            { label: '大于等于', value: 'greaterOrEqual' },
            { label: '小于', value: 'less' },
            { label: '小于等于', value: 'lessOrEqual' },
            { label: '包含', value: 'contains' },
            { label: '正则匹配', value: 'matches' }
        ]
    })
    @Serialize()
    operator: CompareOperator = CompareOperator.Equal;

    @BehaviorProperty({
        label: '比较值',
        type: 'string',
        description: '可以是固定值或变量引用 {{varName}}'
    })
    @Serialize()
    compareValue: any = null;

    @BehaviorProperty({
        label: '反转结果',
        type: 'boolean'
    })
    @Serialize()
    invertResult: boolean = false;
}
