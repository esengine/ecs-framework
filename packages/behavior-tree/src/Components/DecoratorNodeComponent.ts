import { Component, ECSComponent, Entity } from '@esengine/ecs-framework';
import { Serializable, Serialize, IgnoreSerialization } from '@esengine/ecs-framework';
import { DecoratorType } from '../Types/TaskStatus';
import { BlackboardComponent } from './BlackboardComponent';

/**
 * 装饰器节点组件
 *
 * 用于标识装饰器节点类型（Repeater, Inverter等）
 */
@ECSComponent('DecoratorNode')
@Serializable({ version: 1 })
export class DecoratorNodeComponent extends Component {
    /** 装饰器类型 */
    @Serialize()
    decoratorType: DecoratorType = DecoratorType.Inverter;

    // ===== Repeater 相关 =====
    /** 重复次数（-1表示无限） */
    @Serialize()
    repeatCount: number = 1;

    /** 当前已重复次数 */
    @IgnoreSerialization()
    currentRepeatCount: number = 0;

    /** 子节点失败时是否停止 */
    @Serialize()
    endOnFailure: boolean = false;

    // ===== Conditional 相关 =====
    /** 条件函数（序列化为字符串） */
    @Serialize()
    conditionCode?: string;

    /** 是否重新评估条件 */
    @Serialize()
    shouldReevaluate: boolean = true;

    /** 编译后的条件函数（不序列化） */
    @IgnoreSerialization()
    private compiledCondition?: (entity: Entity, blackboard?: BlackboardComponent) => boolean;

    // ===== Cooldown 相关 =====
    /** 冷却时间（秒） */
    @Serialize()
    cooldownTime: number = 1.0;

    /** 上次执行时间 */
    @IgnoreSerialization()
    lastExecutionTime: number = 0;

    // ===== Timeout 相关 =====
    /** 超时时间（秒） */
    @Serialize()
    timeoutDuration: number = 5.0;

    /** 开始执行时间 */
    @IgnoreSerialization()
    startTime: number = 0;

    /**
     * 重置装饰器状态
     */
    reset(): void {
        this.currentRepeatCount = 0;
        this.lastExecutionTime = 0;
        this.startTime = 0;
    }

    /**
     * 检查是否可以执行（Cooldown）
     */
    canExecute(currentTime: number): boolean {
        if (this.decoratorType !== DecoratorType.Cooldown) {
            return true;
        }

        return currentTime - this.lastExecutionTime >= this.cooldownTime;
    }

    /**
     * 记录执行时间
     */
    recordExecution(currentTime: number): void {
        if (this.decoratorType === DecoratorType.Cooldown) {
            this.lastExecutionTime = currentTime;
        } else if (this.decoratorType === DecoratorType.Timeout) {
            if (this.startTime === 0) {
                this.startTime = currentTime;
            }
        }
    }

    /**
     * 检查是否超时
     */
    isTimeout(currentTime: number): boolean {
        if (this.decoratorType !== DecoratorType.Timeout || this.startTime === 0) {
            return false;
        }

        return currentTime - this.startTime >= this.timeoutDuration;
    }

    /**
     * 增加重复计数
     */
    incrementRepeat(): void {
        if (this.decoratorType === DecoratorType.Repeater) {
            this.currentRepeatCount++;
        }
    }

    /**
     * 检查是否应该继续重复
     */
    shouldContinueRepeat(): boolean {
        if (this.decoratorType !== DecoratorType.Repeater) {
            return false;
        }

        // -1 表示无限重复
        if (this.repeatCount === -1) {
            return true;
        }

        return this.currentRepeatCount < this.repeatCount;
    }

    /**
     * 评估条件（用于 Conditional 装饰器）
     */
    evaluateCondition(entity: Entity, blackboard?: BlackboardComponent): boolean {
        if (this.decoratorType !== DecoratorType.Conditional) {
            return true;
        }

        if (!this.conditionCode) {
            return false;
        }

        // 获取或编译条件函数
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
