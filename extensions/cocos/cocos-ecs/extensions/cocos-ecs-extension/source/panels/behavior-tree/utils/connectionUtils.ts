import { TreeNode, Connection, ConnectionPort } from '../types';
import { getNodeById } from './nodeUtils';

/**
 * 创建连接路径（贝塞尔曲线）
 */
export function createConnectionPath(sourceNode: TreeNode, targetNode: TreeNode): Connection {
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
}

/**
 * 创建临时连接路径
 */
export function createTempConnectionPath(
    node: TreeNode,
    portType: string,
    targetX: number,
    targetY: number
): string {
    const nodeWidth = 150;
    const nodeHeight = 100;
    const startX = node.x + nodeWidth / 2;
    
    let startY: number;
    if (portType === 'output') {
        startY = node.y + nodeHeight; // 输出端口在底部
    } else {
        startY = node.y; // 输入端口在顶部
    }
    
    // 创建贝塞尔曲线路径
    const controlOffset = Math.abs(targetY - startY) * 0.5;
    
    let path: string;
    if (portType === 'output') {
        path = `M ${startX} ${startY} C ${startX} ${startY + controlOffset} ${targetX} ${targetY - controlOffset} ${targetX} ${targetY}`;
    } else {
        path = `M ${startX} ${startY} C ${startX} ${startY - controlOffset} ${targetX} ${targetY + controlOffset} ${targetX} ${targetY}`;
    }
    
    return path;
}

/**
 * 检查两个端口是否可以连接
 */
export function canConnect(
    source: ConnectionPort,
    target: ConnectionPort,
    nodes: TreeNode[]
): boolean {
    // 不能连接自己
    if (source.nodeId === target.nodeId) return false;
    
    // 必须是输出端口连接到输入端口
    if (source.portType === target.portType) return false;
    
    // 确定源和目标
    const sourceNodeId = source.portType === 'output' ? source.nodeId : target.nodeId;
    const targetNodeId = source.portType === 'output' ? target.nodeId : source.nodeId;
    
    // 检查是否会创建循环
    if (wouldCreateCycle(sourceNodeId, targetNodeId, nodes)) return false;
    
    // 检查目标节点是否已经有父节点
    const targetNode = getNodeById(nodes, targetNodeId);
    if (targetNode && targetNode.parent) return false;
    
    return true;
}

/**
 * 检查是否会创建循环引用
 */
export function wouldCreateCycle(
    sourceId: string,
    targetId: string,
    nodes: TreeNode[]
): boolean {
    const visited = new Set<string>();
    
    const checkAncestors = (nodeId: string): boolean => {
        if (visited.has(nodeId)) return false;
        visited.add(nodeId);
        
        if (nodeId === sourceId) return true;
        
        const node = getNodeById(nodes, nodeId);
        if (node && node.parent) {
            return checkAncestors(node.parent);
        }
        
        return false;
    };
    
    return checkAncestors(targetId);
}

/**
 * 创建节点间的连接
 */
export function createConnection(
    sourceId: string,
    targetId: string,
    nodes: TreeNode[],
    connections: Connection[]
): { updatedNodes: TreeNode[]; updatedConnections: Connection[] } {
    const sourceNode = getNodeById(nodes, sourceId);
    const targetNode = getNodeById(nodes, targetId);
    
    if (!sourceNode || !targetNode) {
        return { updatedNodes: nodes, updatedConnections: connections };
    }
    
    // 更新节点关系
    if (!sourceNode.children.includes(targetId)) {
        sourceNode.children.push(targetId);
    }
    targetNode.parent = sourceId;
    
    // 更新连接数组
    const existingConnection = connections.find(conn => 
        conn.sourceId === sourceId && conn.targetId === targetId
    );
    
    if (!existingConnection) {
        const newConnection = createConnectionPath(sourceNode, targetNode);
        connections.push(newConnection);
    }
    
    return {
        updatedNodes: [...nodes],
        updatedConnections: [...connections]
    };
}

/**
 * 移除连接
 */
export function removeConnection(
    sourceId: string,
    targetId: string,
    nodes: TreeNode[],
    connections: Connection[]
): { updatedNodes: TreeNode[]; updatedConnections: Connection[] } {
    const sourceNode = getNodeById(nodes, sourceId);
    const targetNode = getNodeById(nodes, targetId);
    
    if (sourceNode) {
        const index = sourceNode.children.indexOf(targetId);
        if (index > -1) {
            sourceNode.children.splice(index, 1);
        }
    }
    
    if (targetNode) {
        targetNode.parent = undefined;
    }
    
    const updatedConnections = connections.filter(conn => 
        !(conn.sourceId === sourceId && conn.targetId === targetId)
    );
    
    return {
        updatedNodes: [...nodes],
        updatedConnections: updatedConnections
    };
}

/**
 * 更新所有连接的路径
 */
export function updateAllConnections(connections: Connection[], nodes: TreeNode[]): Connection[] {
    return connections.map(conn => {
        const sourceNode = getNodeById(nodes, conn.sourceId);
        const targetNode = getNodeById(nodes, conn.targetId);
        
        if (sourceNode && targetNode) {
            const updatedConnection = createConnectionPath(sourceNode, targetNode);
            return { ...conn, path: updatedConnection.path };
        }
        
        return conn;
    });
}

/**
 * 从元素中获取节点ID
 */
export function getNodeIdFromElement(element: HTMLElement): string | null {
    let current = element;
    while (current && current.getAttribute) {
        const nodeId = current.getAttribute('data-node-id');
        if (nodeId) return nodeId;
        current = current.parentElement as HTMLElement;
    }
    return null;
} 