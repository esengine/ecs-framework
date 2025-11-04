import { TaskStatus, NodeType, AbortType } from '../Types/TaskStatus';

/**
 * 行为树节点定义（纯数据结构）
 *
 * 不依赖Entity，可以被多个实例共享
 */
export interface BehaviorNodeData {
    /** 节点唯一ID */
    id: string;

    /** 节点名称（用于调试） */
    name: string;

    /** 节点类型 */
    nodeType: NodeType;

    /** 节点实现类型（对应Component类名） */
    implementationType: string;

    /** 子节点ID列表 */
    children?: string[];

    /** 节点特定配置数据 */
    config: Record<string, any>;

    /** 属性到黑板变量的绑定映射 */
    bindings?: Record<string, string>;

    /** 中止类型（条件装饰器使用） */
    abortType?: AbortType;
}

/**
 * 行为树定义（可共享的Asset）
 */
export interface BehaviorTreeData {
    /** 树ID */
    id: string;

    /** 树名称 */
    name: string;

    /** 根节点ID */
    rootNodeId: string;

    /** 所有节点（扁平化存储） */
    nodes: Map<string, BehaviorNodeData>;

    /** 黑板变量定义 */
    blackboardVariables?: Map<string, any>;
}

/**
 * 节点运行时状态
 *
 * 每个BehaviorTreeRuntimeComponent实例独立维护
 */
export interface NodeRuntimeState {
    /** 当前执行状态 */
    status: TaskStatus;

    /** 当前执行的子节点索引（复合节点使用） */
    currentChildIndex: number;

    /** 执行顺序号（用于调试和可视化） */
    executionOrder?: number;

    /** 开始执行时间（某些节点需要） */
    startTime?: number;

    /** 上次执行时间（冷却节点使用） */
    lastExecutionTime?: number;

    /** 当前重复次数（重复节点使用） */
    repeatCount?: number;

    /** 缓存的结果（某些条件节点使用） */
    cachedResult?: any;

    /** 洗牌后的索引（随机节点使用） */
    shuffledIndices?: number[];

    /** 是否被中止 */
    isAborted?: boolean;

    /** 上次条件评估结果（条件装饰器使用） */
    lastConditionResult?: boolean;

    /** 正在观察的黑板键（条件装饰器使用） */
    observedKeys?: string[];
}

/**
 * 创建默认的运行时状态
 */
export function createDefaultRuntimeState(): NodeRuntimeState {
    return {
        status: TaskStatus.Invalid,
        currentChildIndex: 0
    };
}
