import { DragState, TreeNode } from '../types';
import { getCanvasCoordinates } from './canvasUtils';
import { createTempConnectionPath, updateAllConnections } from './connectionUtils';
import { getNodeById } from './nodeUtils';

/**
 * 节流函数工厂
 */
export function createThrottledFunction<T extends (...args: any[]) => void>(
    fn: T,
    delay: number = 16
): (...args: Parameters<T>) => void {
    let timeoutId: number | null = null;
    
    return (...args: Parameters<T>) => {
        if (timeoutId) {
            cancelAnimationFrame(timeoutId);
        }
        timeoutId = requestAnimationFrame(() => {
            fn(...args);
        });
    };
}

/**
 * 处理画布鼠标移动事件
 */
export function handleCanvasMouseMove(
    event: MouseEvent,
    dragState: DragState,
    panX: { value: number },
    panY: { value: number },
    zoomLevel: number,
    nodes: TreeNode[],
    updateConnections: () => void,
    updateTempConnection: (nodeId: string, portType: string, x: number, y: number) => void
): void {
    if (dragState.isDraggingCanvas) {
        const deltaX = event.clientX - dragState.dragStartX;
        const deltaY = event.clientY - dragState.dragStartY;
        
        panX.value += deltaX;
        panY.value += deltaY;
        
        dragState.dragStartX = event.clientX;
        dragState.dragStartY = event.clientY;
        
    } else if (dragState.isDraggingNode && dragState.dragNodeId) {
        const node = getNodeById(nodes, dragState.dragNodeId);
        if (node) {
            const deltaX = (event.clientX - dragState.dragStartX) / zoomLevel;
            const deltaY = (event.clientY - dragState.dragStartY) / zoomLevel;
            
            node.x = dragState.dragNodeStartX + deltaX;
            node.y = dragState.dragNodeStartY + deltaY;
            
            updateConnections();
        }
        
    } else if (dragState.isConnecting && dragState.connectionStart) {
        let canvasElement = event.currentTarget as HTMLElement | null;
        if (!canvasElement) {
            canvasElement = document.querySelector('.canvas-area') as HTMLElement | null;
        }
        
        if (canvasElement) {
            const { x, y } = getCanvasCoordinates(event, canvasElement, panX.value, panY.value, zoomLevel);
            
            dragState.connectionEnd.x = x;
            dragState.connectionEnd.y = y;
            
            updateTempConnection(
                dragState.connectionStart.nodeId,
                dragState.connectionStart.portType,
                x,
                y
            );
        }
    }
}

/**
 * 开始节点拖拽
 */
export function startNodeDrag(
    event: MouseEvent,
    node: TreeNode,
    dragState: DragState,
    selectNode: (id: string) => void
): void {
    // 检查是否点击的是端口或删除按钮
    const target = event.target as HTMLElement;
    if (target.classList.contains('port') || 
        target.classList.contains('node-delete') ||
        target.closest('.port') ||
        target.closest('.node-delete')) {
        return; // 不启动节点拖拽
    }
    
    event.stopPropagation();
    
    if (event.button !== 0) return; // 只处理左键
    
    dragState.isDraggingNode = true;
    dragState.dragNodeId = node.id;
    dragState.dragStartX = event.clientX;
    dragState.dragStartY = event.clientY;
    dragState.dragNodeStartX = node.x;
    dragState.dragNodeStartY = node.y;
    
    const nodeElement = document.querySelector(`[data-node-id="${node.id}"]`) as HTMLElement;
    if (nodeElement) {
        nodeElement.style.transition = 'none';
    }
    
    selectNode(node.id);
}

/**
 * 开始连接拖拽
 */
export function startConnection(
    event: MouseEvent,
    nodeId: string,
    portType: string,
    dragState: DragState,
    nodes: TreeNode[],
    panX: number,
    panY: number,
    zoomLevel: number,
    updateTempConnection: (nodeId: string, portType: string, x: number, y: number) => void
): void {
    event.stopPropagation();
    event.preventDefault();
    
    const node = getNodeById(nodes, nodeId);
    if (!node) return;
    
    dragState.isConnecting = true;
    dragState.connectionStart = { nodeId, portType };
    
    const canvasElement = document.querySelector('.canvas-area') as HTMLElement | null;
    if (canvasElement) {
        const { x, y } = getCanvasCoordinates(event, canvasElement, panX, panY, zoomLevel);
        dragState.connectionEnd.x = x;
        dragState.connectionEnd.y = y;
        
        updateTempConnection(nodeId, portType, x, y);
    } else {
        const target = event.target as HTMLElement;
        const rect = target.getBoundingClientRect();
        dragState.connectionEnd.x = event.clientX - rect.left;
        dragState.connectionEnd.y = event.clientY - rect.top;
        
        updateTempConnection(nodeId, portType, dragState.connectionEnd.x, dragState.connectionEnd.y);
    }
}

/**
 * 处理鼠标释放事件
 */
export function handleMouseUp(
    event: MouseEvent,
    dragState: DragState,
    cleanupDrag: () => void
): void {
    if (dragState.isDraggingCanvas) {
        dragState.isDraggingCanvas = false;
        
    } else if (dragState.isDraggingNode) {
        // 恢复过渡效果
        if (dragState.dragNodeId) {
            const nodeElement = document.querySelector(`[data-node-id="${dragState.dragNodeId}"]`) as HTMLElement;
            if (nodeElement) {
                nodeElement.style.transition = '';
            }
        }
        
        dragState.isDraggingNode = false;
        dragState.dragNodeId = null;
        
    } else if (dragState.isConnecting) {
        // 连接拖拽结束的处理由外部函数处理
        return;
    }
    
    cleanupDrag();
}

/**
 * 取消连接拖拽
 */
export function cancelConnection(
    dragState: DragState,
    tempConnection: { path: string }
): void {
    dragState.isConnecting = false;
    dragState.connectionStart = null;
    tempConnection.path = '';
}

/**
 * 创建更新临时连接的函数
 */
export function createTempConnectionUpdater(
    nodes: TreeNode[],
    tempConnection: { path: string }
) {
    return (nodeId: string, portType: string, targetX: number, targetY: number) => {
        const node = getNodeById(nodes, nodeId);
        if (!node) return;
        
        tempConnection.path = createTempConnectionPath(node, portType, targetX, targetY);
    };
}

/**
 * 创建节流版本的连接更新函数
 */
export function createThrottledConnectionUpdater(
    connections: any[],
    nodes: TreeNode[],
    onUpdate: (connections: any[]) => void
) {
    return createThrottledFunction(() => {
        const updatedConnections = updateAllConnections(connections, nodes);
        onUpdate(updatedConnections);
    });
} 