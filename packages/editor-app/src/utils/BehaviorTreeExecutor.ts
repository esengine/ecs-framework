import { World, Entity, Scene, createLogger } from '@esengine/ecs-framework';
import {
    BehaviorTreeNode as BehaviorTreeNodeComponent,
    BlackboardComponent,
    ActiveNode,
    PropertyBindings,
    RootExecutionSystem,
    LeafExecutionSystem,
    DecoratorExecutionSystem,
    CompositeExecutionSystem,
    CompositeNodeComponent,
    TaskStatus,
    NodeType,
    WaitAction,
    LogAction,
    SetBlackboardValueAction,
    ModifyBlackboardValueAction,
    ExecuteAction,
    BlackboardCompareCondition,
    BlackboardExistsCondition,
    RandomProbabilityCondition,
    ExecuteCondition,
    RootNode,
    SequenceNode,
    SelectorNode,
    ParallelNode,
    ParallelSelectorNode,
    RandomSequenceNode,
    RandomSelectorNode,
    InverterNode,
    RepeaterNode,
    UntilSuccessNode,
    UntilFailNode,
    AlwaysSucceedNode,
    AlwaysFailNode,
    ConditionalNode,
    CooldownNode,
    TimeoutNode,
    AbortType,
    CompareOperator
} from '@esengine/behavior-tree';
import type { BehaviorTreeNode } from '../stores/behaviorTreeStore';

const logger = createLogger('BehaviorTreeExecutor');

export interface ExecutionStatus {
    nodeId: string;
    status: 'running' | 'success' | 'failure' | 'idle';
    message?: string;
}

export interface ExecutionLog {
    timestamp: number;
    message: string;
    level: 'info' | 'success' | 'error' | 'warning';
    nodeId?: string;
}

export type ExecutionCallback = (statuses: ExecutionStatus[], logs: ExecutionLog[]) => void;

/**
 * 真实的行为树执行器
 *
 * 使用真实的 ECS 系统执行行为树
 */
export class BehaviorTreeExecutor {
    private world: World;
    private scene: Scene;
    private rootEntity: Entity | null = null;
    private entityMap: Map<string, Entity> = new Map();
    private blackboardVariables: Record<string, any> = {};
    private callback: ExecutionCallback | null = null;
    private isRunning = false;
    private isPaused = false;
    private executionLogs: ExecutionLog[] = [];
    private lastStatuses: Map<string, 'running' | 'success' | 'failure' | 'idle'> = new Map();
    private debugMode = false;
    private tickCount = 0;
    // 存储节点ID -> 属性绑定信息的映射
    private propertyBindingsMap: Map<string, Map<string, string>> = new Map();

    constructor() {
        this.world = new World({ name: 'BehaviorTreeWorld' });
        this.scene = this.world.createScene('BehaviorTreeScene');

        // 注册执行系统
        this.scene.addSystem(new RootExecutionSystem());
        this.scene.addSystem(new LeafExecutionSystem());
        this.scene.addSystem(new DecoratorExecutionSystem());
        this.scene.addSystem(new CompositeExecutionSystem());
    }

    /**
     * 从编辑器节点构建真实的 Entity 树
     */
    buildTree(
        nodes: BehaviorTreeNode[],
        rootNodeId: string,
        blackboard: Record<string, any>,
        connections: Array<{ from: string; to: string; fromProperty?: string; toProperty?: string; connectionType: 'node' | 'property' }>,
        callback: ExecutionCallback
    ): void {
        this.cleanup();
        this.blackboardVariables = { ...blackboard };
        this.callback = callback;

        const nodeMap = new Map<string, BehaviorTreeNode>();
        nodes.forEach(node => nodeMap.set(node.id, node));

        const rootNode = nodeMap.get(rootNodeId);
        if (!rootNode) {
            logger.error('未找到根节点');
            return;
        }

        // 先创建黑板组件
        const blackboardComp = new BlackboardComponent();
        Object.entries(this.blackboardVariables).forEach(([key, value]) => {
            const type = typeof value === 'number' ? 'number' :
                        typeof value === 'string' ? 'string' :
                        typeof value === 'boolean' ? 'boolean' :
                        'object';
            blackboardComp.defineVariable(key, type as any, value);
        });

        // 在创建实体之前先处理属性连接，这样创建组件时就能读到正确的值
        this.applyPropertyConnections(connections, nodeMap, blackboardComp);

        // 创建实体树
        this.rootEntity = this.createEntityFromNode(rootNode, nodeMap, null);

        if (this.rootEntity) {
            // 将黑板组件添加到根实体
            this.rootEntity.addComponent(blackboardComp);

            if (this.debugMode) {
                this.logDebugTreeStructure();
                // 立即触发一次回调，显示 debug 信息
                if (this.callback) {
                    this.callback([], this.executionLogs);
                }
            }
        }
    }

