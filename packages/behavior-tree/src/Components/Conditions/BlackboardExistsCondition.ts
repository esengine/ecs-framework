import { Component, ECSComponent } from '@esengine/ecs-framework';
import { Serializable, Serialize } from '@esengine/ecs-framework';
import { NodeType } from '../../Types/TaskStatus';
import { BehaviorNode, BehaviorProperty } from '../../Decorators/BehaviorNodeDecorator';

/**
 * 黑板变量存在性检查条件组件
 *
 * 检查黑板变量是否存在
 */
@BehaviorNode({
    displayName: '检查变量存在',
    category: '条件',
    type: NodeType.Condition,
    icon: 'Search',
    description: '检查黑板变量是否存在',
    color: '#00BCD4'
})
@ECSComponent('BlackboardExistsCondition')
@Serializable({ version: 1 })
export class BlackboardExistsCondition extends Component {
    @BehaviorProperty({
        label: '变量名',
        type: 'variable',
        required: true
    })
    @Serialize()
    variableName: string = '';

    @BehaviorProperty({
        label: '检查非空',
        type: 'boolean',
        description: '检查值不为 null/undefined'
    })
    @Serialize()
    checkNotNull: boolean = false;

    @BehaviorProperty({
        label: '反转结果',
        type: 'boolean',
        description: '检查不存在'
    })
    @Serialize()
    invertResult: boolean = false;
}
