import { ECSComponent } from '@esengine/ecs-framework';
import { Serializable, Serialize } from '@esengine/ecs-framework';
import { NodeType, CompositeType } from '../../Types/TaskStatus';
import { BehaviorNode, BehaviorProperty } from '../../Decorators/BehaviorNodeDecorator';
import { CompositeNodeComponent } from '../CompositeNodeComponent';

/**
 * 随机序列节点
 *
 * 随机顺序执行子节点序列
 */
@BehaviorNode({
    displayName: '随机序列',
    category: '组合',
    type: NodeType.Composite,
    icon: 'Shuffle',
    description: '随机顺序执行子节点序列',
    color: '#FF5722'
})
@ECSComponent('RandomSequenceNode')
@Serializable({ version: 1 })
export class RandomSequenceNode extends CompositeNodeComponent {
    @BehaviorProperty({
        label: '重启时重新洗牌',
        type: 'boolean',
        description: '每次重启时是否重新随机子节点顺序'
    })
    @Serialize()
    override reshuffleOnRestart: boolean = true;

    constructor() {
        super();
        this.compositeType = CompositeType.RandomSequence;
    }
}
