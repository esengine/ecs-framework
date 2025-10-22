import { ECSComponent } from '@esengine/ecs-framework';
import { Serializable, Serialize, IgnoreSerialization } from '@esengine/ecs-framework';
import { NodeType, DecoratorType } from '../../Types/TaskStatus';
import { BehaviorNode, BehaviorProperty } from '../../Decorators/BehaviorNodeDecorator';
import { DecoratorNodeComponent } from '../DecoratorNodeComponent';

/**
 * 重复节点
 *
 * 重复执行子节点指定次数
 */
@BehaviorNode({
    displayName: '重复',
    category: '装饰器',
    type: NodeType.Decorator,
    icon: 'Repeat',
    description: '重复执行子节点指定次数',
    color: '#9E9E9E'
})
@ECSComponent('RepeaterNode')
@Serializable({ version: 1 })
export class RepeaterNode extends DecoratorNodeComponent {
    constructor() {
        super();
        this.decoratorType = DecoratorType.Repeater;
    }

    @BehaviorProperty({
        label: '重复次数',
        type: 'number',
        min: -1,
        step: 1,
        description: '-1表示无限重复',
        required: true
    })
    @Serialize()
    repeatCount: number = 1;

    @BehaviorProperty({
        label: '失败时停止',
        type: 'boolean',
        description: '子节点失败时是否停止重复'
    })
    @Serialize()
    endOnFailure: boolean = false;

    /** 当前已重复次数 */
    @IgnoreSerialization()
    currentRepeatCount: number = 0;

    /**
     * 增加重复计数
     */
    incrementRepeat(): void {
        this.currentRepeatCount++;
    }

    /**
     * 检查是否应该继续重复
     */
    shouldContinueRepeat(): boolean {
        if (this.repeatCount === -1) {
            return true;
        }
        return this.currentRepeatCount < this.repeatCount;
    }

    /**
     * 重置状态
     */
    reset(): void {
        this.currentRepeatCount = 0;
    }
}
