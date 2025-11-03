import { Node } from '../../domain/models/Node';
import { Connection } from '../../domain/models/Connection';

/**
 * 节点执行状态
 */
export type NodeExecutionStatus = 'idle' | 'running' | 'success' | 'failure';

/**
 * 执行模式
 */
export type ExecutionMode = 'idle' | 'running' | 'paused' | 'step';

/**
 * 执行日志条目
 */
export interface ExecutionLog {
    nodeId: string;
    status: NodeExecutionStatus;
    timestamp: number;
    message?: string;
}

/**
 * 上下文菜单状态
 */
export interface ContextMenuState {
    visible: boolean;
    position: { x: number; y: number };
    nodeId: string | null;
}

/**
 * 快速创建菜单状态
 */
export interface QuickCreateMenuState {
    visible: boolean;
    position: { x: number; y: number };
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
 * 节点视图数据（用于渲染）
 */
export interface NodeViewData {
    node: Node;
    isSelected: boolean;
    isDragging: boolean;
    executionStatus?: NodeExecutionStatus;
}

/**
 * 连接视图数据（用于渲染）
 */
export interface ConnectionViewData {
    connection: Connection;
    isSelected: boolean;
}

/**
 * 编辑器配置
 */
export interface EditorConfig {
    /**
     * 是否启用网格吸附
     */
    enableSnapping: boolean;

    /**
     * 网格大小
     */
    gridSize: number;

    /**
     * 最小缩放
     */
    minZoom: number;

    /**
     * 最大缩放
     */
    maxZoom: number;

    /**
     * 是否显示网格
     */
    showGrid: boolean;

    /**
     * 是否显示小地图
     */
    showMinimap: boolean;
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
