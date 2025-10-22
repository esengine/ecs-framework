import { ECSComponent } from '@esengine/ecs-framework';
import { Serializable, Serialize } from '@esengine/ecs-framework';
import { NodeType, CompositeType, AbortType } from '../../Types/TaskStatus';
import { BehaviorNode, BehaviorProperty } from '../../Decorators/BehaviorNodeDecorator';
import { CompositeNodeComponent } from '../CompositeNodeComponent';

/**
 * 序列节点
 *
 * 按顺序执行所有子节点，全部成功才成功
 */
@BehaviorNode({
    displayName: '序列',
    category: '组合',
    type: NodeType.Composite,
    icon: 'List',
    description: '按顺序执行子节点，全部成功才成功',
    color: '#4CAF50'
})
@ECSComponent('SequenceNode')
@Serializable({ version: 1 })
export class SequenceNode extends CompositeNodeComponent {
    @BehaviorProperty({
        label: '中止类型',
        type: 'select',
        description: '条件变化时的中止行为',
        options: [
            { label: '无', value: 'none' },
            { label: '自身', value: 'self' },
            { label: '低优先级', value: 'lower-priority' },
            { label: '两者', value: 'both' }
        ]
    })
    @Serialize()
    abortType: AbortType = AbortType.None;

    constructor() {
        super();
        this.compositeType = CompositeType.Sequence;
    }
}
