import { EntitySystem, Matcher, Entity, Core, createLogger } from '@esengine/ecs-framework';
import { SubTreeNode } from '../Components/Composites/SubTreeNode';
import { ActiveNode } from '../Components/ActiveNode';
import { BehaviorTreeNode } from '../Components/BehaviorTreeNode';
import { TaskStatus } from '../Types/TaskStatus';
import { IAssetLoader } from '../Services/IAssetLoader';
import { FileSystemAssetLoader } from '../Services/FileSystemAssetLoader';
import { BehaviorTreeAssetLoader } from '../Serialization/BehaviorTreeAssetLoader';
import { BlackboardComponent } from '../Components/BlackboardComponent';
import { LogOutput } from '../Components/LogOutput';
import { AssetLoadingManager } from '../Services/AssetLoadingManager';
import {
    LoadingState,
    LoadingTaskHandle,
    CircularDependencyError,
    EntityDestroyedError
} from '../Services/AssetLoadingTypes';
import { BehaviorTreeAssetMetadata } from '../Components/AssetMetadata';

/**
 * SubTree 执行系统
 *
 * 处理 SubTree 节点的执行，包括：
 * - 子树资产加载
 * - 子树实例化
 * - 黑板继承
 * - 子树执行和状态管理
 *
 * updateOrder: 300 (与 CompositeExecutionSystem 同级)
 */
export class SubTreeExecutionSystem extends EntitySystem {
    private assetLoader?: IAssetLoader;
    private assetLoaderInitialized = false;
    private hasLoggedMissingAssetLoader = false;
    private loadingManager: AssetLoadingManager;
    private loadingTasks: Map<number, LoadingTaskHandle> = new Map();

    constructor(loadingManager?: AssetLoadingManager) {
        super(Matcher.empty().all(SubTreeNode, ActiveNode, BehaviorTreeNode));
        this.updateOrder = 300;
        this.loadingManager = loadingManager || new AssetLoadingManager();
    }

    protected override onInitialize(): void {
        // 延迟初始化 AssetLoader，不在这里尝试获取
        // 只在第一次真正需要处理 SubTree 节点时才获取
    }

    protected override process(entities: readonly Entity[]): void {
        for (const entity of entities) {
            const subTree = entity.getComponent(SubTreeNode)!;
            const node = entity.getComponent(BehaviorTreeNode)!;

            this.executeSubTree(entity, subTree, node);
        }
    }

    /**
     * 执行子树节点
     */
    private executeSubTree(
        entity: Entity,
        subTree: SubTreeNode,
        node: BehaviorTreeNode
    ): void {
        // 验证配置
        const errors = subTree.validate();
        if (errors.length > 0) {
            this.logger.error(`SubTree 节点配置错误: ${errors.join(', ')}`);
            node.status = TaskStatus.Failure;
            this.completeNode(entity);
            return;
        }

        // 检查是否已有子树（可能是预加载的）
        const existingSubTreeRoot = subTree.getSubTreeRoot();
        if (existingSubTreeRoot) {
            const subTreeNode = existingSubTreeRoot.getComponent(BehaviorTreeNode);

            if (subTreeNode) {
                const statusName = TaskStatus[subTreeNode.status];
                const hasActive = existingSubTreeRoot.hasComponent(ActiveNode);
                this.outputLog(
                    entity,
                    `检查预加载子树 ${subTree.assetId}: status=${statusName}, hasActive=${hasActive}`,
                    'info'
                );

                // 如果子树还没开始执行（状态是 Invalid），需要激活它
                if (subTreeNode.status === TaskStatus.Invalid) {
                    this.outputLog(entity, `使用预加载的子树: ${subTree.assetId}`, 'info');

                    // 检查子节点
                    this.outputLog(entity, `激活前：子树根节点 ${existingSubTreeRoot.name} 有 ${existingSubTreeRoot.children.length} 个子节点`, 'info');
                    if (existingSubTreeRoot.children.length > 0) {
                        const firstChild = existingSubTreeRoot.children[0];
                        this.outputLog(entity, `  第一个子节点: ${firstChild.name}`, 'info');
                    }

                    // 激活根节点
                    if (!existingSubTreeRoot.hasComponent(ActiveNode)) {
                        existingSubTreeRoot.addComponent(new ActiveNode());
                        this.outputLog(entity, `为子树根节点添加 ActiveNode: ${existingSubTreeRoot.name}`, 'info');
                    }

                    const subTreeRootNode = existingSubTreeRoot.getComponent(BehaviorTreeNode);
                    if (subTreeRootNode) {
                        this.outputLog(entity, `设置子树根节点状态: ${existingSubTreeRoot.name} -> Running`, 'info');
                        subTreeRootNode.status = TaskStatus.Running;
                    }

                    // 再次检查（验证激活后子节点没有丢失）
                    this.outputLog(entity, `激活后：子树根节点 ${existingSubTreeRoot.name} 有 ${existingSubTreeRoot.children.length} 个子节点`, 'info');

                    this.outputLog(entity, `激活预加载的子树: ${subTree.assetId}`, 'info');
                    node.status = TaskStatus.Running;
                    return;
                }
            }

            // 子树已激活或已完成，更新状态
            this.updateSubTree(entity, subTree, node);
            return;
        }

        // 子树未预加载，开始运行时加载
        this.outputLog(entity, `子树未预加载，开始运行时加载: ${subTree.assetId}`, 'info');
        this.loadAndInstantiateSubTree(entity, subTree, node);
    }

