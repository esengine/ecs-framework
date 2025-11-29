/**
 * Blueprint Virtual Machine - Executes blueprint graphs
 * 蓝图虚拟机 - 执行蓝图图
 */

import { BlueprintNode } from '../types/nodes';
import { BlueprintAsset } from '../types/blueprint';
import { ExecutionContext, ExecutionResult, IEntity, IScene } from './ExecutionContext';
import { NodeRegistry } from './NodeRegistry';

/**
 * Pending execution frame (for delayed/async execution)
 * 待处理的执行帧（用于延迟/异步执行）
 */
interface PendingExecution {
    nodeId: string;
    execPin: string;
    resumeTime: number;
}

/**
 * Event trigger types
 * 事件触发类型
 */
export type EventType =
    | 'BeginPlay'
    | 'Tick'
    | 'EndPlay'
    | 'Collision'
    | 'TriggerEnter'
    | 'TriggerExit'
    | 'Custom';

/**
 * Blueprint Virtual Machine
 * 蓝图虚拟机
 */
export class BlueprintVM {
    /** Execution context (执行上下文) */
    private _context: ExecutionContext;

    /** Pending executions (delayed nodes) (待处理的执行) */
    private _pendingExecutions: PendingExecution[] = [];

    /** Event node cache by type (按类型缓存的事件节点) */
    private _eventNodes: Map<string, BlueprintNode[]> = new Map();

    /** Whether the VM is running (VM 是否运行中) */
    private _isRunning: boolean = false;

    /** Current execution time (当前执行时间) */
    private _currentTime: number = 0;

    /** Maximum execution steps per frame (每帧最大执行步骤) */
    private _maxStepsPerFrame: number = 1000;

    /** Debug mode (调试模式) */
    debug: boolean = false;

    constructor(blueprint: BlueprintAsset, entity: IEntity, scene: IScene) {
        this._context = new ExecutionContext(blueprint, entity, scene);
        this._cacheEventNodes();
    }

    get context(): ExecutionContext {
        return this._context;
    }

    get isRunning(): boolean {
        return this._isRunning;
    }

    /**
     * Cache event nodes by type for quick lookup
     * 按类型缓存事件节点以便快速查找
     */
    private _cacheEventNodes(): void {
        for (const node of this._context.blueprint.nodes) {
            // Event nodes start with "Event"
            // 事件节点以 "Event" 开头
            if (node.type.startsWith('Event')) {
                const eventType = node.type;
                if (!this._eventNodes.has(eventType)) {
                    this._eventNodes.set(eventType, []);
                }
                this._eventNodes.get(eventType)!.push(node);
            }
        }
    }

    /**
     * Start the VM
     * 启动 VM
     */
    start(): void {
        this._isRunning = true;
        this._currentTime = 0;

        // Trigger BeginPlay event
        // 触发 BeginPlay 事件
        this.triggerEvent('EventBeginPlay');
    }

    /**
     * Stop the VM
     * 停止 VM
     */
    stop(): void {
        // Trigger EndPlay event
        // 触发 EndPlay 事件
        this.triggerEvent('EventEndPlay');

        this._isRunning = false;
        this._pendingExecutions = [];
    }

    /**
     * Pause the VM
     * 暂停 VM
     */
    pause(): void {
        this._isRunning = false;
    }

    /**
     * Resume the VM
     * 恢复 VM
     */
    resume(): void {
        this._isRunning = true;
    }

    /**
     * Update the VM (called every frame)
     * 更新 VM（每帧调用）
     */
    tick(deltaTime: number): void {
        if (!this._isRunning) return;

        this._currentTime += deltaTime;
        this._context.deltaTime = deltaTime;
        this._context.time = this._currentTime;

        // Process pending delayed executions
        // 处理待处理的延迟执行
        this._processPendingExecutions();

        // Trigger Tick event
        // 触发 Tick 事件
        this.triggerEvent('EventTick');
    }

    /**
     * Trigger an event by type
     * 按类型触发事件
     */
    triggerEvent(eventType: string, data?: Record<string, unknown>): void {
        const eventNodes = this._eventNodes.get(eventType);
        if (!eventNodes) return;

        for (const node of eventNodes) {
            this._executeFromNode(node, 'exec', data);
        }
    }

