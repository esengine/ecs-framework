import type { Node } from '../domain/models/Node';
import type { Connection } from '../domain/models/Connection';
import type { Position } from '../domain/value-objects/Position';
import type { Size } from '../domain/value-objects/Size';
import type { NodeExecutionStatus } from '../stores';

export type { Position, Size };

/**
 * 上下文菜单状态
 */
export interface ContextMenuState {
    visible: boolean;
    position: Position;
    nodeId: string | null;
}

/**
 * 快速创建菜单状态
 */
export interface QuickCreateMenuState {
    visible: boolean;
    position: Position;
    searchTerm: string;
}

/**
 * 画布坐标
 */
export interface CanvasPoint {
    x: number;
    y: number;
}

/**
 * 选择区域
 */
export interface SelectionBox {
    start: CanvasPoint;
    end: CanvasPoint;
}

/**
 * 编辑器配置
 */
export interface EditorConfig {
    /**
     * 是否启用网格吸附
     */
    enableSnapping?: boolean;

    /**
     * 网格大小
     */
    gridSize?: number;

    /**
     * 最小缩放
     */
    minZoom?: number;

    /**
     * 最大缩放
     */
    maxZoom?: number;

    /**
     * 是否显示网格
     */
    showGrid?: boolean;

    /**
     * 是否显示小地图
     */
    showMinimap?: boolean;

    /**
     * 是否吸附到网格
     */
    snapToGrid?: boolean;
}

/**
 * 节点视图数据（用于渲染）
 */
export interface NodeViewData {
    node: Node;
    isSelected: boolean;
    isDragging?: boolean;
    executionStatus?: NodeExecutionStatus;
    executionOrder?: number;
}

/**
 * 连接视图数据（用于渲染）
 */
export interface ConnectionViewData {
    connection: Connection;
    isSelected: boolean;
}

/**
 * 默认编辑器配置
 */
export const DEFAULT_EDITOR_CONFIG: EditorConfig = {
    enableSnapping: true,
    gridSize: 20,
    minZoom: 0.1,
    maxZoom: 3,
    showGrid: true,
    showMinimap: false
};
