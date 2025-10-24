import { EntitySystem, Matcher, Entity } from '@esengine/ecs-framework';
import { BehaviorTreeNode } from '../Components/BehaviorTreeNode';
import { CompositeNodeComponent } from '../Components/CompositeNodeComponent';
import { ActiveNode } from '../Components/ActiveNode';
import { BlackboardComponent } from '../Components/BlackboardComponent';
import { TaskStatus, NodeType, CompositeType, AbortType } from '../Types/TaskStatus';
import { SequenceNode } from '../Components/Composites/SequenceNode';
import { SelectorNode } from '../Components/Composites/SelectorNode';
import { RootNode } from '../Components/Composites/RootNode';
import { SubTreeNode } from '../Components/Composites/SubTreeNode';
import { BlackboardCompareCondition, CompareOperator } from '../Components/Conditions/BlackboardCompareCondition';
import { BlackboardExistsCondition } from '../Components/Conditions/BlackboardExistsCondition';
import { RandomProbabilityCondition } from '../Components/Conditions/RandomProbabilityCondition';
import { ExecuteCondition } from '../Components/Conditions/ExecuteCondition';

/**
 * 复合节点执行系统
 *
 * 负责处理所有活跃的复合节点
 * 读取子节点状态，根据复合规则决定自己的状态和激活哪些子节点
 *
 * updateOrder: 300 (在叶子节点和装饰器之后执行)
 */
export class CompositeExecutionSystem extends EntitySystem {
    constructor() {
        super(Matcher.empty().all(BehaviorTreeNode, ActiveNode).exclude(RootNode, SubTreeNode));
        this.updateOrder = 300;
    }

    protected override process(entities: readonly Entity[]): void {
        for (const entity of entities) {
            const node = entity.getComponent(BehaviorTreeNode)!;

            // 只处理复合节点
            if (node.nodeType !== NodeType.Composite) {
                continue;
            }

            // 使用 getComponentByType 支持继承查找
            const composite = entity.getComponentByType(CompositeNodeComponent);

            if (!composite) {
                this.logger.warn(`复合节点 ${entity.name} 没有找到复合节点组件`);
                const components = entity.components.map(c => c.constructor.name).join(', ');
                this.logger.warn(`  组件列表: ${components}`);
                continue;
            }

            this.executeComposite(entity, node, composite);
        }
    }

    /**
     * 执行复合节点逻辑
     */
    private executeComposite(entity: Entity, node: BehaviorTreeNode, composite: CompositeNodeComponent): void {
        const children = entity.children;

        if (children.length === 0) {
            node.status = TaskStatus.Success;
            this.completeNode(entity);
            return;
        }

        // 根据复合节点类型处理
        switch (composite.compositeType) {
            case CompositeType.Sequence:
                this.handleSequence(entity, node, children);
                break;

            case CompositeType.Selector:
                this.handleSelector(entity, node, children);
                break;

            case CompositeType.Parallel:
                this.handleParallel(entity, node, children);
                break;

            case CompositeType.ParallelSelector:
                this.handleParallelSelector(entity, node, children);
                break;

            case CompositeType.RandomSequence:
                this.handleRandomSequence(entity, node, composite, children);
                break;

            case CompositeType.RandomSelector:
                this.handleRandomSelector(entity, node, composite, children);
                break;

            default:
                node.status = TaskStatus.Failure;
                this.completeNode(entity);
                break;
        }
    }

    /**
     * 序列节点：所有子节点都成功才成功
     */
    private handleSequence(entity: Entity, node: BehaviorTreeNode, children: readonly Entity[]): void {
        // 检查是否需要中止
        const sequenceNode = entity.getComponentByType(SequenceNode);
        if (sequenceNode && sequenceNode.abortType !== AbortType.None) {
            if (this.shouldAbort(entity, node, children, sequenceNode.abortType)) {
                this.abortExecution(entity, node, children);
                return;
            }
        }

        // 检查当前子节点
        if (node.currentChildIndex >= children.length) {
            // 所有子节点都成功
            node.status = TaskStatus.Success;
            node.currentChildIndex = 0; // 只重置索引，保持状态为Success
            this.completeNode(entity);
            return;
        }

        const currentChild = children[node.currentChildIndex];
        const childNode = currentChild.getComponent(BehaviorTreeNode);

        if (!childNode) {
            node.status = TaskStatus.Failure;
            this.completeNode(entity);
            return;
        }

        // 如果子节点还没开始执行，激活它
        if (childNode.status === TaskStatus.Invalid) {
            if (!currentChild.hasComponent(ActiveNode)) {
                currentChild.addComponent(new ActiveNode());
            }
            node.status = TaskStatus.Running;
            return;
        }

        // 检查子节点状态
        if (childNode.status === TaskStatus.Running) {
            node.status = TaskStatus.Running;
        } else if (childNode.status === TaskStatus.Failure) {
            // 任一失败则失败
            node.status = TaskStatus.Failure;
            node.currentChildIndex = 0; // 只重置索引，保持状态为Failure
            this.completeNode(entity);
        } else if (childNode.status === TaskStatus.Success) {
            // 成功则移动到下一个子节点
            // 重置已完成的子节点状态，以便下次行为树重新执行时从头开始
            childNode.reset();
            node.currentChildIndex++;
            // 继续保持活跃，下一帧处理下一个子节点
            node.status = TaskStatus.Running;
        }
    }

