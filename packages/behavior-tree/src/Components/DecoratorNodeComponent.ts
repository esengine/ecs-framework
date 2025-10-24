import { Component, ECSComponent } from '@esengine/ecs-framework';
import { Serializable, Serialize } from '@esengine/ecs-framework';
import { DecoratorType } from '../Types/TaskStatus';

/**
 * 装饰器节点组件基类
 *
 * 只包含通用的装饰器类型标识
 * 具体的属性由各个子类自己定义
 */
@ECSComponent('DecoratorNode')
@Serializable({ version: 1 })
export class DecoratorNodeComponent extends Component {
    /** 装饰器类型 */
    @Serialize()
    decoratorType: DecoratorType = DecoratorType.Inverter;

}
