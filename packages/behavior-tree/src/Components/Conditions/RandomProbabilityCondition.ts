import { Component, ECSComponent } from '@esengine/ecs-framework';
import { Serializable, Serialize } from '@esengine/ecs-framework';

/**
 * 随机概率条件组件
 *
 * 根据概率返回成功或失败
 */
@ECSComponent('RandomProbabilityCondition')
@Serializable({ version: 1 })
export class RandomProbabilityCondition extends Component {
    /** 成功概率 (0.0 - 1.0) */
    @Serialize()
    probability: number = 0.5;

    /** 是否每次都重新随机（false则第一次随机后固定结果） */
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