    /**
     * 延迟初始化 AssetLoader
     */
    private ensureAssetLoaderInitialized(): boolean {
        if (!this.assetLoaderInitialized) {
            try {
                this.assetLoader = Core.services.resolve(FileSystemAssetLoader);
                this.assetLoaderInitialized = true;
                this.logger.debug('AssetLoader 已初始化');
            } catch (error) {
                this.assetLoaderInitialized = true;
                this.assetLoader = undefined;

                // 只在第一次失败时记录警告，避免重复日志
                if (!this.hasLoggedMissingAssetLoader) {
                    this.logger.warn(
                        'AssetLoader 未配置。SubTree 节点需要 AssetLoader 来加载子树资产。\n' +
                        '如果您在编辑器中，请确保已打开项目并配置了项目路径。\n' +
                        '如果您在运行时环境，请确保已正确注册 FileSystemAssetLoader 服务。'
                    );
                    this.hasLoggedMissingAssetLoader = true;
                }

                return false;
            }
        }

        return this.assetLoader !== undefined;
    }

    /**
     * 加载并实例化子树（使用加载管理器）
     */
    private loadAndInstantiateSubTree(
        parentEntity: Entity,
        subTree: SubTreeNode,
        node: BehaviorTreeNode
    ): void {
        // 延迟初始化 AssetLoader
        if (!this.ensureAssetLoaderInitialized()) {
            this.logger.debug('AssetLoader 不可用，SubTree 节点执行失败');
            node.status = TaskStatus.Failure;
            this.completeNode(parentEntity);
            return;
        }

        const assetId = subTree.assetId;

        // 检查是否有正在进行的加载任务
        let taskHandle = this.loadingTasks.get(parentEntity.id);

        if (taskHandle) {
            // 轮询检查状态
            const state = taskHandle.getState();

            switch (state) {
                case LoadingState.Loading:
                case LoadingState.Pending:
                    // 仍在加载中
                    node.status = TaskStatus.Running;

                    // 输出进度信息
                    const progress = taskHandle.getProgress();
                    if (progress.elapsedMs > 1000) {
                        this.logger.debug(
                            `子树加载中: ${assetId} (已耗时: ${Math.round(progress.elapsedMs / 1000)}s, ` +
                            `重试: ${progress.retryCount}/${progress.maxRetries})`
                        );
                    }
                    return;

                case LoadingState.Loaded:
                    // 加载完成
                    this.onLoadingComplete(parentEntity, subTree, node, taskHandle);
                    return;

                case LoadingState.Failed:
                case LoadingState.Timeout:
                    // 加载失败
                    const error = taskHandle.getError();
                    this.outputLog(
                        parentEntity,
                        `子树加载失败: ${assetId} - ${error?.message || '未知错误'}`,
                        'error'
                    );
                    node.status = TaskStatus.Failure;
                    this.loadingTasks.delete(parentEntity.id);
                    this.completeNode(parentEntity);
                    return;

                case LoadingState.Cancelled:
                    // 已取消（实体被销毁）
                    this.loadingTasks.delete(parentEntity.id);
                    return;
            }
        }

        // 开始新的加载任务
        this.startNewLoading(parentEntity, subTree, node);
    }

