import { Component, ECSComponent } from '@esengine/ecs-framework';
import { Serializable, Serialize, IgnoreSerialization } from '@esengine/ecs-framework';
import { TaskStatus, NodeType } from '../Types/TaskStatus';

/**
 * 行为树节点基础组件
 *
 * 所有行为树节点都必须包含此组件
 */
@ECSComponent('BehaviorTreeNode')
@Serializable({ version: 1 })
export class BehaviorTreeNode extends Component {
    /** 节点类型 */
    @Serialize()
    nodeType: NodeType = NodeType.Action;

    /** 节点名称（用于调试） */
    @Serialize()
    nodeName: string = 'Node';

    /** 当前执行状态 */
    @IgnoreSerialization()
    status: TaskStatus = TaskStatus.Invalid;

    /** 当前执行的子节点索引（用于复合节点） */
    @IgnoreSerialization()
    currentChildIndex: number = 0;

    /**
     * 重置节点状态
     */
    reset(): void {
        this.status = TaskStatus.Invalid;
        this.currentChildIndex = 0;
    }

    /**
     * 标记节点为失效（递归重置子节点）
     * 注意：此方法只重置当前节点，子节点需要在 System 中处理
     */
    invalidate(): void {
        this.reset();
    }
}
