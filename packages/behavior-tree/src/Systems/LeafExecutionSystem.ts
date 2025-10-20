import { EntitySystem, Matcher, Entity, Time } from '@esengine/ecs-framework';
import { BehaviorTreeNode } from '../Components/BehaviorTreeNode';
import { BlackboardComponent } from '../Components/BlackboardComponent';
import { ActiveNode } from '../Components/ActiveNode';
import { TaskStatus, NodeType } from '../Types/TaskStatus';

// 导入具体的动作组件
import { WaitAction } from '../Components/Actions/WaitAction';
import { LogAction } from '../Components/Actions/LogAction';
import { SetBlackboardValueAction } from '../Components/Actions/SetBlackboardValueAction';
import { ModifyBlackboardValueAction, ModifyOperation } from '../Components/Actions/ModifyBlackboardValueAction';
import { ExecuteAction } from '../Components/Actions/ExecuteAction';

// 导入具体的条件组件
import { BlackboardCompareCondition, CompareOperator } from '../Components/Conditions/BlackboardCompareCondition';
import { BlackboardExistsCondition } from '../Components/Conditions/BlackboardExistsCondition';
import { RandomProbabilityCondition } from '../Components/Conditions/RandomProbabilityCondition';
import { ExecuteCondition } from '../Components/Conditions/ExecuteCondition';

/**
 * 叶子节点执行系统
 *
 * 负责执行所有活跃的叶子节点（Action 和 Condition）
 * 只处理带有 ActiveNode 标记的节点
 *
 * updateOrder: 100 (最先执行)
 */
export class LeafExecutionSystem extends EntitySystem {
    constructor() {
        // 只处理活跃的叶子节点
        super(Matcher.empty().all(BehaviorTreeNode, ActiveNode));
        this.updateOrder = 100;
    }

    protected override process(entities: readonly Entity[]): void {
        for (const entity of entities) {
            const node = entity.getComponent(BehaviorTreeNode)!;

            // 只处理叶子节点
            if (node.nodeType === NodeType.Action) {
                this.executeAction(entity, node);
            } else if (node.nodeType === NodeType.Condition) {
                this.executeCondition(entity, node);
            }
        }
    }

    /**
     * 执行动作节点
     */
    private executeAction(entity: Entity, node: BehaviorTreeNode): void {
        let status = TaskStatus.Failure;

        // 检测实体有哪些动作组件并执行
        if (entity.hasComponent(WaitAction)) {
            status = this.executeWaitAction(entity);
        } else if (entity.hasComponent(LogAction)) {
            status = this.executeLogAction(entity);
        } else if (entity.hasComponent(SetBlackboardValueAction)) {
            status = this.executeSetBlackboardValue(entity);
        } else if (entity.hasComponent(ModifyBlackboardValueAction)) {
            status = this.executeModifyBlackboardValue(entity);
        } else if (entity.hasComponent(ExecuteAction)) {
            status = this.executeCustomAction(entity);
        } else {
            this.logger.warn(`动作节点没有找到任何已知的动作组件`);
        }

        node.status = status;

        // 如果不是 Running 状态，节点执行完成
        if (status !== TaskStatus.Running) {
            this.deactivateNode(entity);
            this.notifyParent(entity);
        }
    }

    /**
     * 执行等待动作
     */
    private executeWaitAction(entity: Entity): TaskStatus {
        const waitAction = entity.getComponent(WaitAction)!;
        waitAction.elapsedTime += Time.deltaTime;

        if (waitAction.elapsedTime >= waitAction.waitTime) {
            waitAction.reset();
            return TaskStatus.Success;
        }

        return TaskStatus.Running;
    }

    /**
     * 执行日志动作
     */
    private executeLogAction(entity: Entity): TaskStatus {
        const logAction = entity.getComponent(LogAction)!;

        let message = logAction.message;
        if (logAction.includeEntityInfo) {
            message = `[Entity: ${entity.name}] ${message}`;
        }

        switch (logAction.level) {
            case 'info':
                console.info(message);
                break;
            case 'warn':
                console.warn(message);
                break;
            case 'error':
                console.error(message);
                break;
            default:
                console.log(message);
                break;
        }

        return TaskStatus.Success;
    }