    /**
     * 开始新的加载任务
     */
    private startNewLoading(
        parentEntity: Entity,
        subTree: SubTreeNode,
        node: BehaviorTreeNode
    ): void {
        const assetId = subTree.assetId;

        // 获取父树的资产ID（用于循环检测）
        const parentAssetId = this.getParentTreeAssetId(parentEntity);

        try {
            // 使用加载管理器
            const taskHandle = this.loadingManager.startLoading(
                assetId,
                parentEntity,
                () => this.loadAsset(assetId),
                {
                    timeoutMs: 5000,
                    maxRetries: 2,
                    parentAssetId: parentAssetId
                }
            );

            this.loadingTasks.set(parentEntity.id, taskHandle);
            node.status = TaskStatus.Running;

            this.outputLog(
                parentEntity,
                `开始加载子树: ${assetId} (父树: ${parentAssetId || 'none'})`,
                'info'
            );

        } catch (error) {
            if (error instanceof CircularDependencyError) {
                this.outputLog(parentEntity, `检测到循环引用: ${error.message}`, 'error');
            } else {
                this.outputLog(parentEntity, `启动加载失败: ${assetId}`, 'error');
            }

            node.status = TaskStatus.Failure;
            this.completeNode(parentEntity);
        }
    }

    /**
     * 加载完成时的处理
     */
    private onLoadingComplete(
        parentEntity: Entity,
        subTree: SubTreeNode,
        node: BehaviorTreeNode,
        taskHandle: LoadingTaskHandle
    ): void {
        // 获取加载结果
        taskHandle.promise.then(subTreeRoot => {
            // 再次检查实体是否存在
            if (parentEntity.isDestroyed) {
                this.logger.warn(`父实体已销毁，丢弃加载结果: ${taskHandle.assetId}`);
                subTreeRoot.destroy();
                return;
            }

            // 设置子树
            subTree.setSubTreeRoot(subTreeRoot);

            // 将子树根实体设置为 SubTreeNode 的子节点，这样子树中的节点可以通过 parent 链找到主树的根节点
            parentEntity.addChild(subTreeRoot);

            // 添加资产元数据（用于循环检测）
            const metadata = subTreeRoot.addComponent(new BehaviorTreeAssetMetadata());
            metadata.initialize(taskHandle.assetId, '1.0.0');

            // 处理黑板继承
            if (subTree.inheritParentBlackboard) {
                this.setupBlackboardInheritance(parentEntity, subTreeRoot);
            }

            this.outputLog(parentEntity, `子树 ${taskHandle.assetId} 加载成功并激活`, 'info');

            // 打印子树结构（用于调试）
            this.outputLog(parentEntity, `=== 子树 ${taskHandle.assetId} 内部结构 ===`, 'info');
            this.logSubTreeStructure(parentEntity, subTreeRoot, 0);
            this.outputLog(parentEntity, `=== 子树结构结束 ===`, 'info');

            // 激活子树执行
            this.startSubTreeExecution(subTreeRoot, parentEntity);

            // 清理任务
            this.loadingTasks.delete(parentEntity.id);

        }).catch(error => {
            // 这里不应该到达，因为错误应该在状态机中处理了
            if (!(error instanceof EntityDestroyedError)) {
                this.logger.error('意外错误:', error);
            }
        });
    }

    /**
     * 加载资产
     */
    private async loadAsset(assetId: string): Promise<Entity> {
        if (!this.scene) {
            throw new Error('Scene 不存在');
        }

        // 加载资产
        const asset = await this.assetLoader!.loadBehaviorTree(assetId);

        // 实例化为 Entity 树（作为子树，跳过 RootNode）
        const rootEntity = BehaviorTreeAssetLoader.instantiate(asset, this.scene, {
            asSubTree: true
        });

        return rootEntity;
    }

    /**
     * 设置黑板继承
     */
    private setupBlackboardInheritance(parentEntity: Entity, subTreeRoot: Entity): void {
        const parentBlackboard = this.findBlackboard(parentEntity);
        if (!parentBlackboard) {
            return;
        }

        // 找到子树的黑板
        const subTreeBlackboard = subTreeRoot.getComponent(BlackboardComponent);
        if (subTreeBlackboard) {
            // 启用全局黑板查找（这样子树可以访问父树的变量）
            subTreeBlackboard.setUseGlobalBlackboard(true);
        }
    }

