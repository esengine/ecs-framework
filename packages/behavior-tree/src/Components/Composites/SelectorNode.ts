import { ECSComponent } from '@esengine/ecs-framework';
import { Serializable, Serialize } from '@esengine/ecs-framework';
import { NodeType, CompositeType, AbortType } from '../../Types/TaskStatus';
import { BehaviorNode, BehaviorProperty } from '../../Decorators/BehaviorNodeDecorator';
import { CompositeNodeComponent } from '../CompositeNodeComponent';

/**
 * 选择节点
 *
 * 按顺序执行子节点，任一成功则成功
 */
@BehaviorNode({
    displayName: '选择',
    category: '组合',
    type: NodeType.Composite,
    icon: 'GitBranch',
    description: '按顺序执行子节点，任一成功则成功',
    color: '#8BC34A'
})
@ECSComponent('SelectorNode')
@Serializable({ version: 1 })
export class SelectorNode extends CompositeNodeComponent {
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
        this.compositeType = CompositeType.Selector;
    }
}
