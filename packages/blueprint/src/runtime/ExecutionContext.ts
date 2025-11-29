/**
 * Execution Context - Runtime context for blueprint execution
 * 执行上下文 - 蓝图执行的运行时上下文
 */

import { BlueprintNode, BlueprintConnection } from '../types/nodes';
import { BlueprintAsset } from '../types/blueprint';

/**
 * Result of node execution
 * 节点执行的结果
 */
export interface ExecutionResult {
    /**
     * Next exec pin to follow (null to stop, undefined to continue default)
     * 下一个要执行的引脚（null 停止，undefined 继续默认）
     */
    nextExec?: string | null;

    /**
     * Output values by pin name
     * 按引脚名称的输出值
     */
    outputs?: Record<string, unknown>;

    /**
     * Whether to yield execution (for async operations)
     * 是否暂停执行（用于异步操作）
     */
    yield?: boolean;

    /**
     * Delay before continuing (in seconds)
     * 继续前的延迟（秒）
     */
    delay?: number;

    /**
     * Error message if execution failed
     * 执行失败时的错误消息
     */
    error?: string;
}

/**
 * Entity interface (minimal for decoupling)
 * 实体接口（最小化以解耦）
 */
export interface IEntity {
    id: number;
    name: string;
    active: boolean;
    getComponent<T>(type: new (...args: unknown[]) => T): T | null;
    addComponent<T>(component: T): T;
    removeComponent<T>(type: new (...args: unknown[]) => T): void;
    hasComponent<T>(type: new (...args: unknown[]) => T): boolean;
}

/**
 * Scene interface (minimal for decoupling)
 * 场景接口（最小化以解耦）
 */
export interface IScene {
    createEntity(name?: string): IEntity;
    destroyEntity(entity: IEntity): void;
    findEntityByName(name: string): IEntity | null;
    findEntitiesByTag(tag: number): IEntity[];
}

/**
 * Execution context provides access to runtime services
 * 执行上下文提供对运行时服务的访问
 */
export class ExecutionContext {
    /** Current blueprint asset (当前蓝图资产) */
    readonly blueprint: BlueprintAsset;

    /** Owner entity (所有者实体) */
    readonly entity: IEntity;

    /** Current scene (当前场景) */
    readonly scene: IScene;

    /** Frame delta time (帧增量时间) */
    deltaTime: number = 0;

    /** Total time since start (开始以来的总时间) */
    time: number = 0;

    /** Instance variables (实例变量) */
    private _instanceVariables: Map<string, unknown> = new Map();

    /** Local variables (per-execution) (局部变量，每次执行) */
    private _localVariables: Map<string, unknown> = new Map();

    /** Global variables (shared) (全局变量，共享) */
    private static _globalVariables: Map<string, unknown> = new Map();

    /** Node output cache for current execution (当前执行的节点输出缓存) */
    private _outputCache: Map<string, Record<string, unknown>> = new Map();

    /** Connection lookup by target (按目标的连接查找) */
    private _connectionsByTarget: Map<string, BlueprintConnection[]> = new Map();

    /** Connection lookup by source (按源的连接查找) */
    private _connectionsBySource: Map<string, BlueprintConnection[]> = new Map();

    constructor(blueprint: BlueprintAsset, entity: IEntity, scene: IScene) {
        this.blueprint = blueprint;
        this.entity = entity;
        this.scene = scene;

        // Initialize instance variables with defaults
        // 使用默认值初始化实例变量
        for (const variable of blueprint.variables) {
            if (variable.scope === 'instance') {
                this._instanceVariables.set(variable.name, variable.defaultValue);
            }
        }

        // Build connection lookup maps
        // 构建连接查找映射
        this._buildConnectionMaps();
    }

    private _buildConnectionMaps(): void {
        for (const conn of this.blueprint.connections) {
            // By target
            const targetKey = `${conn.toNodeId}.${conn.toPin}`;
            if (!this._connectionsByTarget.has(targetKey)) {
                this._connectionsByTarget.set(targetKey, []);
            }
            this._connectionsByTarget.get(targetKey)!.push(conn);

            // By source
            const sourceKey = `${conn.fromNodeId}.${conn.fromPin}`;
            if (!this._connectionsBySource.has(sourceKey)) {
                this._connectionsBySource.set(sourceKey, []);
            }
            this._connectionsBySource.get(sourceKey)!.push(conn);
        }
    }