    /**
     * 应用属性连接
     * 记录属性到黑板变量的绑定关系
     */
    private applyPropertyConnections(
        connections: Array<{ from: string; to: string; fromProperty?: string; toProperty?: string; connectionType: 'node' | 'property' }>,
        nodeMap: Map<string, BehaviorTreeNode>,
        blackboard: BlackboardComponent
    ): void {
        // 清空之前的绑定信息
        this.propertyBindingsMap.clear();

        // 过滤出属性类型的连接
        const propertyConnections = connections.filter(conn => conn.connectionType === 'property');

        logger.info(`[属性绑定] 找到 ${propertyConnections.length} 个属性连接`);

        propertyConnections.forEach(conn => {
            const fromNode = nodeMap.get(conn.from);
            const toNode = nodeMap.get(conn.to);

            if (!fromNode || !toNode || !conn.toProperty) {
                logger.warn(`[属性绑定] 连接数据不完整: from=${conn.from}, to=${conn.to}, toProperty=${conn.toProperty}`);
                return;
            }

            let variableName: string | undefined;

            // 检查 from 节点是否是黑板变量节点
            if (fromNode.data.nodeType === 'blackboard-variable') {
                // 黑板变量节点，变量名在 data.variableName 中
                variableName = fromNode.data.variableName;
            } else if (conn.fromProperty) {
                // 普通节点的属性连接
                variableName = conn.fromProperty;
            }

            if (!variableName) {
                logger.warn(`[属性绑定] 无法确定变量名: from节点=${fromNode.template.displayName}`);
                return;
            }

            if (!blackboard.hasVariable(variableName)) {
                logger.warn(`[属性绑定] 黑板变量不存在: ${variableName}`);
                return;
            }

            // 记录绑定信息到 Map
            let nodeBindings = this.propertyBindingsMap.get(toNode.id);
            if (!nodeBindings) {
                nodeBindings = new Map<string, string>();
                this.propertyBindingsMap.set(toNode.id, nodeBindings);
            }

            nodeBindings.set(conn.toProperty, variableName);

            logger.info(`[属性绑定] 成功绑定: 节点 "${toNode.template.displayName}" 的属性 "${conn.toProperty}" -> 黑板变量 "${variableName}"`);
        });
    }

    /**
     * 递归创建 Entity
     */
    private createEntityFromNode(
        node: BehaviorTreeNode,
        nodeMap: Map<string, BehaviorTreeNode>,
        parent: Entity | null
    ): Entity {
        const entity = this.scene.createEntity(node.template.displayName || 'Node');
        this.entityMap.set(node.id, entity);

        if (parent) {
            parent.addChild(entity);
        }

        const btNode = new BehaviorTreeNodeComponent();
        btNode.nodeType = this.getNodeType(node);
        entity.addComponent(btNode);

        this.addNodeComponents(entity, node);

        // 检查是否有属性绑定，如果有则添加 PropertyBindings 组件
        const bindings = this.propertyBindingsMap.get(node.id);
        if (bindings && bindings.size > 0) {
            const propertyBindings = new PropertyBindings();
            bindings.forEach((variableName, propertyName) => {
                propertyBindings.addBinding(propertyName, variableName);
            });
            entity.addComponent(propertyBindings);
            logger.info(`[PropertyBindings] 为节点 "${node.template.displayName}" 添加了 ${bindings.size} 个属性绑定`);
        }

        node.children.forEach(childId => {
            const childNode = nodeMap.get(childId);
            if (childNode) {
                this.createEntityFromNode(childNode, nodeMap, entity);
            }
        });

        return entity;
    }

    /**
     * 获取节点类型
     */
    private getNodeType(node: BehaviorTreeNode): NodeType {
        const type = node.template.type;
        if (type === NodeType.Composite) return NodeType.Composite;
        if (type === NodeType.Decorator) return NodeType.Decorator;
        if (type === NodeType.Action) return NodeType.Action;
        if (type === NodeType.Condition) return NodeType.Condition;
        return NodeType.Action;
    }

