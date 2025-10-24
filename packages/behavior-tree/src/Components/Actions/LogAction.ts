import { Component, ECSComponent } from '@esengine/ecs-framework';
import { Serializable, Serialize } from '@esengine/ecs-framework';
import { NodeType } from '../../Types/TaskStatus';
import { BehaviorNode, BehaviorProperty } from '../../Decorators/BehaviorNodeDecorator';

/**
 * 日志动作组件
 *
 * 输出日志信息
 */
@BehaviorNode({
    displayName: '日志',
    category: '动作',
    type: NodeType.Action,
    icon: 'FileText',
    description: '输出日志消息',
    color: '#673AB7'
})
@ECSComponent('LogAction')
@Serializable({ version: 1 })
export class LogAction extends Component {
    @BehaviorProperty({
        label: '消息',
        type: 'string',
        required: true
    })
    @Serialize()
    message: string = 'Hello';

    @BehaviorProperty({
        label: '级别',
        type: 'select',
        options: [
            { label: 'Log', value: 'log' },
            { label: 'Info', value: 'info' },
            { label: 'Warn', value: 'warn' },
            { label: 'Error', value: 'error' }
        ]
    })
    @Serialize()
    level: 'log' | 'info' | 'warn' | 'error' = 'log';

    @BehaviorProperty({
        label: '包含实体信息',
        type: 'boolean'
    })
    @Serialize()
    includeEntityInfo: boolean = false;
}
