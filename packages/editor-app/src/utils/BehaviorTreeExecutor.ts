import { World, Entity, Scene, createLogger, Time, Core } from '@esengine/ecs-framework';
import {
    BehaviorTreeData,
    BehaviorNodeData,
    BehaviorTreeRuntimeComponent,
    BehaviorTreeAssetManager,
    BehaviorTreeExecutionSystem,
    TaskStatus,
    NodeType
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

export type ExecutionCallback = (
    statuses: ExecutionStatus[],
    logs: ExecutionLog[],
    blackboardVariables?: Record<string, any>
) => void;

/**
 * 行为树执行器
 *
 * 使用新的Runtime架构执行行为树
 */
export class BehaviorTreeExecutor {
    private world: World;
    private scene: Scene;
    private entity: Entity | null = null;
    private runtime: BehaviorTreeRuntimeComponent | null = null;
    private treeData: BehaviorTreeData | null = null;
    private callback: ExecutionCallback | null = null;
    private isRunning = false;
    private isPaused = false;
    private executionLogs: ExecutionLog[] = [];
    private lastStatuses: Map<string, 'running' | 'success' | 'failure' | 'idle'> = new Map();
    private tickCount = 0;
    private nodeIdMap: Map<string, string> = new Map();
    private blackboardKeys: string[] = [];

    private assetManager: BehaviorTreeAssetManager;
    private executionSystem: BehaviorTreeExecutionSystem;

    constructor() {
        this.world = new World({ name: 'BehaviorTreeWorld' });
        this.scene = this.world.createScene('BehaviorTreeScene');

        // 尝试获取已存在的 assetManager，如果不存在则创建新的
        try {
            this.assetManager = Core.services.resolve(BehaviorTreeAssetManager);
        } catch {
            this.assetManager = new BehaviorTreeAssetManager();
            Core.services.registerInstance(BehaviorTreeAssetManager, this.assetManager);
        }

        this.executionSystem = new BehaviorTreeExecutionSystem();
        this.scene.addSystem(this.executionSystem);
    }

    /**
     * 从编辑器节点构建行为树数据
     */
    buildTree(
        nodes: BehaviorTreeNode[],
        rootNodeId: string,
        blackboard: Record<string, any>,
        connections: Array<{ from: string; to: string; fromProperty?: string; toProperty?: string; connectionType: 'node' | 'property' }>,
        callback: ExecutionCallback,
        projectPath?: string | null
    ): void {
        this.cleanup();
        this.callback = callback;

        this.treeData = this.convertToTreeData(nodes, rootNodeId, blackboard, connections);

        this.assetManager.loadAsset(this.treeData);

        this.entity = this.scene.createEntity('BehaviorTreeEntity');
        this.runtime = new BehaviorTreeRuntimeComponent();

        // 在添加组件之前设置资产ID和autoStart
        this.runtime.treeAssetId = this.treeData.id;
        this.runtime.autoStart = false;

        this.entity.addComponent(this.runtime);

        if (this.treeData.blackboardVariables) {
            this.blackboardKeys = Array.from(this.treeData.blackboardVariables.keys());
            for (const [key, value] of this.treeData.blackboardVariables.entries()) {
                this.runtime.setBlackboardValue(key, value);
            }
        } else {
            this.blackboardKeys = [];
        }

        this.addLog('行为树构建完成', 'info');
    }

    /**
     * 将编辑器节点转换为BehaviorTreeData
     */
    private convertToTreeData(
        nodes: BehaviorTreeNode[],
        rootNodeId: string,
        blackboard: Record<string, any>,
        connections: Array<{ from: string; to: string; fromProperty?: string; toProperty?: string; connectionType: 'node' | 'property' }>
    ): BehaviorTreeData {
        const rootNode = nodes.find((n) => n.id === rootNodeId);
        if (!rootNode) {
            throw new Error('未找到根节点');
        }

        // 如果根节点是编辑器特有的"根节点"且只有一个子节点，使用第一个子节点作为实际根节点
        let actualRootId = rootNodeId;
        if (rootNode.template.displayName === '根节点' && rootNode.children.length === 1) {
            actualRootId = rootNode.children[0]!;
        }

        const treeData: BehaviorTreeData = {
            id: `tree_${Date.now()}`,
            name: 'EditorTree',
            rootNodeId: actualRootId,
            nodes: new Map(),
            blackboardVariables: new Map()
        };

        this.nodeIdMap.clear();

        for (const node of nodes) {
            // 跳过编辑器的虚拟根节点
            if (node.id === rootNodeId && node.template.displayName === '根节点' && rootNode.children.length === 1) {
                continue;
            }

            this.nodeIdMap.set(node.id, node.id);

            const nodeData: BehaviorNodeData = {
                id: node.id,
                name: node.template.displayName,
                nodeType: this.convertNodeType(node.template.type),
                implementationType: node.template.className || this.getImplementationType(node.template.displayName, node.template.type),
                config: { ...node.data },
                children: Array.from(node.children)
            };

            treeData.nodes.set(node.id, nodeData);
        }

        // 处理属性连接，转换为 bindings
        for (const conn of connections) {
            if (conn.connectionType === 'property' && conn.toProperty) {
                const targetNodeData = treeData.nodes.get(conn.to);
                const sourceNode = nodes.find((n) => n.id === conn.from);

                if (targetNodeData && sourceNode) {
                    // 检查源节点是否是黑板变量节点
                    if (sourceNode.data.nodeType === 'blackboard-variable') {
                        // 从黑板变量节点获取实际的变量名
                        const variableName = sourceNode.data.variableName as string;

                        if (variableName) {
                            // 初始化 bindings 如果不存在
                            if (!targetNodeData.bindings) {
                                targetNodeData.bindings = {};
                            }

                            // 添加绑定：属性名 -> 黑板变量名
                            targetNodeData.bindings[conn.toProperty] = variableName;
                        }
                    }
                }
            }
        }

        for (const [key, value] of Object.entries(blackboard)) {
            treeData.blackboardVariables!.set(key, value);
        }

        return treeData;
    }

    /**
     * 转换节点类型
     */
    private convertNodeType(type: string): NodeType {
        if (type === NodeType.Composite) return NodeType.Composite;
        if (type === NodeType.Decorator) return NodeType.Decorator;
        if (type === NodeType.Action) return NodeType.Action;
        if (type === NodeType.Condition) return NodeType.Condition;
        return NodeType.Action;
    }

    /**
     * 根据显示名称获取实现类型
     */
    private getImplementationType(displayName: string, nodeType: string): string {
        const typeMap: Record<string, string> = {
            '序列': 'Sequence',
            '选择': 'Selector',
            '并行': 'Parallel',
            '并行选择': 'ParallelSelector',
            '随机序列': 'RandomSequence',
            '随机选择': 'RandomSelector',
            '反转': 'Inverter',
            '重复': 'Repeater',
            '直到成功': 'UntilSuccess',
            '直到失败': 'UntilFail',
            '总是成功': 'AlwaysSucceed',
            '总是失败': 'AlwaysFail',
            '条件装饰器': 'Conditional',
            '冷却': 'Cooldown',
            '超时': 'Timeout',
            '等待': 'Wait',
            '日志': 'Log',
            '设置变量': 'SetBlackboardValue',
            '修改变量': 'ModifyBlackboardValue',
            '自定义动作': 'ExecuteAction',
            '比较变量': 'BlackboardCompare',
            '变量存在': 'BlackboardExists',
            '随机概率': 'RandomProbability',
            '执行条件': 'ExecuteCondition'
        };

        return typeMap[displayName] || displayName;
    }

    /**
     * 开始执行
     */
    start(): void {
        if (!this.runtime || !this.treeData) {
            logger.error('未构建行为树');
            return;
        }

        this.isRunning = true;
        this.isPaused = false;
        this.executionLogs = [];
        this.lastStatuses.clear();
        this.tickCount = 0;

        this.runtime.resetAllStates();
        this.runtime.isRunning = true;

        this.addLog('开始执行行为树', 'info');
    }

    /**
     * 暂停执行
     */
    pause(): void {
        this.isPaused = true;
        if (this.runtime) {
            this.runtime.isRunning = false;
        }
    }

    /**
     * 恢复执行
     */
    resume(): void {
        this.isPaused = false;
        if (this.runtime) {
            this.runtime.isRunning = true;
        }
    }

    /**
     * 停止执行
     */
    stop(): void {
        this.isRunning = false;
        this.isPaused = false;

        if (this.runtime) {
            this.runtime.isRunning = false;
            this.runtime.resetAllStates();
        }

        this.addLog('行为树已停止', 'info');
    }

    /**
     * 执行一帧
     */
    tick(deltaTime: number): void {
        if (!this.isRunning || this.isPaused || !this.runtime) {
            return;
        }

        Time.update(deltaTime);
        this.tickCount++;

        this.scene.update();
        this.collectExecutionStatus();
    }

    /**
     * 收集所有节点的执行状态
     */
    private collectExecutionStatus(): void {
        if (!this.callback || !this.runtime || !this.treeData) return;

        const statuses: ExecutionStatus[] = [];

        for (const [nodeId, nodeData] of this.treeData.nodes.entries()) {
            const state = this.runtime.getNodeState(nodeId);

            let status: 'running' | 'success' | 'failure' | 'idle' = 'idle';

            if (state) {
                switch (state.status) {
                    case TaskStatus.Success:
                        status = 'success';
                        break;
                    case TaskStatus.Failure:
                        status = 'failure';
                        break;
                    case TaskStatus.Running:
                        status = 'running';
                        break;
                    default:
                        status = 'idle';
                }
            }

            const lastStatus = this.lastStatuses.get(nodeId);
            if (lastStatus !== status) {
                this.onNodeStatusChanged(nodeId, nodeData.name, lastStatus || 'idle', status);
                this.lastStatuses.set(nodeId, status);
            }

            statuses.push({
                nodeId,
                status
            });
        }

        const currentBlackboardVars = this.getBlackboardVariables();
        this.callback(statuses, this.executionLogs, currentBlackboardVars);
    }

    /**
     * 节点状态变化时记录日志
     */
    private onNodeStatusChanged(
        nodeId: string,
        nodeName: string,
        oldStatus: string,
        newStatus: string
    ): void {
        if (newStatus === 'running') {
            this.addLog(`[${nodeName}](${nodeId}) 开始执行`, 'info', nodeId);
        } else if (newStatus === 'success') {
            this.addLog(`[${nodeName}](${nodeId}) 执行成功`, 'success', nodeId);
        } else if (newStatus === 'failure') {
            this.addLog(`[${nodeName}](${nodeId}) 执行失败`, 'error', nodeId);
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
        if (!this.runtime) return {};

        const variables: Record<string, any> = {};

        for (const name of this.blackboardKeys) {
            variables[name] = this.runtime.getBlackboardValue(name);
        }

        return variables;
    }

    /**
     * 更新黑板变量
     */
    updateBlackboardVariable(key: string, value: any): void {
        if (!this.runtime) {
            logger.warn('无法更新黑板变量：未构建行为树');
            return;
        }

        this.runtime.setBlackboardValue(key, value);
        logger.info(`黑板变量已更新: ${key} = ${JSON.stringify(value)}`);
    }

    /**
     * 清理资源
     */
    cleanup(): void {
        this.stop();
        this.nodeIdMap.clear();
        this.lastStatuses.clear();
        this.blackboardKeys = [];

        if (this.entity) {
            this.entity.destroy();
            this.entity = null;
        }

        // 卸载旧的行为树资产
        if (this.treeData) {
            this.assetManager.unloadAsset(this.treeData.id);
        }

        this.runtime = null;
        this.treeData = null;
    }

    /**
     * 检查节点的执行器是否存在
     */
    hasExecutor(implementationType: string): boolean {
        const registry = this.executionSystem.getExecutorRegistry();
        return registry.has(implementationType);
    }

    /**
     * 销毁
     */
    destroy(): void {
        this.cleanup();
    }
}