    /**
     * 执行设置黑板变量值
     */
    private executeSetBlackboardValue(entity: Entity): TaskStatus {
        const action = entity.getComponent(SetBlackboardValueAction)!;
        const blackboard = this.findBlackboard(entity);

        if (!blackboard) {
            this.logger.warn('未找到黑板组件');
            return TaskStatus.Failure;
        }

        let valueToSet: any;

        // 如果指定了源变量，从中读取值
        if (action.sourceVariable) {
            if (!blackboard.hasVariable(action.sourceVariable)) {
                this.logger.warn(`源变量不存在: ${action.sourceVariable}`);
                return TaskStatus.Failure;
            }
            valueToSet = blackboard.getValue(action.sourceVariable);
        } else {
            valueToSet = action.value;

            // 处理变量引用 {{varName}}
            if (typeof valueToSet === 'string') {
                valueToSet = this.resolveVariableReferences(valueToSet, blackboard);
            }
        }

        const success = blackboard.setValue(action.variableName, valueToSet, action.force);
        return success ? TaskStatus.Success : TaskStatus.Failure;
    }

    /**
     * 执行修改黑板变量值
     */
    private executeModifyBlackboardValue(entity: Entity): TaskStatus {
        const action = entity.getComponent(ModifyBlackboardValueAction)!;
        const blackboard = this.findBlackboard(entity);

        if (!blackboard) {
            this.logger.warn('未找到黑板组件');
            return TaskStatus.Failure;
        }

        if (!blackboard.hasVariable(action.variableName)) {
            this.logger.warn(`变量不存在: ${action.variableName}`);
            return TaskStatus.Failure;
        }

        let currentValue = blackboard.getValue(action.variableName);
        let operand = action.operand;

        // 解析操作数中的变量引用
        if (typeof operand === 'string') {
            operand = this.resolveVariableReferences(operand, blackboard);
        }

        // 执行操作
        let newValue: any;
        switch (action.operation) {
            case ModifyOperation.Add:
                newValue = currentValue + operand;
                break;
            case ModifyOperation.Subtract:
                newValue = currentValue - operand;
                break;
            case ModifyOperation.Multiply:
                newValue = currentValue * operand;
                break;
            case ModifyOperation.Divide:
                if (operand === 0) {
                    this.logger.warn('除数不能为0');
                    return TaskStatus.Failure;
                }
                newValue = currentValue / operand;
                break;
            case ModifyOperation.Modulo:
                newValue = currentValue % operand;
                break;
            case ModifyOperation.Append:
                if (Array.isArray(currentValue)) {
                    newValue = [...currentValue, operand];
                } else if (typeof currentValue === 'string') {
                    newValue = currentValue + operand;
                } else {
                    this.logger.warn(`变量 ${action.variableName} 不支持 append 操作`);
                    return TaskStatus.Failure;
                }
                break;
            case ModifyOperation.Remove:
                if (Array.isArray(currentValue)) {
                    newValue = currentValue.filter(item => item !== operand);
                } else {
                    this.logger.warn(`变量 ${action.variableName} 不是数组，不支持 remove 操作`);
                    return TaskStatus.Failure;
                }
                break;
            default:
                return TaskStatus.Failure;
        }

        const success = blackboard.setValue(action.variableName, newValue, action.force);
        return success ? TaskStatus.Success : TaskStatus.Failure;
    }

    /**
     * 执行自定义动作
     */
    private executeCustomAction(entity: Entity): TaskStatus {
        const action = entity.getComponent(ExecuteAction)!;
        const func = action.getFunction();

        if (!func) {
            return TaskStatus.Failure;
        }

        const blackboard = this.findBlackboard(entity);
        return func(entity, blackboard, Time.deltaTime);
    }

    /**
     * 执行条件节点
     */
    private executeCondition(entity: Entity, node: BehaviorTreeNode): void {
        let result = false;

        // 检测实体有哪些条件组件并评估
        if (entity.hasComponent(BlackboardCompareCondition)) {
            result = this.evaluateBlackboardCompare(entity);
        } else if (entity.hasComponent(BlackboardExistsCondition)) {
            result = this.evaluateBlackboardExists(entity);
        } else if (entity.hasComponent(RandomProbabilityCondition)) {
            result = this.evaluateRandomProbability(entity);
        } else if (entity.hasComponent(ExecuteCondition)) {
            result = this.evaluateCustomCondition(entity);
        } else {
            this.logger.warn('条件节点没有找到任何已知的条件组件');
        }

        node.status = result ? TaskStatus.Success : TaskStatus.Failure;

        // 条件节点总是立即完成
        this.deactivateNode(entity);
        this.notifyParent(entity);
    }

