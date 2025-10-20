import { Component, ECSComponent } from '@esengine/ecs-framework';
import { Serializable, Serialize } from '@esengine/ecs-framework';

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
@ECSComponent('BlackboardCompareCondition')
@Serializable({ version: 1 })
export class BlackboardCompareCondition extends Component {
    /** 要比较的变量名 */
    @Serialize()
    variableName: string = '';

    /** 比较运算符 */
    @Serialize()
    operator: CompareOperator = CompareOperator.Equal;

    /** 比较值（可以是固定值或变量引用 "{{varName}}"） */
    @Serialize()
    compareValue: any = null;

    /** 是否反转结果 */
    @Serialize()
    invertResult: boolean = false;
}
