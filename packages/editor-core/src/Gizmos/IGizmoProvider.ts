/**
 * Gizmo Provider Interface
 * Gizmo 提供者接口
 *
 * Allows components to define custom gizmo rendering in the editor.
 * Uses the Rust WebGL renderer for high-performance gizmo display.
 * 允许组件定义编辑器中的自定义 gizmo 渲染。
 * 使用 Rust WebGL 渲染器实现高性能 gizmo 显示。
 */

import type { Entity } from '@esengine/ecs-framework';

/**
 * Gizmo type enumeration
 * Gizmo 类型枚举
 */
export type GizmoType = 'rect' | 'circle' | 'line' | 'grid';

/**
 * Color in RGBA format (0-1 range)
 * RGBA 格式颜色（0-1 范围）
 */
export interface GizmoColor {
    r: number;
    g: number;
    b: number;
    a: number;
}

/**
 * Rectangle gizmo data (rendered via Rust WebGL)
 * 矩形 gizmo 数据（通过 Rust WebGL 渲染）
 */
export interface IRectGizmoData {
    type: 'rect';
    /** Center X position in world space | 世界空间中心 X 位置 */
    x: number;
    /** Center Y position in world space | 世界空间中心 Y 位置 */
    y: number;
    /** Width in world units | 世界单位宽度 */
    width: number;
    /** Height in world units | 世界单位高度 */
    height: number;
    /** Rotation in radians | 旋转角度（弧度） */
    rotation: number;
    /** Origin X (0-1, default 0.5 for center) | 原点 X（0-1，默认 0.5 居中） */
    originX: number;
    /** Origin Y (0-1, default 0.5 for center) | 原点 Y（0-1，默认 0.5 居中） */
    originY: number;
    /** Color | 颜色 */
    color: GizmoColor;
    /** Show transform handles (move/rotate/scale based on mode) | 显示变换手柄 */
    showHandles: boolean;
}

/**
 * Circle gizmo data
 * 圆形 gizmo 数据
 */
export interface ICircleGizmoData {
    type: 'circle';
    /** Center X position | 中心 X 位置 */
    x: number;
    /** Center Y position | 中心 Y 位置 */
    y: number;
    /** Radius | 半径 */
    radius: number;
    /** Color | 颜色 */
    color: GizmoColor;
}

/**
 * Line gizmo data
 * 线条 gizmo 数据
 */
export interface ILineGizmoData {
    type: 'line';
    /** Line points | 线段点 */
    points: Array<{ x: number; y: number }>;
    /** Color | 颜色 */
    color: GizmoColor;
    /** Whether to close the path | 是否闭合路径 */
    closed: boolean;
}

/**
 * Grid gizmo data
 * 网格 gizmo 数据
 */
export interface IGridGizmoData {
    type: 'grid';
    /** Top-left X position | 左上角 X 位置 */
    x: number;
    /** Top-left Y position | 左上角 Y 位置 */
    y: number;
    /** Total width | 总宽度 */
    width: number;
    /** Total height | 总高度 */
    height: number;
    /** Number of columns | 列数 */
    cols: number;
    /** Number of rows | 行数 */
    rows: number;
    /** Color | 颜色 */
    color: GizmoColor;
}

/**
 * Union type for all gizmo data
 * 所有 gizmo 数据的联合类型
 */
export type IGizmoRenderData = IRectGizmoData | ICircleGizmoData | ILineGizmoData | IGridGizmoData;

/**
 * Gizmo Provider Interface
 * Gizmo 提供者接口
 *
 * Components can implement this interface to provide custom gizmo rendering.
 * The returned data will be rendered by the Rust WebGL engine.
 * 组件可以实现此接口以提供自定义 gizmo 渲染。
 * 返回的数据将由 Rust WebGL 引擎渲染。
 */
export interface IGizmoProvider {
    /**
     * Get gizmo render data for this component
     * 获取此组件的 gizmo 渲染数据
     *
     * @param entity The entity owning this component | 拥有此组件的实体
     * @param isSelected Whether the entity is selected | 实体是否被选中
     * @returns Array of gizmo render data | Gizmo 渲染数据数组
     */
    getGizmoData(entity: Entity, isSelected: boolean): IGizmoRenderData[];
}

/**
 * Check if a component implements IGizmoProvider
 * 检查组件是否实现了 IGizmoProvider
 */
export function hasGizmoProvider(component: unknown): component is IGizmoProvider {
    return component !== null &&
           typeof component === 'object' &&
           'getGizmoData' in component &&
           typeof (component as Record<string, unknown>).getGizmoData === 'function';
}

/**
 * Helper to create a gizmo color from hex string
 * 从十六进制字符串创建 gizmo 颜色的辅助函数
 */
export function hexToGizmoColor(hex: string, alpha: number = 1): GizmoColor {
    let r = 0, g = 1, b = 0;
    if (hex.startsWith('#')) {
        const hexValue = hex.slice(1);
        if (hexValue.length === 3) {
            r = parseInt(hexValue[0] + hexValue[0], 16) / 255;
            g = parseInt(hexValue[1] + hexValue[1], 16) / 255;
            b = parseInt(hexValue[2] + hexValue[2], 16) / 255;
        } else if (hexValue.length === 6) {
            r = parseInt(hexValue.slice(0, 2), 16) / 255;
            g = parseInt(hexValue.slice(2, 4), 16) / 255;
            b = parseInt(hexValue.slice(4, 6), 16) / 255;
        }
    }
    return { r, g, b, a: alpha };
}

/**
 * Predefined gizmo colors
 * 预定义的 gizmo 颜色
 */
export const GizmoColors = {
    /** Green for selected entities | 选中实体的绿色 */
    selected: { r: 0, g: 1, b: 0.5, a: 1 } as GizmoColor,
    /** Semi-transparent green for unselected | 未选中实体的半透明绿色 */
    unselected: { r: 0, g: 1, b: 0.5, a: 0.4 } as GizmoColor,
    /** White for camera frustum | 相机视锥体的白色 */
    camera: { r: 1, g: 1, b: 1, a: 0.8 } as GizmoColor,
    /** Cyan for colliders | 碰撞体的青色 */
    collider: { r: 0, g: 1, b: 1, a: 0.6 } as GizmoColor,
    /** Yellow for grid | 网格的黄色 */
    grid: { r: 1, g: 1, b: 0, a: 0.3 } as GizmoColor,
};
