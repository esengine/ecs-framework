import { ECSComponent, Entity } from '@esengine/ecs-framework';
import { Serializable, Serialize, IgnoreSerialization } from '@esengine/ecs-framework';
import { NodeType, DecoratorType } from '../../Types/TaskStatus';
import { BehaviorNode, BehaviorProperty } from '../../Decorators/BehaviorNodeDecorator';
import { DecoratorNodeComponent } from '../DecoratorNodeComponent';
import { BlackboardComponent } from '../BlackboardComponent';

/**
 * 条件装饰器节点
 *
 * 基于条件判断是否执行子节点
 */
@BehaviorNode({
    displayName: '条件装饰器',
    category: '装饰器',
    type: NodeType.Decorator,
    icon: 'Filter',
    description: '基于条件判断是否执行子节点',
    color: '#3F51B5'
})
@ECSComponent('ConditionalNode')
@Serializable({ version: 1 })
export class ConditionalNode extends DecoratorNodeComponent {
    constructor() {
        super();
        this.decoratorType = DecoratorType.Conditional;
    }

    @BehaviorProperty({
        label: '条件代码',
        type: 'code',
        description: 'JavaScript 代码，返回 boolean',
        required: true
    })
    @Serialize()
    conditionCode?: string;

    @BehaviorProperty({
        label: '重新评估条件',
        type: 'boolean',
        description: '每次执行时是否重新评估条件'
    })
    @Serialize()
    shouldReevaluate: boolean = true;

    /** 编译后的条件函数（不序列化） */
    @IgnoreSerialization()
    private compiledCondition?: (entity: Entity, blackboard?: BlackboardComponent) => boolean;

    /**
     * 评估条件
     */
    evaluateCondition(entity: Entity, blackboard?: BlackboardComponent): boolean {
        if (!this.conditionCode) {
            return false;
        }

        if (!this.compiledCondition) {
            try {
                const func = new Function(
                    'entity',
                    'blackboard',
                    `
                    try {
                        return Boolean(${this.conditionCode});
                    } catch (error) {
                        return false;
                    }
                    `
                );

                this.compiledCondition = (entity, blackboard) => {
                    return Boolean(func(entity, blackboard));
                };
            } catch (error) {
                return false;
            }
        }

        return this.compiledCondition(entity, blackboard);
    }

    /**
     * 设置条件函数（运行时使用）
     */
    setConditionFunction(func: (entity: Entity, blackboard?: BlackboardComponent) => boolean): void {
        this.compiledCondition = func;
    }
}
