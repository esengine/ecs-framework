import { EntitySystem, Matcher, Entity, Time, Core, ECSSystem, ServiceContainer } from '@esengine/ecs-framework';
import type { IAssetManager } from '@esengine/asset-system';
import { BehaviorTreeRuntimeComponent } from './BehaviorTreeRuntimeComponent';
import { BehaviorTreeAssetManager } from './BehaviorTreeAssetManager';
import { NodeExecutorRegistry, NodeExecutionContext } from './NodeExecutor';
import { BehaviorTreeData, BehaviorNodeData } from './BehaviorTreeData';
import { TaskStatus } from '../Types/TaskStatus';
import { NodeMetadataRegistry } from './NodeMetadata';
import type { IBehaviorTreeAsset } from '../loaders/BehaviorTreeLoader';
import './Executors';

/**
 * 行为树执行系统
 *
 * 统一处理所有行为树的执行
 */
@ECSSystem('BehaviorTreeExecution')
export class BehaviorTreeExecutionSystem extends EntitySystem {
    private btAssetManager: BehaviorTreeAssetManager | null = null;
    private executorRegistry: NodeExecutorRegistry;
    private _services: ServiceContainer | null = null;

    /** 引用 asset-system 的 AssetManager（由 BehaviorTreeRuntimeModule 设置） */
    private _assetManager: IAssetManager | null = null;

    /** 已警告过的缺失资产，避免重复警告 */
    private _warnedMissingAssets: Set<string> = new Set();

    constructor(services?: ServiceContainer) {
        super(Matcher.empty().all(BehaviorTreeRuntimeComponent));
        this._services = services || null;
        this.executorRegistry = new NodeExecutorRegistry();
        this.registerBuiltInExecutors();
    }

    /**
     * 设置 AssetManager 引用
     * Set AssetManager reference
     */
    setAssetManager(assetManager: IAssetManager | null): void {
        this._assetManager = assetManager;
    }

    /**
     * 启动所有 autoStart 的行为树（用于预览模式）
     * Start all autoStart behavior trees (for preview mode)
     *
     * 由于编辑器模式下系统默认禁用，实体添加时 onAdded 不会处理自动启动。
     * 预览开始时需要手动调用此方法来启动所有需要自动启动的行为树。
     */
    startAllAutoStartTrees(): void {
        if (!this.scene) {
            this.logger.warn('Scene not available, cannot start auto-start trees');
            return;
        }

        const entities = this.scene.entities.findEntitiesWithComponent(BehaviorTreeRuntimeComponent);
        for (const entity of entities) {
            const runtime = entity.getComponent(BehaviorTreeRuntimeComponent);
            if (runtime && runtime.autoStart && runtime.treeAssetId && !runtime.isRunning) {
                this.ensureAssetLoaded(runtime.treeAssetId).then(() => {
                    if (runtime && runtime.autoStart && !runtime.isRunning) {
                        runtime.start();
                        this.logger.debug(`Auto-started behavior tree for entity: ${entity.name}`);
                    }
                }).catch(e => {
                    this.logger.error(`Failed to load behavior tree for entity ${entity.name}:`, e);
                });
            }
        }
    }

    /**
     * 当实体添加到系统时，处理自动启动
     * Handle auto-start when entity is added to system
     */
    protected override onAdded(entity: Entity): void {
        // 只有在系统启用时才自动启动
        // Only auto-start when system is enabled
        if (!this.enabled) return;

        const runtime = entity.getComponent(BehaviorTreeRuntimeComponent);
        if (runtime && runtime.autoStart && runtime.treeAssetId && !runtime.isRunning) {
            // 先尝试加载资产（如果是文件路径）
            this.ensureAssetLoaded(runtime.treeAssetId).then(() => {
                // 检查实体是否仍然有效
                if (runtime && runtime.autoStart && !runtime.isRunning) {
                    runtime.start();
                    this.logger.debug(`Auto-started behavior tree for entity: ${entity.name}`);
                }
            }).catch(e => {
                this.logger.error(`Failed to load behavior tree for entity ${entity.name}:`, e);
            });
        }
    }

