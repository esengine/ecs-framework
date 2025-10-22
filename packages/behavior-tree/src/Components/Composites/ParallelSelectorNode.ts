import { ECSComponent } from '@esengine/ecs-framework';
import { Serializable, Serialize } from '@esengine/ecs-framework';
import { NodeType, CompositeType } from '../../Types/TaskStatus';
import { BehaviorNode, BehaviorProperty } from '../../Decorators/BehaviorNodeDecorator';
import { CompositeNodeComponent } from '../CompositeNodeComponent';

/**
 * 并行选择节点
 *
 * 并行执行子节点，任一成功则成功
 */
@BehaviorNode({
    displayName: '并行选择',
    category: '组合',
    type: NodeType.Composite,
    icon: 'Sparkles',
    description: '并行执行子节点，任一成功则成功',
    color: '#FFC107'
})
@ECSComponent('ParallelSelectorNode')
@Serializable({ version: 1 })
export class ParallelSelectorNode extends CompositeNodeComponent {
    @BehaviorProperty({
        label: '失败策略',
        type: 'select',
        description: '多少个子节点失败时整体失败',
        options: [
            { label: '任意一个失败', value: 'one' },
            { label: '全部失败', value: 'all' }
        ]
    })
    @Serialize()
    failurePolicy: 'one' | 'all' = 'all';

    constructor() {
        super();
        this.compositeType = CompositeType.ParallelSelector;
    }
}
