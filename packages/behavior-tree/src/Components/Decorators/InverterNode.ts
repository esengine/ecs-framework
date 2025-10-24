import { ECSComponent } from '@esengine/ecs-framework';
import { Serializable } from '@esengine/ecs-framework';
import { NodeType, DecoratorType } from '../../Types/TaskStatus';
import { BehaviorNode } from '../../Decorators/BehaviorNodeDecorator';
import { DecoratorNodeComponent } from '../DecoratorNodeComponent';

/**
 * 反转节点
 *
 * 反转子节点的执行结果
 */
@BehaviorNode({
    displayName: '反转',
    category: '装饰器',
    type: NodeType.Decorator,
    icon: 'RotateCcw',
    description: '反转子节点的执行结果',
    color: '#607D8B'
})
@ECSComponent('InverterNode')
@Serializable({ version: 1 })
export class InverterNode extends DecoratorNodeComponent {
    constructor() {
        super();
        this.decoratorType = DecoratorType.Inverter;
    }
}
