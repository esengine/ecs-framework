import { ECSComponent } from '@esengine/ecs-framework';
import { Serializable, Serialize } from '@esengine/ecs-framework';
import { NodeType, CompositeType } from '../../Types/TaskStatus';
import { BehaviorNode, BehaviorProperty } from '../../Decorators/BehaviorNodeDecorator';
import { CompositeNodeComponent } from '../CompositeNodeComponent';

/**
 * 随机选择节点
 *
 * 随机顺序执行子节点选择
 */
@BehaviorNode({
    displayName: '随机选择',
    category: '组合',
    type: NodeType.Composite,
    icon: 'Dices',
    description: '随机顺序执行子节点选择',
    color: '#F44336'
})
@ECSComponent('RandomSelectorNode')
@Serializable({ version: 1 })
export class RandomSelectorNode extends CompositeNodeComponent {
    @BehaviorProperty({
        label: '重启时重新洗牌',
        type: 'boolean',
        description: '每次重启时是否重新随机子节点顺序'
    })
    @Serialize()
    override reshuffleOnRestart: boolean = true;

    constructor() {
        super();
        this.compositeType = CompositeType.RandomSelector;
    }
}
