import { Ref } from 'vue';
import { TreeNode, DragState } from '../types';
import { getCanvasCoordinates, constrainZoom } from './canvasUtils';

export interface CanvasManager {
    onCanvasMouseDown: (event: MouseEvent) => void;
    onCanvasMouseMove: (event: MouseEvent) => void;
    onCanvasMouseUp: (event: MouseEvent) => void;
    onCanvasWheel: (event: WheelEvent) => void;
    zoomIn: () => void;
    zoomOut: () => void;
    resetZoom: () => void;
    centerView: () => void;
    startNodeDrag: (event: MouseEvent, node: TreeNode) => void;
}

export function createCanvasManager(
    canvasWidth: Ref<number>,
    canvasHeight: Ref<number>,
    zoomLevel: Ref<number>,
    panX: Ref<number>,
    panY: Ref<number>,
    dragState: Ref<DragState>,
    treeNodes: Ref<TreeNode[]>,
    getNodeByIdLocal: (id: string) => TreeNode | undefined,
    selectNode: (nodeId: string) => void,
    updateConnectionsThrottled: () => void,
    connectionManager: { updateTempConnection: (nodeId: string, portType: string, targetX: number, targetY: number) => void },
    findCanvasElement: () => HTMLElement | null,
    getSVGInternalCoords: (event: MouseEvent, canvasElement: HTMLElement | null) => { x: number, y: number }
): CanvasManager {
    
    const UPDATE_THROTTLE = 16; // 60fps
    let animationFrameId: number | null = null;
    let lastUpdateTime = 0;

    const onCanvasMouseDown = (event: MouseEvent) => {
        if (event.button !== 0) return; // 只处理左键
        
        dragState.value.isDraggingCanvas = true;
        dragState.value.dragStartX = event.clientX;
        dragState.value.dragStartY = event.clientY;
    };

    const onCanvasMouseMove = (event: MouseEvent) => {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        
        animationFrameId = requestAnimationFrame(() => {
            const currentTime = performance.now();
            if (currentTime - lastUpdateTime < UPDATE_THROTTLE) {
                return;
            }
            lastUpdateTime = currentTime;
            
            if (dragState.value.isDraggingCanvas) {
                const deltaX = event.clientX - dragState.value.dragStartX;
                const deltaY = event.clientY - dragState.value.dragStartY;
                
                panX.value += deltaX;
                panY.value += deltaY;
                
                dragState.value.dragStartX = event.clientX;
                dragState.value.dragStartY = event.clientY;
            } else if (dragState.value.isDraggingNode && dragState.value.dragNodeId) {
                const node = getNodeByIdLocal(dragState.value.dragNodeId);
                if (node) {
                    const deltaX = (event.clientX - dragState.value.dragStartX) / zoomLevel.value;
                    const deltaY = (event.clientY - dragState.value.dragStartY) / zoomLevel.value;
                    
                    node.x = dragState.value.dragNodeStartX + deltaX;
                    node.y = dragState.value.dragNodeStartY + deltaY;
                    
                    updateConnectionsThrottled();
                }
            } else if (dragState.value.isConnecting && dragState.value.connectionStart) {
                let canvasElement = event.currentTarget as HTMLElement | null;
                if (!canvasElement) {
                    canvasElement = findCanvasElement();
                }
                
                if (canvasElement) {
                    const { x, y } = getSVGInternalCoords(event, canvasElement);
                    
                    dragState.value.connectionEnd.x = x;
                    dragState.value.connectionEnd.y = y;
                    
                    connectionManager.updateTempConnection(
                        dragState.value.connectionStart.nodeId,
                        dragState.value.connectionStart.portType,
                        x,
                        y
                    );
                }
            }
        });
    };

    const onCanvasMouseUp = (event: MouseEvent) => {
        if (dragState.value.isDraggingCanvas) {
            dragState.value.isDraggingCanvas = false;
        } else if (dragState.value.isDraggingNode) {
            // 恢复过渡效果
            if (dragState.value.dragNodeId) {
                const nodeElement = document.querySelector(`[data-node-id="${dragState.value.dragNodeId}"]`) as HTMLElement;
                if (nodeElement) {
                    nodeElement.style.transition = '';
                }
            }
            
            dragState.value.isDraggingNode = false;
            dragState.value.dragNodeId = null;
        }
        
        // 清理动画帧
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
    };

    const onCanvasWheel = (event: WheelEvent) => {
        event.preventDefault();
        if (event.deltaY < 0) {
            zoomIn();
        } else {
            zoomOut();
        }
    };

    const zoomIn = () => {
        zoomLevel.value = constrainZoom(zoomLevel.value * 1.2);
    };

    const zoomOut = () => {
        zoomLevel.value = constrainZoom(zoomLevel.value / 1.2);
    };

    const resetZoom = () => {
        zoomLevel.value = 1;
        panX.value = 0;
        panY.value = 0;
    };

    const centerView = () => {
        if (treeNodes.value.length === 0) return;
        
        // 计算所有节点的边界
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        
        treeNodes.value.forEach(node => {
            minX = Math.min(minX, node.x);
            minY = Math.min(minY, node.y);
            maxX = Math.max(maxX, node.x + 150);
            maxY = Math.max(maxY, node.y + 100);
        });
        
        // 计算中心点
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        
        // 设置平移，使内容居中
        panX.value = canvasWidth.value / 2 - centerX * zoomLevel.value;
        panY.value = canvasHeight.value / 2 - centerY * zoomLevel.value;
    };

    const startNodeDrag = (event: MouseEvent, node: TreeNode) => {
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
        
        dragState.value.isDraggingNode = true;
        dragState.value.dragNodeId = node.id;
        dragState.value.dragStartX = event.clientX;
        dragState.value.dragStartY = event.clientY;
        dragState.value.dragNodeStartX = node.x;
        dragState.value.dragNodeStartY = node.y;
        
        const nodeElement = document.querySelector(`[data-node-id="${node.id}"]`) as HTMLElement;
        if (nodeElement) {
            nodeElement.style.transition = 'none';
        }
        
        selectNode(node.id);
    };

    return {
        onCanvasMouseDown,
        onCanvasMouseMove,
        onCanvasMouseUp,
        onCanvasWheel,
        zoomIn,
        zoomOut,
        resetZoom,
        centerView,
        startNodeDrag
    };
} 