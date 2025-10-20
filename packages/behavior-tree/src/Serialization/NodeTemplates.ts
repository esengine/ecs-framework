import { NodeType, CompositeType, DecoratorType, BlackboardValueType } from '../Types/TaskStatus';

/**
 * 节点数据JSON格式（用于编辑器）
 */
export interface NodeDataJSON {
    nodeType: string;
    compositeType?: string;
    decoratorType?: string;
    [key: string]: any;
}

/**
 * 属性定义（用于编辑器）
 */
export interface PropertyDefinition {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'select' | 'blackboard' | 'code' | 'variable';
    label: string;
    description?: string;
    defaultValue?: any;
    options?: Array<{ label: string; value: any }>;
    min?: number;
    max?: number;
    step?: number;
    required?: boolean;
}

/**
 * 节点模板（用于编辑器）
 */
export interface NodeTemplate {
    type: NodeType;
    displayName: string;
    category: string;
    icon?: string;
    description: string;
    color?: string;
    defaultConfig: Partial<NodeDataJSON>;
    properties: PropertyDefinition[];
}

/**
 * 编辑器节点模板库
 *
 * 定义所有可用的节点类型及其配置
 */
export class NodeTemplates {
    /**
     * 获取所有节点模板
     */
    static getAllTemplates(): NodeTemplate[] {
        return [
            ...this.getCompositeTemplates(),
            ...this.getDecoratorTemplates(),
            ...this.getActionTemplates(),
            ...this.getConditionTemplates()
        ];
    }

    /**
     * 获取复合节点模板
     */
    static getCompositeTemplates(): NodeTemplate[] {
        return [
            {
                type: NodeType.Composite,
                displayName: '序列',
                category: '复合节点',
                icon: '→',
                description: '按顺序执行子节点，全部成功才成功',
                color: '#4CAF50',
                defaultConfig: {
                    nodeType: 'composite',
                    compositeType: CompositeType.Sequence
                },
                properties: []
            },
            {
                type: NodeType.Composite,
                displayName: '选择器',
                category: '复合节点',
                icon: '?',
                description: '按顺序执行子节点，任一成功则成功',
                color: '#2196F3',
                defaultConfig: {
                    nodeType: 'composite',
                    compositeType: CompositeType.Selector
                },
                properties: []
            },
            {
                type: NodeType.Composite,
                displayName: '并行',
                category: '复合节点',
                icon: '‖',
                description: '同时执行所有子节点，全部成功才成功',
                color: '#FF9800',
                defaultConfig: {
                    nodeType: 'composite',
                    compositeType: CompositeType.Parallel
                },
                properties: []
            },
            {
                type: NodeType.Composite,
                displayName: '并行选择器',
                category: '复合节点',
                icon: '‖?',
                description: '同时执行所有子节点，任一成功则成功',
                color: '#FF5722',
                defaultConfig: {
                    nodeType: 'composite',
                    compositeType: CompositeType.ParallelSelector
                },
                properties: []
            },
            {
                type: NodeType.Composite,
                displayName: '随机序列',
                category: '复合节点',
                icon: '🎲→',
                description: '随机顺序执行子节点，全部成功才成功',
                color: '#9C27B0',
                defaultConfig: {
                    nodeType: 'composite',
                    compositeType: CompositeType.RandomSequence
                },
                properties: []
            },
            {
                type: NodeType.Composite,
                displayName: '随机选择器',
                category: '复合节点',
                icon: '🎲?',
                description: '随机顺序执行子节点，任一成功则成功',
                color: '#E91E63',
                defaultConfig: {
                    nodeType: 'composite',
                    compositeType: CompositeType.RandomSelector
                },
                properties: []
            }
        ];
    }