    /**
     * 选择器节点：任一子节点成功就成功
     */
    private handleSelector(entity: Entity, node: BehaviorTreeNode, children: readonly Entity[]): void {
        // 检查是否需要中止
        const selectorNode = entity.getComponentByType(SelectorNode);
        if (selectorNode && selectorNode.abortType !== AbortType.None) {
            if (this.shouldAbort(entity, node, children, selectorNode.abortType)) {
                this.abortExecution(entity, node, children);
                return;
            }
        }

        // 检查当前子节点
        if (node.currentChildIndex >= children.length) {
            // 所有子节点都失败
            node.status = TaskStatus.Failure;
            node.currentChildIndex = 0; // 只重置索引，保持状态为Failure
            this.completeNode(entity);
            return;
        }

        const currentChild = children[node.currentChildIndex];
        const childNode = currentChild.getComponent(BehaviorTreeNode);

        if (!childNode) {
            node.status = TaskStatus.Failure;
            this.completeNode(entity);
            return;
        }

        // 如果子节点还没开始执行，激活它
        if (childNode.status === TaskStatus.Invalid) {
            if (!currentChild.hasComponent(ActiveNode)) {
                currentChild.addComponent(new ActiveNode());
            }
            node.status = TaskStatus.Running;
            return;
        }

        // 检查子节点状态
        if (childNode.status === TaskStatus.Running) {
            node.status = TaskStatus.Running;
        } else if (childNode.status === TaskStatus.Success) {
            // 任一成功则成功
            node.status = TaskStatus.Success;
            node.currentChildIndex = 0; // 只重置索引，保持状态为Success
            this.completeNode(entity);
        } else if (childNode.status === TaskStatus.Failure) {
            // 失败则移动到下一个子节点
            // 重置已完成的子节点状态，以便下次行为树重新执行时从头开始
            childNode.reset();
            node.currentChildIndex++;
            // 继续保持活跃，下一帧处理下一个子节点
            node.status = TaskStatus.Running;
        }
    }

    /**
     * 并行节点：所有子节点都执行，全部成功才成功
     */
    private handleParallel(entity: Entity, node: BehaviorTreeNode, children: readonly Entity[]): void {
        let hasRunning = false;
        let hasFailed = false;

        // 激活所有子节点
        for (const child of children) {
            if (!child.hasComponent(ActiveNode)) {
                child.addComponent(new ActiveNode());
            }

            const childNode = child.getComponent(BehaviorTreeNode);
            if (!childNode) continue;

            if (childNode.status === TaskStatus.Running) {
                hasRunning = true;
            } else if (childNode.status === TaskStatus.Failure) {
                hasFailed = true;
            }
        }

        if (hasRunning) {
            node.status = TaskStatus.Running;
        } else if (hasFailed) {
            node.status = TaskStatus.Failure;
            node.currentChildIndex = 0; // 只重置索引，保持状态为Failure
            this.completeNode(entity);
        } else {
            // 所有子节点都成功
            node.status = TaskStatus.Success;
            node.currentChildIndex = 0; // 只重置索引，保持状态为Success
            this.completeNode(entity);
        }
    }

    /**
     * 并行选择器：任一成功则成功
     */
    private handleParallelSelector(entity: Entity, node: BehaviorTreeNode, children: readonly Entity[]): void {
        let hasRunning = false;
        let hasSucceeded = false;

        // 激活所有子节点
        for (const child of children) {
            if (!child.hasComponent(ActiveNode)) {
                child.addComponent(new ActiveNode());
            }

            const childNode = child.getComponent(BehaviorTreeNode);
            if (!childNode) continue;

            if (childNode.status === TaskStatus.Running) {
                hasRunning = true;
            } else if (childNode.status === TaskStatus.Success) {
                hasSucceeded = true;
            }
        }

        if (hasSucceeded) {
            // 任一成功则成功
            node.status = TaskStatus.Success;
            node.currentChildIndex = 0; // 只重置索引，保持状态为Success
            // 停止所有子节点
            for (const child of children) {
                child.removeComponentByType(ActiveNode);
            }
            this.completeNode(entity);
        } else if (hasRunning) {
            node.status = TaskStatus.Running;
        } else {
            // 所有子节点都失败
            node.status = TaskStatus.Failure;
            node.currentChildIndex = 0; // 只重置索引，保持状态为Failure
            this.completeNode(entity);
        }
    }

