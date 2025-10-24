import { Component, ECSComponent } from '@esengine/ecs-framework';

/**
 * 活跃节点标记组件
 *
 * 标记当前应该被执行的节点。
 * 只有带有此组件的节点才会被各个执行系统处理。
 *
 * 这是一个标记组件（Tag Component），不包含数据，只用于标识。
 *
 * 执行流程：
 * 1. 初始时只有根节点带有 ActiveNode
 * 2. 父节点决定激活哪个子节点时，为子节点添加 ActiveNode
 * 3. 节点执行完成后移除 ActiveNode
 * 4. 通过这种方式实现按需执行，避免每帧遍历整棵树
 */
@ECSComponent('ActiveNode')
export class ActiveNode extends Component {
    // 标记组件，无需数据字段
}
