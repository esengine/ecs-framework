import { Ref, computed } from 'vue';
import { TreeNode } from '../types';
import { NodeTemplate } from '../data/nodeTemplates';
import { getRootNode } from '../utils/nodeUtils';
import { getInstallStatusText, getInstallStatusClass } from '../utils/installUtils';
import { getGridStyle } from '../utils/canvasUtils';

/**
 * 计算属性管理
 */
export function useComputedProperties(
    nodeTemplates: Ref<NodeTemplate[]>,
    nodeSearchText: Ref<string>,
    treeNodes: Ref<TreeNode[]>,
    selectedNodeId: Ref<string | null>,
    selectedConditionNodeId: Ref<string | null>,
    checkingStatus: Ref<boolean>,
    isInstalling: Ref<boolean>,
    isInstalled: Ref<boolean>,
    version: Ref<string | null>,
    exportFormat: Ref<string>,
    panX: Ref<number>,
    panY: Ref<number>,
    zoomLevel: Ref<number>,
    getNodeByIdLocal: (id: string) => TreeNode | undefined,
    codeGeneration?: {
        generateConfigJSON: () => string;
        generateTypeScriptCode: () => string;
    }
) {
    // 过滤节点
    const filteredRootNodes = () => {
        return nodeTemplates.value.filter(node => 
            node.category === 'root' && 
            node.name.toLowerCase().includes(nodeSearchText.value.toLowerCase())
        );
    };

    const filteredCompositeNodes = () => {
        return nodeTemplates.value.filter(node => 
            node.category === 'composite' && 
            node.name.toLowerCase().includes(nodeSearchText.value.toLowerCase())
        );
    };
    
    const filteredDecoratorNodes = () => {
        return nodeTemplates.value.filter(node => 
            node.category === 'decorator' && 
            node.name.toLowerCase().includes(nodeSearchText.value.toLowerCase())
        );
    };
    
    const filteredActionNodes = () => {
        return nodeTemplates.value.filter(node => 
            node.category === 'action' && 
            node.name.toLowerCase().includes(nodeSearchText.value.toLowerCase())
        );
    };
    
    const filteredConditionNodes = () => {
        return nodeTemplates.value.filter(node => 
            node.category === 'condition' && 
            node.name.toLowerCase().includes(nodeSearchText.value.toLowerCase())
        );
    };

    const filteredECSNodes = () => {
        return nodeTemplates.value.filter(node => 
            node.category === 'ecs' && 
            node.name.toLowerCase().includes(nodeSearchText.value.toLowerCase())
        );
    };

    // 选中的节点 - 使用computed确保响应式更新
    const selectedNode = computed(() => {
        if (!selectedNodeId.value) return null;
        
        // 直接从treeNodes数组中查找，确保获取最新的节点状态
        const node = treeNodes.value.find(n => n.id === selectedNodeId.value);
        return node || null;
    });

    // 当前选中的条件节点（用于编辑条件属性）
    const selectedConditionNode = computed(() => {
        if (!selectedConditionNodeId.value) return null;
        const decoratorNode = treeNodes.value.find(n => n.id === selectedConditionNodeId.value);
        if (!decoratorNode || !decoratorNode.attachedCondition) return null;
        
        // 根据条件类型重新构建属性结构
        const conditionProperties = reconstructConditionProperties(
            decoratorNode.attachedCondition.type,
            decoratorNode.properties || {}
        );
        
        // 创建一个虚拟的条件节点对象，用于属性编辑
        return {
            id: decoratorNode.id + '_condition',
            name: decoratorNode.attachedCondition.name + '（条件）',
            type: decoratorNode.attachedCondition.type,
            icon: decoratorNode.attachedCondition.icon,
            properties: conditionProperties,
            isConditionNode: true,
            parentDecorator: decoratorNode
        };
    });

    /**
     * 根据条件类型重新构建属性结构
     * 将装饰器的扁平属性转换回条件模板的属性结构
     */
    const reconstructConditionProperties = (conditionType: string, decoratorProperties: Record<string, any>) => {
        switch (conditionType) {
            case 'condition-random':
                return {
                    successProbability: {
                        type: 'number',
                        name: '成功概率',
                        value: decoratorProperties.successProbability || 0.5,
                        description: '条件成功的概率 (0.0 - 1.0)'
                    }
                };

            case 'condition-component':
                return {
                    componentType: {
                        type: 'string',
                        name: '组件类型',
                        value: decoratorProperties.componentType || '',
                        description: '要检查的组件类型名称'
                    }
                };

            case 'condition-tag':
                return {
                    tagValue: {
                        type: 'number',
                        name: '标签值',
                        value: decoratorProperties.tagValue || 0,
                        description: '要检查的标签值'
                    }
                };

            case 'condition-active':
                return {
                    checkHierarchy: {
                        type: 'boolean',
                        name: '检查层级激活',
                        value: decoratorProperties.checkHierarchy || false,
                        description: '是否检查整个层级的激活状态'
                    }
                };

            case 'condition-numeric':
                return {
                    propertyPath: {
                        type: 'string',
                        name: '属性路径',
                        value: decoratorProperties.propertyPath || 'context.someValue',
                        description: '要比较的数值属性路径'
                    },
                    compareOperator: {
                        type: 'select',
                        name: '比较操作符',
                        value: decoratorProperties.compareOperator || 'greater',
                        options: ['greater', 'less', 'equal', 'greaterEqual', 'lessEqual', 'notEqual'],
                        description: '数值比较的操作符'
                    },
                    compareValue: {
                        type: 'number',
                        name: '比较值',
                        value: decoratorProperties.compareValue || 0,
                        description: '用于比较的目标值'
                    }
                };

            case 'condition-property':
                return {
                    propertyPath: {
                        type: 'string',
                        name: '属性路径',
                        value: decoratorProperties.propertyPath || 'context.someProperty',
                        description: '要检查的属性路径'
                    }
                };

            case 'condition-custom':
                return {
                    conditionCode: {
                        type: 'code',
                        name: '条件代码',
                        value: decoratorProperties.conditionCode || '(context) => true',
                        description: '自定义条件判断函数'
                    }
                };

            // Blackboard相关条件（使用实际的模板类型名）
            case 'blackboard-variable-exists':
                return {
                    variableName: {
                        type: 'string',
                        name: '变量名',
                        value: decoratorProperties.variableName || '',
                        description: '要检查的黑板变量名'
                    },
                    invert: {
                        type: 'boolean',
                        name: '反转结果',
                        value: decoratorProperties.invert || false,
                        description: '是否反转检查结果'
                    }
                };

            case 'blackboard-value-comparison':
                return {
                    variableName: {
                        type: 'string',
                        name: '变量名',
                        value: decoratorProperties.variableName || '',
                        description: '要比较的黑板变量名'
                    },
                    operator: {
                        type: 'select',
                        name: '比较操作符',
                        value: decoratorProperties.operator || 'equal',
                        options: ['equal', 'notEqual', 'greater', 'greaterOrEqual', 'less', 'lessOrEqual', 'contains', 'notContains'],
                        description: '比较操作类型'
                    },
                    compareValue: {
                        type: 'string',
                        name: '比较值',
                        value: decoratorProperties.compareValue || '',
                        description: '用于比较的值（留空则使用比较变量）'
                    },
                    compareVariable: {
                        type: 'string',
                        name: '比较变量名',
                        value: decoratorProperties.compareVariable || '',
                        description: '用于比较的另一个黑板变量名'
                    }
                };

            case 'blackboard-variable-type-check':
                return {
                    variableName: {
                        type: 'string',
                        name: '变量名',
                        value: decoratorProperties.variableName || '',
                        description: '要检查的黑板变量名'
                    },
                    expectedType: {
                        type: 'select',
                        name: '期望类型',
                        value: decoratorProperties.expectedType || 'string',
                        options: ['string', 'number', 'boolean', 'vector2', 'vector3', 'object', 'array'],
                        description: '期望的变量类型'
                    }
                };

            case 'blackboard-variable-range-check':
                return {
                    variableName: {
                        type: 'string',
                        name: '变量名',
                        value: decoratorProperties.variableName || '',
                        description: '要检查的数值型黑板变量名'
                    },
                    minValue: {
                        type: 'number',
                        name: '最小值',
                        value: decoratorProperties.minValue || 0,
                        description: '范围的最小值（包含）'
                    },
                    maxValue: {
                        type: 'number',
                        name: '最大值',
                        value: decoratorProperties.maxValue || 100,
                        description: '范围的最大值（包含）'
                    }
                };

            default:
                // 对于未知的条件类型，尝试从装饰器属性中推断
                const reconstructed: Record<string, any> = {};
                Object.keys(decoratorProperties).forEach(key => {
                    if (key !== 'conditionType') {
                        reconstructed[key] = {
                            type: typeof decoratorProperties[key] === 'number' ? 'number' :
                                  typeof decoratorProperties[key] === 'boolean' ? 'boolean' : 'string',
                            name: key,
                            value: decoratorProperties[key],
                            description: `${key}参数`
                        };
                    }
                });
                return reconstructed;
        }
    };

    // 当前显示在属性面板的节点（普通节点或条件节点）
    const activeNode = computed(() => selectedConditionNode.value || selectedNode.value);

    // 根节点
    const rootNode = () => {
        return getRootNode(treeNodes.value);
    };

    // 安装状态
    const installStatusClass = () => {
        return getInstallStatusClass(isInstalling.value, isInstalled.value);
    };

    const installStatusText = () => {
        return getInstallStatusText(
            checkingStatus.value, 
            isInstalling.value, 
            isInstalled.value, 
            version.value
        );
    };

    // 验证结果
    const validationResult = () => {
        if (treeNodes.value.length === 0) {
            return { isValid: false, message: '行为树为空' };
        }
        const root = rootNode();
        if (!root) {
            return { isValid: false, message: '缺少根节点' };
        }
        return { isValid: true, message: '行为树结构有效' };
    };

    // 导出代码
    const exportedCode = () => {
        if (!codeGeneration) {
            return '// 代码生成器未初始化';
        }
        
        try {
            if (exportFormat.value === 'json') {
                return codeGeneration.generateConfigJSON();
            } else {
                return codeGeneration.generateTypeScriptCode();
            }
        } catch (error) {
            return `// 代码生成失败: ${error}`;
        }
    };

    // 网格样式
    const gridStyle = () => {
        return getGridStyle(panX.value, panY.value, zoomLevel.value);
    };

    return {
        filteredRootNodes,
        filteredCompositeNodes,
        filteredDecoratorNodes,
        filteredActionNodes,
        filteredConditionNodes,
        filteredECSNodes,
        selectedNode,
        selectedConditionNode,
        activeNode,
        rootNode,
        installStatusClass,
        installStatusText,
        validationResult,
        exportedCode,
        gridStyle
    };
} 