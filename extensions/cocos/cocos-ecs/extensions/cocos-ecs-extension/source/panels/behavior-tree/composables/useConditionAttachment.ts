import { ref, reactive, Ref } from 'vue';
import { TreeNode } from '../types';
import { NodeTemplate } from '../data/nodeTemplates';

/**
 * 拖拽状态
 */
interface DragState {
    isDraggingCondition: boolean;
    conditionTemplate: NodeTemplate | null;
    mousePosition: { x: number, y: number } | null;
    hoveredDecoratorId: string | null;
}

/**
 * 条件节点吸附功能
 */
export function useConditionAttachment(
    treeNodes: Ref<TreeNode[]>,
    getNodeByIdLocal: (id: string) => TreeNode | undefined
) {
    
    const dragState = reactive<DragState>({
        isDraggingCondition: false,
        conditionTemplate: null,
        mousePosition: null,
        hoveredDecoratorId: null
    });

    /**
     * 检查节点是否为条件装饰器
     */
    const isConditionalDecorator = (node: TreeNode): boolean => {
        return node.type === 'conditional-decorator';
    };

    /**
     * 开始拖拽条件节点
     */
    const startConditionDrag = (event: DragEvent, template: NodeTemplate) => {
        console.log('🎯 开始条件拖拽:', template.name, template.isDraggableCondition);
        
        if (!template.isDraggableCondition) {
            console.warn('节点不是可拖拽条件:', template.name);
            return;
        }
        
        dragState.isDraggingCondition = true;
        dragState.conditionTemplate = template;
        
        if (event.dataTransfer) {
            event.dataTransfer.setData('application/json', JSON.stringify({
                ...template,
                isConditionDrag: true
            }));
            event.dataTransfer.effectAllowed = 'copy';
        }
        
        console.log('✅ 条件拖拽状态已设置:', dragState);
    };

    /**
     * 处理拖拽悬停在装饰器上
     */
    const handleDecoratorDragOver = (event: DragEvent, decoratorNode: TreeNode) => {
        console.log('🔀 装饰器拖拽悬停:', decoratorNode.name, decoratorNode.type, 'isDragging:', dragState.isDraggingCondition);
        
        // 检查传输数据
        const transferData = event.dataTransfer?.getData('application/json');
        if (transferData) {
            try {
                const data = JSON.parse(transferData);
                console.log('📦 传输数据:', data.isConditionDrag, data.isDraggableCondition, data.name);
            } catch (e) {
                console.log('❌ 传输数据解析失败:', transferData);
            }
        }
        
        if (!dragState.isDraggingCondition || !isConditionalDecorator(decoratorNode)) {
            console.log('❌ 不符合条件:', { 
                isDragging: dragState.isDraggingCondition, 
                isDecorator: isConditionalDecorator(decoratorNode),
                nodeType: decoratorNode.type 
            });
            return false;
        }
        
        event.preventDefault();
        event.stopPropagation();
        
        dragState.hoveredDecoratorId = decoratorNode.id;
        
        if (event.dataTransfer) {
            event.dataTransfer.dropEffect = 'copy';
        }
        
        console.log('✅ 装饰器可接受拖拽:', decoratorNode.name);
        return true;
    };

    /**
     * 处理拖拽离开装饰器
     */
    const handleDecoratorDragLeave = (decoratorNode: TreeNode) => {
        if (dragState.hoveredDecoratorId === decoratorNode.id) {
            dragState.hoveredDecoratorId = null;
        }
    };

    /**
     * 条件到装饰器属性的映射
     */
    const mapConditionToDecoratorProperties = (conditionTemplate: NodeTemplate): Record<string, any> => {
        const baseConfig = {
            conditionType: getConditionTypeFromTemplate(conditionTemplate),
            shouldReevaluate: true
        };

        switch (conditionTemplate.type) {
            case 'condition-random':
                return {
                    ...baseConfig,
                    successProbability: conditionTemplate.properties?.successProbability?.value || 0.5
                };

            case 'condition-component':
                return {
                    ...baseConfig,
                    componentType: conditionTemplate.properties?.componentType?.value || 'Component'
                };

            case 'condition-tag':
                return {
                    ...baseConfig,
                    tagValue: conditionTemplate.properties?.tagValue?.value || 0
                };

            case 'condition-active':
                return {
                    ...baseConfig,
                    checkHierarchy: conditionTemplate.properties?.checkHierarchy?.value || true
                };

            case 'condition-numeric':
                return {
                    ...baseConfig,
                    propertyPath: conditionTemplate.properties?.propertyPath?.value || 'context.someValue',
                    compareOperator: conditionTemplate.properties?.compareOperator?.value || 'greater',
                    compareValue: conditionTemplate.properties?.compareValue?.value || 0
                };

            case 'condition-property':
                return {
                    ...baseConfig,
                    propertyPath: conditionTemplate.properties?.propertyPath?.value || 'context.someProperty'
                };

            case 'condition-custom':
                return {
                    ...baseConfig,
                    conditionCode: conditionTemplate.properties?.conditionCode?.value || '(context) => true'
                };

            default:
                return baseConfig;
        }
    };

    /**
     * 获取条件类型字符串
     */
    const getConditionTypeFromTemplate = (template: NodeTemplate): string => {
        const typeMap: Record<string, string> = {
            'condition-random': 'random',
            'condition-component': 'hasComponent',
            'condition-tag': 'hasTag',
            'condition-active': 'isActive',
            'condition-numeric': 'numericCompare',
            'condition-property': 'propertyExists',
            'condition-custom': 'custom'
        };
        
        return typeMap[template.type] || 'custom';
    };

    /**
     * 执行条件吸附到装饰器
     */
    const attachConditionToDecorator = (
        event: DragEvent, 
        decoratorNode: TreeNode
    ): boolean => {
        console.log('🎯 执行条件吸附:', decoratorNode.name, dragState.conditionTemplate?.name);
        
        event.preventDefault();
        event.stopPropagation();
        
        if (!dragState.isDraggingCondition || !dragState.conditionTemplate) {
            console.log('❌ 拖拽状态无效:', { 
                isDragging: dragState.isDraggingCondition, 
                hasTemplate: !!dragState.conditionTemplate 
            });
            return false;
        }

        if (!isConditionalDecorator(decoratorNode)) {
            console.log('❌ 不是条件装饰器:', decoratorNode.type);
            return false;
        }

        // 获取条件配置
        const conditionConfig = mapConditionToDecoratorProperties(dragState.conditionTemplate);
        console.log('📝 条件配置:', conditionConfig);
        
        // 更新装饰器属性
        if (!decoratorNode.properties) {
            decoratorNode.properties = {};
        }
        
        Object.assign(decoratorNode.properties, conditionConfig);
        
        // 标记装饰器已附加条件
        decoratorNode.attachedCondition = {
            type: dragState.conditionTemplate.type,
            name: dragState.conditionTemplate.name,
            icon: dragState.conditionTemplate.icon
        };

        console.log('✅ 条件吸附成功!', decoratorNode.attachedCondition);

        // 重置拖拽状态
        resetDragState();
        
        return true;
    };

    /**
     * 处理画布拖拽事件（阻止条件节点创建为独立节点）
     */
    const handleCanvasDrop = (event: DragEvent): boolean => {
        const templateData = event.dataTransfer?.getData('application/json');
        if (!templateData) return false;
        
        try {
            const data = JSON.parse(templateData);
            // 如果是条件拖拽，阻止创建独立节点
            if (data.isConditionDrag || data.isDraggableCondition) {
                event.preventDefault();
                resetDragState();
                return true;
            }
        } catch (error) {
            // 忽略解析错误
        }
        
        return false;
    };

    /**
     * 重置拖拽状态
     */
    const resetDragState = () => {
        console.log('🔄 重置拖拽状态');
        dragState.isDraggingCondition = false;
        dragState.conditionTemplate = null;
        dragState.mousePosition = null;
        dragState.hoveredDecoratorId = null;
    };

    /**
     * 获取条件显示文本
     */
    const getConditionDisplayText = (decoratorNode: TreeNode): string => {
        if (!decoratorNode.attachedCondition || !decoratorNode.properties) {
            return '';
        }

        const conditionType = decoratorNode.properties.conditionType;
        
        switch (conditionType) {
            case 'random':
                const probability = decoratorNode.properties.successProbability || 0.5;
                return `${(probability * 100).toFixed(0)}%概率`;
                
            case 'hasComponent':
                return `有${decoratorNode.properties.componentType || 'Component'}`;
                
            case 'hasTag':
                return `标签=${decoratorNode.properties.tagValue || 0}`;
                
            case 'isActive':
                const checkHierarchy = decoratorNode.properties.checkHierarchy;
                return checkHierarchy ? '激活(含层级)' : '激活';
                
            case 'numericCompare':
                const path = decoratorNode.properties.propertyPath || 'value';
                const operator = decoratorNode.properties.compareOperator || '>';
                const value = decoratorNode.properties.compareValue || 0;
                return `${path} ${operator} ${value}`;
                
            case 'propertyExists':
                return `存在${decoratorNode.properties.propertyPath || 'property'}`;
                
            case 'custom':
                return '自定义条件';
                
            default:
                return decoratorNode.attachedCondition.name;
        }
    };

    /**
     * 移除装饰器的条件
     */
    const removeConditionFromDecorator = (decoratorNode: TreeNode) => {
        if (decoratorNode.attachedCondition) {
            delete decoratorNode.attachedCondition;
            
            // 完全清空所有属性，回到初始空白状态
            decoratorNode.properties = {};
        }
    };

    /**
     * 检查装饰器是否可以接受条件吸附
     */
    const canAcceptCondition = (decoratorNode: TreeNode): boolean => {
        return isConditionalDecorator(decoratorNode);
    };

    return {
        dragState,
        startConditionDrag,
        handleDecoratorDragOver,
        handleDecoratorDragLeave,
        attachConditionToDecorator,
        handleCanvasDrop,
        resetDragState,
        getConditionDisplayText,
        removeConditionFromDecorator,
        canAcceptCondition,
        isConditionalDecorator
    };
} 