import { EntitySystem, Matcher, Entity } from '@esengine/ecs-framework';
import { BehaviorTreeNode } from '../Components/BehaviorTreeNode';
import { RootNode } from '../Components/Composites/RootNode';
import { ActiveNode } from '../Components/ActiveNode';
import { TaskStatus, NodeType } from '../Types/TaskStatus';

/**
 * 根节点执行系统
 *
 * 专门处理根节点的执行逻辑
 * 根节点的职责很简单：激活第一个子节点，并根据子节点的状态来设置自己的状态
 *
 * updateOrder: 350 (在所有其他执行系统之后)
 */
export class RootExecutionSystem extends EntitySystem {
    constructor() {
        super(Matcher.empty().all(BehaviorTreeNode, ActiveNode));
        this.updateOrder = 350;
    }

    protected override process(entities: readonly Entity[]): void {
        for (const entity of entities) {
            const node = entity.getComponent(BehaviorTreeNode)!;

            // 只处理根节点
            if (node.nodeType !== NodeType.Composite) {
                continue;
            }

            // 检查是否是根节点
            if (!entity.hasComponent(RootNode)) {
                continue;
            }

            this.executeRoot(entity, node);
        }
    }

    /**
     * 执行根节点逻辑
     */
    private executeRoot(entity: Entity, node: BehaviorTreeNode): void {
        const children = entity.children;

        // 如果没有子节点，标记为成功
        if (children.length === 0) {
            node.status = TaskStatus.Success;
            return;
        }

        // 获取第一个子节点
        const firstChild = children[0];
        const childNode = firstChild.getComponent(BehaviorTreeNode);

        if (!childNode) {
            node.status = TaskStatus.Failure;
            return;
        }

        // 激活第一个子节点（如果还没激活）
        if (!firstChild.hasComponent(ActiveNode)) {
            firstChild.addComponent(new ActiveNode());
            node.status = TaskStatus.Running;
            return;
        }

        // 根据第一个子节点的状态来设置根节点的状态
        if (childNode.status === TaskStatus.Running) {
            node.status = TaskStatus.Running;
        } else if (childNode.status === TaskStatus.Success) {
            node.status = TaskStatus.Success;
            // 移除根节点的 ActiveNode，结束整个行为树
            entity.removeComponentByType(ActiveNode);
        } else if (childNode.status === TaskStatus.Failure) {
            node.status = TaskStatus.Failure;
            // 移除根节点的 ActiveNode，结束整个行为树
            entity.removeComponentByType(ActiveNode);
        }
    }
}