    /**
     * Trigger a custom event by name
     * 按名称触发自定义事件
     */
    triggerCustomEvent(eventName: string, data?: Record<string, unknown>): void {
        const eventNodes = this._eventNodes.get('EventCustom');
        if (!eventNodes) return;

        for (const node of eventNodes) {
            if (node.data.eventName === eventName) {
                this._executeFromNode(node, 'exec', data);
            }
        }
    }

    /**
     * Execute from a starting node
     * 从起始节点执行
     */
    private _executeFromNode(
        startNode: BlueprintNode,
        startPin: string,
        eventData?: Record<string, unknown>
    ): void {
        // Clear output cache for new execution
        // 为新执行清除输出缓存
        this._context.clearOutputCache();

        // Set event data as node outputs
        // 设置事件数据为节点输出
        if (eventData) {
            this._context.setOutputs(startNode.id, eventData);
        }

        // Follow execution chain
        // 跟随执行链
        let currentNodeId: string | null = startNode.id;
        let currentPin: string = startPin;
        let steps = 0;

        while (currentNodeId && steps < this._maxStepsPerFrame) {
            steps++;

            // Get connected nodes from current exec pin
            // 从当前执行引脚获取连接的节点
            const connections = this._context.getConnectionsFromPin(currentNodeId, currentPin);

            if (connections.length === 0) {
                // No more connections, end execution
                // 没有更多连接，结束执行
                break;
            }

            // Execute connected node
            // 执行连接的节点
            const nextConn = connections[0];
            const result = this._executeNode(nextConn.toNodeId);

            if (result.error) {
                console.error(`Blueprint error in node ${nextConn.toNodeId}: ${result.error}`);
                break;
            }

            if (result.delay && result.delay > 0) {
                // Schedule delayed execution
                // 安排延迟执行
                this._pendingExecutions.push({
                    nodeId: nextConn.toNodeId,
                    execPin: result.nextExec ?? 'exec',
                    resumeTime: this._currentTime + result.delay
                });
                break;
            }

            if (result.yield) {
                // Yield execution until next frame
                // 暂停执行直到下一帧
                break;
            }

            if (result.nextExec === null) {
                // Explicitly stop execution
                // 显式停止执行
                break;
            }

            // Continue to next node
            // 继续到下一个节点
            currentNodeId = nextConn.toNodeId;
            currentPin = result.nextExec ?? 'exec';
        }

        if (steps >= this._maxStepsPerFrame) {
            console.warn('Blueprint execution exceeded maximum steps, possible infinite loop');
        }
    }

    /**
     * Execute a single node
     * 执行单个节点
     */
    private _executeNode(nodeId: string): ExecutionResult {
        const node = this._context.getNode(nodeId);
        if (!node) {
            return { error: `Node not found: ${nodeId}` };
        }

        const executor = NodeRegistry.instance.getExecutor(node.type);
        if (!executor) {
            return { error: `No executor for node type: ${node.type}` };
        }

        try {
            if (this.debug) {
                console.log(`[Blueprint] Executing: ${node.type} (${nodeId})`);
            }

            const result = executor.execute(node, this._context);

            // Cache outputs
            // 缓存输出
            if (result.outputs) {
                this._context.setOutputs(nodeId, result.outputs);
            }

            return result;
        } catch (error) {
            return { error: `Execution error: ${error}` };
        }
    }

    /**
     * Process pending delayed executions
     * 处理待处理的延迟执行
     */
    private _processPendingExecutions(): void {
        const stillPending: PendingExecution[] = [];

        for (const pending of this._pendingExecutions) {
            if (this._currentTime >= pending.resumeTime) {
                // Resume execution
                // 恢复执行
                const node = this._context.getNode(pending.nodeId);
                if (node) {
                    this._executeFromNode(node, pending.execPin);
                }
            } else {
                stillPending.push(pending);
            }
        }

        this._pendingExecutions = stillPending;
    }

    /**
     * Get instance variables for serialization
     * 获取实例变量用于序列化
     */
    getInstanceVariables(): Map<string, unknown> {
        return this._context.getInstanceVariables();
    }

    /**
     * Set instance variables from serialization
     * 从序列化设置实例变量
     */
    setInstanceVariables(variables: Map<string, unknown>): void {
        this._context.setInstanceVariables(variables);
    }
}
