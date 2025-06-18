/**
 * 节点属性定义接口
 */
export interface PropertyDefinition {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'select' | 'code';
    value: any;
    description?: string;
    options?: string[]; // 用于select类型
    required?: boolean;
}

/**
 * 节点模板接口
 */
export interface NodeTemplate {
    type: string;
    name: string;
    icon: string;
    category: 'composite' | 'decorator' | 'action' | 'condition' | 'ecs' | 'root';
    description: string;
    canHaveChildren: boolean;
    canHaveParent: boolean;
    maxChildren?: number; // 最大子节点数量限制
    minChildren?: number; // 最小子节点数量要求
    properties?: Record<string, PropertyDefinition>;
    className?: string; // 对应的实际类名
    namespace?: string; // 命名空间
    // 条件节点相关
    isDraggableCondition?: boolean; // 是否为可拖拽的条件节点
    attachableToDecorator?: boolean; // 是否可以吸附到条件装饰器
}

/**
 * 基于项目实际行为树系统的节点模板定义
 */
export const nodeTemplates: NodeTemplate[] = [
    // 根节点
    {
        type: 'root',
        name: '根节点',
        icon: '🌳',
        category: 'root',
        description: '行为树的根节点，每棵树只能有一个根节点',
        canHaveChildren: true,
        canHaveParent: false,
        maxChildren: 1,
        minChildren: 1,
        className: 'BehaviorTree',
        namespace: 'behaviourTree'
    },

    // 复合节点 (Composites)
    {
        type: 'sequence',
        name: '序列器',
        icon: '→',
        category: 'composite',
        description: '按顺序执行子节点，任一失败则整体失败',
        canHaveChildren: true,
        canHaveParent: true,
        minChildren: 1,
        className: 'Sequence',
        namespace: 'behaviourTree/composites',
        properties: {
            abortType: {
                name: '中止类型',
                type: 'select',
                value: 'None',
                options: ['None', 'LowerPriority', 'Self', 'Both'],
                description: '决定节点在何种情况下会被中止',
                required: false
            }
        }
    },
    {
        type: 'selector',
        name: '选择器',
        icon: '?',
        category: 'composite',
        description: '按顺序执行子节点，任一成功则整体成功',
        canHaveChildren: true,
        canHaveParent: true,
        minChildren: 1,
        className: 'Selector',
        namespace: 'behaviourTree/composites',
        properties: {
            abortType: {
                name: '中止类型',
                type: 'select',
                value: 'None',
                options: ['None', 'LowerPriority', 'Self', 'Both'],
                description: '决定节点在何种情况下会被中止',
                required: false
            }
        }
    },
    {
        type: 'parallel',
        name: '并行器',
        icon: '||',
        category: 'composite',
        description: '并行执行所有子节点',
        canHaveChildren: true,
        canHaveParent: true,
        minChildren: 2,
        className: 'Parallel',
        namespace: 'behaviourTree/composites'
    },
    {
        type: 'parallel-selector',
        name: '并行选择器',
        icon: '⫸',
        category: 'composite',
        description: '并行执行子节点，任一成功则成功',
        canHaveChildren: true,
        canHaveParent: true,
        minChildren: 2,
        className: 'ParallelSelector',
        namespace: 'behaviourTree/composites'
    },
    {
        type: 'random-selector',
        name: '随机选择器',
        icon: '🎲?',
        category: 'composite',
        description: '随机顺序执行子节点，任一成功则成功',
        canHaveChildren: true,
        canHaveParent: true,
        minChildren: 2,
        className: 'RandomSelector',
        namespace: 'behaviourTree/composites',
        properties: {
            reshuffleOnRestart: {
                name: '重启时重新洗牌',
                type: 'boolean',
                value: true,
                description: '是否在每次重新开始时都重新洗牌子节点顺序',
                required: false
            },
            abortType: {
                name: '中止类型',
                type: 'select',
                value: 'None',
                options: ['None', 'LowerPriority', 'Self', 'Both'],
                description: '决定节点在何种情况下会被中止',
                required: false
            }
        }
    },
    {
        type: 'random-sequence',
        name: '随机序列器',
        icon: '🎲→',
        category: 'composite',
        description: '随机顺序执行子节点，任一失败则失败',
        canHaveChildren: true,
        canHaveParent: true,
        minChildren: 2,
        className: 'RandomSequence',
        namespace: 'behaviourTree/composites',
        properties: {
            reshuffleOnRestart: {
                name: '重启时重新洗牌',
                type: 'boolean',
                value: true,
                description: '是否在每次重新开始时都重新洗牌子节点顺序',
                required: false
            },
            abortType: {
                name: '中止类型',
                type: 'select',
                value: 'None',
                options: ['None', 'LowerPriority', 'Self', 'Both'],
                description: '决定节点在何种情况下会被中止',
                required: false
            }
        }
    },

    // 装饰器节点 (Decorators) - 只能有一个子节点
    {
        type: 'repeater',
        name: '重复器',
        icon: '🔄',
        category: 'decorator',
        description: '重复执行子节点指定次数或无限次',
        canHaveChildren: true,
        canHaveParent: true,
        maxChildren: 1,
        minChildren: 1,
        className: 'Repeater',
        namespace: 'behaviourTree/decorators',
        properties: {
            count: {
                name: '重复次数',
                type: 'number',
                value: -1,
                description: '重复执行次数，-1表示无限重复，必须是正整数',
                required: true
            },
            endOnFailure: {
                name: '失败时停止',
                type: 'boolean',
                value: false,
                description: '子节点失败时是否停止重复',
                required: false
            },
            endOnSuccess: {
                name: '成功时停止',
                type: 'boolean',
                value: false,
                description: '子节点成功时是否停止重复',
                required: false
            }
        }
    },
    {
        type: 'inverter',
        name: '反转器',
        icon: '⚡',
        category: 'decorator',
        description: '反转子节点的执行结果',
        canHaveChildren: true,
        canHaveParent: true,
        maxChildren: 1,
        minChildren: 1,
        className: 'Inverter',
        namespace: 'behaviourTree/decorators'
    },
    {
        type: 'always-succeed',
        name: '总是成功',
        icon: '✅',
        category: 'decorator',
        description: '无论子节点结果如何都返回成功',
        canHaveChildren: true,
        canHaveParent: true,
        maxChildren: 1,
        minChildren: 1,
        className: 'AlwaysSucceed',
        namespace: 'behaviourTree/decorators'
    },
    {
        type: 'always-fail',
        name: '总是失败',
        icon: '❌',
        category: 'decorator',
        description: '无论子节点结果如何都返回失败',
        canHaveChildren: true,
        canHaveParent: true,
        maxChildren: 1,
        minChildren: 1,
        className: 'AlwaysFail',
        namespace: 'behaviourTree/decorators'
    },
    {
        type: 'until-success',
        name: '直到成功',
        icon: '🔁✅',
        category: 'decorator',
        description: '重复执行子节点直到成功',
        canHaveChildren: true,
        canHaveParent: true,
        maxChildren: 1,
        minChildren: 1,
        className: 'UntilSuccess',
        namespace: 'behaviourTree/decorators'
    },
    {
        type: 'until-fail',
        name: '直到失败',
        icon: '🔁❌',
        category: 'decorator',
        description: '重复执行子节点直到失败',
        canHaveChildren: true,
        canHaveParent: true,
        maxChildren: 1,
        minChildren: 1,
        className: 'UntilFail',
        namespace: 'behaviourTree/decorators'
    },
    {
        type: 'conditional-decorator',
        name: '条件装饰器',
        icon: '🔀',
        category: 'decorator',
        description: '基于条件执行子节点（拖拽条件节点到此装饰器来配置条件）',
        canHaveChildren: true,
        canHaveParent: true,
        maxChildren: 1,
        minChildren: 1,
        className: 'ConditionalDecorator',
        namespace: 'behaviourTree/decorators',
        properties: {}
    },

    // 动作节点 (Actions) - 叶子节点，不能有子节点
    {
        type: 'execute-action',
        name: '执行动作',
        icon: '⚡',
        category: 'action',
        description: '执行自定义代码逻辑',
        canHaveChildren: false,
        canHaveParent: true,
        maxChildren: 0,
        className: 'ExecuteAction',
        namespace: 'behaviourTree/actions',
        properties: {
            actionCode: {
                name: '动作代码',
                type: 'code',
                value: '(context) => {\n  // 在这里编写动作逻辑\n  return TaskStatus.Success;\n}',
                description: '要执行的动作函数代码',
                required: true
            },
            actionName: {
                name: '动作名称',
                type: 'string',
                value: '',
                description: '用于调试的动作名称',
                required: false
            }
        }
    },
    {
        type: 'wait-action',
        name: '等待动作',
        icon: '⏰',
        category: 'action',
        description: '等待指定时间后完成',
        canHaveChildren: false,
        canHaveParent: true,
        maxChildren: 0,
        className: 'WaitAction',
        namespace: 'behaviourTree/actions',
        properties: {
            waitTime: {
                name: '等待时间',
                type: 'number',
                value: 1.0,
                description: '等待时间（秒），必须大于0',
                required: true
            },
            useExternalTime: {
                name: '使用外部时间',
                type: 'boolean',
                value: false,
                description: '是否使用上下文提供的deltaTime，否则使用内部时间计算',
                required: false
            }
        }
    },
    {
        type: 'log-action',
        name: '日志动作',
        icon: '📝',
        category: 'action',
        description: '输出日志信息',
        canHaveChildren: false,
        canHaveParent: true,
        maxChildren: 0,
        className: 'LogAction',
        namespace: 'behaviourTree/actions',
        properties: {
            message: {
                name: '日志消息',
                type: 'string',
                value: 'Hello from behavior tree!',
                description: '要输出的日志消息',
                required: true
            },
            logLevel: {
                name: '日志级别',
                type: 'select',
                value: 'info',
                options: ['debug', 'info', 'warn', 'error'],
                description: '日志输出级别',
                required: false
            }
        }
    },
    {
        type: 'behavior-tree-reference',
        name: '行为树引用',
        icon: '🔗',
        category: 'action',
        description: '运行另一个行为树',
        canHaveChildren: false,
        canHaveParent: true,
        maxChildren: 0,
        className: 'BehaviorTreeReference',
        namespace: 'behaviourTree/actions',
        properties: {
            treeName: {
                name: '树名称',
                type: 'string',
                value: '',
                description: '要引用的行为树名称',
                required: true
            }
        }
    },




    // 条件节点 (可拖拽到条件装饰器上吸附)
    {
        type: 'condition-random',
        name: '随机概率',
        icon: '🎲',
        category: 'condition',
        description: '基于概率的随机条件 (拖拽到条件装饰器上使用)',
        canHaveChildren: false,
        canHaveParent: false, // 不能作为常规子节点
        maxChildren: 0,
        isDraggableCondition: true, // 标记为可拖拽的条件
        attachableToDecorator: true, // 可以吸附到装饰器
        className: 'RandomProbability',
        namespace: 'behaviourTree/conditionals',
        properties: {
            successProbability: {
                name: '成功概率',
                type: 'number',
                value: 0.5,
                description: '返回成功的概率 (0.0 - 1.0)',
                required: true
            }
        }
    },
    {
        type: 'condition-component',
        name: '组件检查',
        icon: '🔍📦',
        category: 'condition',
        description: '检查实体是否有指定组件 (拖拽到条件装饰器上使用)',
        canHaveChildren: false,
        canHaveParent: false,
        maxChildren: 0,
        isDraggableCondition: true,
        attachableToDecorator: true,
        className: 'HasComponentCondition',
        namespace: 'ecs-integration/behaviors',
        properties: {
            componentType: {
                name: '组件类型',
                type: 'string',
                value: 'Component',
                description: '要检查的组件类型名称',
                required: true
            }
        }
    },
    {
        type: 'condition-tag',
        name: '标签检查',
        icon: '🏷️',
        category: 'condition',
        description: '检查实体标签 (拖拽到条件装饰器上使用)',
        canHaveChildren: false,
        canHaveParent: false,
        maxChildren: 0,
        isDraggableCondition: true,
        attachableToDecorator: true,
        className: 'HasTagCondition',
        namespace: 'ecs-integration/behaviors',
        properties: {
            tagValue: {
                name: '标签值',
                type: 'number',
                value: 0,
                description: '要检查的标签值',
                required: true
            }
        }
    },
    {
        type: 'condition-active',
        name: '激活状态',
        icon: '👁️',
        category: 'condition',
        description: '检查实体激活状态 (拖拽到条件装饰器上使用)',
        canHaveChildren: false,
        canHaveParent: false,
        maxChildren: 0,
        isDraggableCondition: true,
        attachableToDecorator: true,
        className: 'IsActiveCondition',
        namespace: 'ecs-integration/behaviors',
        properties: {
            checkHierarchy: {
                name: '检查层级',
                type: 'boolean',
                value: true,
                description: '是否检查层级激活状态',
                required: false
            }
        }
    },
    {
        type: 'condition-numeric',
        name: '数值比较',
        icon: '🔢',
        category: 'condition',
        description: '数值比较条件 (拖拽到条件装饰器上使用)',
        canHaveChildren: false,
        canHaveParent: false,
        maxChildren: 0,
        isDraggableCondition: true,
        attachableToDecorator: true,
        className: 'NumericComparison',
        namespace: 'behaviourTree/conditionals',
        properties: {
            propertyPath: {
                name: '属性路径',
                type: 'string',
                value: 'context.someValue',
                description: '要比较的属性路径',
                required: true
            },
            compareOperator: {
                name: '比较操作符',
                type: 'select',
                value: 'greater',
                options: ['greater', 'less', 'equal', 'greaterEqual', 'lessEqual', 'notEqual'],
                description: '数值比较操作符',
                required: true
            },
            compareValue: {
                name: '比较值',
                type: 'number',
                value: 0,
                description: '用于比较的数值',
                required: true
            }
        }
    },
    {
        type: 'condition-property',
        name: '属性存在',
        icon: '📋',
        category: 'condition',
        description: '检查属性是否存在 (拖拽到条件装饰器上使用)',
        canHaveChildren: false,
        canHaveParent: false,
        maxChildren: 0,
        isDraggableCondition: true,
        attachableToDecorator: true,
        className: 'PropertyExists',
        namespace: 'behaviourTree/conditionals',
        properties: {
            propertyPath: {
                name: '属性路径',
                type: 'string',
                value: 'context.someProperty',
                description: '要检查的属性路径',
                required: true
            }
        }
    },
    {
        type: 'condition-custom',
        name: '自定义条件',
        icon: '⚙️',
        category: 'condition',
        description: '自定义代码条件 (拖拽到条件装饰器上使用)',
        canHaveChildren: false,
        canHaveParent: false,
        maxChildren: 0,
        isDraggableCondition: true,
        attachableToDecorator: true,
        className: 'ExecuteActionConditional',
        namespace: 'behaviourTree/conditionals',
        properties: {
            conditionCode: {
                name: '条件代码',
                type: 'code',
                value: '(context) => {\n  // 条件判断逻辑\n  return true; // 返回 true/false\n}',
                description: '条件判断函数代码',
                required: true
            },
            conditionName: {
                name: '条件名称',
                type: 'string',
                value: '',
                description: '用于调试的条件名称',
                required: false
            }
        }
    },

    // ECS专用节点 - 动作节点
    {
        type: 'add-component',
        name: '添加组件',
        icon: '➕',
        category: 'ecs',
        description: '为实体添加组件',
        canHaveChildren: false,
        canHaveParent: true,
        maxChildren: 0,
        className: 'AddComponentAction',
        namespace: 'ecs-integration/behaviors',
        properties: {
            componentType: {
                name: '组件类型',
                type: 'string',
                value: 'Component',
                description: '要添加的组件类型名称',
                required: true
            },
            componentFactory: {
                name: '组件工厂函数',
                type: 'code',
                value: '() => new Component()',
                description: '创建组件实例的函数（可选）',
                required: false
            }
        }
    },
    {
        type: 'remove-component',
        name: '移除组件',
        icon: '➖',
        category: 'ecs',
        description: '从实体移除组件',
        canHaveChildren: false,
        canHaveParent: true,
        maxChildren: 0,
        className: 'RemoveComponentAction',
        namespace: 'ecs-integration/behaviors',
        properties: {
            componentType: {
                name: '组件类型',
                type: 'string',
                value: 'Component',
                description: '要移除的组件类型名称',
                required: true
            }
        }
    },
    {
        type: 'modify-component',
        name: '修改组件',
        icon: '✏️',
        category: 'ecs',
        description: '修改实体组件的属性',
        canHaveChildren: false,
        canHaveParent: true,
        maxChildren: 0,
        className: 'ModifyComponentAction',
        namespace: 'ecs-integration/behaviors',
        properties: {
            componentType: {
                name: '组件类型',
                type: 'string',
                value: 'Component',
                description: '要修改的组件类型名称',
                required: true
            },
            modifierCode: {
                name: '修改代码',
                type: 'code',
                value: '(component) => {\n  // 在这里修改组件属性\n  // component.someProperty = newValue;\n}',
                description: '组件修改函数代码',
                required: true
            }
        }
    },

    {
        type: 'wait-time',
        name: 'ECS等待',
        icon: '⏱️',
        category: 'ecs',
        description: 'ECS优化的等待动作',
        canHaveChildren: false,
        canHaveParent: true,
        maxChildren: 0,
        className: 'WaitTimeAction',
        namespace: 'ecs-integration/behaviors',
        properties: {
            waitTime: {
                name: '等待时间',
                type: 'number',
                value: 1.0,
                description: '等待时间（秒）',
                required: true
            }
        }
    },
    {
        type: 'destroy-entity',
        name: '销毁实体',
        icon: '💥',
        category: 'ecs',
        description: '销毁当前实体',
        canHaveChildren: false,
        canHaveParent: true,
        maxChildren: 0,
        className: 'DestroyEntityAction',
        namespace: 'ecs-integration/behaviors'
    }
]; 