    /**
     * 获取装饰器节点模板
     */
    static getDecoratorTemplates(): NodeTemplate[] {
        return [
            {
                type: NodeType.Decorator,
                displayName: '反转',
                category: '装饰器',
                icon: '!',
                description: '反转子节点的执行结果',
                color: '#607D8B',
                defaultConfig: {
                    nodeType: 'decorator',
                    decoratorType: DecoratorType.Inverter
                },
                properties: []
            },
            {
                type: NodeType.Decorator,
                displayName: '重复',
                category: '装饰器',
                icon: '↻',
                description: '重复执行子节点指定次数',
                color: '#795548',
                defaultConfig: {
                    nodeType: 'decorator',
                    decoratorType: DecoratorType.Repeater,
                    repeatCount: -1,
                    endOnFailure: false
                },
                properties: [
                    {
                        name: 'repeatCount',
                        label: '重复次数',
                        type: 'number',
                        defaultValue: -1,
                        description: '-1 表示无限重复'
                    },
                    {
                        name: 'endOnFailure',
                        label: '失败时停止',
                        type: 'boolean',
                        defaultValue: false,
                        description: '子节点失败时是否停止重复'
                    }
                ]
            },
            {
                type: NodeType.Decorator,
                displayName: '直到成功',
                category: '装饰器',
                icon: '✓',
                description: '重复执行直到子节点成功',
                color: '#4CAF50',
                defaultConfig: {
                    nodeType: 'decorator',
                    decoratorType: DecoratorType.UntilSuccess
                },
                properties: []
            },
            {
                type: NodeType.Decorator,
                displayName: '直到失败',
                category: '装饰器',
                icon: '✗',
                description: '重复执行直到子节点失败',
                color: '#F44336',
                defaultConfig: {
                    nodeType: 'decorator',
                    decoratorType: DecoratorType.UntilFail
                },
                properties: []
            },
            {
                type: NodeType.Decorator,
                displayName: '总是成功',
                category: '装饰器',
                icon: '✓✓',
                description: '无论子节点结果都返回成功',
                color: '#8BC34A',
                defaultConfig: {
                    nodeType: 'decorator',
                    decoratorType: DecoratorType.AlwaysSucceed
                },
                properties: []
            },
            {
                type: NodeType.Decorator,
                displayName: '总是失败',
                category: '装饰器',
                icon: '✗✗',
                description: '无论子节点结果都返回失败',
                color: '#E57373',
                defaultConfig: {
                    nodeType: 'decorator',
                    decoratorType: DecoratorType.AlwaysFail
                },
                properties: []
            },
            {
                type: NodeType.Decorator,
                displayName: '条件',
                category: '装饰器',
                icon: '?',
                description: '基于条件决定是否执行子节点',
                color: '#03A9F4',
                defaultConfig: {
                    nodeType: 'decorator',
                    decoratorType: DecoratorType.Conditional,
                    conditionCode: 'return true;'
                },
                properties: [
                    {
                        name: 'conditionCode',
                        label: '条件代码',
                        type: 'code',
                        defaultValue: 'return true;',
                        description: 'JavaScript 表达式，返回 boolean',
                        required: true
                    }
                ]
            },
            {
                type: NodeType.Decorator,
                displayName: '冷却',
                category: '装饰器',
                icon: '❄',
                description: '冷却时间内阻止执行',
                color: '#00BCD4',
                defaultConfig: {
                    nodeType: 'decorator',
                    decoratorType: DecoratorType.Cooldown,
                    cooldownTime: 1.0
                },
                properties: [
                    {
                        name: 'cooldownTime',
                        label: '冷却时间',
                        type: 'number',
                        defaultValue: 1.0,
                        min: 0,
                        step: 0.1,
                        description: '冷却时间（秒）'
                    }
                ]
            },
            {
                type: NodeType.Decorator,
                displayName: '超时',
                category: '装饰器',
                icon: '⏱',
                description: '超时则返回失败',
                color: '#FF5722',
                defaultConfig: {
                    nodeType: 'decorator',
                    decoratorType: DecoratorType.Timeout,
                    timeoutDuration: 5.0
                },
                properties: [
                    {
                        name: 'timeoutDuration',
                        label: '超时时间',
                        type: 'number',
                        defaultValue: 5.0,
                        min: 0,
                        step: 0.1,
                        description: '超时时间（秒）'
                    }
                ]
            }
        ];
    }

