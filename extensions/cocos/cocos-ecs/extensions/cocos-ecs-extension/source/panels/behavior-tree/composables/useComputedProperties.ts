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
        filteredCompositeNodes,
        filteredDecoratorNodes,
        filteredActionNodes,
        filteredConditionNodes,
        filteredECSNodes,
        selectedNode,
        rootNode,
        installStatusClass,
        installStatusText,
        validationResult,
        exportedCode,
        gridStyle
    };
} 