    /**
     * 确保行为树资产已加载
     * Ensure behavior tree asset is loaded
     */
    private async ensureAssetLoaded(assetIdOrPath: string): Promise<void> {
        const btAssetManager = this.getBTAssetManager();

        // 如果资产已存在，直接返回
        if (btAssetManager.hasAsset(assetIdOrPath)) {
            return;
        }

        // 使用 AssetManager 加载（必须通过 setAssetManager 设置）
        // Use AssetManager (must be set via setAssetManager)
        if (!this._assetManager) {
            this.logger.warn(`AssetManager not set, cannot load: ${assetIdOrPath}`);
            return;
        }

        try {
            const result = await this._assetManager.loadAssetByPath(assetIdOrPath);
            if (result && result.asset) {
                this.logger.debug(`Behavior tree loaded via AssetManager: ${assetIdOrPath}`);
            }
        } catch (e) {
            this.logger.warn(`Failed to load via AssetManager: ${assetIdOrPath}`, e);
        }
    }

    private getBTAssetManager(): BehaviorTreeAssetManager {
        if (!this.btAssetManager) {
            // 优先使用传入的 services，否则回退到全局 Core.services
            // Prefer passed services, fallback to global Core.services
            const services = this._services || Core.services;
            if (!services) {
                throw new Error('ServiceContainer is not available. Ensure Core.create() was called.');
            }
            this.btAssetManager = services.resolve(BehaviorTreeAssetManager);
        }
        return this.btAssetManager;
    }

    /**
     * 获取行为树数据
     * Get behavior tree data from AssetManager or BehaviorTreeAssetManager
     *
     * 优先从 AssetManager 获取（新方式），如果没有再从 BehaviorTreeAssetManager 获取（兼容旧方式）
     */
    private getTreeData(assetIdOrPath: string): BehaviorTreeData | undefined {
        // 1. 优先从 AssetManager 获取（如果已加载）
        // First try AssetManager (preferred way)
        if (this._assetManager) {
            const cachedAsset = this._assetManager.getAssetByPath<IBehaviorTreeAsset>(assetIdOrPath);
            if (cachedAsset?.data) {
                return cachedAsset.data;
            }
        }

        // 2. 回退到 BehaviorTreeAssetManager（兼容旧方式）
        // Fallback to BehaviorTreeAssetManager (legacy support)
        return this.getBTAssetManager().getAsset(assetIdOrPath);
    }

    /**
     * 注册所有执行器（包括内置和插件提供的）
     */
    private registerBuiltInExecutors(): void {
        const constructors = NodeMetadataRegistry.getAllExecutorConstructors();

        for (const [implementationType, ExecutorClass] of constructors) {
            try {
                const instance = new ExecutorClass();
                this.executorRegistry.register(implementationType, instance);
            } catch (error) {
                this.logger.error(`注册执行器失败: ${implementationType}`, error);
            }
        }
    }

    /**
     * 获取执行器注册表
     */
    getExecutorRegistry(): NodeExecutorRegistry {
        return this.executorRegistry;
    }

    protected override process(entities: readonly Entity[]): void {
        for (const entity of entities) {
            const runtime = entity.getComponent(BehaviorTreeRuntimeComponent)!;

            if (!runtime.isRunning) {
                continue;
            }

            const treeData = this.getTreeData(runtime.treeAssetId);
            if (!treeData) {
                // 只警告一次，避免每帧重复输出
                // Only warn once to avoid repeated output every frame
                if (!this._warnedMissingAssets.has(runtime.treeAssetId)) {
                    this._warnedMissingAssets.add(runtime.treeAssetId);
                    this.logger.warn(`未找到行为树资产: ${runtime.treeAssetId}`);
                }
                continue;
            }

            // 如果标记了需要重置，先重置状态
            if (runtime.needsReset) {
                runtime.resetAllStates();
                runtime.needsReset = false;
            }

            // 初始化黑板变量（如果行为树定义了默认值）
            // Initialize blackboard variables from tree definition
            if (treeData.blackboardVariables && treeData.blackboardVariables.size > 0) {
                runtime.initializeBlackboard(treeData.blackboardVariables);
            }

            this.executeTree(entity, runtime, treeData);
        }
    }