    /**
     * 获取动作节点模板
     */
    static getActionTemplates(): NodeTemplate[] {
        return [
            {
                type: NodeType.Action,
                displayName: '等待',
                category: '动作',
                icon: '⏸',
                description: '等待指定时间',
                color: '#9E9E9E',
                defaultConfig: {
                    nodeType: 'action',
                    actionType: 'wait',
                    waitTime: 1.0
                },
                properties: [
                    {
                        name: 'waitTime',
                        label: '等待时间',
                        type: 'number',
                        defaultValue: 1.0,
                        min: 0,
                        step: 0.1,
                        description: '等待时间（秒）',
                        required: true
                    }
                ]
            },
            {
                type: NodeType.Action,
                displayName: '日志',
                category: '动作',
                icon: '📝',
                description: '输出日志消息',
                color: '#673AB7',
                defaultConfig: {
                    nodeType: 'action',
                    actionType: 'log',
                    message: 'Hello',
                    level: 'log',
                    includeEntityInfo: false
                },
                properties: [
                    {
                        name: 'message',
                        label: '消息',
                        type: 'string',
                        defaultValue: 'Hello',
                        required: true
                    },
                    {
                        name: 'level',
                        label: '级别',
                        type: 'select',
                        defaultValue: 'log',
                        options: [
                            { label: 'Log', value: 'log' },
                            { label: 'Info', value: 'info' },
                            { label: 'Warn', value: 'warn' },
                            { label: 'Error', value: 'error' }
                        ]
                    },
                    {
                        name: 'includeEntityInfo',
                        label: '包含实体信息',
                        type: 'boolean',
                        defaultValue: false
                    }
                ]
            },
            {
                type: NodeType.Action,
                displayName: '设置变量',
                category: '动作',
                icon: '=',
                description: '设置黑板变量的值',
                color: '#3F51B5',
                defaultConfig: {
                    nodeType: 'action',
                    actionType: 'setBlackboardValue',
                    variableName: '',
                    value: null
                },
                properties: [
                    {
                        name: 'variableName',
                        label: '变量名',
                        type: 'variable',
                        defaultValue: '',
                        required: true
                    },
                    {
                        name: 'value',
                        label: '值',
                        type: 'string',
                        defaultValue: '',
                        description: '可以使用 {{varName}} 引用其他变量'
                    }
                ]
            },
            {
                type: NodeType.Action,
                displayName: '修改变量',
                category: '动作',
                icon: '±',
                description: '对黑板变量执行数学操作',
                color: '#009688',
                defaultConfig: {
                    nodeType: 'action',
                    actionType: 'modifyBlackboardValue',
                    variableName: '',
                    operation: 'add',
                    operand: 1
                },
                properties: [
                    {
                        name: 'variableName',
                        label: '变量名',
                        type: 'variable',
                        defaultValue: '',
                        required: true
                    },
                    {
                        name: 'operation',
                        label: '操作',
                        type: 'select',
                        defaultValue: 'add',
                        options: [
                            { label: '加', value: 'add' },
                            { label: '减', value: 'subtract' },
                            { label: '乘', value: 'multiply' },
                            { label: '除', value: 'divide' },
                            { label: '取模', value: 'modulo' },
                            { label: '追加', value: 'append' },
                            { label: '移除', value: 'remove' }
                        ]
                    },
                    {
                        name: 'operand',
                        label: '操作数',
                        type: 'string',
                        defaultValue: '1',
                        description: '可以使用 {{varName}} 引用其他变量'
                    }
                ]
            },
            {
                type: NodeType.Action,
                displayName: '自定义动作',
                category: '动作',
                icon: '⚙',
                description: '执行自定义代码',
                color: '#FFC107',
                defaultConfig: {
                    nodeType: 'action',
                    actionType: 'execute',
                    actionCode: 'return TaskStatus.Success;'
                },
                properties: [
                    {
                        name: 'actionCode',
                        label: '动作代码',
                        type: 'code',
                        defaultValue: 'return TaskStatus.Success;',
                        description: 'JavaScript 代码，返回 TaskStatus',
                        required: true
                    }
                ]
            }
        ];
    }

