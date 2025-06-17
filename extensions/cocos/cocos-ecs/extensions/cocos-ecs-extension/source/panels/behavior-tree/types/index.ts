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
    properties?: Record<string, PropertyDefinition>;
    canHaveChildren: boolean;
    canHaveParent: boolean;
    hasError?: boolean;
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