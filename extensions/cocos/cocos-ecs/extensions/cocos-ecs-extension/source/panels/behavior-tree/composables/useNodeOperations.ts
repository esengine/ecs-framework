import { Ref, nextTick } from 'vue';
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
    getNodeByIdLocal: (id: string) => TreeNode | undefined,
    updateConnections?: () => void
) {
    
    // 获取相对于画布的坐标（用于节点拖放等操作）
    const getCanvasCoords = (event: MouseEvent, canvasElement: HTMLElement | null) => {
        return getCanvasCoordinates(event, canvasElement, panX.value, panY.value, zoomLevel.value);
    };

    // 拖拽事件处理
    const onNodeDragStart = (event: DragEvent, template: NodeTemplate) => {
        if (event.dataTransfer) {
            // 检查是否为条件节点，如果是则标记为条件拖拽
            const dragData = {
                ...template,
                isConditionDrag: template.isDraggableCondition || false
            };
            event.dataTransfer.setData('application/json', JSON.stringify(dragData));
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
            const dragData = JSON.parse(templateData);
            
            // 如果是条件节点拖拽，阻止创建独立节点
            if (dragData.isConditionDrag || dragData.isDraggableCondition) {
                return; // 条件节点不能作为独立节点创建
            }
            
            const template: NodeTemplate = dragData;
            const canvasElement = event.currentTarget as HTMLElement;
            const { x, y } = getCanvasCoords(event, canvasElement);
            
            const newNode = createNodeFromTemplate(template, x, y);
            treeNodes.value.push(newNode);
            selectedNodeId.value = newNode.id;
            
        } catch (error) {
            // 节点创建失败时静默处理
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
        
        // 更新连接线
        if (updateConnections) {
            updateConnections();
        }
    };

    // 通用的属性更新方法
    const setNestedProperty = (obj: any, path: string, value: any) => {
        const keys = path.split('.');
        let current = obj;
        
        // 导航到目标属性的父对象
        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (!(key in current) || typeof current[key] !== 'object' || current[key] === null) {
                current[key] = {};
            }
            current = current[key];
        }
        
        // 设置最终值
        const finalKey = keys[keys.length - 1];
        current[finalKey] = value;
    };

    // 节点属性更新
    const updateNodeProperty = (path: string, value: any) => {
        const selectedNode = selectedNodeId.value ? getNodeByIdLocal(selectedNodeId.value) : null;
        if (!selectedNode) return;
        
        // 检查是否是条件节点的属性更新
        if (selectedNode.isConditionNode && selectedNode.parentDecorator) {
            // 条件节点的属性更新需要同步到装饰器
            updateConditionNodeProperty(selectedNode.parentDecorator, path, value);
        } else {
            // 普通节点的属性更新
            setNestedProperty(selectedNode, path, value);
            
            // 强制触发响应式更新
            const nodeIndex = treeNodes.value.findIndex(n => n.id === selectedNode.id);
            if (nodeIndex > -1) {
                const newNodes = [...treeNodes.value];
                newNodes[nodeIndex] = { ...selectedNode };
                treeNodes.value = newNodes;
            }
        }
    };

    // 更新条件节点属性到装饰器
    const updateConditionNodeProperty = (decoratorNode: TreeNode, path: string, value: any) => {
        // 解析属性路径，例如 "properties.variableName.value" -> "variableName"
        const pathParts = path.split('.');
        if (pathParts[0] === 'properties' && pathParts[2] === 'value') {
            const propertyName = pathParts[1];
            
            // 直接更新装饰器的属性
            if (!decoratorNode.properties) {
                decoratorNode.properties = {};
            }
            decoratorNode.properties[propertyName] = value;
            
            // 强制触发响应式更新
            const nodeIndex = treeNodes.value.findIndex(n => n.id === decoratorNode.id);
            if (nodeIndex > -1) {
                const newNodes = [...treeNodes.value];
                newNodes[nodeIndex] = { ...decoratorNode };
                treeNodes.value = newNodes;
            }
        }
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