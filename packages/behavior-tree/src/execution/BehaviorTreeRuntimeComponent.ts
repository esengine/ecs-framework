import { Component, ECSComponent, Property } from '@esengine/ecs-framework';
import { Serializable, Serialize, IgnoreSerialization } from '@esengine/ecs-framework';
import { NodeRuntimeState, createDefaultRuntimeState } from './BehaviorTreeData';
import { TaskStatus } from '../Types/TaskStatus';

/**
 * 黑板变化监听器
 */
export type BlackboardChangeListener = (key: string, newValue: any, oldValue: any) => void;

/**
 * 黑板观察者信息
 */
interface BlackboardObserver {
    nodeId: string;
    keys: Set<string>;
    callback: BlackboardChangeListener;
}

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
    @Property({ type: 'asset', label: 'Behavior Tree', extensions: ['.btree'] })
    treeAssetId: string = '';

    /**
     * 是否自动启动
     */
    @Serialize()
    @Property({ type: 'boolean', label: 'Auto Start' })
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
     * 黑板观察者列表
     */
    @IgnoreSerialization()
    private blackboardObservers: Map<string, BlackboardObserver[]> = new Map();

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
     * 需要中止的节点ID列表
     */
    @IgnoreSerialization()
    nodesToAbort: Set<string> = new Set();

    /**
     * 执行顺序计数器（用于调试和可视化）
     */
    @IgnoreSerialization()
    executionOrderCounter: number = 0;

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
        delete state.startTime;
        delete state.lastExecutionTime;
        delete state.repeatCount;
        delete state.cachedResult;
        delete state.shuffledIndices;
        delete state.isAborted;
        delete state.lastConditionResult;
        delete state.observedKeys;
    }

    /**
     * 重置所有节点状态
     */
    resetAllStates(): void {
        this.nodeStates.clear();
        this.activeNodeIds.clear();
        this.executionOrderCounter = 0;
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
        const oldValue = this.blackboard.get(key);
        this.blackboard.set(key, value);

        if (oldValue !== value) {
            this.notifyBlackboardChange(key, value, oldValue);
        }
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

    /**
     * 注册黑板观察者
     */
    observeBlackboard(nodeId: string, keys: string[], callback: BlackboardChangeListener): void {
        const observer: BlackboardObserver = {
            nodeId,
            keys: new Set(keys),
            callback
        };

        for (const key of keys) {
            if (!this.blackboardObservers.has(key)) {
                this.blackboardObservers.set(key, []);
            }
            this.blackboardObservers.get(key)!.push(observer);
        }
    }

    /**
     * 取消注册黑板观察者
     */
    unobserveBlackboard(nodeId: string): void {
        for (const observers of this.blackboardObservers.values()) {
            const index = observers.findIndex((o) => o.nodeId === nodeId);
            if (index !== -1) {
                observers.splice(index, 1);
            }
        }
    }

    /**
     * 通知黑板变化
     */
    private notifyBlackboardChange(key: string, newValue: any, oldValue: any): void {
        const observers = this.blackboardObservers.get(key);
        if (!observers) return;

        for (const observer of observers) {
            try {
                observer.callback(key, newValue, oldValue);
            } catch (error) {
                console.error(`黑板观察者回调错误 (节点: ${observer.nodeId}):`, error);
            }
        }
    }

    /**
     * 请求中止节点
     */
    requestAbort(nodeId: string): void {
        this.nodesToAbort.add(nodeId);
    }

    /**
     * 检查节点是否需要中止
     */
    shouldAbort(nodeId: string): boolean {
        return this.nodesToAbort.has(nodeId);
    }

    /**
     * 清除中止请求
     */
    clearAbortRequest(nodeId: string): void {
        this.nodesToAbort.delete(nodeId);
    }

    /**
     * 清除所有中止请求
     */
    clearAllAbortRequests(): void {
        this.nodesToAbort.clear();
    }
}
