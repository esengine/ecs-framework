import { PropertyDefinition } from '../data/nodeTemplates';

export interface TreeNode {
    id: string;
    type: string;
    name: string;
    icon: string;
    description: string;
    x: number;
    y: number;
    children: string[];
    parent?: string;
    properties?: Record<string, any>; // 改为any以支持动态属性值
    canHaveChildren: boolean;
    canHaveParent: boolean;
    maxChildren?: number; // 最大子节点数量限制
    minChildren?: number; // 最小子节点数量要求
    hasError?: boolean;
    // 条件装饰器相关
    attachedCondition?: {
        type: string;
        name: string;
        icon: string;
    };
    // 条件节点相关（用于虚拟条件节点）
    isConditionNode?: boolean;
    parentDecorator?: TreeNode;
    // 条件显示状态
    conditionExpanded?: boolean; // 条件是否展开显示详细信息
}

export interface Connection {
    id: string;
    sourceId: string;
    targetId: string;
    path: string;
    active: boolean;
}

export interface DragState {
    isDraggingCanvas: boolean;
    isDraggingNode: boolean;
    isConnecting: boolean;
    dragStartX: number;
    dragStartY: number;
    dragNodeId: string | null;
    dragNodeStartX: number;
    dragNodeStartY: number;
    connectionStart: { nodeId: string; portType: string } | null;
    connectionEnd: { x: number; y: number };
}

export interface InstallStatus {
    installed: boolean;
    version: string | null;
    packageExists: boolean;
}

export interface ValidationResult {
    isValid: boolean;
    message: string;
}

export interface ConnectionPort {
    nodeId: string;
    portType: string;
}

export interface CanvasCoordinates {
    x: number;
    y: number;
}

export interface ConnectionState {
    isConnecting: boolean;
    startNodeId: string | null;
    startPortType: 'input' | 'output' | null;
    currentMousePos: { x: number; y: number } | null;
    startPortPos: { x: number; y: number } | null;
    hoveredPort: { nodeId: string; portType: 'input' | 'output' } | null;
} 