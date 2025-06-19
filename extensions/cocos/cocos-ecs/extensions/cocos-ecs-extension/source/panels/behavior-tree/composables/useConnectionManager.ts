import { Ref } from 'vue';
import { TreeNode, Connection, ConnectionState } from '../types';

/**
 * 连接线管理功能
 */
export function useConnectionManager(
    treeNodes: Ref<TreeNode[]>,
    connections: Ref<Connection[]>,
    connectionState: ConnectionState,
    canvasAreaRef: Ref<HTMLElement | null>,
    svgRef: Ref<SVGElement | null>,
    panX: Ref<number>,
    panY: Ref<number>,
    zoomLevel: Ref<number>
) {
    
    const getPortPosition = (nodeId: string, portType: 'input' | 'output') => {
        const node = treeNodes.value.find(n => n.id === nodeId);
        if (!node) return null;
        
        const canvasArea = canvasAreaRef.value;
        if (!canvasArea) {
            return getCalculatedPortPosition(node, portType);
        }
        
        const selectors = [
            `[data-node-id="${nodeId}"]`,
            `.tree-node[data-node-id="${nodeId}"]`,
            `div[data-node-id="${nodeId}"]`
        ];
        
        let nodeElement: HTMLElement | null = null;
        
        for (const selector of selectors) {
            try {
                const doc = canvasArea.ownerDocument || document;
                const foundElement = doc.querySelector(selector);
                if (foundElement && canvasArea.contains(foundElement)) {
                    nodeElement = foundElement as HTMLElement;
                    break;
                }
            } catch (error) {
                continue;
            }
        }
        
        if (!nodeElement) {
            try {
                const allTreeNodes = canvasArea.querySelectorAll('.tree-node');
                for (let i = 0; i < allTreeNodes.length; i++) {
                    const el = allTreeNodes[i] as HTMLElement;
                    const dataNodeId = el.getAttribute('data-node-id');
                    if (dataNodeId === nodeId) {
                        nodeElement = el;
                        break;
                    }
                }
            } catch (error) {
                // Fallback to calculated position
            }
        }
        
        if (!nodeElement) {
            return getCalculatedPortPosition(node, portType);
        }
        
        const portSelectors = [
            `.port.port-${portType}`,
            `.port-${portType}`,
            `.port.${portType}`,
            `.${portType}-port`
        ];
        
        let portElement: HTMLElement | null = null;
        
        for (const portSelector of portSelectors) {
            try {
                portElement = nodeElement.querySelector(portSelector) as HTMLElement;
                if (portElement) {
                    break;
                }
            } catch (error) {
                continue;
            }
        }
        
        if (!portElement) {
            return getNodeEdgePortPosition(nodeElement, node, portType);
        }
        
        const portRect = portElement.getBoundingClientRect();
        const canvasRect = canvasAreaRef.value?.getBoundingClientRect();
        
        if (!canvasRect) {
            return getCalculatedPortPosition(node, portType);
        }
        
        const relativeX = portRect.left + portRect.width / 2 - canvasRect.left;
        const relativeY = portRect.top + portRect.height / 2 - canvasRect.top;
        
        const svgX = (relativeX - panX.value) / zoomLevel.value;
        const svgY = (relativeY - panY.value) / zoomLevel.value;
        
        return { x: svgX, y: svgY };
    };

    const getCalculatedPortPosition = (node: any, portType: 'input' | 'output') => {
        let nodeWidth = 150;
        let nodeHeight = 80;
        
        if (node.properties) {
            const propertyCount = Object.keys(node.properties).length;
            if (propertyCount > 0) {
                nodeHeight += propertyCount * 20 + 20;
                nodeWidth = Math.max(150, nodeWidth + 50);
            }
        }
        
        const portX = node.x + nodeWidth / 2;
        const portY = portType === 'input' 
            ? node.y - 8
            : node.y + nodeHeight + 8;
        
        return { x: portX, y: portY };
    };

    const getNodeEdgePortPosition = (nodeElement: HTMLElement, node: any, portType: 'input' | 'output') => {
        const nodeRect = nodeElement.getBoundingClientRect();
        const canvasRect = canvasAreaRef.value?.getBoundingClientRect();
        
        if (!canvasRect) {
            return getCalculatedPortPosition(node, portType);
        }
        
        // 计算节点在SVG坐标系中的实际大小和位置
        const nodeWidth = nodeRect.width / zoomLevel.value;
        const nodeHeight = nodeRect.height / zoomLevel.value;
        
        // 端口位于节点的水平中心
        const portX = node.x + nodeWidth / 2;
        const portY = portType === 'input' 
            ? node.y - 5
            : node.y + nodeHeight + 5;
        
        return { x: portX, y: portY };
    };

    const startConnection = (event: MouseEvent, nodeId: string, portType: 'input' | 'output') => {
        event.preventDefault();
        event.stopPropagation();
        
        connectionState.isConnecting = true;
        connectionState.startNodeId = nodeId;
        connectionState.startPortType = portType;
        connectionState.currentMousePos = { x: event.clientX, y: event.clientY };
        
        const startPos = getPortPosition(nodeId, portType);
        if (startPos) {
            connectionState.startPortPos = startPos;
        }
        
        document.addEventListener('mousemove', onConnectionDrag);
        document.addEventListener('mouseup', onConnectionEnd);
        
        if (canvasAreaRef.value) {
            canvasAreaRef.value.classList.add('connecting');
        }
    };

    // 连接拖拽
    const onConnectionDrag = (event: MouseEvent) => {
        if (!connectionState.isConnecting || !connectionState.startNodeId || !connectionState.startPortType) return;
        
        connectionState.currentMousePos = { x: event.clientX, y: event.clientY };
        
        const svgPos = clientToSVGCoordinates(event.clientX, event.clientY);
        const startPos = getPortPosition(connectionState.startNodeId, connectionState.startPortType);
        
        if (startPos && svgPos) {
            const controlOffset = Math.abs(svgPos.y - startPos.y) * 0.5;
            let path: string;
            
            if (connectionState.startPortType === 'output') {
                path = `M ${startPos.x} ${startPos.y} C ${startPos.x} ${startPos.y + controlOffset} ${svgPos.x} ${svgPos.y - controlOffset} ${svgPos.x} ${svgPos.y}`;
            } else {
                path = `M ${startPos.x} ${startPos.y} C ${startPos.x} ${startPos.y - controlOffset} ${svgPos.x} ${svgPos.y + controlOffset} ${svgPos.x} ${svgPos.y}`;
            }
            
            if ('tempPath' in connectionState) {
                (connectionState as any).tempPath = path;
            }
        }
        const targetPort = findTargetPort(event.clientX, event.clientY);
        if (targetPort && targetPort.nodeId !== connectionState.startNodeId) {
            connectionState.hoveredPort = targetPort;
        } else {
            connectionState.hoveredPort = null;
        }
    };

    // 结束连接
    const onConnectionEnd = (event: MouseEvent) => {
        if (!connectionState.isConnecting) return;
        
        // 检查是否落在有效的端口上
        const targetPort = findTargetPort(event.clientX, event.clientY);
        
        if (targetPort && connectionState.startNodeId && connectionState.startPortType) {
            const canConnectResult = canConnect(
                connectionState.startNodeId,
                connectionState.startPortType,
                targetPort.nodeId,
                targetPort.portType
            );
            
            if (canConnectResult) {
                let parentId: string, childId: string;
                
                if (connectionState.startPortType === 'output') {
                    parentId = connectionState.startNodeId;
                    childId = targetPort.nodeId;
                } else {
                    parentId = targetPort.nodeId;
                    childId = connectionState.startNodeId;
                }
                
                createConnection(parentId, childId);
            }
        }
        
        // 清理连接状态
        cancelConnection();
    };

    // 取消连接
    const cancelConnection = () => {
        connectionState.isConnecting = false;
        connectionState.startNodeId = null;
        connectionState.startPortType = null;
        connectionState.currentMousePos = null;
        connectionState.startPortPos = null;
        connectionState.hoveredPort = null;
        
        if ('tempPath' in connectionState) {
            (connectionState as any).tempPath = '';
        }
        
        document.removeEventListener('mousemove', onConnectionDrag);
        document.removeEventListener('mouseup', onConnectionEnd);
        
        if (canvasAreaRef.value) {
            canvasAreaRef.value.classList.remove('connecting');
        }
        // 清除画布内的拖拽目标样式
        if (canvasAreaRef.value) {
            const allPorts = canvasAreaRef.value.querySelectorAll('.port.drag-target');
            allPorts.forEach(port => port.classList.remove('drag-target'));
        }
    };

    const clientToSVGCoordinates = (clientX: number, clientY: number) => {
        if (!canvasAreaRef.value) return null;
        
        try {
            // 获取canvas容器的边界
            const canvasRect = canvasAreaRef.value.getBoundingClientRect();
            
            // 转换为相对于canvas的坐标
            const canvasX = clientX - canvasRect.left;
            const canvasY = clientY - canvasRect.top;
            
            // 撤销SVG的transform，转换为SVG坐标
            // SVG transform: translate(panX, panY) scale(zoomLevel)
            const svgX = (canvasX - panX.value) / zoomLevel.value;
            const svgY = (canvasY - panY.value) / zoomLevel.value;
            
            return { x: svgX, y: svgY };
        } catch (e) {
            return null;
        }
    };

    // 查找目标端口
    const findTargetPort = (clientX: number, clientY: number) => {
        if (!canvasAreaRef.value) return null;
        
        try {
            const elementAtPoint = document.elementFromPoint(clientX, clientY);
            if (elementAtPoint?.classList.contains('port') && canvasAreaRef.value.contains(elementAtPoint)) {
                return getPortInfo(elementAtPoint as HTMLElement);
            }
        } catch (error) {
            // 查询出错时静默处理
        }
        
        const allPorts = canvasAreaRef.value.querySelectorAll('.port');
        for (const port of allPorts) {
            const rect = port.getBoundingClientRect();
            const margin = 10;
            
            if (clientX >= rect.left - margin && clientX <= rect.right + margin &&
                clientY >= rect.top - margin && clientY <= rect.bottom + margin) {
                return getPortInfo(port as HTMLElement);
            }
        }
        
        return null;
    };

    // 从端口元素获取端口信息
    const getPortInfo = (portElement: HTMLElement) => {
        const nodeElement = portElement.closest('.tree-node');
        if (!nodeElement) return null;
        
        const nodeId = nodeElement.getAttribute('data-node-id');
        const portType = portElement.classList.contains('port-input') ? 'input' : 'output' as 'input' | 'output';
        
        return nodeId ? { nodeId, portType } : null;
    };

    // 端口悬停处理
    const onPortHover = (nodeId: string, portType: 'input' | 'output') => {
        if (connectionState.isConnecting && connectionState.startNodeId !== nodeId) {
            connectionState.hoveredPort = { nodeId, portType };
            
            if (canConnect(connectionState.startNodeId!, connectionState.startPortType!, nodeId, portType)) {
                // 在画布区域内查找端口元素
                if (canvasAreaRef.value) {
                    const portElement = canvasAreaRef.value.querySelector(`[data-node-id="${nodeId}"] .port.port-${portType}`);
                    if (portElement) {
                        portElement.classList.add('drag-target');
                    }
                }
            }
        }
    };

    const onPortLeave = () => {
        if (connectionState.isConnecting) {
            connectionState.hoveredPort = null;
            // 清除画布内的拖拽目标样式
            if (canvasAreaRef.value) {
                const allPorts = canvasAreaRef.value.querySelectorAll('.port.drag-target');
                allPorts.forEach(port => port.classList.remove('drag-target'));
            }
        }
    };

    // 验证连接目标是否有效
    const isValidConnectionTarget = (nodeId: string, portType: 'input' | 'output') => {
        if (!connectionState.isConnecting || !connectionState.startNodeId || connectionState.startNodeId === nodeId) {
            return false;
        }
        
        return canConnect(connectionState.startNodeId, connectionState.startPortType!, nodeId, portType);
    };

    // 检查是否可以连接
    const canConnect = (sourceNodeId: string, sourcePortType: string, targetNodeId: string, targetPortType: string) => {
        if (sourceNodeId === targetNodeId) return false;
        if (sourcePortType === targetPortType) return false;
        
        let parentNodeId: string, childNodeId: string;
        
        if (sourcePortType === 'output') {
            parentNodeId = sourceNodeId;
            childNodeId = targetNodeId;
        } else {
            parentNodeId = targetNodeId;
            childNodeId = sourceNodeId;
        }
        
        const childNode = treeNodes.value.find(n => n.id === childNodeId);
        if (childNode && childNode.parent && childNode.parent !== parentNodeId) {
            return false;
        }
        
        const parentNode = treeNodes.value.find(n => n.id === parentNodeId);
        if (!parentNode || !parentNode.canHaveChildren) return false;
        if (!childNode || !childNode.canHaveParent) return false;
        
        // 检查子节点数量限制
        if (parentNode.maxChildren !== undefined) {
            const currentChildrenCount = parentNode.children ? parentNode.children.length : 0;
            if (currentChildrenCount >= parentNode.maxChildren) {
                return false; // 已达到最大子节点数量
            }
        }
        
        // 检查根节点限制：根节点不能有父节点
        if (childNode.type === 'root') {
            return false; // 根节点不能作为其他节点的子节点
        }
        
        // 检查是否只能有一个根节点
        if (parentNode.type === 'root') {
            // 根节点只能连接一个子节点
            const rootNodes = treeNodes.value.filter(n => n.type === 'root');
            if (rootNodes.length > 1) {
                return false; // 不能有多个根节点
            }
        }
        
        if (wouldCreateCycle(parentNodeId, childNodeId)) return false;
        if (isDescendant(childNodeId, parentNodeId)) return false;
        
        return true;
    };

    // 检查是否会创建循环
    const wouldCreateCycle = (parentId: string, childId: string) => {
        return isDescendant(parentId, childId);
    };
    
    const isDescendant = (ancestorId: string, descendantId: string): boolean => {
        const visited = new Set<string>();
        
        function checkPath(currentId: string): boolean {
            if (currentId === ancestorId) return true;
            if (visited.has(currentId)) return false;
            
            visited.add(currentId);
            
            const currentNode = treeNodes.value.find(n => n.id === currentId);
            if (currentNode?.children) {
                for (const childId of currentNode.children) {
                    if (checkPath(childId)) return true;
                }
            }
            
            return false;
        }
        
        return checkPath(descendantId);
    };

    // 创建连接
    const createConnection = (parentId: string, childId: string) => {
        const parentNode = treeNodes.value.find(n => n.id === parentId);
        const childNode = treeNodes.value.find(n => n.id === childId);
        
        if (!parentNode || !childNode) return;
        
        // 移除子节点的旧父子关系
        if (childNode.parent) {
            const oldParent = treeNodes.value.find(n => n.id === childNode.parent);
            if (oldParent) {
                const index = oldParent.children.indexOf(childId);
                if (index > -1) {
                    oldParent.children.splice(index, 1);
                }
            }
        }
        
        // 建立新的父子关系
        childNode.parent = parentId;
        if (!parentNode.children.includes(childId)) {
            parentNode.children.push(childId);
        }
        
        updateConnections();
    };

    // 改进的连接线更新方法
    const updateConnections = () => {
        // 立即清空现有连接
        connections.value.length = 0;
        
        // 创建新的连接数据
        const newConnections: Connection[] = [];
        
        // 遍历所有节点建立连接
        treeNodes.value.forEach(node => {
            if (node.children && node.children.length > 0) {
                node.children.forEach(childId => {
                    const childNode = treeNodes.value.find(n => n.id === childId);
                    if (childNode) {
                        // 尝试获取端口位置
                        const parentPos = getPortPosition(node.id, 'output');
                        const childPos = getPortPosition(childId, 'input');
                        
                        if (parentPos && childPos) {
                            // 计算贝塞尔曲线路径
                            const deltaY = Math.abs(childPos.y - parentPos.y);
                            const controlOffset = Math.max(30, Math.min(deltaY * 0.5, 80));
                            
                            const path = `M ${parentPos.x} ${parentPos.y} C ${parentPos.x} ${parentPos.y + controlOffset} ${childPos.x} ${childPos.y - controlOffset} ${childPos.x} ${childPos.y}`;
                            
                            newConnections.push({
                                id: `${node.id}-${childId}`,
                                sourceId: node.id,
                                targetId: childId,
                                path: path,
                                active: false
                            });
                        } else {
                            // 如果无法获取实际位置，使用计算位置作为后备
                            const fallbackParentPos = getCalculatedPortPosition(node, 'output');
                            const fallbackChildPos = getCalculatedPortPosition(childNode, 'input');
                            
                            const deltaY = Math.abs(fallbackChildPos.y - fallbackParentPos.y);
                            const controlOffset = Math.max(30, Math.min(deltaY * 0.5, 80));
                            
                            const path = `M ${fallbackParentPos.x} ${fallbackParentPos.y} C ${fallbackParentPos.x} ${fallbackParentPos.y + controlOffset} ${fallbackChildPos.x} ${fallbackChildPos.y - controlOffset} ${fallbackChildPos.x} ${fallbackChildPos.y}`;
                            
                            newConnections.push({
                                id: `${node.id}-${childId}`,
                                sourceId: node.id,
                                targetId: childId,
                                path: path,
                                active: false
                            });
                        }
                    }
                });
            }
        });
        
        // 批量更新连接
        connections.value.push(...newConnections);
        
        // 如果有DOM元素，进行二次精确更新
        if (canvasAreaRef.value) {
            setTimeout(() => {
                // 二次更新，使用实际DOM位置
                const updatedConnections: Connection[] = [];
                
                treeNodes.value.forEach(node => {
                    if (node.children && node.children.length > 0) {
                        node.children.forEach(childId => {
                            const childNode = treeNodes.value.find(n => n.id === childId);
                            if (childNode) {
                                const parentPos = getPortPosition(node.id, 'output');
                                const childPos = getPortPosition(childId, 'input');
                                
                                if (parentPos && childPos) {
                                    const deltaY = Math.abs(childPos.y - parentPos.y);
                                    const controlOffset = Math.max(30, Math.min(deltaY * 0.5, 80));
                                    
                                    const path = `M ${parentPos.x} ${parentPos.y} C ${parentPos.x} ${parentPos.y + controlOffset} ${childPos.x} ${childPos.y - controlOffset} ${childPos.x} ${childPos.y}`;
                                    
                                    updatedConnections.push({
                                        id: `${node.id}-${childId}`,
                                        sourceId: node.id,
                                        targetId: childId,
                                        path: path,
                                        active: false
                                    });
                                }
                            }
                        });
                    }
                });
                
                // 如果二次更新得到了有效结果，替换连接数据
                if (updatedConnections.length > 0) {
                    connections.value.length = 0;
                    connections.value.push(...updatedConnections);
                }
            }, 100); // 100ms延迟，确保DOM完全渲染
        }
    };

    // 删除连接线
    const removeConnection = (connectionId: string) => {
        const connection = connections.value.find(conn => conn.id === connectionId);
        if (!connection) return;
        
        const parentNode = treeNodes.value.find(n => n.id === connection.sourceId);
        const childNode = treeNodes.value.find(n => n.id === connection.targetId);
        
        if (parentNode && childNode) {
            // 从父节点的children中移除
            const index = parentNode.children.indexOf(connection.targetId);
            if (index > -1) {
                parentNode.children.splice(index, 1);
            }
            
            // 清除子节点的parent
            childNode.parent = undefined;
            
            // 更新连接线
            updateConnections();
        }
    };

    // 连接线点击事件处理
    const onConnectionClick = (event: MouseEvent, connectionId: string) => {
        event.preventDefault();
        event.stopPropagation();
        
        // 询问用户是否要删除连接
        if (confirm('确定要删除这条连接线吗？')) {
            removeConnection(connectionId);
        }
    };

    return {
        getPortPosition,
        startConnection,
        cancelConnection,
        updateConnections,
        removeConnection,
        onConnectionClick,
        onPortHover,
        onPortLeave,
        isValidConnectionTarget
    };
} 