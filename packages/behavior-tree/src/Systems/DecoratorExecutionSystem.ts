import { EntitySystem, Matcher, Entity, Time } from '@esengine/ecs-framework';
import { BehaviorTreeNode } from '../Components/BehaviorTreeNode';
import { DecoratorNodeComponent } from '../Components/DecoratorNodeComponent';
import { BlackboardComponent } from '../Components/BlackboardComponent';
import { ActiveNode } from '../Components/ActiveNode';
import { TaskStatus, NodeType, DecoratorType } from '../Types/TaskStatus';
import { RepeaterNode } from '../Components/Decorators/RepeaterNode';
import { ConditionalNode } from '../Components/Decorators/ConditionalNode';
import { CooldownNode } from '../Components/Decorators/CooldownNode';
import { TimeoutNode } from '../Components/Decorators/TimeoutNode';

/**
 * 装饰器节点执行系统
 *
 * 负责处理所有活跃的装饰器节点
 * 读取子节点状态，根据装饰器规则决定自己的状态
 *
 * updateOrder: 200 (在叶子节点之后执行)
 */
export class DecoratorExecutionSystem extends EntitySystem {
    constructor() {
        super(Matcher.empty().all(BehaviorTreeNode, ActiveNode));
        this.updateOrder = 200;
    }

    protected override process(entities: readonly Entity[]): void {
        for (const entity of entities) {
            const node = entity.getComponent(BehaviorTreeNode)!;

            // 只处理装饰器节点
            if (node.nodeType !== NodeType.Decorator) {
                continue;
            }

            // 使用 getComponentByType 支持继承查找
            const decorator = entity.getComponentByType(DecoratorNodeComponent);
            if (!decorator) {
                continue;
            }

            this.executeDecorator(entity, node, decorator);
        }
    }

    /**
     * 执行装饰器逻辑
     */
    private executeDecorator(entity: Entity, node: BehaviorTreeNode, decorator: DecoratorNodeComponent): void {
        const children = entity.children;

        if (children.length === 0) {
            this.logger.warn('装饰器节点没有子节点');
            node.status = TaskStatus.Failure;
            this.completeNode(entity);
            return;
        }

        const child = children[0]; // 装饰器只有一个子节点
        const childNode = child.getComponent(BehaviorTreeNode);

        if (!childNode) {
            node.status = TaskStatus.Failure;
            this.completeNode(entity);
            return;
        }

        // 根据装饰器类型处理
        switch (decorator.decoratorType) {
            case DecoratorType.Inverter:
                this.handleInverter(entity, node, child, childNode);
                break;

            case DecoratorType.Repeater:
                this.handleRepeater(entity, node, decorator, child, childNode);
                break;

            case DecoratorType.UntilSuccess:
                this.handleUntilSuccess(entity, node, child, childNode);
                break;

            case DecoratorType.UntilFail:
                this.handleUntilFail(entity, node, child, childNode);
                break;

            case DecoratorType.AlwaysSucceed:
                this.handleAlwaysSucceed(entity, node, child, childNode);
                break;

            case DecoratorType.AlwaysFail:
                this.handleAlwaysFail(entity, node, child, childNode);
                break;

            case DecoratorType.Conditional:
                this.handleConditional(entity, node, decorator, child, childNode);
                break;

            case DecoratorType.Cooldown:
                this.handleCooldown(entity, node, decorator, child, childNode);
                break;

            case DecoratorType.Timeout:
                this.handleTimeout(entity, node, decorator, child, childNode);
                break;

            default:
                node.status = TaskStatus.Failure;
                this.completeNode(entity);
                break;
        }
    }

    /**
     * 反转装饰器
     */
    private handleInverter(entity: Entity, node: BehaviorTreeNode, child: Entity, childNode: BehaviorTreeNode): void {
        if (!child.hasComponent(ActiveNode)) {
            // 子节点未激活，激活它
            child.addComponent(new ActiveNode());
            node.status = TaskStatus.Running;
        } else {
            // 子节点正在执行
            node.status = TaskStatus.Running;
        }

        // 如果子节点完成了
        if (childNode.status === TaskStatus.Success || childNode.status === TaskStatus.Failure) {
            // 反转结果
            node.status = childNode.status === TaskStatus.Success ? TaskStatus.Failure : TaskStatus.Success;
            this.completeNode(entity);
        }
    }

    /**
     * 重复装饰器
     */
    private handleRepeater(
        entity: Entity,
        node: BehaviorTreeNode,
        decorator: DecoratorNodeComponent,
        child: Entity,
        childNode: BehaviorTreeNode
    ): void {
        const repeater = decorator as RepeaterNode;

        // 如果子节点未激活，激活它
        if (!child.hasComponent(ActiveNode)) {
            child.addComponent(new ActiveNode());
            node.status = TaskStatus.Running;
            return;
        }

        // 子节点正在执行
        if (childNode.status === TaskStatus.Running) {
            node.status = TaskStatus.Running;
            return;
        }

        // 子节点完成
        if (childNode.status === TaskStatus.Failure && repeater.endOnFailure) {
            node.status = TaskStatus.Failure;
            repeater.reset();
            this.completeNode(entity);
            return;
        }

        // 增加重复计数
        repeater.incrementRepeat();

        // 检查是否继续重复
        if (repeater.shouldContinueRepeat()) {
            // 重置子节点并继续
            childNode.invalidate();
            child.addComponent(new ActiveNode());
            node.status = TaskStatus.Running;
        } else {
            // 完成
            node.status = TaskStatus.Success;
            repeater.reset();
            this.completeNode(entity);
        }
    }

