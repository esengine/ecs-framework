import { ECSComponent } from '@esengine/ecs-framework';
import { Serializable } from '@esengine/ecs-framework';
import { NodeType, CompositeType } from '../../Types/TaskStatus';
import { BehaviorNode } from '../../Decorators/BehaviorNodeDecorator';
import { CompositeNodeComponent } from '../CompositeNodeComponent';

/**
 * 根节点
 *
 * 行为树的根节点，简单地激活第一个子节点
 */
@BehaviorNode({
    displayName: '根节点',
    category: '根节点',
    type: NodeType.Composite,
    icon: 'TreePine',
    description: '行为树的根节点',
    color: '#FFD700'
})
@ECSComponent('RootNode')
@Serializable({ version: 1 })
export class RootNode extends CompositeNodeComponent {
    constructor() {
        super();
        this.compositeType = CompositeType.Sequence;
    }
}
