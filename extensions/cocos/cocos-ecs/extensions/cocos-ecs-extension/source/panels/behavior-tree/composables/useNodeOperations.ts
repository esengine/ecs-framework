import { Ref } from 'vue';
import { TreeNode, Connection } from '../types';
import { NodeTemplate } from '../data/nodeTemplates';
import { createNodeFromTemplate } from '../utils/nodeUtils';
import { getCanvasCoordinates } from '../utils/canvasUtils';

/**
 * 节点操作管理
 */
export function useNodeOperations(
    treeNodes: Ref<TreeNode[]>,
    selectedNodeId: Ref<string | null>,
    connections: Ref<Connection[]>,
    panX: Ref<number>,
    panY: Ref<number>,
    zoomLevel: Ref<number>,
    getNodeByIdLocal: (id: string) => TreeNode | undefined
) {
    
    // 获取相对于画布的坐标（用于节点拖放等操作）
    const getCanvasCoords = (event: MouseEvent, canvasElement: HTMLElement | null) => {
        return getCanvasCoordinates(event, canvasElement, panX.value, panY.value, zoomLevel.value);
    };

    // 拖拽事件处理
    const onNodeDragStart = (event: DragEvent, template: NodeTemplate) => {
        if (event.dataTransfer) {
            event.dataTransfer.setData('application/json', JSON.stringify(template));
            event.dataTransfer.effectAllowed = 'copy';
        }
    };

    const onCanvasDragOver = (event: DragEvent) => {
        event.preventDefault();
        if (event.dataTransfer) {
            event.dataTransfer.dropEffect = 'copy';
        }
    };

    const onCanvasDrop = (event: DragEvent) => {
        event.preventDefault();
        
        const templateData = event.dataTransfer?.getData('application/json');
        if (!templateData) return;
        
        try {
            const template: NodeTemplate = JSON.parse(templateData);
            const canvasElement = event.currentTarget as HTMLElement;
            const { x, y } = getCanvasCoords(event, canvasElement);
            
            const newNode = createNodeFromTemplate(template, x, y);
            treeNodes.value.push(newNode);
            selectedNodeId.value = newNode.id;
            
        } catch (error) {
            console.error('节点创建失败:', error);
        }
    };

    // 节点删除（递归删除子节点）
    const deleteNode = (nodeId: string) => {
        const deleteRecursive = (id: string) => {
            const node = getNodeByIdLocal(id);
            if (!node) return;
            
            // 递归删除子节点
            node.children.forEach(childId => deleteRecursive(childId));
            
            // 从父节点的children中移除
            if (node.parent) {
                const parent = getNodeByIdLocal(node.parent);
                if (parent) {
                    const index = parent.children.indexOf(id);
                    if (index > -1) {
                        parent.children.splice(index, 1);
                    }
                }
            }
            
            // 移除连接
            connections.value = connections.value.filter(conn => 
                conn.sourceId !== id && conn.targetId !== id
            );
            
            // 从树中移除节点
            const nodeIndex = treeNodes.value.findIndex(n => n.id === id);
            if (nodeIndex > -1) {
                treeNodes.value.splice(nodeIndex, 1);
            }
        };
        
        deleteRecursive(nodeId);
        
        if (selectedNodeId.value === nodeId) {
            selectedNodeId.value = null;
        }
    };

    // 节点属性更新
    const updateNodeProperty = (path: string, value: any) => {
        const node = selectedNodeId.value ? getNodeByIdLocal(selectedNodeId.value) : null;
        if (!node) return;
        
        // 确保 properties 对象存在
        if (!node.properties) {
            node.properties = {};
        }
        
        const keys = path.split('.');
        let target: any = node.properties;
        
        // 导航到目标对象，如果中间对象不存在则创建
        for (let i = 0; i < keys.length - 1; i++) {
            if (!target[keys[i]] || typeof target[keys[i]] !== 'object') {
                target[keys[i]] = {};
            }
            target = target[keys[i]];
        }
        
        // 设置最终值
        target[keys[keys.length - 1]] = value;
    };

    return {
        getCanvasCoords,
        onNodeDragStart,
        onCanvasDragOver,
        onCanvasDrop,
        deleteNode,
        updateNodeProperty
    };
} 