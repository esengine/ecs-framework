/**
 * 任务执行状态
 */
export enum TaskStatus {
    /** 无效状态 - 节点未初始化或已被重置 */
    Invalid = 0,
    /** 成功 - 节点执行成功完成 */
    Success = 1,
    /** 失败 - 节点执行失败 */
    Failure = 2,
    /** 运行中 - 节点正在执行，需要在后续帧继续 */
    Running = 3
}

/**
 * 内置节点类型常量
 */
export const NodeType = {
    /** 根节点 - 行为树的起始节点 */
    Root: 'root',
    /** 复合节点 - 有多个子节点 */
    Composite: 'composite',
    /** 装饰器节点 - 有一个子节点 */
    Decorator: 'decorator',
    /** 动作节点 - 叶子节点 */
    Action: 'action',
    /** 条件节点 - 叶子节点 */
    Condition: 'condition'
} as const;

/**
 * 节点类型（支持自定义扩展）
 *
 * 使用内置类型或自定义字符串
 *
 * @example
 * ```typescript
 * // 使用内置类型
 * type: NodeType.Action
 *
 * // 使用自定义类型
 * type: 'custom-behavior'
 * ```
 */
export type NodeType = typeof NodeType[keyof typeof NodeType] | string;

/**
 * 复合节点类型
 */
export enum CompositeType {
    /** 序列 - 按顺序执行，全部成功才成功 */
    Sequence = 'sequence',
    /** 选择 - 按顺序执行，任一成功则成功 */
    Selector = 'selector',
    /** 并行 - 同时执行所有子节点 */
    Parallel = 'parallel',
    /** 并行选择 - 并行执行，任一成功则成功 */
    ParallelSelector = 'parallel-selector',
    /** 随机序列 - 随机顺序执行序列 */
    RandomSequence = 'random-sequence',
    /** 随机选择 - 随机顺序执行选择 */
    RandomSelector = 'random-selector'
}

/**
 * 装饰器节点类型
 */
export enum DecoratorType {
    /** 反转 - 反转子节点结果 */
    Inverter = 'inverter',
    /** 重复 - 重复执行子节点 */
    Repeater = 'repeater',
    /** 直到成功 - 重复直到成功 */
    UntilSuccess = 'until-success',
    /** 直到失败 - 重复直到失败 */
    UntilFail = 'until-fail',
    /** 总是成功 - 无论子节点结果都返回成功 */
    AlwaysSucceed = 'always-succeed',
    /** 总是失败 - 无论子节点结果都返回失败 */
    AlwaysFail = 'always-fail',
    /** 条件装饰器 - 基于条件执行子节点 */
    Conditional = 'conditional',
    /** 冷却 - 冷却时间内阻止执行 */
    Cooldown = 'cooldown',
    /** 超时 - 超时则返回失败 */
    Timeout = 'timeout'
}

/**
 * 中止类型
 *
 * 用于动态优先级和条件重新评估
 */
export enum AbortType {
    /** 无 - 不中止任何节点 */
    None = 'none',
    /** 自身 - 条件变化时可以中止自身的执行 */
    Self = 'self',
    /** 低优先级 - 条件满足时可以中止低优先级的兄弟节点 */
    LowerPriority = 'lower-priority',
    /** 两者 - 可以中止自身和低优先级节点 */
    Both = 'both'
}

/**
 * 黑板变量类型
 */
export enum BlackboardValueType {
    String = 'string',
    Number = 'number',
    Boolean = 'boolean',
    Vector2 = 'vector2',
    Vector3 = 'vector3',
    Object = 'object',
    Array = 'array'
}

/**
 * 黑板变量定义
 */
export interface BlackboardVariable {
    name: string;
    type: BlackboardValueType;
    value: any;
    readonly?: boolean;
    description?: string;
}
