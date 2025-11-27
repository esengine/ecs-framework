import { Entity } from '@esengine/ecs-framework';
import { TaskStatus } from '../Types/TaskStatus';
import { BehaviorNodeData, BehaviorTreeData, NodeRuntimeState } from './BehaviorTreeData';
import { BehaviorTreeRuntimeComponent } from './BehaviorTreeRuntimeComponent';

/**
 * 节点执行上下文
 *
 * 包含执行节点所需的所有信息
 */
export interface NodeExecutionContext {
    /** 游戏Entity（行为树宿主） */
    readonly entity: Entity;

    /** 节点数据 */
    readonly nodeData: BehaviorNodeData;

    /** 节点运行时状态 */
    readonly state: NodeRuntimeState;

    /** 运行时组件（访问黑板等） */
    readonly runtime: BehaviorTreeRuntimeComponent;

    /** 行为树数据（访问子节点等） */
    readonly treeData: BehaviorTreeData;

    /** 当前帧增量时间 */
    readonly deltaTime: number;

    /** 总时间 */
    readonly totalTime: number;

    /** 执行子节点 */
    executeChild(childId: string): TaskStatus;
}

/**
 * 节点执行器接口
 *
 * 所有节点类型都需要实现对应的执行器
 * 执行器是无状态的，状态存储在NodeRuntimeState中
 */
export interface INodeExecutor {
    /**
     * 执行节点逻辑
     *
     * @param context 执行上下文
     * @returns 执行结果状态
     */
    execute(context: NodeExecutionContext): TaskStatus;

    /**
     * 重置节点状态（可选）
     *
     * 当节点完成或被中断时调用
     */
    reset?(context: NodeExecutionContext): void;
}

/**
 * 复合节点执行结果
 */
export interface CompositeExecutionResult {
    /** 节点状态 */
    status: TaskStatus;

    /** 要激活的子节点索引列表（undefined表示激活所有） */
    activateChildren?: number[];

    /** 是否停止所有子节点 */
    stopAllChildren?: boolean;
}

/**
 * 复合节点执行器接口
 */
export interface ICompositeExecutor extends INodeExecutor {
    /**
     * 执行复合节点逻辑
     *
     * @param context 执行上下文
     * @returns 复合节点执行结果
     */
    executeComposite(context: NodeExecutionContext): CompositeExecutionResult;
}

/**
 * 绑定辅助工具
 *
 * 处理配置属性的黑板绑定
 */
export class BindingHelper {
    /**
     * 获取配置值（考虑黑板绑定）
     *
     * @param context 执行上下文
     * @param configKey 配置键名
     * @param defaultValue 默认值
     * @returns 解析后的值
     */
    static getValue<T = any>(
        context: NodeExecutionContext,
        configKey: string,
        defaultValue?: T
    ): T {
        const { nodeData, runtime } = context;

        if (nodeData.bindings && nodeData.bindings[configKey]) {
            const blackboardKey = nodeData.bindings[configKey];
            const boundValue = runtime.getBlackboardValue<T>(blackboardKey);
            return boundValue !== undefined ? boundValue : (defaultValue as T);
        }

        const configValue = nodeData.config[configKey];
        return configValue !== undefined ? configValue : (defaultValue as T);
    }

    /**
     * 检查配置是否绑定到黑板变量
     */
    static hasBinding(context: NodeExecutionContext, configKey: string): boolean {
        return !!(context.nodeData.bindings && context.nodeData.bindings[configKey]);
    }

    /**
     * 获取绑定的黑板变量名
     */
    static getBindingKey(context: NodeExecutionContext, configKey: string): string | undefined {
        return context.nodeData.bindings?.[configKey];
    }
}

/**
 * 节点执行器注册表
 *
 * 管理所有节点类型的执行器
 */
export class NodeExecutorRegistry {
    private executors: Map<string, INodeExecutor> = new Map();

    /**
     * 注册执行器
     *
     * @param implementationType 节点实现类型（对应BehaviorNodeData.implementationType）
     * @param executor 执行器实例
     */
    register(implementationType: string, executor: INodeExecutor): void {
        if (this.executors.has(implementationType)) {
            console.warn(`执行器已存在，将被覆盖: ${implementationType}`);
        }
        this.executors.set(implementationType, executor);
    }

    /**
     * 获取执行器
     */
    get(implementationType: string): INodeExecutor | undefined {
        return this.executors.get(implementationType);
    }

    /**
     * 检查是否有执行器
     */
    has(implementationType: string): boolean {
        return this.executors.has(implementationType);
    }

    /**
     * 注销执行器
     */
    unregister(implementationType: string): boolean {
        return this.executors.delete(implementationType);
    }

    /**
     * 清空所有执行器
     */
    clear(): void {
        this.executors.clear();
    }
}