    /**
     * 根据节点数据添加对应的组件
     */
    private addNodeComponents(entity: Entity, node: BehaviorTreeNode): void {
        const category = node.template.category;
        const data = node.data;

        if (category === '根节点' || data.nodeType === 'root') {
            // 根节点使用专门的 RootNode 组件
            entity.addComponent(new RootNode());
        } else if (category === '动作') {
            this.addActionComponent(entity, node);
        } else if (category === '条件') {
            this.addConditionComponent(entity, node);
        } else if (category === '组合') {
            this.addCompositeComponent(entity, node);
        } else if (category === '装饰器') {
            this.addDecoratorComponent(entity, node);
        }
    }

    /**
     * 添加动作组件
     */
    private addActionComponent(entity: Entity, node: BehaviorTreeNode): void {
        const displayName = node.template.displayName;

        if (displayName === '等待') {
            const action = new WaitAction();
            action.waitTime = node.data.waitTime ?? 1.0;
            entity.addComponent(action);
        } else if (displayName === '日志') {
            const action = new LogAction();
            action.message = node.data.message ?? '';
            action.level = node.data.level ?? 'log';
            entity.addComponent(action);
        } else if (displayName === '设置变量') {
            const action = new SetBlackboardValueAction();
            action.variableName = node.data.variableName ?? '';
            action.value = node.data.value;
            entity.addComponent(action);
        } else if (displayName === '修改变量') {
            const action = new ModifyBlackboardValueAction();
            action.variableName = node.data.variableName ?? '';
            action.operation = node.data.operation ?? 'add';
            action.operand = node.data.operand ?? 0;
            entity.addComponent(action);
        } else if (displayName === '自定义动作') {
            const action = new ExecuteAction();
            action.actionCode = node.data.actionCode ?? 'return TaskStatus.Success;';
            entity.addComponent(action);
        }
    }

    /**
     * 添加条件组件
     */
    private addConditionComponent(entity: Entity, node: BehaviorTreeNode): void {
        const displayName = node.template.displayName;

        if (displayName === '比较变量') {
            const condition = new BlackboardCompareCondition();
            condition.variableName = node.data.variableName ?? '';
            condition.operator = (node.data.operator as CompareOperator) ?? CompareOperator.Equal;
            condition.compareValue = node.data.compareValue;
            condition.invertResult = node.data.invertResult ?? false;
            entity.addComponent(condition);
        } else if (displayName === '变量存在') {
            const condition = new BlackboardExistsCondition();
            condition.variableName = node.data.variableName ?? '';
            condition.checkNotNull = node.data.checkNotNull ?? false;
            condition.invertResult = node.data.invertResult ?? false;
            entity.addComponent(condition);
        } else if (displayName === '随机概率') {
            const condition = new RandomProbabilityCondition();
            condition.probability = node.data.probability ?? 0.5;
            entity.addComponent(condition);
        } else if (displayName === '执行条件') {
            const condition = new ExecuteCondition();
            condition.conditionCode = node.data.conditionCode ?? '';
            condition.invertResult = node.data.invertResult ?? false;
            entity.addComponent(condition);
        }
    }

    /**
     * 添加复合节点组件
     */
    private addCompositeComponent(entity: Entity, node: BehaviorTreeNode): void {
        const displayName = node.template.displayName;

        if (displayName === '序列') {
            const composite = new SequenceNode();
            composite.abortType = (node.data.abortType as AbortType) ?? AbortType.None;
            entity.addComponent(composite);
        } else if (displayName === '选择') {
            const composite = new SelectorNode();
            composite.abortType = (node.data.abortType as AbortType) ?? AbortType.None;
            entity.addComponent(composite);
        } else if (displayName === '并行') {
            const composite = new ParallelNode();
            composite.successPolicy = node.data.successPolicy ?? 'all';
            composite.failurePolicy = node.data.failurePolicy ?? 'one';
            entity.addComponent(composite);
        } else if (displayName === '并行选择') {
            const composite = new ParallelSelectorNode();
            composite.failurePolicy = node.data.failurePolicy ?? 'one';
            entity.addComponent(composite);
        } else if (displayName === '随机序列') {
            const composite = new RandomSequenceNode();
            entity.addComponent(composite);
        } else if (displayName === '随机选择') {
            const composite = new RandomSelectorNode();
            entity.addComponent(composite);
        }
    }

