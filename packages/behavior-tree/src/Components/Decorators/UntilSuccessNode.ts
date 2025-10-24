import { ECSComponent } from '@esengine/ecs-framework';
import { Serializable } from '@esengine/ecs-framework';
import { NodeType, DecoratorType } from '../../Types/TaskStatus';
import { BehaviorNode } from '../../Decorators/BehaviorNodeDecorator';
import { DecoratorNodeComponent } from '../DecoratorNodeComponent';

/**
 * 直到成功节点
 *
 * 重复执行子节点直到成功
 */
@BehaviorNode({
    displayName: '直到成功',
    category: '装饰器',
    type: NodeType.Decorator,
    icon: 'CheckCircle',
    description: '重复执行子节点直到成功',
    color: '#4CAF50'
})
@ECSComponent('UntilSuccessNode')
@Serializable({ version: 1 })
export class UntilSuccessNode extends DecoratorNodeComponent {
    constructor() {
        super();
        this.decoratorType = DecoratorType.UntilSuccess;
    }
}