    /**
     * 获取条件节点模板
     */
    static getConditionTemplates(): NodeTemplate[] {
        return [
            {
                type: NodeType.Condition,
                displayName: '比较变量',
                category: '条件',
                icon: '≈',
                description: '比较黑板变量的值',
                color: '#00BCD4',
                defaultConfig: {
                    nodeType: 'condition',
                    conditionType: 'blackboardCompare',
                    variableName: '',
                    operator: 'equal',
                    compareValue: null
                },
                properties: [
                    {
                        name: 'variableName',
                        label: '变量名',
                        type: 'variable',
                        defaultValue: '',
                        required: true
                    },
                    {
                        name: 'operator',
                        label: '操作符',
                        type: 'select',
                        defaultValue: 'equal',
                        options: [
                            { label: '等于', value: 'equal' },
                            { label: '不等于', value: 'notEqual' },
                            { label: '大于', value: 'greater' },
                            { label: '大于等于', value: 'greaterOrEqual' },
                            { label: '小于', value: 'less' },
                            { label: '小于等于', value: 'lessOrEqual' },
                            { label: '包含', value: 'contains' },
                            { label: '匹配', value: 'matches' }
                        ]
                    },
                    {
                        name: 'compareValue',
                        label: '比较值',
                        type: 'string',
                        defaultValue: '',
                        description: '可以使用 {{varName}} 引用其他变量'
                    },
                    {
                        name: 'invertResult',
                        label: '反转结果',
                        type: 'boolean',
                        defaultValue: false
                    }
                ]
            },
            {
                type: NodeType.Condition,
                displayName: '检查变量存在',
                category: '条件',
                icon: '?',
                description: '检查黑板变量是否存在',
                color: '#4CAF50',
                defaultConfig: {
                    nodeType: 'condition',
                    conditionType: 'blackboardExists',
                    variableName: '',
                    checkNotNull: false
                },
                properties: [
                    {
                        name: 'variableName',
                        label: '变量名',
                        type: 'variable',
                        defaultValue: '',
                        required: true
                    },
                    {
                        name: 'checkNotNull',
                        label: '检查非空',
                        type: 'boolean',
                        defaultValue: false,
                        description: '同时检查值不为 null/undefined'
                    },
                    {
                        name: 'invertResult',
                        label: '反转结果',
                        type: 'boolean',
                        defaultValue: false
                    }
                ]
            },
            {
                type: NodeType.Condition,
                displayName: '随机概率',
                category: '条件',
                icon: '🎲',
                description: '按概率返回成功或失败',
                color: '#E91E63',
                defaultConfig: {
                    nodeType: 'condition',
                    conditionType: 'randomProbability',
                    probability: 0.5
                },
                properties: [
                    {
                        name: 'probability',
                        label: '成功概率',
                        type: 'number',
                        defaultValue: 0.5,
                        min: 0,
                        max: 1,
                        step: 0.05,
                        description: '0.0 到 1.0 之间的值'
                    }
                ]
            },
            {
                type: NodeType.Condition,
                displayName: '自定义条件',
                category: '条件',
                icon: '⚙',
                description: '执行自定义条件代码',
                color: '#FF9800',
                defaultConfig: {
                    nodeType: 'condition',
                    conditionType: 'execute',
                    conditionCode: 'return true;'
                },
                properties: [
                    {
                        name: 'conditionCode',
                        label: '条件代码',
                        type: 'code',
                        defaultValue: 'return true;',
                        description: 'JavaScript 代码，返回 boolean',
                        required: true
                    },
                    {
                        name: 'invertResult',
                        label: '反转结果',
                        type: 'boolean',
                        defaultValue: false
                    }
                ]
            }
        ];
    }

    /**
     * 根据类型和子类型获取模板
     */
    static getTemplate(type: NodeType, subType: string): NodeTemplate | undefined {
        return this.getAllTemplates().find(t => {
            if (t.type !== type) return false;
            const config: any = t.defaultConfig;

            switch (type) {
                case NodeType.Composite:
                    return config.compositeType === subType;
                case NodeType.Decorator:
                    return config.decoratorType === subType;
                case NodeType.Action:
                    return config.actionType === subType;
                case NodeType.Condition:
                    return config.conditionType === subType;
                default:
                    return false;
            }
        });
    }
}