    /**
     * 评估黑板比较条件
     */
    private evaluateBlackboardCompare(entity: Entity): boolean {
        const condition = entity.getComponent(BlackboardCompareCondition)!;
        const blackboard = this.findBlackboard(entity);

        if (!blackboard || !blackboard.hasVariable(condition.variableName)) {
            return false;
        }

        const value = blackboard.getValue(condition.variableName);
        let compareValue = condition.compareValue;

        // 解析变量引用
        if (typeof compareValue === 'string') {
            compareValue = this.resolveVariableReferences(compareValue, blackboard);
        }

        let result = false;
        switch (condition.operator) {
            case CompareOperator.Equal:
                result = value === compareValue;
                break;
            case CompareOperator.NotEqual:
                result = value !== compareValue;
                break;
            case CompareOperator.Greater:
                result = value > compareValue;
                break;
            case CompareOperator.GreaterOrEqual:
                result = value >= compareValue;
                break;
            case CompareOperator.Less:
                result = value < compareValue;
                break;
            case CompareOperator.LessOrEqual:
                result = value <= compareValue;
                break;
            case CompareOperator.Contains:
                if (typeof value === 'string') {
                    result = value.includes(compareValue);
                } else if (Array.isArray(value)) {
                    result = value.includes(compareValue);
                }
                break;
            case CompareOperator.Matches:
                if (typeof value === 'string' && typeof compareValue === 'string') {
                    const regex = new RegExp(compareValue);
                    result = regex.test(value);
                }
                break;
        }

        return condition.invertResult ? !result : result;
    }

    /**
     * 评估黑板变量存在性
     */
    private evaluateBlackboardExists(entity: Entity): boolean {
        const condition = entity.getComponent(BlackboardExistsCondition)!;
        const blackboard = this.findBlackboard(entity);

        if (!blackboard) {
            return false;
        }

        let result = blackboard.hasVariable(condition.variableName);

        if (result && condition.checkNotNull) {
            const value = blackboard.getValue(condition.variableName);
            result = value !== null && value !== undefined;
        }

        return condition.invertResult ? !result : result;
    }

    /**
     * 评估随机概率
     */
    private evaluateRandomProbability(entity: Entity): boolean {
        const condition = entity.getComponent(RandomProbabilityCondition)!;
        return condition.evaluate();
    }

    /**
     * 评估自定义条件
     */
    private evaluateCustomCondition(entity: Entity): boolean {
        const condition = entity.getComponent(ExecuteCondition)!;
        const func = condition.getFunction();

        if (!func) {
            return false;
        }

        const blackboard = this.findBlackboard(entity);
        const result = func(entity, blackboard, Time.deltaTime);

        return condition.invertResult ? !result : result;
    }

    /**
     * 解析字符串中的变量引用 {{varName}}
     */
    private resolveVariableReferences(value: string, blackboard: BlackboardComponent): any {
        // 纯变量引用，返回原始值
        const pureMatch = value.match(/^{{\s*(\w+)\s*}}$/);
        if (pureMatch) {
            const varName = pureMatch[1];
            if (blackboard.hasVariable(varName)) {
                return blackboard.getValue(varName);
            }
            return value;
        }

        // 字符串模板，替换所有变量引用
        return value.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
            if (blackboard.hasVariable(varName)) {
                const val = blackboard.getValue(varName);
                return val !== undefined ? String(val) : match;
            }
            return match;
        });
    }

    /**
     * 移除节点的活跃标记
     */
    private deactivateNode(entity: Entity): void {
        entity.removeComponentByType(ActiveNode);
    }

    /**
     * 通知父节点子节点已完成
     */
    private notifyParent(entity: Entity): void {
        if (entity.parent && entity.parent.hasComponent(BehaviorTreeNode)) {
            // 为父节点添加活跃标记，让它在下一帧被处理
            if (!entity.parent.hasComponent(ActiveNode)) {
                entity.parent.addComponent(new ActiveNode());
            }
        }
    }

    /**
     * 查找黑板组件（向上遍历父节点）
     */
    private findBlackboard(entity: Entity): BlackboardComponent | undefined {
        let current: Entity | null = entity;

        while (current) {
            const blackboard = current.getComponent(BlackboardComponent);
            if (blackboard) {
                return blackboard;
            }
            current = current.parent;
        }

        return undefined;
    }

    protected override getLoggerName(): string {
        return 'LeafExecutionSystem';
    }
}
