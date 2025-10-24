import { EntitySystem, Matcher, Entity, Core, createLogger } from '@esengine/ecs-framework';
import { SubTreeNode } from '../Components/Composites/SubTreeNode';
import { ActiveNode } from '../Components/ActiveNode';
import { BehaviorTreeNode } from '../Components/BehaviorTreeNode';
import { TaskStatus } from '../Types/TaskStatus';
import { IAssetLoader } from '../Services/IAssetLoader';
import { FileSystemAssetLoader } from '../Services/FileSystemAssetLoader';
import { BehaviorTreeAssetLoader } from '../Serialization/BehaviorTreeAssetLoader';
import { BlackboardComponent } from '../Components/BlackboardComponent';

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
    private loadingAssets: Map<string, Promise<Entity>> = new Map();

    constructor() {
        super(Matcher.empty().all(SubTreeNode, ActiveNode, BehaviorTreeNode));
        this.updateOrder = 300;
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

        // 检查是否已有子树
        if (subTree.getSubTreeRoot()) {
            this.updateSubTree(entity, subTree, node);
            return;
        }

        // 开始加载子树
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
     * 加载并实例化子树（异步后台加载）
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

        // 检查是否正在加载
        if (this.loadingAssets.has(assetId)) {
            this.logger.debug(`子树 ${assetId} 正在加载中...`);
            node.status = TaskStatus.Running;
            return;
        }

        // 开始异步加载
        this.logger.info(`开始加载子树: ${assetId}`);
        const loadingPromise = this.loadAsset(assetId);
        this.loadingAssets.set(assetId, loadingPromise);

        // 在后台完成加载
        loadingPromise.then(subTreeRoot => {
            this.loadingAssets.delete(assetId);

            // 设置子树根实体
            subTree.setSubTreeRoot(subTreeRoot);

            // 处理黑板继承
            if (subTree.inheritParentBlackboard) {
                this.setupBlackboardInheritance(parentEntity, subTreeRoot);
            }

            this.logger.info(`子树 ${assetId} 加载成功`);

            // 激活子树执行
            this.startSubTreeExecution(subTreeRoot);
        }).catch(error => {
            this.logger.error(`加载子树 ${assetId} 失败:`, error);
            this.loadingAssets.delete(assetId);
            node.status = TaskStatus.Failure;
            this.completeNode(parentEntity);
        });

        // 保持运行状态等待加载完成
        node.status = TaskStatus.Running;
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

        // 实例化为 Entity 树
        const rootEntity = BehaviorTreeAssetLoader.instantiate(asset, this.scene);

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
    private startSubTreeExecution(subTreeRoot: Entity): void {
        // 激活根节点
        if (!subTreeRoot.hasComponent(ActiveNode)) {
            subTreeRoot.addComponent(new ActiveNode());
        }

        const node = subTreeRoot.getComponent(BehaviorTreeNode);
        if (node) {
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
        this.logger.debug(`子树完成，状态: ${TaskStatus[subTreeStatus]}`);

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

        // 完成父节点
        this.completeNode(parentEntity);
    }

    /**
     * 清理子树
     */
    private cleanupSubTree(subTree: SubTreeNode): void {
        const subTreeRoot = subTree.getSubTreeRoot();
        if (subTreeRoot) {
            // 销毁子树实体
            subTreeRoot.destroy();
            subTree.setSubTreeRoot(undefined);
        }

        subTree.reset();
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
     * 系统销毁时清理
     */
    protected override onDestroy(): void {
        this.loadingAssets.clear();
        super.onDestroy();
    }

    protected override getLoggerName(): string {
        return 'SubTreeExecutionSystem';
    }
}
