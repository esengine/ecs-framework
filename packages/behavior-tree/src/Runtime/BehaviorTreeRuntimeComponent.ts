import { Component, ECSComponent } from '@esengine/ecs-framework';
import { Serializable, Serialize, IgnoreSerialization } from '@esengine/ecs-framework';
import { NodeRuntimeState, createDefaultRuntimeState } from './BehaviorTreeData';
import { TaskStatus } from '../Types/TaskStatus';

/**
 * 行为树运行时组件
 *
 * 挂载到游戏Entity上，引用共享的BehaviorTreeData
 * 维护该Entity独立的运行时状态
 */
@ECSComponent('BehaviorTreeRuntime')
@Serializable({ version: 1 })
export class BehaviorTreeRuntimeComponent extends Component {
    /**
     * 引用的行为树资产ID（可序列化）
     */
    @Serialize()
    treeAssetId: string = '';

    /**
     * 是否自动启动
     */
    @Serialize()
    autoStart: boolean = true;

    /**
     * 是否正在运行
     */
    @IgnoreSerialization()
    isRunning: boolean = false;

    /**
     * 节点运行时状态（每个节点独立）
     * 不序列化，每次加载时重新初始化
     */
    @IgnoreSerialization()
    private nodeStates: Map<string, NodeRuntimeState> = new Map();

    /**
     * 黑板数据（该Entity独立的数据）
     * 不序列化，通过初始化设置
     */
    @IgnoreSerialization()
    private blackboard: Map<string, any> = new Map();

    /**
     * 当前激活的节点ID列表（用于调试）
     */
    @IgnoreSerialization()
    activeNodeIds: Set<string> = new Set();

    /**
     * 标记是否需要在下一个tick重置状态
     */
    @IgnoreSerialization()
    needsReset: boolean = false;

    /**
     * 获取节点运行时状态
     */
    getNodeState(nodeId: string): NodeRuntimeState {
        if (!this.nodeStates.has(nodeId)) {
            this.nodeStates.set(nodeId, createDefaultRuntimeState());
        }
        return this.nodeStates.get(nodeId)!;
    }

    /**
     * 重置节点状态
     */
    resetNodeState(nodeId: string): void {
        const state = this.getNodeState(nodeId);
        state.status = TaskStatus.Invalid;
        state.currentChildIndex = 0;
        state.startTime = undefined;
        state.lastExecutionTime = undefined;
        state.repeatCount = undefined;
        state.cachedResult = undefined;
        state.shuffledIndices = undefined;
    }

    /**
     * 重置所有节点状态
     */
    resetAllStates(): void {
        this.nodeStates.clear();
        this.activeNodeIds.clear();
    }

    /**
     * 获取黑板值
     */
    getBlackboardValue<T = any>(key: string): T | undefined {
        return this.blackboard.get(key) as T;
    }

    /**
     * 设置黑板值
     */
    setBlackboardValue(key: string, value: any): void {
        this.blackboard.set(key, value);
    }

    /**
     * 检查黑板是否有某个键
     */
    hasBlackboardKey(key: string): boolean {
        return this.blackboard.has(key);
    }

    /**
     * 初始化黑板（从树定义的默认值）
     */
    initializeBlackboard(variables?: Map<string, any>): void {
        if (variables) {
            variables.forEach((value, key) => {
                if (!this.blackboard.has(key)) {
                    this.blackboard.set(key, value);
                }
            });
        }
    }

    /**
     * 清空黑板
     */
    clearBlackboard(): void {
        this.blackboard.clear();
    }

    /**
     * 启动行为树
     */
    start(): void {
        this.isRunning = true;
        this.resetAllStates();
    }

    /**
     * 停止行为树
     */
    stop(): void {
        this.isRunning = false;
        this.activeNodeIds.clear();
    }

    /**
     * 暂停行为树
     */
    pause(): void {
        this.isRunning = false;
    }

    /**
     * 恢复行为树
     */
    resume(): void {
        this.isRunning = true;
    }
}
