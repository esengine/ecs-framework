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
        namespace: 'behaviourTree/composites'
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
        namespace: 'behaviourTree/composites'
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
            repeatCount: {
                name: '重复次数',
                type: 'number',
                value: -1,
                description: '重复执行次数，-1表示无限重复',
                required: true
            },
            repeatForever: {
                name: '无限重复',
                type: 'boolean',
                value: true,
                description: '是否无限重复执行',
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
        description: '基于条件执行子节点',
        canHaveChildren: true,
        canHaveParent: true,
        maxChildren: 1,
        minChildren: 1,
        className: 'ConditionalDecorator',
        namespace: 'behaviourTree/decorators',
        properties: {
            conditionCode: {
                name: '条件代码',
                type: 'code',
                value: '(context) => true',
                description: '条件判断函数代码',
                required: true
            }
        }
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
                description: '等待时间（秒）',
                required: true
            },
            randomVariance: {
                name: '随机变化',
                type: 'number',
                value: 0.0,
                description: '时间的随机变化量',
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
        icon: '🌳',
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

    // 条件节点 (基础条件) - 叶子节点，不能有子节点
    {
        type: 'execute-conditional',
        name: '执行条件',
        icon: '❓',
        category: 'condition',
        description: '执行自定义条件判断',
        canHaveChildren: false,
        canHaveParent: true,
        maxChildren: 0,
        className: 'ExecuteActionConditional',
        namespace: 'behaviourTree/conditionals',
        properties: {
            conditionCode: {
                name: '条件代码',
                type: 'code',
                value: '(context) => {\n  // 在这里编写条件判断逻辑\n  return TaskStatus.Success; // 或 TaskStatus.Failure\n}',
                description: '条件判断函数代码',
                required: true
            }
        }
    },

    // ECS专用节点 - 都是叶子节点
    {
        type: 'has-component',
        name: '检查组件',
        icon: '🔍',
        category: 'ecs',
        description: '检查实体是否包含指定组件',
        canHaveChildren: false,
        canHaveParent: true,
        maxChildren: 0,
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
        type: 'has-tag',
        name: '检查标签',
        icon: '🏷️',
        category: 'ecs',
        description: '检查实体是否具有指定标签',
        canHaveChildren: false,
        canHaveParent: true,
        maxChildren: 0,
        className: 'HasTagCondition',
        namespace: 'ecs-integration/behaviors',
        properties: {
            tag: {
                name: '标签值',
                type: 'number',
                value: 0,
                description: '要检查的标签值',
                required: true
            }
        }
    },
    {
        type: 'is-active',
        name: '检查激活状态',
        icon: '🔋',
        category: 'ecs',
        description: '检查实体是否处于激活状态',
        canHaveChildren: false,
        canHaveParent: true,
        maxChildren: 0,
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