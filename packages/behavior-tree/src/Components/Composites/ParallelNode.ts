import { ECSComponent } from '@esengine/ecs-framework';
import { Serializable, Serialize } from '@esengine/ecs-framework';
import { NodeType, CompositeType } from '../../Types/TaskStatus';
import { BehaviorNode, BehaviorProperty } from '../../Decorators/BehaviorNodeDecorator';
import { CompositeNodeComponent } from '../CompositeNodeComponent';

/**
 * 并行节点
 *
 * 同时执行所有子节点
 */
@BehaviorNode({
    displayName: '并行',
    category: '组合',
    type: NodeType.Composite,
    icon: 'Layers',
    description: '同时执行所有子节点',
    color: '#CDDC39'
})
@ECSComponent('ParallelNode')
@Serializable({ version: 1 })
export class ParallelNode extends CompositeNodeComponent {
    @BehaviorProperty({
        label: '成功策略',
        type: 'select',
        description: '多少个子节点成功时整体成功',
        options: [
            { label: '全部成功', value: 'all' },
            { label: '任意一个成功', value: 'one' }
        ]
    })
    @Serialize()
    successPolicy: 'all' | 'one' = 'all';

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
    failurePolicy: 'one' | 'all' = 'one';

    constructor() {
        super();
        this.compositeType = CompositeType.Parallel;
    }
}
