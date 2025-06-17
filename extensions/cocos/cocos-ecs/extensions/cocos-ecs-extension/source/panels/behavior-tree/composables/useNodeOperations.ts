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
        console.log('updateNodeProperty called:', path, value);
        const node = selectedNodeId.value ? getNodeByIdLocal(selectedNodeId.value) : null;
        if (!node) {
            console.log('No selected node found');
            return;
        }
        
        console.log('Current node before update:', JSON.stringify(node, null, 2));
        
        // 使用通用方法更新属性
        setNestedProperty(node, path, value);
        
        console.log(`Updated property ${path} to:`, value);
        console.log('Updated node after change:', JSON.stringify(node, null, 2));
        
        // 强制触发响应式更新 - 创建新数组来强制Vue检测变化
        const nodeIndex = treeNodes.value.findIndex(n => n.id === node.id);
        if (nodeIndex > -1) {
            // 创建新的节点数组，确保Vue能检测到变化
            const newNodes = [...treeNodes.value];
            newNodes[nodeIndex] = { ...node }; // 创建节点副本确保响应式更新
            treeNodes.value = newNodes;
            
            console.log('Triggered reactive update - replaced array');
            
            // 验证更新是否成功
            nextTick(() => {
                const verifyNode = treeNodes.value.find(n => n.id === node.id);
                console.log('Verification - node after update:', JSON.stringify(verifyNode, null, 2));
                
                // 验证属性值
                const pathParts = path.split('.');
                let checkValue: any = verifyNode;
                for (const part of pathParts) {
                    checkValue = checkValue?.[part];
                }
                console.log(`Verification - final value at ${path}:`, checkValue);
            });
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