    /**
     * 随机序列
     */
    private handleRandomSequence(
        entity: Entity,
        node: BehaviorTreeNode,
        composite: CompositeNodeComponent,
        children: readonly Entity[]
    ): void {
        // 获取洗牌后的子节点索引
        const childIndex = composite.getNextChildIndex(node.currentChildIndex, children.length);

        if (childIndex >= children.length) {
            // 所有子节点都成功
            node.status = TaskStatus.Success;
            node.currentChildIndex = 0; // 只重置索引，保持状态为Success
            composite.resetShuffle();
            this.completeNode(entity);
            return;
        }

        const currentChild = children[childIndex];
        const childNode = currentChild.getComponent(BehaviorTreeNode);

        if (!childNode) {
            node.status = TaskStatus.Failure;
            this.completeNode(entity);
            return;
        }

        // 如果子节点还没开始执行，激活它
        if (childNode.status === TaskStatus.Invalid) {
            if (!currentChild.hasComponent(ActiveNode)) {
                currentChild.addComponent(new ActiveNode());
            }
            node.status = TaskStatus.Running;
            return;
        }

        // 检查子节点状态
        if (childNode.status === TaskStatus.Running) {
            node.status = TaskStatus.Running;
        } else if (childNode.status === TaskStatus.Failure) {
            node.status = TaskStatus.Failure;
            node.currentChildIndex = 0; // 只重置索引，保持状态为Failure
            composite.resetShuffle();
            this.completeNode(entity);
        } else if (childNode.status === TaskStatus.Success) {
            // 成功则移动到下一个子节点
            // 重置已完成的子节点状态，以便下次行为树重新执行时从头开始
            childNode.reset();
            node.currentChildIndex++;
            node.status = TaskStatus.Running;
        }
    }

    /**
     * 随机选择器
     */
    private handleRandomSelector(
        entity: Entity,
        node: BehaviorTreeNode,
        composite: CompositeNodeComponent,
        children: readonly Entity[]
    ): void {
        // 获取洗牌后的子节点索引
        const childIndex = composite.getNextChildIndex(node.currentChildIndex, children.length);

        if (childIndex >= children.length) {
            // 所有子节点都失败
            node.status = TaskStatus.Failure;
            node.currentChildIndex = 0; // 只重置索引，保持状态为Failure
            composite.resetShuffle();
            this.completeNode(entity);
            return;
        }

        const currentChild = children[childIndex];
        const childNode = currentChild.getComponent(BehaviorTreeNode);

        if (!childNode) {
            node.status = TaskStatus.Failure;
            this.completeNode(entity);
            return;
        }

        // 如果子节点还没开始执行，激活它
        if (childNode.status === TaskStatus.Invalid) {
            if (!currentChild.hasComponent(ActiveNode)) {
                currentChild.addComponent(new ActiveNode());
            }
            node.status = TaskStatus.Running;
            return;
        }

        // 检查子节点状态
        if (childNode.status === TaskStatus.Running) {
            node.status = TaskStatus.Running;
        } else if (childNode.status === TaskStatus.Success) {
            node.status = TaskStatus.Success;
            node.currentChildIndex = 0; // 只重置索引，保持状态为Success
            composite.resetShuffle();
            this.completeNode(entity);
        } else if (childNode.status === TaskStatus.Failure) {
            // 失败则移动到下一个子节点
            // 重置已完成的子节点状态，以便下次行为树重新执行时从头开始
            childNode.reset();
            node.currentChildIndex++;
            node.status = TaskStatus.Running;
        }
    }

