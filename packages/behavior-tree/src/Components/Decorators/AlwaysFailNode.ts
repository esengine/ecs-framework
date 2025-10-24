import { ECSComponent } from '@esengine/ecs-framework';
import { Serializable } from '@esengine/ecs-framework';
import { NodeType, DecoratorType } from '../../Types/TaskStatus';
import { BehaviorNode } from '../../Decorators/BehaviorNodeDecorator';
import { DecoratorNodeComponent } from '../DecoratorNodeComponent';

/**
 * 总是失败节点
 *
 * 无论子节点结果如何都返回失败
 */
@BehaviorNode({
    displayName: '总是失败',
    category: '装饰器',
    type: NodeType.Decorator,
    icon: 'ThumbsDown',
    description: '无论子节点结果如何都返回失败',
    color: '#FF5722'
})
@ECSComponent('AlwaysFailNode')
@Serializable({ version: 1 })
export class AlwaysFailNode extends DecoratorNodeComponent {
    constructor() {
        super();
        this.decoratorType = DecoratorType.AlwaysFail;
    }
}
