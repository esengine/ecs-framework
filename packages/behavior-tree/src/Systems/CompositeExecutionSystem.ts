import { EntitySystem, Matcher, Entity } from '@esengine/ecs-framework';
import { BehaviorTreeNode } from '../Components/BehaviorTreeNode';
import { CompositeNodeComponent } from '../Components/CompositeNodeComponent';
import { ActiveNode } from '../Components/ActiveNode';
import { TaskStatus, NodeType, CompositeType } from '../Types/TaskStatus';

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
        super(Matcher.empty().all(BehaviorTreeNode, CompositeNodeComponent, ActiveNode));
        this.updateOrder = 300;
    }

    protected override process(entities: readonly Entity[]): void {
        for (const entity of entities) {
            const node = entity.getComponent(BehaviorTreeNode)!;
            const composite = entity.getComponent(CompositeNodeComponent)!;

            // 确保是复合节点
            if (node.nodeType !== NodeType.Composite) {
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
        // 检查当前子节点
        if (node.currentChildIndex >= children.length) {
            // 所有子节点都成功
            node.status = TaskStatus.Success;
            node.reset();
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

        // 激活当前子节点
        if (!currentChild.hasComponent(ActiveNode)) {
            currentChild.addComponent(new ActiveNode());
            node.status = TaskStatus.Running;
            return;
        }

        // 检查子节点状态
        if (childNode.status === TaskStatus.Running) {
            node.status = TaskStatus.Running;
        } else if (childNode.status === TaskStatus.Failure) {
            // 任一失败则失败
            node.status = TaskStatus.Failure;
            node.reset();
            this.completeNode(entity);
        } else if (childNode.status === TaskStatus.Success) {
            // 成功则移动到下一个子节点
            node.currentChildIndex++;
            // 继续保持活跃，下一帧处理下一个子节点
            node.status = TaskStatus.Running;
        }
    }

    /**
     * 选择器节点：任一子节点成功就成功
     */
    private handleSelector(entity: Entity, node: BehaviorTreeNode, children: readonly Entity[]): void {
        // 检查当前子节点
        if (node.currentChildIndex >= children.length) {
            // 所有子节点都失败
            node.status = TaskStatus.Failure;
            node.reset();
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

        // 激活当前子节点
        if (!currentChild.hasComponent(ActiveNode)) {
            currentChild.addComponent(new ActiveNode());
            node.status = TaskStatus.Running;
            return;
        }

        // 检查子节点状态
        if (childNode.status === TaskStatus.Running) {
            node.status = TaskStatus.Running;
        } else if (childNode.status === TaskStatus.Success) {
            // 任一成功则成功
            node.status = TaskStatus.Success;
            node.reset();
            this.completeNode(entity);
        } else if (childNode.status === TaskStatus.Failure) {
            // 失败则移动到下一个子节点
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
            node.reset();
            this.completeNode(entity);
        } else {
            // 所有子节点都成功
            node.status = TaskStatus.Success;
            node.reset();
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
            node.reset();
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
            node.reset();
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
            node.reset();
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

        // 激活当前子节点
        if (!currentChild.hasComponent(ActiveNode)) {
            currentChild.addComponent(new ActiveNode());
            node.status = TaskStatus.Running;
            return;
        }

        // 检查子节点状态
        if (childNode.status === TaskStatus.Running) {
            node.status = TaskStatus.Running;
        } else if (childNode.status === TaskStatus.Failure) {
            node.status = TaskStatus.Failure;
            node.reset();
            composite.resetShuffle();
            this.completeNode(entity);
        } else if (childNode.status === TaskStatus.Success) {
            // 成功则移动到下一个子节点
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
            node.reset();
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

        // 激活当前子节点
        if (!currentChild.hasComponent(ActiveNode)) {
            currentChild.addComponent(new ActiveNode());
            node.status = TaskStatus.Running;
            return;
        }

        // 检查子节点状态
        if (childNode.status === TaskStatus.Running) {
            node.status = TaskStatus.Running;
        } else if (childNode.status === TaskStatus.Success) {
            node.status = TaskStatus.Success;
            node.reset();
            composite.resetShuffle();
            this.completeNode(entity);
        } else if (childNode.status === TaskStatus.Failure) {
            // 失败则移动到下一个子节点
            node.currentChildIndex++;
            node.status = TaskStatus.Running;
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

    protected override getLoggerName(): string {
        return 'CompositeExecutionSystem';
    }
}