    /**
     * 检查是否应该中止当前执行
     */
    private shouldAbort(
        entity: Entity,
        node: BehaviorTreeNode,
        children: readonly Entity[],
        abortType: AbortType
    ): boolean {
        const currentIndex = node.currentChildIndex;

        // 如果还没开始执行任何子节点，不需要中止
        if (currentIndex === 0) {
            return false;
        }

        // Self: 检查当前执行路径中的条件节点是否失败
        if (abortType === AbortType.Self || abortType === AbortType.Both) {
            // 检查当前正在执行的分支之前的条件节点
            for (let i = 0; i < currentIndex; i++) {
                const child = children[i];
                const childNode = child.getComponent(BehaviorTreeNode);
                if (childNode && childNode.nodeType === NodeType.Condition) {
                    // 如果条件节点现在失败了，应该中止
                    if (childNode.status === TaskStatus.Failure) {
                        return true;
                    }
                }
            }
        }

        // LowerPriority: 检查高优先级分支的条件是否满足
        if (abortType === AbortType.LowerPriority || abortType === AbortType.Both) {
            // 检查当前索引之前的所有分支（优先级更高）
            for (let i = 0; i < currentIndex; i++) {
                const child = children[i];
                const childNode = child.getComponent(BehaviorTreeNode);
                if (!childNode) continue;

                // 如果是条件节点且现在成功了
                if (childNode.nodeType === NodeType.Condition) {
                    if (this.evaluateCondition(child, childNode)) {
                        return true;
                    }
                }
                // 如果是复合节点，检查其第一个子节点（通常是条件）
                else if (childNode.nodeType === NodeType.Composite && child.children.length > 0) {
                    const firstGrandChild = child.children[0];
                    const firstGrandChildNode = firstGrandChild.getComponent(BehaviorTreeNode);
                    if (firstGrandChildNode && firstGrandChildNode.nodeType === NodeType.Condition) {
                        if (this.evaluateCondition(firstGrandChild, firstGrandChildNode)) {
                            return true;
                        }
                    }
                }
            }
        }

        return false;
    }

    /**
     * 评估条件节点
     */
    private evaluateCondition(entity: Entity, node: BehaviorTreeNode): boolean {
        if (node.nodeType !== NodeType.Condition) {
            return false;
        }

        let result = false;

        if (entity.hasComponent(BlackboardCompareCondition)) {
            result = this.evaluateBlackboardCompare(entity);
        } else if (entity.hasComponent(BlackboardExistsCondition)) {
            result = this.evaluateBlackboardExists(entity);
        } else if (entity.hasComponent(RandomProbabilityCondition)) {
            result = this.evaluateRandomProbability(entity);
        } else if (entity.hasComponent(ExecuteCondition)) {
            result = this.evaluateCustomCondition(entity);
        }

        return result;
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
        const result = func(entity, blackboard, 0);

        return condition.invertResult ? !result : result;
    }

    /**
     * 解析字符串中的变量引用
     */
    private resolveVariableReferences(value: string, blackboard: BlackboardComponent): any {
        const pureMatch = value.match(/^{{\s*(\w+)\s*}}$/);
        if (pureMatch) {
            const varName = pureMatch[1];
            if (blackboard.hasVariable(varName)) {
                return blackboard.getValue(varName);
            }
            return value;
        }

        return value.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
            if (blackboard.hasVariable(varName)) {
                const val = blackboard.getValue(varName);
                return val !== undefined ? String(val) : match;
            }
            return match;
        });
    }

    /**
     * 查找黑板组件
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
     * 中止当前执行
     */
    private abortExecution(entity: Entity, node: BehaviorTreeNode, children: readonly Entity[]): void {
        // 停止当前正在执行的子节点
        const currentIndex = node.currentChildIndex;
        if (currentIndex < children.length) {
            const currentChild = children[currentIndex];
            this.deactivateNode(currentChild);
        }

        // 重置节点状态，从头开始
        node.currentChildIndex = 0;
        node.status = TaskStatus.Running;

        // 不需要 completeNode，因为我们要继续执行（从头开始）
    }

    /**
     * 递归停用节点及其所有子节点
     */
    private deactivateNode(entity: Entity): void {
        // 移除活跃标记
        entity.removeComponentByType(ActiveNode);

        // 重置节点状态
        const node = entity.getComponent(BehaviorTreeNode);
        if (node) {
            node.reset();
        }

        // 递归停用所有子节点
        for (const child of entity.children) {
            this.deactivateNode(child);
        }
    }

    /**
     * 递归重置所有子节点的状态
     */
    private resetAllChildren(entity: Entity): void {
        for (const child of entity.children) {
            const childNode = child.getComponent(BehaviorTreeNode);
            if (childNode) {
                childNode.reset();
            }
            // 递归重置孙子节点
            this.resetAllChildren(child);
        }
    }

    /**
     * 完成节点执行
     */
    private completeNode(entity: Entity): void {
        entity.removeComponentByType(ActiveNode);

        // 如果是复合节点完成，重置所有子节点状态
        const node = entity.getComponent(BehaviorTreeNode);
        if (node && node.nodeType === NodeType.Composite) {
            this.resetAllChildren(entity);
        }

        // 通知父节点
        if (entity.parent && entity.parent.hasComponent(BehaviorTreeNode)) {
            if (!entity.parent.hasComponent(ActiveNode)) {
                entity.parent.addComponent(new ActiveNode());
            }
        }
    }

    protected override getLoggerName(): string {
        return 'CompositeExecutionSystem';
    }
}
