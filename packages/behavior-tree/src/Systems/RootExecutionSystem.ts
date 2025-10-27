import { EntitySystem, Matcher, Entity, Core } from '@esengine/ecs-framework';
import { BehaviorTreeNode } from '../Components/BehaviorTreeNode';
import { RootNode } from '../Components/Composites/RootNode';
import { ActiveNode } from '../Components/ActiveNode';
import { TaskStatus, NodeType } from '../Types/TaskStatus';
import { SubTreeNode } from '../Components/Composites/SubTreeNode';
import { LogOutput } from '../Components/LogOutput';
import { FileSystemAssetLoader } from '../Services/FileSystemAssetLoader';
import { BehaviorTreeAssetLoader } from '../Serialization/BehaviorTreeAssetLoader';
import { BehaviorTreeAssetMetadata } from '../Components/AssetMetadata';
import { BlackboardComponent } from '../Components/BlackboardComponent';

/**
 * 预加载状态
 */
enum PreloadState {
    /** 未开始预加载 */
    NotStarted,
    /** 正在预加载 */
    Loading,
    /** 预加载完成 */
    Completed,
    /** 预加载失败 */
    Failed
}

/**
 * 根节点执行系统
 *
 * 专门处理根节点的执行逻辑
 * 根节点的职责：
 * 1. 扫描并预加载所有标记为 preload=true 的子树
 * 2. 激活第一个子节点，并根据子节点的状态来设置自己的状态
 *
 * updateOrder: 350 (在所有其他执行系统之后)
 */
export class RootExecutionSystem extends EntitySystem {
    /** 跟踪每个根节点的预加载状态 */
    private preloadStates: Map<number, PreloadState> = new Map();

    /** 跟踪预加载任务 */
    private preloadTasks: Map<number, Promise<void>> = new Map();

    /** AssetLoader 实例 */
    private assetLoader?: FileSystemAssetLoader;

    constructor() {
        super(Matcher.empty().all(BehaviorTreeNode, ActiveNode));
        this.updateOrder = 350;
    }

    protected override process(entities: readonly Entity[]): void {
        for (const entity of entities) {
            const node = entity.getComponent(BehaviorTreeNode)!;

            // 只处理根节点
            if (node.nodeType !== NodeType.Composite) {
                continue;
            }

            // 检查是否是根节点
            if (!entity.hasComponent(RootNode)) {
                continue;
            }

            this.executeRoot(entity, node);
        }
    }

    /**
     * 执行根节点逻辑
     */
    private executeRoot(entity: Entity, node: BehaviorTreeNode): void {
        // 检查预加载状态
        const preloadState = this.preloadStates.get(entity.id) || PreloadState.NotStarted;

        if (preloadState === PreloadState.NotStarted) {
            // 开始预加载
            this.startPreload(entity, node);
            return;
        } else if (preloadState === PreloadState.Loading) {
            // 正在预加载，等待
            node.status = TaskStatus.Running;
            return;
        } else if (preloadState === PreloadState.Failed) {
            // 预加载失败，标记为失败
            node.status = TaskStatus.Failure;
            entity.removeComponentByType(ActiveNode);
            return;
        }

        // 预加载完成，执行正常逻辑
        const children = entity.children;

        // 如果没有子节点，标记为成功
        if (children.length === 0) {
            node.status = TaskStatus.Success;
            return;
        }

        // 获取第一个子节点
        const firstChild = children[0];
        const childNode = firstChild.getComponent(BehaviorTreeNode);

        if (!childNode) {
            node.status = TaskStatus.Failure;
            return;
        }

        // 激活第一个子节点（如果还没激活）
        if (!firstChild.hasComponent(ActiveNode)) {
            firstChild.addComponent(new ActiveNode());
            node.status = TaskStatus.Running;
            return;
        }

        // 根据第一个子节点的状态来设置根节点的状态
        if (childNode.status === TaskStatus.Running) {
            node.status = TaskStatus.Running;
        } else if (childNode.status === TaskStatus.Success) {
            node.status = TaskStatus.Success;
            // 移除根节点的 ActiveNode，结束整个行为树
            entity.removeComponentByType(ActiveNode);
        } else if (childNode.status === TaskStatus.Failure) {
            node.status = TaskStatus.Failure;
            // 移除根节点的 ActiveNode，结束整个行为树
            entity.removeComponentByType(ActiveNode);
        }
    }