    /**
     * 添加装饰器组件
     */
    private addDecoratorComponent(entity: Entity, node: BehaviorTreeNode): void {
        const displayName = node.template.displayName;

        if (displayName === '反转') {
            entity.addComponent(new InverterNode());
        } else if (displayName === '重复') {
            const decorator = new RepeaterNode();
            decorator.repeatCount = node.data.repeatCount ?? -1;
            decorator.endOnFailure = node.data.endOnFailure ?? false;
            entity.addComponent(decorator);
        } else if (displayName === '直到成功') {
            entity.addComponent(new UntilSuccessNode());
        } else if (displayName === '直到失败') {
            entity.addComponent(new UntilFailNode());
        } else if (displayName === '总是成功') {
            entity.addComponent(new AlwaysSucceedNode());
        } else if (displayName === '总是失败') {
            entity.addComponent(new AlwaysFailNode());
        } else if (displayName === '条件装饰器') {
            const decorator = new ConditionalNode();
            decorator.conditionCode = node.data.conditionCode;
            decorator.shouldReevaluate = node.data.shouldReevaluate ?? true;
            entity.addComponent(decorator);
        } else if (displayName === '冷却') {
            const decorator = new CooldownNode();
            decorator.cooldownTime = node.data.cooldownTime ?? 1.0;
            entity.addComponent(decorator);
        } else if (displayName === '超时') {
            const decorator = new TimeoutNode();
            decorator.timeoutDuration = node.data.timeoutDuration ?? 1.0;
            entity.addComponent(decorator);
        }
    }

    /**
     * 开始执行
     */
    start(): void {
        if (!this.rootEntity) {
            logger.error('未构建行为树');
            return;
        }

        this.isRunning = true;
        this.isPaused = false;
        this.executionLogs = [];
        this.lastStatuses.clear();
        this.tickCount = 0;

        this.addLog('开始执行行为树', 'info');
        this.rootEntity.addComponent(new ActiveNode());
    }

    /**
     * 暂停执行
     */
    pause(): void {
        this.isPaused = true;
    }

    /**
     * 恢复执行
     */
    resume(): void {
        this.isPaused = false;
    }

    /**
     * 停止执行
     */
    stop(): void {
        this.isRunning = false;
        this.isPaused = false;

        if (this.rootEntity) {
            this.deactivateAllNodes(this.rootEntity);
        }
    }

    /**
     * 递归停用所有节点
     */
    private deactivateAllNodes(entity: Entity): void {
        entity.removeComponentByType(ActiveNode);

        const btNode = entity.getComponent(BehaviorTreeNodeComponent);
        if (btNode) {
            btNode.reset();
        }

        entity.children.forEach((child: Entity) => this.deactivateAllNodes(child));
    }

    /**
     * 执行一帧
     */
    tick(deltaTime: number): void {
        if (!this.isRunning || this.isPaused) {
            return;
        }

        this.tickCount++;

        if (this.debugMode) {
            this.addLog(`=== Tick ${this.tickCount} ===`, 'info');
        }

        this.scene.update();

        if (this.debugMode) {
            this.logDebugSystemExecution();
        }

        this.collectExecutionStatus();
    }

    /**
     * 收集所有节点的执行状态
     */
    private collectExecutionStatus(): void {
        if (!this.callback) return;

        const statuses: ExecutionStatus[] = [];

        this.entityMap.forEach((entity, nodeId) => {
            const btNode = entity.getComponent(BehaviorTreeNodeComponent);
            if (!btNode) return;

            let status: 'running' | 'success' | 'failure' | 'idle' = 'idle';

            if (entity.hasComponent(ActiveNode)) {
                status = 'running';
            }

            if (btNode.status === TaskStatus.Success) {
                status = 'success';
            } else if (btNode.status === TaskStatus.Failure) {
                status = 'failure';
            } else if (btNode.status === TaskStatus.Running) {
                status = 'running';
            }

            // 检测状态变化并记录日志
            const lastStatus = this.lastStatuses.get(nodeId);
            if (lastStatus !== status) {
                this.onNodeStatusChanged(nodeId, entity.name, lastStatus || 'idle', status, entity);
                this.lastStatuses.set(nodeId, status);
            }

            statuses.push({
                nodeId,
                status
            });
        });

        this.callback(statuses, this.executionLogs);
    }

    /**
     * 节点状态变化时记录日志
     */
    private onNodeStatusChanged(
        nodeId: string,
        nodeName: string,
        oldStatus: string,
        newStatus: string,
        entity: Entity
    ): void {
        if (newStatus === 'running') {
            this.addLog(`[${nodeName}] 开始执行`, 'info', nodeId);
        } else if (newStatus === 'success') {
            // 检查是否是空的复合节点
            const btNode = entity.getComponent(BehaviorTreeNodeComponent);
            if (btNode && btNode.nodeType === NodeType.Composite && entity.children.length === 0) {
                this.addLog(`[${nodeName}] 执行成功（空节点，无子节点）`, 'warning', nodeId);
            } else {
                this.addLog(`[${nodeName}] 执行成功`, 'success', nodeId);
            }
        } else if (newStatus === 'failure') {
            this.addLog(`[${nodeName}] 执行失败`, 'error', nodeId);
        }
    }

