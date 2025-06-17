import { ref } from 'vue';
import { TreeNode, DragState, Connection } from '../types';
import { nodeTemplates } from '../data/nodeTemplates';

/**
 * 应用状态管理
 */
export function useAppState() {
    // 安装状态
    const checkingStatus = ref(true);
    const isInstalled = ref(false);
    const version = ref<string | null>(null);
    const isInstalling = ref(false);
    
    // 编辑器状态
    const nodeTemplates_ = ref(nodeTemplates);
    const treeNodes = ref<TreeNode[]>([]);
    const selectedNodeId = ref<string | null>(null);
    const nodeSearchText = ref('');
    
    // 画布状态
    const canvasWidth = ref(800);
    const canvasHeight = ref(600);
    const zoomLevel = ref(1);
    const panX = ref(0);
    const panY = ref(0);
    
    const dragState = ref<DragState>({
        isDraggingCanvas: false,
        isDraggingNode: false,
        isConnecting: false,
        dragStartX: 0,
        dragStartY: 0,
        dragNodeId: null,
        dragNodeStartX: 0,
        dragNodeStartY: 0,
        connectionStart: null,
        connectionEnd: { x: 0, y: 0 }
    });
    
    // 连接状态
    const connections = ref<Connection[]>([]);
    const tempConnection = ref({ path: '' });
    
    // UI状态
    const showExportModal = ref(false);
    const exportFormat = ref('json');
    
    // 工具函数
    const getNodeByIdLocal = (id: string): TreeNode | undefined => {
        return treeNodes.value.find(node => node.id === id);
    };

    const selectNode = (nodeId: string) => {
        selectedNodeId.value = nodeId;
    };

    const newBehaviorTree = () => {
        treeNodes.value = [];
        selectedNodeId.value = null;
        connections.value = [];
        tempConnection.value.path = '';
    };

    const updateCanvasSize = () => {
        const canvasArea = document.querySelector('.canvas-area') as HTMLElement;
        if (canvasArea) {
            const rect = canvasArea.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
                canvasWidth.value = Math.max(rect.width, 800);
                canvasHeight.value = Math.max(rect.height, 600);
            }
        }
    };

    return {
        // 安装状态
        checkingStatus,
        isInstalled,
        version,
        isInstalling,
        
        // 编辑器状态
        nodeTemplates: nodeTemplates_,
        treeNodes,
        selectedNodeId,
        nodeSearchText,
        
        // 画布状态
        canvasWidth,
        canvasHeight,
        zoomLevel,
        panX,
        panY,
        dragState,
        
        // 连接状态
        connections,
        tempConnection,
        
        // UI状态
        showExportModal,
        exportFormat,
        
        // 工具函数
        getNodeByIdLocal,
        selectNode,
        newBehaviorTree,
        updateCanvasSize
    };
} 