import { Ref } from 'vue';
import { TreeNode, DragState, Connection } from '../types';

export interface ConnectionManager {
    startConnection: (event: MouseEvent, nodeId: string, portType: string) => void;
    updateTempConnection: (nodeId: string, portType: string, targetX: number, targetY: number) => void;
    onConnectionDragEnd: (event: MouseEvent) => void;
    cancelConnection: () => void;
    createConnection: (sourceId: string, targetId: string) => void;
    removeConnection: (sourceId: string, targetId: string) => void;
    updateConnections: () => void;
    canConnect: (source: { nodeId: string, portType: string }, target: { nodeId: string, portType: string }) => boolean;
}

export function createConnectionManager(
    treeNodes: Ref<TreeNode[]>,
    connections: Ref<Connection[]>,
    tempConnection: Ref<{ path: string }>,
    dragState: Ref<DragState>,
    findCanvasElement: () => HTMLElement | null,
    getSVGInternalCoords: (event: MouseEvent, canvasElement: HTMLElement | null) => { x: number, y: number },
    getNodeByIdLocal: (id: string) => TreeNode | undefined,
    getNodeIdFromElement: (element: HTMLElement) => string | null
): ConnectionManager {
    
    const startConnection = (event: MouseEvent, nodeId: string, portType: string) => {
        event.stopPropagation();
        event.preventDefault();
        
        const node = getNodeByIdLocal(nodeId);
        if (!node) {
            return;
        }
        
        dragState.value.isConnecting = true;
        dragState.value.connectionStart = { nodeId, portType };
        
        // 使用统一的canvas查找方法
        const canvasElement = findCanvasElement();
        
        if (canvasElement) {
            const { x, y } = getSVGInternalCoords(event, canvasElement);
            
            // 为了让连线明显可见，使用一个与端口位置明显不同的初始位置
            const node = getNodeByIdLocal(nodeId);
            let initialX, initialY;
            
            if (node) {
                if (portType === 'output') {
                    // 输出端口：向下延伸50像素
                    initialX = node.x + 75; // 节点中心
                    initialY = node.y + 150; // 节点底部向下50像素
                } else {
                    // 输入端口：向上延伸50像素
                    initialX = node.x + 75; // 节点中心
                    initialY = node.y - 50; // 节点顶部向上50像素
                }
            } else {
                // fallback到鼠标位置
                initialX = x;
                initialY = y;
            }
            
            dragState.value.connectionEnd.x = initialX;
            dragState.value.connectionEnd.y = initialY;
            
            updateTempConnection(nodeId, portType, initialX, initialY);
        }
    };

    const updateTempConnection = (nodeId: string, portType: string, targetX: number, targetY: number) => {
        const node = getNodeByIdLocal(nodeId);
        if (!node) {
            return;
        }
        
        // 计算端口的准确位置（在节点坐标系中）
        const nodeWidth = 150;
        const nodeHeight = 100;
        const startX = node.x + nodeWidth / 2;
        
        let startY: number;
        if (portType === 'output') {
            startY = node.y + nodeHeight; // 输出端口在底部
        } else {
            startY = node.y; // 输入端口在顶部
        }
        
        // targetX, targetY 现在已经是SVG内部坐标系的坐标，可以直接使用
        // 创建贝塞尔曲线路径
        const controlOffset = Math.abs(targetY - startY) * 0.5;
        
        let path: string;
        if (portType === 'output') {
            path = `M ${startX} ${startY} C ${startX} ${startY + controlOffset} ${targetX} ${targetY - controlOffset} ${targetX} ${targetY}`;
        } else {
            path = `M ${startX} ${startY} C ${startX} ${startY - controlOffset} ${targetX} ${targetY + controlOffset} ${targetX} ${targetY}`;
        }
        
        tempConnection.value.path = path;
    };

    const onConnectionDragEnd = (event: MouseEvent) => {
        if (!dragState.value.isConnecting || !dragState.value.connectionStart) return;
        
        console.log('🔗 连线拖拽结束');
        
        // 检查是否释放在目标端口上
        const targetElement = document.elementFromPoint(event.clientX, event.clientY) as HTMLElement;
        console.log('🎯 鼠标位置的元素:', targetElement);
        console.log('📍 鼠标坐标:', event.clientX, event.clientY);
        
        // 多种方式查找端口
        let targetPort: HTMLElement | null = null;
        
        // 方法1: 直接检查当前元素
        if (targetElement?.classList.contains('port')) {
            targetPort = targetElement;
            console.log('✅ 方法1成功：直接是端口元素');
        }
        
        // 方法2: 向上查找最近的端口
        if (!targetPort) {
            targetPort = targetElement?.closest('.port') as HTMLElement;
            if (targetPort) {
                console.log('✅ 方法2成功：通过closest找到端口');
            }
        }
        
        // 方法3: 查找当前节点下的所有端口，检查鼠标是否在其范围内
        if (!targetPort) {
            const nodeElement = targetElement?.closest('.tree-node') as HTMLElement;
            if (nodeElement) {
                const ports = nodeElement.querySelectorAll('.port');
                console.log('🔍 在节点中找到', ports.length, '个端口');
                
                ports.forEach((port, index) => {
                    const rect = port.getBoundingClientRect();
                    console.log(`端口${index}位置:`, rect);
                    
                    if (event.clientX >= rect.left && event.clientX <= rect.right &&
                        event.clientY >= rect.top && event.clientY <= rect.bottom) {
                        targetPort = port as HTMLElement;
                        console.log('✅ 方法3成功：鼠标在端口范围内');
                    }
                });
            }
        }
        
        console.log('🎯 最终找到的端口:', targetPort);
        
        if (targetPort) {
            const targetNodeId = getNodeIdFromElement(targetPort);
            const targetPortType = targetPort.classList.contains('port-input') ? 'input' : 'output';
            
            console.log('📋 目标节点ID:', targetNodeId);
            console.log('🔌 端口类型:', targetPortType);
            console.log('🔗 源端口信息:', dragState.value.connectionStart);
            
            if (targetNodeId && targetNodeId !== dragState.value.connectionStart.nodeId) {
                const sourcePort = dragState.value.connectionStart;
                const targetPortObj = { nodeId: targetNodeId, portType: targetPortType };
                
                const canConn = canConnect(sourcePort, targetPortObj);
                console.log('🤔 是否可以连接:', canConn);
                
                if (canConn) {
                    if (sourcePort.portType === 'output') {
                        createConnection(sourcePort.nodeId, targetNodeId);
                        console.log('✅ 创建连接:', sourcePort.nodeId, '->', targetNodeId);
                    } else {
                        createConnection(targetNodeId, sourcePort.nodeId);
                        console.log('✅ 创建连接:', targetNodeId, '->', sourcePort.nodeId);
                    }
                } else {
                    console.log('❌ 无法连接：不满足连接条件');
                }
            } else {
                console.log('❌ 无法连接：目标节点无效或是同一节点');
            }
        } else {
            console.log('❌ 没有找到目标端口');
        }
        
        // 清理连线状态
        cancelConnection();
    };

    const cancelConnection = () => {
        dragState.value.isConnecting = false;
        dragState.value.connectionStart = null;
        tempConnection.value.path = '';
    };

    const canConnect = (source: { nodeId: string, portType: string }, target: { nodeId: string, portType: string }): boolean => {
        // 不能连接自己
        if (source.nodeId === target.nodeId) return false;
        
        // 必须是输出端口连接到输入端口
        if (source.portType === target.portType) return false;
        
        // 确定源和目标
        const sourceNodeId = source.portType === 'output' ? source.nodeId : target.nodeId;
        const targetNodeId = source.portType === 'output' ? target.nodeId : source.nodeId;
        
        // 检查是否会创建循环
        if (wouldCreateCycle(sourceNodeId, targetNodeId)) return false;
        
        // 检查目标节点是否已经有父节点
        const targetNode = getNodeByIdLocal(targetNodeId);
        if (targetNode && targetNode.parent) return false;
        
        return true;
    };

    const wouldCreateCycle = (sourceId: string, targetId: string): boolean => {
        const visited = new Set<string>();
        
        const checkAncestors = (nodeId: string): boolean => {
            if (visited.has(nodeId)) return false;
            visited.add(nodeId);
            
            if (nodeId === sourceId) return true;
            
            const node = getNodeByIdLocal(nodeId);
            if (node && node.parent) {
                return checkAncestors(node.parent);
            }
            
            return false;
        };
        
        return checkAncestors(targetId);
    };

    const createConnection = (sourceId: string, targetId: string) => {
        const sourceNode = getNodeByIdLocal(sourceId);
        const targetNode = getNodeByIdLocal(targetId);
        
        if (!sourceNode || !targetNode) return;
        
        // 更新节点关系
        if (!sourceNode.children.includes(targetId)) {
            sourceNode.children.push(targetId);
        }
        targetNode.parent = sourceId;
        
        // 更新连接数组
        const existingConnection = connections.value.find(conn => 
            conn.sourceId === sourceId && conn.targetId === targetId
        );
        
        if (!existingConnection) {
            connections.value.push({
                id: `${sourceId}-${targetId}`,
                sourceId,
                targetId,
                active: false,
                path: createConnectionPath(sourceNode, targetNode).path
            });
        }
        
        updateConnections();
    };

    const removeConnection = (sourceId: string, targetId: string) => {
        const sourceNode = getNodeByIdLocal(sourceId);
        const targetNode = getNodeByIdLocal(targetId);
        
        if (sourceNode) {
            const index = sourceNode.children.indexOf(targetId);
            if (index > -1) {
                sourceNode.children.splice(index, 1);
            }
        }
        
        if (targetNode) {
            targetNode.parent = undefined;
        }
        
        connections.value = connections.value.filter(conn => 
            !(conn.sourceId === sourceId && conn.targetId === targetId)
        );
        
        updateConnections();
    };

    const updateConnections = () => {
        connections.value.forEach(conn => {
            const sourceNode = getNodeByIdLocal(conn.sourceId);
            const targetNode = getNodeByIdLocal(conn.targetId);
            
            if (sourceNode && targetNode) {
                conn.path = createConnectionPath(sourceNode, targetNode).path;
            }
        });
    };

    const createConnectionPath = (sourceNode: TreeNode, targetNode: TreeNode) => {
        const nodeWidth = 150;
        const nodeHeight = 100;
        
        // 源节点的输出端口位置（底部中心）
        const sourceX = sourceNode.x + nodeWidth / 2;
        const sourceY = sourceNode.y + nodeHeight;
        
        // 目标节点的输入端口位置（顶部中心）
        const targetX = targetNode.x + nodeWidth / 2;
        const targetY = targetNode.y;
        
        // 创建贝塞尔曲线路径
        const controlOffset = Math.abs(targetY - sourceY) * 0.5;
        const path = `M ${sourceX} ${sourceY} C ${sourceX} ${sourceY + controlOffset} ${targetX} ${targetY - controlOffset} ${targetX} ${targetY}`;
        
        return {
            id: `${sourceNode.id}-${targetNode.id}`,
            path,
            active: false,
            sourceId: sourceNode.id,
            targetId: targetNode.id
        };
    };

    return {
        startConnection,
        updateTempConnection,
        onConnectionDragEnd,
        cancelConnection,
        createConnection,
        removeConnection,
        updateConnections,
        canConnect
    };
} 