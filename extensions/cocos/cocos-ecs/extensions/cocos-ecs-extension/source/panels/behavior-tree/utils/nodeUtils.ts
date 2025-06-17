import { TreeNode, ValidationResult } from '../types';
import { NodeTemplate } from '../data/nodeTemplates';

/**
 * 生成唯一的节点ID
 */
export function generateNodeId(): string {
    return 'node_' + Math.random().toString(36).substr(2, 9);
}

/**
 * 根据模板创建节点
 */
export function createNodeFromTemplate(template: NodeTemplate, x: number = 100, y: number = 100): TreeNode {
    const nodeId = generateNodeId();
    
    // 深拷贝 properties 以避免引用共享
    let properties: any = {};
    if (template.properties) {
        for (const [key, prop] of Object.entries(template.properties)) {
            properties[key] = {
                name: prop.name,
                type: prop.type,
                value: prop.value,
                description: prop.description,
                options: prop.options ? [...prop.options] : undefined,
                required: prop.required
            };
        }
    }
    
    const node: TreeNode = {
        id: nodeId,
        type: template.className || template.type,
        name: template.name,
        icon: template.icon,
        description: template.description,
        x: x,
        y: y,
        children: [],
        properties: properties,
        canHaveChildren: template.canHaveChildren,
        canHaveParent: template.canHaveParent,
        hasError: false
    };
    return node;
}

/**
 * 根据ID查找节点
 */
export function getNodeById(nodes: TreeNode[], id: string): TreeNode | undefined {
    return nodes.find(node => node.id === id);
}

/**
 * 获取根节点
 */
export function getRootNode(nodes: TreeNode[]): TreeNode | undefined {
    return nodes.find(node => !node.parent);
}

/**
 * 递归删除节点及其子节点
 */
export function deleteNodeRecursive(
    nodes: TreeNode[], 
    nodeId: string, 
    connections: any[], 
    onConnectionsUpdate: (connections: any[]) => void
): TreeNode[] {
    const deleteRecursive = (id: string) => {
        const node = getNodeById(nodes, id);
        if (!node) return;
        
        // 递归删除子节点
        node.children.forEach(childId => deleteRecursive(childId));
        
        // 从父节点的children中移除
        if (node.parent) {
            const parent = getNodeById(nodes, node.parent);
            if (parent) {
                const index = parent.children.indexOf(id);
                if (index > -1) {
                    parent.children.splice(index, 1);
                }
            }
        }
        
        // 移除连接
        const updatedConnections = connections.filter(conn => 
            conn.sourceId !== id && conn.targetId !== id
        );
        onConnectionsUpdate(updatedConnections);
        
        // 从树中移除节点
        const nodeIndex = nodes.findIndex(n => n.id === id);
        if (nodeIndex > -1) {
            nodes.splice(nodeIndex, 1);
        }
    };
    
    deleteRecursive(nodeId);
    return [...nodes]; // 返回新数组以触发响应式更新
}

/**
 * 验证行为树结构
 */
export function validateTree(nodes: TreeNode[]): ValidationResult {
    if (nodes.length === 0) {
        return { isValid: false, message: '行为树为空' };
    }
    
    const root = getRootNode(nodes);
    if (!root) {
        return { isValid: false, message: '缺少根节点' };
    }
    
    // 可以添加更多验证逻辑
    // 例如：检查循环引用、孤立节点等
    
    return { isValid: true, message: '行为树结构有效' };
}

/**
 * 更新节点属性
 */
export function updateNodeProperty(node: TreeNode, path: string, value: any): void {
    if (!node.properties) return;
    
    const keys = path.split('.');
    let target: any = node.properties;
    
    for (let i = 0; i < keys.length - 1; i++) {
        target = target[keys[i]];
    }
    
    target[keys[keys.length - 1]] = value;
}

/**
 * 计算节点的边界框
 */
export function getNodesBounds(nodes: TreeNode[]): { minX: number; minY: number; maxX: number; maxY: number } {
    if (nodes.length === 0) {
        return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    }
    
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    nodes.forEach(node => {
        minX = Math.min(minX, node.x);
        minY = Math.min(minY, node.y);
        maxX = Math.max(maxX, node.x + 150); // 节点宽度
        maxY = Math.max(maxY, node.y + 100); // 节点高度
    });
    
    return { minX, minY, maxX, maxY };
} 