import { ECSComponent } from '@esengine/ecs-framework';
import { Serializable } from '@esengine/ecs-framework';
import { NodeType, DecoratorType } from '../../Types/TaskStatus';
import { BehaviorNode } from '../../Decorators/BehaviorNodeDecorator';
import { DecoratorNodeComponent } from '../DecoratorNodeComponent';

/**
 * 直到失败节点
 *
 * 重复执行子节点直到失败
 */
@BehaviorNode({
    displayName: '直到失败',
    category: '装饰器',
    type: NodeType.Decorator,
    icon: 'XCircle',
    description: '重复执行子节点直到失败',
    color: '#F44336'
})
@ECSComponent('UntilFailNode')
@Serializable({ version: 1 })
export class UntilFailNode extends DecoratorNodeComponent {
    constructor() {
        super();
        this.decoratorType = DecoratorType.UntilFail;
    }
}
