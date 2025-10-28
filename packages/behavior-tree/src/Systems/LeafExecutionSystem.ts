import { EntitySystem, Matcher, Entity, Time } from '@esengine/ecs-framework';
import { BehaviorTreeNode } from '../Components/BehaviorTreeNode';
import { BlackboardComponent } from '../Components/BlackboardComponent';
import { ActiveNode } from '../Components/ActiveNode';
import { PropertyBindings } from '../Components/PropertyBindings';
import { LogOutput } from '../Components/LogOutput';
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

        const { displayName, nodeIdShort } = this.getNodeInfo(entity);

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
            status = this.executeGenericAction(entity);
            if (status === TaskStatus.Failure) {
                this.outputLog(entity, `动作节点没有找到任何已知的动作组件`, 'warn');
            }
        }

        node.status = status;

        // 输出节点执行后的状态
        const statusText = status === TaskStatus.Success ? 'Success' :
                          status === TaskStatus.Failure ? 'Failure' :
                          status === TaskStatus.Running ? 'Running' : 'Unknown';

        if (status !== TaskStatus.Running) {
            this.outputLog(entity, `[${displayName}#${nodeIdShort}] 执行完成 -> ${statusText}`,
                          status === TaskStatus.Success ? 'info' : 'warn');
        }

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
        const node = entity.getComponent(BehaviorTreeNode);

        const { displayName, nodeIdShort } = this.getNodeInfo(entity);

        // 从 PropertyBindings 读取绑定的黑板变量值
        const waitTime = this.resolvePropertyValue(entity, 'waitTime', waitAction.waitTime);

        waitAction.elapsedTime += Time.deltaTime;

        // 输出调试信息（显示在UI中）
        this.outputLog(
            entity,
            `[${displayName}#${nodeIdShort}] deltaTime=${Time.deltaTime.toFixed(3)}s, ` +
            `elapsed=${waitAction.elapsedTime.toFixed(3)}s/${waitTime.toFixed(3)}s`,
            'info'
        );

        if (waitAction.elapsedTime >= waitTime) {
            waitAction.reset();
            this.outputLog(entity, `[${displayName}#${nodeIdShort}] 等待完成，返回成功`, 'info');
            return TaskStatus.Success;
        }

        return TaskStatus.Running;
    }

    /**
     * 执行日志动作
     */
    private executeLogAction(entity: Entity): TaskStatus {
        const logAction = entity.getComponent(LogAction)!;
        const node = entity.getComponent(BehaviorTreeNode);

        // 从 PropertyBindings 读取绑定的黑板变量值
        let message = this.resolvePropertyValue(entity, 'message', logAction.message);

        const { displayName, nodeIdShort } = this.getNodeInfo(entity);

        // 在消息前添加节点ID信息
        if (node) {
            message = `[${displayName}#${nodeIdShort}] ${message}`;
        }

        if (logAction.includeEntityInfo) {
            message = `[Entity: ${entity.name}] ${message}`;
        }

        // 输出到浏览器控制台
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

        // 同时记录到LogOutput组件，以便在UI中显示
        const rootEntity = this.findRootEntity(entity);
        if (rootEntity) {
            const logOutput = rootEntity.getComponent(LogOutput);
            if (logOutput) {
                logOutput.addMessage(message, logAction.level);
            }
        }

        return TaskStatus.Success;
    }

    /**
     * 查找根实体
     */
    private findRootEntity(entity: Entity): Entity | null {
        let current: Entity | null = entity;
        while (current) {
            if (!current.parent) {
                return current;
            }
            current = current.parent;
        }
        return null;
    }

    /**
     * 执行设置黑板变量值
     */
    private executeSetBlackboardValue(entity: Entity): TaskStatus {
        const action = entity.getComponent(SetBlackboardValueAction)!;
        const blackboard = this.findBlackboard(entity);

        if (!blackboard) {
            this.outputLog(entity, '未找到黑板组件', 'warn');
            return TaskStatus.Failure;
        }

        let valueToSet: any;

        // 如果指定了源变量，从中读取值
        if (action.sourceVariable) {
            if (!blackboard.hasVariable(action.sourceVariable)) {
                this.outputLog(entity, `源变量不存在: ${action.sourceVariable}`, 'warn');
                return TaskStatus.Failure;
            }
            valueToSet = blackboard.getValue(action.sourceVariable);
        } else {
            // 从 PropertyBindings 读取绑定的值
            valueToSet = this.resolvePropertyValue(entity, 'value', action.value);
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
            this.outputLog(entity, '未找到黑板组件', 'warn');
            return TaskStatus.Failure;
        }

        if (!blackboard.hasVariable(action.variableName)) {
            this.outputLog(entity, `变量不存在: ${action.variableName}`, 'warn');
            return TaskStatus.Failure;
        }

        let currentValue = blackboard.getValue(action.variableName);

        // 从 PropertyBindings 读取绑定的值
        let operand = this.resolvePropertyValue(entity, 'operand', action.operand);

        // 执行操作
        let newValue: any;
        switch (action.operation) {
            case ModifyOperation.Add:
                newValue = Number(currentValue) + Number(operand);
                break;
            case ModifyOperation.Subtract:
                newValue = Number(currentValue) - Number(operand);
                break;
            case ModifyOperation.Multiply:
                newValue = Number(currentValue) * Number(operand);
                break;
            case ModifyOperation.Divide:
                if (Number(operand) === 0) {
                    this.outputLog(entity, '除数不能为0', 'warn');
                    return TaskStatus.Failure;
                }
                newValue = Number(currentValue) / Number(operand);
                break;
            case ModifyOperation.Modulo:
                newValue = Number(currentValue) % Number(operand);
                break;
            case ModifyOperation.Append:
                if (Array.isArray(currentValue)) {
                    newValue = [...currentValue, operand];
                } else if (typeof currentValue === 'string') {
                    newValue = currentValue + operand;
                } else {
                    this.outputLog(entity, `变量 ${action.variableName} 不支持 append 操作`, 'warn');
                    return TaskStatus.Failure;
                }
                break;
            case ModifyOperation.Remove:
                if (Array.isArray(currentValue)) {
                    newValue = currentValue.filter(item => item !== operand);
                } else {
                    this.outputLog(entity, `变量 ${action.variableName} 不是数组，不支持 remove 操作`, 'warn');
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
     * 执行通用动作组件
     * 查找实体上具有 execute 方法的自定义组件并执行
     */
    private executeGenericAction(entity: Entity): TaskStatus {
        for (const component of entity.components) {
            if (component instanceof BehaviorTreeNode ||
                component instanceof ActiveNode ||
                component instanceof BlackboardComponent ||
                component instanceof PropertyBindings ||
                component instanceof LogOutput) {
                continue;
            }

            if (typeof (component as any).execute === 'function') {
                try {
                    const blackboard = this.findBlackboard(entity);
                    const status = (component as any).execute(entity, blackboard);

                    if (typeof status === 'number' &&
                        (status === TaskStatus.Success ||
                         status === TaskStatus.Failure ||
                         status === TaskStatus.Running)) {
                        return status;
                    }
                } catch (error) {
                    this.outputLog(entity, `执行动作组件时发生错误: ${error}`, 'error');
                    return TaskStatus.Failure;
                }
            }
        }

        return TaskStatus.Failure;
    }

    /**
     * 执行条件节点
     */
    private executeCondition(entity: Entity, node: BehaviorTreeNode): void {
        let result = false;

        const { displayName, nodeIdShort } = this.getNodeInfo(entity);

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
            this.outputLog(entity, '条件节点没有找到任何已知的条件组件', 'warn');
        }

        node.status = result ? TaskStatus.Success : TaskStatus.Failure;

        // 输出条件评估结果
        const statusText = result ? 'Success (true)' : 'Failure (false)';
        this.outputLog(entity, `[${displayName}#${nodeIdShort}] 条件评估 -> ${statusText}`,
                      result ? 'info' : 'warn');

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

        // 从 PropertyBindings 读取绑定的值
        let compareValue = this.resolvePropertyValue(entity, 'compareValue', condition.compareValue);

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

        // 从 PropertyBindings 读取绑定的黑板变量值
        const probability = this.resolvePropertyValue(entity, 'probability', condition.probability);

        // 使用解析后的概率值进行评估
        if (condition.alwaysRandomize || condition['cachedResult'] === undefined) {
            condition['cachedResult'] = Math.random() < probability;
        }
        return condition['cachedResult'];
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
     * 解析属性值
     * 如果属性绑定到黑板变量，从黑板读取最新值
     */
    private resolvePropertyValue(entity: Entity, propertyName: string, defaultValue: any): any {
        // 检查实体是否有 PropertyBindings 组件
        const bindings = entity.getComponent(PropertyBindings);
        if (!bindings || !bindings.hasBinding(propertyName)) {
            // 没有绑定，返回默认值
            return defaultValue;
        }

        // 有绑定，从黑板读取值
        const blackboardKey = bindings.getBinding(propertyName)!;
        const blackboard = this.findBlackboard(entity);

        if (!blackboard) {
            this.outputLog(entity, `[属性绑定] 未找到黑板组件，实体: ${entity.name}`, 'warn');
            return defaultValue;
        }

        if (!blackboard.hasVariable(blackboardKey)) {
            this.outputLog(entity, `[属性绑定] 黑板变量不存在: ${blackboardKey}`, 'warn');
            return defaultValue;
        }

        const value = blackboard.getValue(blackboardKey);
        return value;
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

    /**
     * 从Entity提取节点显示名称和ID
     */
    private getNodeInfo(entity: Entity): { displayName: string; nodeIdShort: string } {
        let displayName = 'Node';
        let nodeIdShort = '';

        if (entity.name && entity.name.includes('#')) {
            const parts = entity.name.split('#');
            displayName = parts[0];
            nodeIdShort = parts[1];
        } else {
            nodeIdShort = entity.id.toString().substring(0, 8);
        }

        return { displayName, nodeIdShort };
    }

    /**
     * 统一的日志输出方法
     * 同时输出到控制台和LogOutput组件，确保用户在UI中能看到
     */
    private outputLog(
        entity: Entity,
        message: string,
        level: 'log' | 'info' | 'warn' | 'error' = 'info'
    ): void {
        // 输出到浏览器控制台（方便开发调试）
        switch (level) {
            case 'info':
                this.logger.info(message);
                break;
            case 'warn':
                this.logger.warn(message);
                break;
            case 'error':
                this.logger.error(message);
                break;
            default:
                this.logger.info(message);
                break;
        }

        // 输出到LogOutput组件（显示在UI中）
        const rootEntity = this.findRootEntity(entity);
        if (rootEntity) {
            const logOutput = rootEntity.getComponent(LogOutput);
            if (logOutput) {
                logOutput.addMessage(message, level);
            }
        }
    }

    protected override getLoggerName(): string {
        return 'LeafExecutionSystem';
    }
}