    /**
     * 直到成功装饰器
     */
    private handleUntilSuccess(entity: Entity, node: BehaviorTreeNode, child: Entity, childNode: BehaviorTreeNode): void {
        if (!child.hasComponent(ActiveNode)) {
            child.addComponent(new ActiveNode());
            node.status = TaskStatus.Running;
            return;
        }

        if (childNode.status === TaskStatus.Running) {
            node.status = TaskStatus.Running;
            return;
        }

        if (childNode.status === TaskStatus.Success) {
            node.status = TaskStatus.Success;
            this.completeNode(entity);
        } else {
            // 失败则重试
            childNode.invalidate();
            child.addComponent(new ActiveNode());
            node.status = TaskStatus.Running;
        }
    }

    /**
     * 直到失败装饰器
     */
    private handleUntilFail(entity: Entity, node: BehaviorTreeNode, child: Entity, childNode: BehaviorTreeNode): void {
        if (!child.hasComponent(ActiveNode)) {
            child.addComponent(new ActiveNode());
            node.status = TaskStatus.Running;
            return;
        }

        if (childNode.status === TaskStatus.Running) {
            node.status = TaskStatus.Running;
            return;
        }

        if (childNode.status === TaskStatus.Failure) {
            node.status = TaskStatus.Success;
            this.completeNode(entity);
        } else {
            // 成功则重试
            childNode.invalidate();
            child.addComponent(new ActiveNode());
            node.status = TaskStatus.Running;
        }
    }

    /**
     * 总是成功装饰器
     */
    private handleAlwaysSucceed(entity: Entity, node: BehaviorTreeNode, child: Entity, childNode: BehaviorTreeNode): void {
        if (!child.hasComponent(ActiveNode)) {
            child.addComponent(new ActiveNode());
            node.status = TaskStatus.Running;
            return;
        }

        if (childNode.status === TaskStatus.Running) {
            node.status = TaskStatus.Running;
        } else {
            node.status = TaskStatus.Success;
            this.completeNode(entity);
        }
    }

    /**
     * 总是失败装饰器
     */
    private handleAlwaysFail(entity: Entity, node: BehaviorTreeNode, child: Entity, childNode: BehaviorTreeNode): void {
        if (!child.hasComponent(ActiveNode)) {
            child.addComponent(new ActiveNode());
            node.status = TaskStatus.Running;
            return;
        }

        if (childNode.status === TaskStatus.Running) {
            node.status = TaskStatus.Running;
        } else {
            node.status = TaskStatus.Failure;
            this.completeNode(entity);
        }
    }

    /**
     * 条件装饰器
     */
    private handleConditional(
        entity: Entity,
        node: BehaviorTreeNode,
        decorator: DecoratorNodeComponent,
        child: Entity,
        childNode: BehaviorTreeNode
    ): void {
        const conditional = decorator as ConditionalNode;

        // 评估条件
        const conditionMet = conditional.evaluateCondition(entity, this.findBlackboard(entity));

        if (!conditionMet) {
            // 条件不满足，直接失败
            node.status = TaskStatus.Failure;
            this.completeNode(entity);
            return;
        }

        // 条件满足，执行子节点
        if (!child.hasComponent(ActiveNode)) {
            child.addComponent(new ActiveNode());
            node.status = TaskStatus.Running;
            return;
        }

        node.status = childNode.status;

        if (childNode.status !== TaskStatus.Running) {
            this.completeNode(entity);
        }
    }

    /**
     * 冷却装饰器
     */
    private handleCooldown(
        entity: Entity,
        node: BehaviorTreeNode,
        decorator: DecoratorNodeComponent,
        child: Entity,
        childNode: BehaviorTreeNode
    ): void {
        const cooldown = decorator as CooldownNode;

        // 检查冷却
        if (!cooldown.canExecute(Time.totalTime)) {
            node.status = TaskStatus.Failure;
            this.completeNode(entity);
            return;
        }

        if (!child.hasComponent(ActiveNode)) {
            child.addComponent(new ActiveNode());
            node.status = TaskStatus.Running;
            return;
        }

        node.status = childNode.status;

        if (childNode.status !== TaskStatus.Running) {
            cooldown.recordExecution(Time.totalTime);
            this.completeNode(entity);
        }
    }

    /**
     * 超时装饰器
     */
    private handleTimeout(
        entity: Entity,
        node: BehaviorTreeNode,
        decorator: DecoratorNodeComponent,
        child: Entity,
        childNode: BehaviorTreeNode
    ): void {
        const timeout = decorator as TimeoutNode;

        timeout.recordStartTime(Time.totalTime);

        if (timeout.isTimeout(Time.totalTime)) {
            node.status = TaskStatus.Failure;
            timeout.reset();
            // 移除子节点的活跃标记
            child.removeComponentByType(ActiveNode);
            this.completeNode(entity);
            return;
        }

        if (!child.hasComponent(ActiveNode)) {
            child.addComponent(new ActiveNode());
            node.status = TaskStatus.Running;
            return;
        }

        node.status = childNode.status;

        if (childNode.status !== TaskStatus.Running) {
            timeout.reset();
            this.completeNode(entity);
        }
    }

    /**
     * 完成节点执行
     */
    private completeNode(entity: Entity): void {
        entity.removeComponentByType(ActiveNode);

        // 通知父节点
        if (entity.parent && entity.parent.hasComponent(BehaviorTreeNode)) {
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
        return 'DecoratorExecutionSystem';
    }
}
