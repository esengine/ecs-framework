import { Component, ECSComponent } from '@esengine/ecs-framework';
import { Serializable, Serialize, IgnoreSerialization } from '@esengine/ecs-framework';
import { NodeType } from '../../Types/TaskStatus';
import { BehaviorNode, BehaviorProperty } from '../../Decorators/BehaviorNodeDecorator';

/**
 * 等待动作组件
 *
 * 等待指定时间后返回成功
 */
@BehaviorNode({
    displayName: '等待',
    category: '动作',
    type: NodeType.Action,
    icon: 'Clock',
    description: '等待指定时间',
    color: '#9E9E9E'
})
@ECSComponent('WaitAction')
@Serializable({ version: 1 })
export class WaitAction extends Component {
    @BehaviorProperty({
        label: '等待时间',
        type: 'number',
        min: 0,
        step: 0.1,
        description: '等待时间（秒）',
        required: true
    })
    @Serialize()
    waitTime: number = 1.0;

    /** 已等待时间（秒） */
    @IgnoreSerialization()
    elapsedTime: number = 0;

    /**
     * 重置等待状态
     */
    reset(): void {
        this.elapsedTime = 0;
    }
}
