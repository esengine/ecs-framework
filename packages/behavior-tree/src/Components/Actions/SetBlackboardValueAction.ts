import { Component, ECSComponent } from '@esengine/ecs-framework';
import { Serializable, Serialize } from '@esengine/ecs-framework';
import { NodeType } from '../../Types/TaskStatus';
import { BehaviorNode, BehaviorProperty } from '../../Decorators/BehaviorNodeDecorator';

/**
 * 设置黑板变量值动作组件
 *
 * 将指定值或另一个黑板变量的值设置到目标变量
 */
@BehaviorNode({
    displayName: '设置变量',
    category: '动作',
    type: NodeType.Action,
    icon: 'Edit',
    description: '设置黑板变量的值',
    color: '#3F51B5'
})
@ECSComponent('SetBlackboardValueAction')
@Serializable({ version: 1 })
export class SetBlackboardValueAction extends Component {
    @BehaviorProperty({
        label: '变量名',
        type: 'variable',
        required: true
    })
    @Serialize()
    variableName: string = '';

    @BehaviorProperty({
        label: '值',
        type: 'string',
        description: '可以使用 {{varName}} 引用其他变量'
    })
    @Serialize()
    value: any = '';

    @Serialize()
    sourceVariable?: string;

    @Serialize()
    force: boolean = false;
}