    /**
     * 开始预加载子树
     */
    private startPreload(rootEntity: Entity, node: BehaviorTreeNode): void {
        // 扫描所有需要预加载的子树节点
        const subTreeNodesToPreload = this.scanSubTreeNodes(rootEntity);

        if (subTreeNodesToPreload.length === 0) {
            // 没有需要预加载的子树，直接标记为完成
            this.preloadStates.set(rootEntity.id, PreloadState.Completed);
            this.outputLog(rootEntity, '没有需要预加载的子树', 'info');
            return;
        }

        // 标记为正在加载
        this.preloadStates.set(rootEntity.id, PreloadState.Loading);
        node.status = TaskStatus.Running;

        this.outputLog(
            rootEntity,
            `开始预加载 ${subTreeNodesToPreload.length} 个子树...`,
            'info'
        );

        // 并行加载所有子树
        const loadTask = this.preloadAllSubTrees(rootEntity, subTreeNodesToPreload);
        this.preloadTasks.set(rootEntity.id, loadTask);

        // 异步处理加载结果
        loadTask.then(() => {
            this.preloadStates.set(rootEntity.id, PreloadState.Completed);
            this.outputLog(rootEntity, '所有子树预加载完成', 'info');
        }).catch(error => {
            this.preloadStates.set(rootEntity.id, PreloadState.Failed);
            this.outputLog(rootEntity, `子树预加载失败: ${error.message}`, 'error');
        });
    }

    /**
     * 扫描所有需要预加载的子树节点
     */
    private scanSubTreeNodes(entity: Entity): Array<{ entity: Entity; subTree: SubTreeNode }> {
        const result: Array<{ entity: Entity; subTree: SubTreeNode }> = [];

        // 检查当前实体
        const subTree = entity.getComponent(SubTreeNode);
        if (subTree && subTree.preload) {
            result.push({ entity, subTree });
        }

        // 递归扫描子节点
        for (const child of entity.children) {
            result.push(...this.scanSubTreeNodes(child));
        }

        return result;
    }

    /**
     * 预加载所有子树
     */
    private async preloadAllSubTrees(
        rootEntity: Entity,
        subTreeNodes: Array<{ entity: Entity; subTree: SubTreeNode }>
    ): Promise<void> {
        // 确保 AssetLoader 已初始化
        if (!this.assetLoader) {
            try {
                this.assetLoader = Core.services.resolve(FileSystemAssetLoader);
            } catch (error) {
                throw new Error('AssetLoader 未配置，无法预加载子树');
            }
        }

        // 并行加载所有子树
        await Promise.all(
            subTreeNodes.map(({ entity, subTree }) =>
                this.preloadSingleSubTree(rootEntity, entity, subTree)
            )
        );
    }

    /**
     * 预加载单个子树
     */
    private async preloadSingleSubTree(
        rootEntity: Entity,
        subTreeEntity: Entity,
        subTree: SubTreeNode
    ): Promise<void> {
        try {
            this.outputLog(rootEntity, `预加载子树: ${subTree.assetId}`, 'info');

            // 加载资产
            const asset = await this.assetLoader!.loadBehaviorTree(subTree.assetId);

            // 实例化为 Entity 树（作为子树，跳过 RootNode）
            const subTreeRoot = BehaviorTreeAssetLoader.instantiate(asset, this.scene!, {
                asSubTree: true
            });

            // 设置子树根实体
            subTree.setSubTreeRoot(subTreeRoot);

            // 将子树根实体设置为 SubTreeNode 的子节点，这样子树中的节点可以通过 parent 链找到主树的根节点
            subTreeEntity.addChild(subTreeRoot);

            // 添加资产元数据
            const metadata = subTreeRoot.addComponent(new BehaviorTreeAssetMetadata());
            metadata.initialize(subTree.assetId, '1.0.0');

            // 处理黑板继承
            if (subTree.inheritParentBlackboard) {
                this.setupBlackboardInheritance(subTreeEntity, subTreeRoot);
            }

            // 输出子树内部结构（用于调试）
            this.outputLog(rootEntity, `=== 预加载子树 ${subTree.assetId} 的内部结构 ===`, 'info');
            this.logSubTreeStructure(rootEntity, subTreeRoot, 0);
            this.outputLog(rootEntity, `=== 预加载子树结构结束 ===`, 'info');

            this.outputLog(rootEntity, `✓ 子树 ${subTree.assetId} 预加载完成`, 'info');
        } catch (error: any) {
            this.outputLog(
                rootEntity,
                `✗ 子树 ${subTree.assetId} 预加载失败: ${error.message}`,
                'error'
            );
            throw error;
        }
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
            subTreeBlackboard.setUseGlobalBlackboard(true);
        }
    }

    /**
     * 查找黑板组件
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
     */
    private outputLog(
        entity: Entity,
        message: string,
        level: 'log' | 'info' | 'warn' | 'error' = 'info'
    ): void {
        // 输出到控制台
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

        // 输出到LogOutput组件
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

    /**
     * 清理资源
     */
    protected override onDestroy(): void {
        this.preloadStates.clear();
        this.preloadTasks.clear();
        super.onDestroy();
    }

    protected override getLoggerName(): string {
        return 'RootExecutionSystem';
    }
}
