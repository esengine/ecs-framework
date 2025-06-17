import { ref, computed, reactive, onMounted, onUnmounted, nextTick } from 'vue';
import { useAppState } from './useAppState';
import { useComputedProperties } from './useComputedProperties';
import { useNodeOperations } from './useNodeOperations';
import { useCodeGeneration } from './useCodeGeneration';
import { useInstallation } from './useInstallation';
import { useFileOperations } from './useFileOperations';
import { useConnectionManager } from './useConnectionManager';
import { useCanvasManager } from './useCanvasManager';
import { useNodeDisplay } from './useNodeDisplay';

/**
 * 主要的行为树编辑器组合功能
 */
export function useBehaviorTreeEditor() {
    // Vue Refs for DOM elements
    const canvasAreaRef = ref<HTMLElement | null>(null);
    const svgRef = ref<SVGElement | null>(null);
    
    // 获取其他组合功能
    const appState = useAppState();
    
    // 临时根节点获取函数
    const getRootNode = () => {
        return appState.treeNodes.value.find(node => 
            !appState.treeNodes.value.some(otherNode => 
                otherNode.children?.includes(node.id)
            )
        ) || null;
    };
    
    const codeGen = useCodeGeneration(
        appState.treeNodes,
        appState.nodeTemplates,
        appState.getNodeByIdLocal,
        getRootNode
    );
    
    const computedProps = useComputedProperties(
        appState.nodeTemplates,
        appState.nodeSearchText,
        appState.treeNodes,
        appState.selectedNodeId,
        appState.checkingStatus,
        appState.isInstalling,
        appState.isInstalled,
        appState.version,
        appState.exportFormat,
        appState.panX,
        appState.panY,
        appState.zoomLevel,
        appState.getNodeByIdLocal,
        {
            generateConfigJSON: codeGen.generateConfigJSON,
            generateTypeScriptCode: codeGen.generateTypeScriptCode
        }
    );
    
    const nodeOps = useNodeOperations(
        appState.treeNodes,
        appState.selectedNodeId,
        appState.connections,
        appState.panX,
        appState.panY,
        appState.zoomLevel,
        appState.getNodeByIdLocal,
        () => connectionManager.updateConnections()
    );
    
    const installation = useInstallation(
        appState.checkingStatus,
        appState.isInstalled,
        appState.version,
        appState.isInstalling
    );
    
    const fileOps = useFileOperations(
        appState.treeNodes,
        appState.selectedNodeId,
        appState.connections,
        appState.tempConnection,
        appState.showExportModal,
        codeGen,
        () => connectionManager.updateConnections()
    );

    const connectionState = reactive({
        isConnecting: false,
        startNodeId: null as string | null,
        startPortType: null as 'input' | 'output' | null,
        tempPath: '',
        currentMousePos: null as { x: number, y: number } | null,
        startPortPos: null as { x: number, y: number } | null,
        hoveredPort: null as { nodeId: string, portType: 'input' | 'output' } | null
    });

    const connectionManager = useConnectionManager(
        appState.treeNodes,
        appState.connections,
        connectionState,
        canvasAreaRef,
        svgRef,
        appState.panX,
        appState.panY,
        appState.zoomLevel
    );

    const canvasManager = useCanvasManager(
        appState.panX,
        appState.panY,
        appState.zoomLevel,
        appState.treeNodes,
        appState.selectedNodeId,
        canvasAreaRef,
        connectionManager.updateConnections
    );

    const nodeDisplay = useNodeDisplay();

    const dragState = reactive({
        isDragging: false,
        dragNode: null as any,
        dragElement: null as HTMLElement | null,
        dragOffset: { x: 0, y: 0 },
        startPosition: { x: 0, y: 0 },
        updateCounter: 0
    });

    const startNodeDrag = (event: MouseEvent, node: any) => {
        event.stopPropagation();
        event.preventDefault();
        
        dragState.isDragging = true;
        dragState.dragNode = node;
        dragState.startPosition = { x: event.clientX, y: event.clientY };
        
        dragState.dragElement = document.querySelector(`[data-node-id="${node.id}"]`) as HTMLElement;
        if (dragState.dragElement) {
            dragState.dragElement.classList.add('dragging');
        }
        
        dragState.dragOffset = {
            x: node.x,
            y: node.y
        };
        
        document.addEventListener('mousemove', onNodeDrag);
        document.addEventListener('mouseup', onNodeDragEnd);
    };

    const onNodeDrag = (event: MouseEvent) => {
        if (!dragState.isDragging || !dragState.dragNode) return;
        
        const deltaX = (event.clientX - dragState.startPosition.x) / appState.zoomLevel.value;
        const deltaY = (event.clientY - dragState.startPosition.y) / appState.zoomLevel.value;
        
        dragState.dragNode.x = dragState.dragOffset.x + deltaX;
        dragState.dragNode.y = dragState.dragOffset.y + deltaY;
        
        connectionManager.updateConnections();
    };

    const onNodeDragEnd = (event: MouseEvent) => {
        if (!dragState.isDragging) return;
        
        if (dragState.dragElement) {
            dragState.dragElement.classList.remove('dragging');
        }
        
        dragState.isDragging = false;
        dragState.dragNode = null;
        dragState.dragElement = null;
        
        document.removeEventListener('mousemove', onNodeDrag);
        document.removeEventListener('mouseup', onNodeDragEnd);
        
        connectionManager.updateConnections();
        dragState.updateCounter = 0;
    };

    const handleInstall = () => {
        installation.handleInstall();
    };

    // 组件挂载时初始化连接
    onMounted(() => {
        // 延迟一下确保 DOM 已经渲染
        nextTick(() => {
            connectionManager.updateConnections();
        });
    });

    onUnmounted(() => {
        document.removeEventListener('mousemove', onNodeDrag);
        document.removeEventListener('mouseup', onNodeDragEnd);
    });

    return {
        canvasAreaRef,
        svgRef,
        ...appState,
        ...computedProps,
        ...nodeOps,
        ...fileOps,
        ...codeGen,
        ...installation,
        handleInstall,
        connectionState,
        ...connectionManager,
        ...canvasManager,
        ...nodeDisplay,
        startNodeDrag,
        dragState
    };
} 