    /**
     * 添加日志
     */
    private addLog(message: string, level: 'info' | 'success' | 'error' | 'warning', nodeId?: string): void {
        this.executionLogs.push({
            timestamp: Date.now(),
            message,
            level,
            nodeId
        });

        // 限制日志数量，避免内存泄漏
        if (this.executionLogs.length > 1000) {
            this.executionLogs.shift();
        }
    }

    /**
     * 获取当前tick计数
     */
    getTickCount(): number {
        return this.tickCount;
    }

    /**
     * 获取黑板变量
     */
    getBlackboardVariables(): Record<string, any> {
        if (!this.rootEntity) return {};

        const blackboard = this.rootEntity.getComponent(BlackboardComponent);
        if (!blackboard) return {};

        const variables: Record<string, any> = {};
        const names = blackboard.getVariableNames();
        names.forEach((name: string) => {
            variables[name] = blackboard.getValue(name);
        });

        return variables;
    }

    /**
     * 记录树结构的 debug 信息
     */
    private logDebugTreeStructure(): void {
        if (!this.rootEntity) return;

        this.addLog('=== 行为树结构 Debug 信息 ===', 'info');
        this.logEntityStructure(this.rootEntity, 0);
        this.addLog('=== Debug 信息结束 ===', 'info');
    }

    /**
     * 递归记录实体结构
     */
    private logEntityStructure(entity: Entity, depth: number): void {
        const indent = '  '.repeat(depth);
        const nodeId = Array.from(this.entityMap.entries()).find(([_, e]) => e === entity)?.[0] || 'unknown';
        const btNode = entity.getComponent(BehaviorTreeNodeComponent);
        const activeNode = entity.hasComponent(ActiveNode);

        let componentsList = [];
        if (btNode) {
            componentsList.push(`BehaviorTreeNode(type=${btNode.nodeType}, status=${btNode.status})`);
        }
        if (activeNode) {
            componentsList.push('ActiveNode');
        }

        const allComponents = entity.components.map(c => c.constructor.name);
        const otherComponents = allComponents.filter(name =>
            name !== 'BehaviorTreeNode' && name !== 'ActiveNode'
        );
        componentsList.push(...otherComponents);

        this.addLog(
            `${indent}[${entity.name}] (id=${nodeId}) - ${componentsList.join(', ')}`,
            'info'
        );

        if (entity.children.length > 0) {
            this.addLog(`${indent}  子节点数: ${entity.children.length}`, 'info');
            entity.children.forEach((child: Entity) => {
                this.logEntityStructure(child, depth + 1);
            });
        }
    }

    /**
     * 记录系统执行的 debug 信息
     */
    private logDebugSystemExecution(): void {
        if (!this.rootEntity) return;

        const activeEntities: Entity[] = [];
        this.entityMap.forEach((entity) => {
            if (entity.hasComponent(ActiveNode)) {
                activeEntities.push(entity);
            }
        });

        if (activeEntities.length > 0) {
            this.addLog(`活跃节点数: ${activeEntities.length}`, 'info');
            activeEntities.forEach((entity) => {
                const nodeId = Array.from(this.entityMap.entries()).find(([_, e]) => e === entity)?.[0];
                const btNode = entity.getComponent(BehaviorTreeNodeComponent);

                // 显示该节点的详细信息
                const components = entity.components.map(c => c.constructor.name).join(', ');
                this.addLog(
                    `  - [${entity.name}] status=${btNode?.status}, nodeType=${btNode?.nodeType}, children=${entity.children.length}`,
                    'info',
                    nodeId
                );
                this.addLog(`    组件: ${components}`, 'info', nodeId);

                // 显示子节点状态
                if (entity.children.length > 0) {
                    entity.children.forEach((child: Entity, index: number) => {
                        const childBtNode = child.getComponent(BehaviorTreeNodeComponent);
                        const childActive = child.hasComponent(ActiveNode);
                        this.addLog(
                            `    子节点${index}: [${child.name}] status=${childBtNode?.status}, active=${childActive}`,
                            'info',
                            nodeId
                        );
                    });
                }
            });
        }
    }

    /**
     * 清理资源
     */
    cleanup(): void {
        this.stop();
        this.entityMap.clear();
        this.propertyBindingsMap.clear();
        this.rootEntity = null;

        this.scene.destroyAllEntities();
    }

    /**
     * 销毁
     */
    destroy(): void {
        this.cleanup();
    }
}

