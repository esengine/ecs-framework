import { Component, ECSComponent } from '@esengine/ecs-framework';
import { Serializable, Serialize } from '@esengine/ecs-framework';
import { NodeType } from '../../Types/TaskStatus';
import { BehaviorNode, BehaviorProperty } from '../../Decorators/BehaviorNodeDecorator';

/**
 * 随机概率条件组件
 *
 * 根据概率返回成功或失败
 */
@BehaviorNode({
    displayName: '随机概率',
    category: '条件',
    type: NodeType.Condition,
    icon: 'Dice',
    description: '根据概率返回成功或失败',
    color: '#E91E63'
})
@ECSComponent('RandomProbabilityCondition')
@Serializable({ version: 1 })
export class RandomProbabilityCondition extends Component {
    @BehaviorProperty({
        label: '成功概率',
        type: 'number',
        min: 0,
        max: 1,
        step: 0.1,
        description: '0.0 - 1.0',
        required: true
    })
    @Serialize()
    probability: number = 0.5;

    @BehaviorProperty({
        label: '总是重新随机',
        type: 'boolean',
        description: 'false则第一次随机后固定结果'
    })
    @Serialize()
    alwaysRandomize: boolean = true;

    /** 缓存的随机结果（不序列化） */
    private cachedResult?: boolean;

    /**
     * 评估随机概率
     */
    evaluate(): boolean {
        if (this.alwaysRandomize || this.cachedResult === undefined) {
            this.cachedResult = Math.random() < this.probability;
        }
        return this.cachedResult;
    }

    /**
     * 重置缓存
     */
    reset(): void {
        this.cachedResult = undefined;
    }
}
