import { ECSComponent } from '@esengine/ecs-framework';
import { Serializable, Serialize, IgnoreSerialization } from '@esengine/ecs-framework';
import { NodeType, DecoratorType } from '../../Types/TaskStatus';
import { BehaviorNode, BehaviorProperty } from '../../Decorators/BehaviorNodeDecorator';
import { DecoratorNodeComponent } from '../DecoratorNodeComponent';

/**
 * 冷却节点
 *
 * 在冷却时间内阻止子节点执行
 */
@BehaviorNode({
    displayName: '冷却',
    category: '装饰器',
    type: NodeType.Decorator,
    icon: 'Timer',
    description: '在冷却时间内阻止子节点执行',
    color: '#00BCD4'
})
@ECSComponent('CooldownNode')
@Serializable({ version: 1 })
export class CooldownNode extends DecoratorNodeComponent {
    constructor() {
        super();
        this.decoratorType = DecoratorType.Cooldown;
    }

    @BehaviorProperty({
        label: '冷却时间',
        type: 'number',
        min: 0,
        step: 0.1,
        description: '冷却时间（秒）',
        required: true
    })
    @Serialize()
    cooldownTime: number = 1.0;

    /** 上次执行时间 */
    @IgnoreSerialization()
    lastExecutionTime: number = 0;

    /**
     * 检查是否可以执行
     */
    canExecute(currentTime: number): boolean {
        return currentTime - this.lastExecutionTime >= this.cooldownTime;
    }

    /**
     * 记录执行时间
     */
    recordExecution(currentTime: number): void {
        this.lastExecutionTime = currentTime;
    }

    /**
     * 重置状态
     */
    reset(): void {
        this.lastExecutionTime = 0;
    }
}