    /**
     * 查找黑板
     */
    private findBlackboard(entity: Entity): BlackboardComponent | undefined {
        let current: Entity | null = entity;

        while (current) {
            const blackboard = current.getComponent(BlackboardComponent);
            if (blackboard) {
                return blackboard;
            }

            current = current.parent;
        }

        return undefined;
    }

    /**
     * 开始子树执行
     */
    private startSubTreeExecution(subTreeRoot: Entity, parentEntity?: Entity): void {
        // 调试：检查子树根节点的子节点
        if (parentEntity) {
            this.outputLog(parentEntity, `子树根节点 ${subTreeRoot.name} 有 ${subTreeRoot.children.length} 个子节点`, 'info');
        }

        // 激活根节点
        if (!subTreeRoot.hasComponent(ActiveNode)) {
            subTreeRoot.addComponent(new ActiveNode());
            if (parentEntity) {
                this.outputLog(parentEntity, `为子树根节点添加 ActiveNode: ${subTreeRoot.name}`, 'info');
            }
        }

        const node = subTreeRoot.getComponent(BehaviorTreeNode);
        if (node) {
            if (parentEntity) {
                this.outputLog(parentEntity, `设置子树根节点状态: ${subTreeRoot.name} -> Running`, 'info');
            }
            node.status = TaskStatus.Running;
        }
    }

    /**
     * 更新子树状态
     */
    private updateSubTree(
        parentEntity: Entity,
        subTree: SubTreeNode,
        node: BehaviorTreeNode
    ): void {
        const subTreeRoot = subTree.getSubTreeRoot();
        if (!subTreeRoot) {
            return;
        }

        // 检查子树是否完成
        const subTreeNode = subTreeRoot.getComponent(BehaviorTreeNode);
        if (!subTreeNode) {
            return;
        }

        // 输出子树当前状态（调试）
        const statusName = TaskStatus[subTreeNode.status];
        this.outputLog(
            parentEntity,
            `子树 ${subTree.assetId} 当前状态: ${statusName}`,
            'info'
        );

        if (subTreeNode.status !== TaskStatus.Running) {
            // 子树完成
            this.onSubTreeCompleted(parentEntity, subTree, node, subTreeNode.status);
        } else {
            // 子树仍在运行
            node.status = TaskStatus.Running;
        }
    }

    /**
     * 子树完成时的处理
     */
    private onSubTreeCompleted(
        parentEntity: Entity,
        subTree: SubTreeNode,
        node: BehaviorTreeNode,
        subTreeStatus: TaskStatus
    ): void {
        this.outputLog(parentEntity, `子树完成，状态: ${TaskStatus[subTreeStatus]}`, 'info');

        // 检查完成前 SubTreeNode 的子节点
        this.outputLog(parentEntity, `完成前：SubTreeNode ${parentEntity.name} 有 ${parentEntity.children.length} 个子节点`, 'info');

        // 标记子树完成
        subTree.markSubTreeCompleted(subTreeStatus);

        // 决定父节点状态
        if (subTreeStatus === TaskStatus.Success) {
            node.status = TaskStatus.Success;
        } else if (subTreeStatus === TaskStatus.Failure) {
            if (subTree.propagateFailure) {
                node.status = TaskStatus.Failure;
            } else {
                // 忽略失败，返回成功
                node.status = TaskStatus.Success;
            }
        } else {
            node.status = subTreeStatus;
        }

        // 清理子树
        this.cleanupSubTree(subTree);

        // 检查清理后 SubTreeNode 的子节点
        this.outputLog(parentEntity, `清理后：SubTreeNode ${parentEntity.name} 有 ${parentEntity.children.length} 个子节点`, 'info');

        // 完成父节点
        this.completeNode(parentEntity);
    }

    /**
     * 清理子树
     */
    private cleanupSubTree(subTree: SubTreeNode): void {
        const subTreeRoot = subTree.getSubTreeRoot();
        if (!subTreeRoot) {
            return;
        }

        // 如果是预加载的子树，不销毁，只重置状态以便复用
        if (subTree.preload) {
            this.logger.debug(`重置预加载子树以便复用: ${subTree.assetId}`);

            // 递归重置整个子树的所有节点
            this.resetSubTreeRecursively(subTreeRoot);

            // 重置 SubTreeNode 的完成状态，但保留 subTreeRoot 引用
            subTree.resetCompletionState();
        } else {
            // 运行时加载的子树，销毁并清理
            this.logger.debug(`销毁运行时加载的子树: ${subTree.assetId}`);
            subTreeRoot.destroy();
            subTree.setSubTreeRoot(undefined);
            subTree.reset();
        }
    }

