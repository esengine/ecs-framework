import { EntitySystem, Matcher, Entity, Time, Core, ECSSystem } from '@esengine/ecs-framework';
import { BehaviorTreeRuntimeComponent } from './BehaviorTreeRuntimeComponent';
import { BehaviorTreeAssetManager } from './BehaviorTreeAssetManager';
import { NodeExecutorRegistry, NodeExecutionContext } from './NodeExecutor';
import { BehaviorTreeData, BehaviorNodeData } from './BehaviorTreeData';
import { TaskStatus } from '../Types/TaskStatus';
import { NodeMetadataRegistry } from './NodeMetadata';
import './Executors';

/**
 * 行为树执行系统
 *
 * 统一处理所有行为树的执行
 */
@ECSSystem('BehaviorTreeExecution')
export class BehaviorTreeExecutionSystem extends EntitySystem {
    private assetManager: BehaviorTreeAssetManager;
    private executorRegistry: NodeExecutorRegistry;

    constructor() {
        super(Matcher.empty().all(BehaviorTreeRuntimeComponent));
        this.assetManager = Core.services.resolve(BehaviorTreeAssetManager);
        this.executorRegistry = new NodeExecutorRegistry();
        this.registerBuiltInExecutors();
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

            const treeData = this.assetManager.getAsset(runtime.treeAssetId);
            if (!treeData) {
                this.logger.warn(`未找到行为树资产: ${runtime.treeAssetId}`);
                continue;
            }

            // 如果标记了需要重置，先重置状态
            if (runtime.needsReset) {
                runtime.resetAllStates();
                runtime.needsReset = false;
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