    /**
     * Get a node by ID
     * 通过ID获取节点
     */
    getNode(nodeId: string): BlueprintNode | undefined {
        return this.blueprint.nodes.find(n => n.id === nodeId);
    }

    /**
     * Get connections to a target pin
     * 获取到目标引脚的连接
     */
    getConnectionsToPin(nodeId: string, pinName: string): BlueprintConnection[] {
        return this._connectionsByTarget.get(`${nodeId}.${pinName}`) ?? [];
    }

    /**
     * Get connections from a source pin
     * 获取从源引脚的连接
     */
    getConnectionsFromPin(nodeId: string, pinName: string): BlueprintConnection[] {
        return this._connectionsBySource.get(`${nodeId}.${pinName}`) ?? [];
    }

    /**
     * Evaluate an input pin value (follows connections or uses default)
     * 计算输入引脚值（跟随连接或使用默认值）
     */
    evaluateInput(nodeId: string, pinName: string, defaultValue?: unknown): unknown {
        const connections = this.getConnectionsToPin(nodeId, pinName);

        if (connections.length === 0) {
            // Use default from node data or provided default
            // 使用节点数据的默认值或提供的默认值
            const node = this.getNode(nodeId);
            return node?.data[pinName] ?? defaultValue;
        }

        // Get value from connected output
        // 从连接的输出获取值
        const conn = connections[0];
        const cachedOutputs = this._outputCache.get(conn.fromNodeId);

        if (cachedOutputs && conn.fromPin in cachedOutputs) {
            return cachedOutputs[conn.fromPin];
        }

        // Need to execute the source node first (lazy evaluation)
        // 需要先执行源节点（延迟求值）
        return defaultValue;
    }

    /**
     * Set output values for a node (cached for current execution)
     * 设置节点的输出值（为当前执行缓存）
     */
    setOutputs(nodeId: string, outputs: Record<string, unknown>): void {
        this._outputCache.set(nodeId, outputs);
    }

    /**
     * Get cached outputs for a node
     * 获取节点的缓存输出
     */
    getOutputs(nodeId: string): Record<string, unknown> | undefined {
        return this._outputCache.get(nodeId);
    }

    /**
     * Clear output cache (call at start of new execution)
     * 清除输出缓存（在新执行开始时调用）
     */
    clearOutputCache(): void {
        this._outputCache.clear();
        this._localVariables.clear();
    }

    /**
     * Get a variable value
     * 获取变量值
     */
    getVariable(name: string): unknown {
        // Check local first, then instance, then global
        // 先检查局部，然后实例，然后全局
        if (this._localVariables.has(name)) {
            return this._localVariables.get(name);
        }
        if (this._instanceVariables.has(name)) {
            return this._instanceVariables.get(name);
        }
        if (ExecutionContext._globalVariables.has(name)) {
            return ExecutionContext._globalVariables.get(name);
        }

        // Return default from variable definition
        // 返回变量定义的默认值
        const varDef = this.blueprint.variables.find(v => v.name === name);
        return varDef?.defaultValue;
    }

    /**
     * Set a variable value
     * 设置变量值
     */
    setVariable(name: string, value: unknown): void {
        const varDef = this.blueprint.variables.find(v => v.name === name);

        if (!varDef) {
            // Treat unknown variables as local
            // 将未知变量视为局部变量
            this._localVariables.set(name, value);
            return;
        }

        switch (varDef.scope) {
            case 'local':
                this._localVariables.set(name, value);
                break;
            case 'instance':
                this._instanceVariables.set(name, value);
                break;
            case 'global':
                ExecutionContext._globalVariables.set(name, value);
                break;
        }
    }

    /**
     * Get all instance variables (for serialization)
     * 获取所有实例变量（用于序列化）
     */
    getInstanceVariables(): Map<string, unknown> {
        return new Map(this._instanceVariables);
    }

    /**
     * Set instance variables (for deserialization)
     * 设置实例变量（用于反序列化）
     */
    setInstanceVariables(variables: Map<string, unknown>): void {
        this._instanceVariables = new Map(variables);
    }

    /**
     * Clear global variables (for scene reset)
     * 清除全局变量（用于场景重置）
     */
    static clearGlobalVariables(): void {
        ExecutionContext._globalVariables.clear();
    }
}