    /**
     * 递归重置子树的所有节点
     */
    private resetSubTreeRecursively(entity: Entity): void {
        // 移除 ActiveNode
        if (entity.hasComponent(ActiveNode)) {
            entity.removeComponentByType(ActiveNode);
        }

        // 重置节点状态
        const node = entity.getComponent(BehaviorTreeNode);
        if (node) {
            node.status = TaskStatus.Invalid;
        }

        // 递归处理子节点
        for (const child of entity.children) {
            this.resetSubTreeRecursively(child);
        }
    }

    /**
     * 完成节点执行
     */
    private completeNode(entity: Entity): void {
        entity.removeComponentByType(ActiveNode);

        // 通知父节点
        if (entity.parent && entity.parent.hasComponent(BehaviorTreeNode)) {
            if (!entity.parent.hasComponent(ActiveNode)) {
                entity.parent.addComponent(new ActiveNode());
            }
        }
    }

    /**
     * 获取父树的资产ID（用于循环检测）
     */
    private getParentTreeAssetId(entity: Entity): string | undefined {
        let current: Entity | null = entity;

        while (current) {
            // 查找带有资产元数据的组件
            const metadata = current.getComponent(BehaviorTreeAssetMetadata);
            if (metadata && metadata.assetId) {
                return metadata.assetId;
            }
            current = current.parent;
        }

        return undefined;
    }

    /**
     * 系统销毁时清理
     */
    protected override onDestroy(): void {
        // 取消所有正在加载的任务
        for (const taskHandle of this.loadingTasks.values()) {
            taskHandle.cancel();
        }
        this.loadingTasks.clear();

        super.onDestroy();
    }

    /**
     * 查找根实体
     */
    private findRootEntity(entity: Entity): Entity | null {
        let current: Entity | null = entity;
        while (current) {
            if (!current.parent) {
                return current;
            }
            current = current.parent;
        }
        return null;
    }

    /**
     * 统一的日志输出方法
     * 同时输出到控制台和LogOutput组件，确保用户在UI中能看到
     */
    private outputLog(
        entity: Entity,
        message: string,
        level: 'log' | 'info' | 'warn' | 'error' = 'info'
    ): void {
        // 输出到浏览器控制台（方便开发调试）
        switch (level) {
            case 'info':
                this.logger.info(message);
                break;
            case 'warn':
                this.logger.warn(message);
                break;
            case 'error':
                this.logger.error(message);
                break;
            default:
                this.logger.info(message);
                break;
        }

        // 输出到LogOutput组件（显示在UI中）
        const rootEntity = this.findRootEntity(entity);
        if (rootEntity) {
            const logOutput = rootEntity.getComponent(LogOutput);
            if (logOutput) {
                logOutput.addMessage(message, level);
            }
        }
    }

    /**
     * 递归打印子树结构（用于调试）
     */
    private logSubTreeStructure(parentEntity: Entity, entity: Entity, depth: number): void {
        const indent = '  '.repeat(depth);
        const btNode = entity.getComponent(BehaviorTreeNode);

        // 获取节点的具体类型组件
        const allComponents = entity.components.map(c => c.constructor.name);
        const nodeTypeComponent = allComponents.find(name =>
            name !== 'BehaviorTreeNode' && name !== 'ActiveNode' &&
            name !== 'BlackboardComponent' && name !== 'LogOutput' &&
            name !== 'PropertyBindings' && name !== 'BehaviorTreeAssetMetadata'
        ) || 'Unknown';

        // 构建节点显示名称
        let nodeName = entity.name;
        if (nodeTypeComponent !== 'Unknown') {
            nodeName = `${nodeName} [${nodeTypeComponent}]`;
        }

        this.outputLog(parentEntity, `${indent}└─ ${nodeName}`, 'info');

        // 递归打印子节点
        if (entity.children.length > 0) {
            this.outputLog(parentEntity, `${indent}   子节点数: ${entity.children.length}`, 'info');
            entity.children.forEach((child: Entity) => {
                this.logSubTreeStructure(parentEntity, child, depth + 1);
            });
        }
    }

    protected override getLoggerName(): string {
        return 'SubTreeExecutionSystem';
    }
}