    /**
     * 执行整个行为树
     */
    private executeTree(
        entity: Entity,
        runtime: BehaviorTreeRuntimeComponent,
        treeData: BehaviorTreeData
    ): void {
        const rootNode = treeData.nodes.get(treeData.rootNodeId);
        if (!rootNode) {
            this.logger.error(`未找到根节点: ${treeData.rootNodeId}`);
            return;
        }

        const status = this.executeNode(entity, runtime, rootNode, treeData);

        // 如果树完成了，标记在下一个tick时重置状态
        // 这样UI可以看到节点的最终状态
        if (status !== TaskStatus.Running) {
            runtime.needsReset = true;
        } else {
            runtime.needsReset = false;
        }
    }

    /**
     * 执行单个节点
     */
    private executeNode(
        entity: Entity,
        runtime: BehaviorTreeRuntimeComponent,
        nodeData: BehaviorNodeData,
        treeData: BehaviorTreeData
    ): TaskStatus {
        const state = runtime.getNodeState(nodeData.id);

        if (runtime.shouldAbort(nodeData.id)) {
            runtime.clearAbortRequest(nodeData.id);
            state.isAborted = true;

            const executor = this.executorRegistry.get(nodeData.implementationType);
            if (executor && executor.reset) {
                const context = this.createContext(entity, runtime, nodeData, treeData);
                executor.reset(context);
            }

            runtime.activeNodeIds.delete(nodeData.id);
            state.status = TaskStatus.Failure;
            return TaskStatus.Failure;
        }

        runtime.activeNodeIds.add(nodeData.id);
        state.isAborted = false;

        if (state.executionOrder === undefined) {
            runtime.executionOrderCounter++;
            state.executionOrder = runtime.executionOrderCounter;
        }

        const executor = this.executorRegistry.get(nodeData.implementationType);
        if (!executor) {
            this.logger.error(`未找到执行器: ${nodeData.implementationType}`);
            state.status = TaskStatus.Failure;
            return TaskStatus.Failure;
        }

        const context = this.createContext(entity, runtime, nodeData, treeData);

        try {
            const status = executor.execute(context);
            state.status = status;

            if (status !== TaskStatus.Running) {
                runtime.activeNodeIds.delete(nodeData.id);

                if (executor.reset) {
                    executor.reset(context);
                }
            }

            return status;
        } catch (error) {
            this.logger.error(`执行节点时发生错误: ${nodeData.name}`, error);
            state.status = TaskStatus.Failure;
            runtime.activeNodeIds.delete(nodeData.id);
            return TaskStatus.Failure;
        }
    }

    /**
     * 创建执行上下文
     */
    private createContext(
        entity: Entity,
        runtime: BehaviorTreeRuntimeComponent,
        nodeData: BehaviorNodeData,
        treeData: BehaviorTreeData
    ): NodeExecutionContext {
        return {
            entity,
            nodeData,
            state: runtime.getNodeState(nodeData.id),
            runtime,
            treeData,
            deltaTime: Time.deltaTime,
            totalTime: Time.totalTime,
            executeChild: (childId: string) => {
                const childData = treeData.nodes.get(childId);
                if (!childData) {
                    this.logger.warn(`未找到子节点: ${childId}`);
                    return TaskStatus.Failure;
                }
                return this.executeNode(entity, runtime, childData, treeData);
            }
        };
    }

    /**
     * 执行子节点列表
     */
    executeChildren(
        context: NodeExecutionContext,
        childIndices?: number[]
    ): TaskStatus[] {
        const { nodeData, treeData, entity, runtime } = context;

        if (!nodeData.children || nodeData.children.length === 0) {
            return [];
        }

        const results: TaskStatus[] = [];
        const indicesToExecute = childIndices ||
            Array.from({ length: nodeData.children.length }, (_, i) => i);

        for (const index of indicesToExecute) {
            if (index >= nodeData.children.length) {
                continue;
            }

            const childId = nodeData.children[index]!;
            const childData = treeData.nodes.get(childId);

            if (!childData) {
                this.logger.warn(`未找到子节点: ${childId}`);
                results.push(TaskStatus.Failure);
                continue;
            }

            const status = this.executeNode(entity, runtime, childData, treeData);
            results.push(status);
        }

        return results;
    }
}
