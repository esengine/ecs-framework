import { ECSComponent } from '@esengine/ecs-framework';
import { Serializable, Serialize, IgnoreSerialization } from '@esengine/ecs-framework';
import { NodeType, DecoratorType } from '../../Types/TaskStatus';
import { BehaviorNode, BehaviorProperty } from '../../Decorators/BehaviorNodeDecorator';
import { DecoratorNodeComponent } from '../DecoratorNodeComponent';

/**
 * 超时节点
 *
 * 子节点执行超时则返回失败
 */
@BehaviorNode({
    displayName: '超时',
    category: '装饰器',
    type: NodeType.Decorator,
    icon: 'Clock',
    description: '子节点执行超时则返回失败',
    color: '#FF9800'
})
@ECSComponent('TimeoutNode')
@Serializable({ version: 1 })
export class TimeoutNode extends DecoratorNodeComponent {
    constructor() {
        super();
        this.decoratorType = DecoratorType.Timeout;
    }

    @BehaviorProperty({
        label: '超时时间',
        type: 'number',
        min: 0,
        step: 0.1,
        description: '超时时间（秒）',
        required: true
    })
    @Serialize()
    timeoutDuration: number = 5.0;

    /** 开始执行时间 */
    @IgnoreSerialization()
    startTime: number = 0;

    /**
     * 记录开始时间
     */
    recordStartTime(currentTime: number): void {
        if (this.startTime === 0) {
            this.startTime = currentTime;
        }
    }

    /**
     * 检查是否超时
     */
    isTimeout(currentTime: number): boolean {
        if (this.startTime === 0) {
            return false;
        }
        return currentTime - this.startTime >= this.timeoutDuration;
    }

    /**
     * 重置状态
     */
    reset(): void {
        this.startTime = 0;
    }
}
