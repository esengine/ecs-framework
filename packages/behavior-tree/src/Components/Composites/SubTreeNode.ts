import { ECSComponent, Serializable, Serialize, Entity } from '@esengine/ecs-framework';
import { CompositeNodeComponent } from '../CompositeNodeComponent';
import { TaskStatus, NodeType } from '../../Types/TaskStatus';
import { BehaviorNode, BehaviorProperty } from '../../Decorators/BehaviorNodeDecorator';

/**
 * SubTree 节点 - 引用其他行为树作为子树
 *
 * 允许将其他行为树嵌入到当前树中，实现行为树的复用和模块化。
 *
 * 注意：SubTreeNode 是一个特殊的叶子节点，它不会执行编辑器中静态连接的子节点，
 * 只会执行从 assetId 动态加载的外部行为树文件。
 *
 * @example
 * ```typescript
 * const subTree = entity.addComponent(SubTreeNode);
 * subTree.assetId = 'patrol';
 * subTree.inheritParentBlackboard = true;
 * ```
 */
@BehaviorNode({
    displayName: '子树',
    category: '组合',
    type: NodeType.Composite,
    icon: 'GitBranch',
    description: '引用并执行外部行为树文件（不支持静态子节点）',
    color: '#FF9800',
    requiresChildren: false
})
@ECSComponent('SubTreeNode')
@Serializable({ version: 1 })
export class SubTreeNode extends CompositeNodeComponent {
    /**
     * 引用的子树资产ID
     * 逻辑标识符，例如 'patrol' 或 'ai/patrol'
     * 实际的文件路径由 AssetLoader 决定
     */
    @BehaviorProperty({
        label: '资产ID',
        type: 'asset',
        description: '要引用的行为树资产ID'
    })
    @Serialize()
    assetId: string = '';

    /**
     * 是否将父黑板传递给子树
     *
     * - true: 子树可以访问和修改父树的黑板变量
     * - false: 子树使用独立的黑板实例
     */
    @BehaviorProperty({
        label: '继承父黑板',
        type: 'boolean',
        description: '子树是否可以访问父树的黑板变量'
    })
    @Serialize()
    inheritParentBlackboard: boolean = true;

    /**
     * 子树执行失败时是否传播失败状态
     *
     * - true: 子树失败时，SubTree 节点返回 Failure
     * - false: 子树失败时，SubTree 节点返回 Success（忽略失败）
     */
    @BehaviorProperty({
        label: '传播失败',
        type: 'boolean',
        description: '子树失败时是否传播失败状态'
    })
    @Serialize()
    propagateFailure: boolean = true;

    /**
     * 是否在行为树启动时预加载子树
     *
     * - true: 在根节点开始执行前预加载此子树，确保执行时子树已就绪
     * - false: 运行时异步加载，执行到此节点时才开始加载（可能会有延迟）
     */
    @BehaviorProperty({
        label: '预加载',
        type: 'boolean',
        description: '在行为树启动时预加载子树，避免运行时加载延迟'
    })
    @Serialize()
    preload: boolean = true;

    /**
     * 子树的根实体（运行时）
     * 在执行时动态创建，执行结束后销毁
     */
    private subTreeRoot?: Entity;

    /**
     * 子树是否已完成
     */
    private subTreeCompleted: boolean = false;

    /**
     * 子树的最终状态
     */
    private subTreeResult: TaskStatus = TaskStatus.Invalid;

    /**
     * 获取子树根实体
     */
    getSubTreeRoot(): Entity | undefined {
        return this.subTreeRoot;
    }

    /**
     * 设置子树根实体（由执行系统调用）
     */
    setSubTreeRoot(root: Entity | undefined): void {
        this.subTreeRoot = root;
        this.subTreeCompleted = false;
        this.subTreeResult = TaskStatus.Invalid;
    }

    /**
     * 标记子树完成（由执行系统调用）
     */
    markSubTreeCompleted(result: TaskStatus): void {
        this.subTreeCompleted = true;
        this.subTreeResult = result;
    }

    /**
     * 检查子树是否已完成
     */
    isSubTreeCompleted(): boolean {
        return this.subTreeCompleted;
    }

    /**
     * 获取子树执行结果
     */
    getSubTreeResult(): TaskStatus {
        return this.subTreeResult;
    }

    /**
     * 重置子树状态
     */
    reset(): void {
        this.subTreeRoot = undefined;
        this.subTreeCompleted = false;
        this.subTreeResult = TaskStatus.Invalid;
    }

    /**
     * 重置完成状态（用于复用预加载的子树）
     * 保留子树根引用，只重置完成标记
     */
    resetCompletionState(): void {
        this.subTreeCompleted = false;
        this.subTreeResult = TaskStatus.Invalid;
    }

    /**
     * 验证配置
     */
    validate(): string[] {
        const errors: string[] = [];

        if (!this.assetId || this.assetId.trim() === '') {
            errors.push('SubTree 节点必须指定资产ID');
        }

        return errors;
    }
}
