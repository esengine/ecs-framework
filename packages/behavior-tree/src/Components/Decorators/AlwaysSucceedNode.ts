import { ECSComponent } from '@esengine/ecs-framework';
import { Serializable } from '@esengine/ecs-framework';
import { NodeType, DecoratorType } from '../../Types/TaskStatus';
import { BehaviorNode } from '../../Decorators/BehaviorNodeDecorator';
import { DecoratorNodeComponent } from '../DecoratorNodeComponent';

/**
 * 总是成功节点
 *
 * 无论子节点结果如何都返回成功
 */
@BehaviorNode({
    displayName: '总是成功',
    category: '装饰器',
    type: NodeType.Decorator,
    icon: 'ThumbsUp',
    description: '无论子节点结果如何都返回成功',
    color: '#8BC34A'
})
@ECSComponent('AlwaysSucceedNode')
@Serializable({ version: 1 })
export class AlwaysSucceedNode extends DecoratorNodeComponent {
    constructor() {
        super();
        this.decoratorType = DecoratorType.AlwaysSucceed;
    }
}
