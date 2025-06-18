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
        
        // 创建一个虚拟的条件节点对象，用于属性编辑
        return {
            id: decoratorNode.id + '_condition',
            name: decoratorNode.attachedCondition.name + '（条件）',
            type: decoratorNode.attachedCondition.type,
            icon: decoratorNode.attachedCondition.icon,
            properties: decoratorNode.properties || {},
            isConditionNode: true,
            parentDecorator: decoratorNode
        };
    });

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