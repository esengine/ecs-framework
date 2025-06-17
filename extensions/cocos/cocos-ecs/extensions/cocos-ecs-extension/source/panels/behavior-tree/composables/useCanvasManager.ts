import { Ref, ref } from 'vue';
import { TreeNode, DragState } from '../types';

/**
 * 画布管理功能
 */
export function useCanvasManager(
    panX: Ref<number>,
    panY: Ref<number>,
    zoomLevel: Ref<number>,
    treeNodes: Ref<TreeNode[]>,
    selectedNodeId: Ref<string | null>,
    canvasAreaRef: Ref<HTMLElement | null>,
    updateConnections: () => void
) {
    // 画布尺寸 - 使用默认值或从DOM获取
    const canvasWidth = ref(800);
    const canvasHeight = ref(600);
    
    // 拖拽状态
    const dragState = ref<DragState>({
        isDraggingCanvas: false,
        isDraggingNode: false,
        dragNodeId: null,
        dragStartX: 0,
        dragStartY: 0,
        dragNodeStartX: 0,
        dragNodeStartY: 0,
        isConnecting: false,
        connectionStart: null,
        connectionEnd: { x: 0, y: 0 }
    });
    
    // 如果有canvas引用，更新尺寸
    if (canvasAreaRef.value) {
        const rect = canvasAreaRef.value.getBoundingClientRect();
        canvasWidth.value = rect.width;
        canvasHeight.value = rect.height;
    }

    // 画布操作功能
    const onCanvasWheel = (event: WheelEvent) => {
        event.preventDefault();
        
        const zoomSpeed = 0.1;
        const delta = event.deltaY > 0 ? -zoomSpeed : zoomSpeed;
        const newZoom = Math.max(0.1, Math.min(3, zoomLevel.value + delta));
        
        zoomLevel.value = newZoom;
    };

    const onCanvasMouseDown = (event: MouseEvent) => {
        // 只在空白区域开始画布拖拽
        if (event.target === event.currentTarget) {
            dragState.value.isDraggingCanvas = true;
            dragState.value.dragStartX = event.clientX;
            dragState.value.dragStartY = event.clientY;
            
            document.addEventListener('mousemove', onCanvasMouseMove);
            document.addEventListener('mouseup', onCanvasMouseUp);
        }
    };

    const onCanvasMouseMove = (event: MouseEvent) => {
        if (dragState.value.isDraggingCanvas) {
            const deltaX = event.clientX - dragState.value.dragStartX;
            const deltaY = event.clientY - dragState.value.dragStartY;
            
            panX.value += deltaX;
            panY.value += deltaY;
            
            dragState.value.dragStartX = event.clientX;
            dragState.value.dragStartY = event.clientY;
        }
    };

    const onCanvasMouseUp = (event: MouseEvent) => {
        if (dragState.value.isDraggingCanvas) {
            dragState.value.isDraggingCanvas = false;
            
            document.removeEventListener('mousemove', onCanvasMouseMove);
            document.removeEventListener('mouseup', onCanvasMouseUp);
        }
    };

    // 缩放控制
    const zoomIn = () => {
        zoomLevel.value = Math.min(3, zoomLevel.value + 0.1);
    };

    const zoomOut = () => {
        zoomLevel.value = Math.max(0.1, zoomLevel.value - 0.1);
    };

    const resetZoom = () => {
        zoomLevel.value = 1;
    };

    const centerView = () => {
        if (treeNodes.value.length === 0) {
            panX.value = 0;
            panY.value = 0;
            return;
        }
        
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        
        treeNodes.value.forEach(node => {
            // 尝试从DOM获取实际节点尺寸，否则使用默认值
            const nodeElement = document.querySelector(`[data-node-id="${node.id}"]`);
            let nodeWidth = 150;
            let nodeHeight = 80; // 使用基础高度
            
            if (nodeElement) {
                const rect = nodeElement.getBoundingClientRect();
                nodeWidth = rect.width / zoomLevel.value;
                nodeHeight = rect.height / zoomLevel.value;
            }
            
            minX = Math.min(minX, node.x);
            minY = Math.min(minY, node.y);
            maxX = Math.max(maxX, node.x + nodeWidth);
            maxY = Math.max(maxY, node.y + nodeHeight);
        });
        
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        
        panX.value = canvasWidth.value / 2 - centerX * zoomLevel.value;
        panY.value = canvasHeight.value / 2 - centerY * zoomLevel.value;
    };

    // 网格样式计算
    const gridStyle = () => {
        const gridSize = 20 * zoomLevel.value;
        return {
            backgroundSize: `${gridSize}px ${gridSize}px`,
            backgroundPosition: `${panX.value % gridSize}px ${panY.value % gridSize}px`
        };
    };

    // 节点拖拽功能
    const startNodeDrag = (event: MouseEvent, node: any) => {
        event.preventDefault();
        event.stopPropagation();
        
        dragState.value.isDraggingNode = true;
        dragState.value.dragNodeId = node.id;
        dragState.value.dragStartX = event.clientX;
        dragState.value.dragStartY = event.clientY;
        dragState.value.dragNodeStartX = node.x;
        dragState.value.dragNodeStartY = node.y;
        
        const nodeElement = event.currentTarget as HTMLElement;
        nodeElement.classList.add('dragging');
        
        document.addEventListener('mousemove', onNodeDrag);
        document.addEventListener('mouseup', onNodeDragEnd);
    };

    const onNodeDrag = (event: MouseEvent) => {
        if (!dragState.value.isDraggingNode || !dragState.value.dragNodeId) return;
        
        const deltaX = (event.clientX - dragState.value.dragStartX) / zoomLevel.value;
        const deltaY = (event.clientY - dragState.value.dragStartY) / zoomLevel.value;
        
        const node = treeNodes.value.find(n => n.id === dragState.value.dragNodeId);
        if (node) {
            node.x = dragState.value.dragNodeStartX + deltaX;
            node.y = dragState.value.dragNodeStartY + deltaY;
            
            updateConnections();
        }
    };

    const onNodeDragEnd = (event: MouseEvent) => {
        if (dragState.value.isDraggingNode) {
            const draggingNodes = document.querySelectorAll('.tree-node.dragging');
            draggingNodes.forEach(node => node.classList.remove('dragging'));
            
            dragState.value.isDraggingNode = false;
            dragState.value.dragNodeId = null;
            
            updateConnections();
            
            document.removeEventListener('mousemove', onNodeDrag);
            document.removeEventListener('mouseup', onNodeDragEnd);
        }
    };

    return {
        onCanvasWheel,
        onCanvasMouseDown,
        onCanvasMouseMove,
        onCanvasMouseUp,
        zoomIn,
        zoomOut,
        resetZoom,
        centerView,
        gridStyle,
        startNodeDrag
    };
} 