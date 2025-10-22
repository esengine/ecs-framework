import { Component, ECSComponent } from '@esengine/ecs-framework';
import { Serializable, Serialize } from '@esengine/ecs-framework';
import { CompositeType } from '../Types/TaskStatus';

/**
 * 复合节点组件
 *
 * 用于标识复合节点类型（Sequence, Selector, Parallel等）
 */
@ECSComponent('CompositeNode')
@Serializable({ version: 1 })
export class CompositeNodeComponent extends Component {
    /** 复合节点类型 */
    @Serialize()
    compositeType: CompositeType = CompositeType.Sequence;

    /** 随机化的子节点索引顺序 */
    protected shuffledIndices: number[] = [];

    /** 是否在重启时重新洗牌（子类可选） */
    protected reshuffleOnRestart: boolean = true;

    /**
     * 获取下一个子节点索引
     */
    getNextChildIndex(currentIndex: number, totalChildren: number): number {
        // 对于随机类型，使用洗牌后的索引
        if (this.compositeType === CompositeType.RandomSequence ||
            this.compositeType === CompositeType.RandomSelector) {

            // 首次执行或需要重新洗牌
            if (this.shuffledIndices.length === 0 || currentIndex === 0 && this.reshuffleOnRestart) {
                this.shuffleIndices(totalChildren);
            }

            if (currentIndex < this.shuffledIndices.length) {
                return this.shuffledIndices[currentIndex];
            }
            return totalChildren; // 结束
        }

        // 普通顺序执行
        return currentIndex;
    }

    /**
     * 洗牌子节点索引
     */
    private shuffleIndices(count: number): void {
        this.shuffledIndices = Array.from({ length: count }, (_, i) => i);

        // Fisher-Yates 洗牌算法
        for (let i = this.shuffledIndices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.shuffledIndices[i], this.shuffledIndices[j]] =
                [this.shuffledIndices[j], this.shuffledIndices[i]];
        }
    }

    /**
     * 重置洗牌状态
     */
    resetShuffle(): void {
        this.shuffledIndices = [];
    }
}
