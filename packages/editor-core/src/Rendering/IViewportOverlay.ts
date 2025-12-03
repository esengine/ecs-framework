/**
 * Viewport Overlay Interface
 * 视口覆盖层接口
 *
 * Defines the interface for rendering overlays on viewports (grid, selection, gizmos, etc.)
 * 定义在视口上渲染覆盖层的接口（网格、选区、辅助线等）
 */

import type { ViewportCameraConfig } from '../Services/IViewportService';

/**
 * Context passed to overlay renderers
 * 传递给覆盖层渲染器的上下文
 */
export interface OverlayRenderContext {
    /** Current camera state | 当前相机状态 */
    camera: ViewportCameraConfig;
    /** Viewport dimensions | 视口尺寸 */
    viewport: { width: number; height: number };
    /** Device pixel ratio | 设备像素比 */
    dpr: number;
    /** Selected entity IDs (if applicable) | 选中的实体 ID（如果适用） */
    selectedEntityIds?: number[];
    /** Delta time since last frame | 距上一帧的时间差 */
    deltaTime: number;
    /** Add a line gizmo | 添加线条辅助线 */
    addLine(x1: number, y1: number, x2: number, y2: number, color: number, thickness?: number): void;
    /** Add a rectangle gizmo (outline) | 添加矩形辅助线（轮廓） */
    addRect(x: number, y: number, width: number, height: number, color: number, thickness?: number): void;
    /** Add a filled rectangle gizmo | 添加填充矩形辅助线 */
    addFilledRect(x: number, y: number, width: number, height: number, color: number): void;
    /** Add a circle gizmo (outline) | 添加圆形辅助线（轮廓） */
    addCircle(x: number, y: number, radius: number, color: number, thickness?: number): void;
    /** Add a filled circle gizmo | 添加填充圆形辅助线 */
    addFilledCircle(x: number, y: number, radius: number, color: number): void;
    /** Add text | 添加文本 */
    addText?(text: string, x: number, y: number, color: number, fontSize?: number): void;
}

/**
 * Interface for viewport overlays (grid, selection, etc.)
 * 视口覆盖层接口（网格、选区等）
 */
export interface IViewportOverlay {
    /** Unique overlay identifier | 唯一覆盖层标识符 */
    readonly id: string;
    /** Priority (higher = rendered later/on top) | 优先级（越高越晚渲染/在上层） */
    priority: number;
    /** Whether overlay is visible | 覆盖层是否可见 */
    visible: boolean;

    /**
     * Render the overlay
     * 渲染覆盖层
     * @param context - Render context with camera, viewport info, and gizmo APIs
     */
    render(context: OverlayRenderContext): void;

    /**
     * Update the overlay (optional, called each frame before render)
     * 更新覆盖层（可选，每帧在渲染前调用）
     * @param deltaTime - Time since last update
     */
    update?(deltaTime: number): void;

    /**
     * Dispose the overlay resources
     * 释放覆盖层资源
     */
    dispose?(): void;
}

/**
 * Base class for viewport overlays
 * 视口覆盖层基类
 */
export abstract class ViewportOverlayBase implements IViewportOverlay {
    abstract readonly id: string;
    priority = 0;
    visible = true;

    abstract render(context: OverlayRenderContext): void;

    update?(deltaTime: number): void;

    dispose?(): void;
}

/**
 * Grid overlay for viewports
 * 视口网格覆盖层
 */
export class GridOverlay extends ViewportOverlayBase {
    override readonly id = 'grid';
    override priority = 0;

    /** Grid cell size in world units | 网格单元格大小（世界单位） */
    cellSize = 32;
    /** Grid line color (ARGB packed) | 网格线颜色（ARGB 打包） */
    lineColor = 0x40FFFFFF;
    /** Major grid line interval | 主网格线间隔 */
    majorLineInterval = 10;
    /** Major grid line color (ARGB packed) | 主网格线颜色（ARGB 打包） */
    majorLineColor = 0x60FFFFFF;
    /** Show axis lines | 显示轴线 */
    showAxisLines = true;
    /** X axis color | X 轴颜色 */
    xAxisColor = 0xFFFF5555;
    /** Y axis color | Y 轴颜色 */
    yAxisColor = 0xFF55FF55;

    render(context: OverlayRenderContext): void {
        const { camera, viewport } = context;
        const halfWidth = (viewport.width / 2) / camera.zoom;
        const halfHeight = (viewport.height / 2) / camera.zoom;

        // Calculate visible grid range
        const left = camera.x - halfWidth;
        const right = camera.x + halfWidth;
        const bottom = camera.y - halfHeight;
        const top = camera.y + halfHeight;

        // Round to grid lines
        const startX = Math.floor(left / this.cellSize) * this.cellSize;
        const endX = Math.ceil(right / this.cellSize) * this.cellSize;
        const startY = Math.floor(bottom / this.cellSize) * this.cellSize;
        const endY = Math.ceil(top / this.cellSize) * this.cellSize;

        // Draw vertical lines
        for (let x = startX; x <= endX; x += this.cellSize) {
            const isMajor = x % (this.cellSize * this.majorLineInterval) === 0;
            const color = isMajor ? this.majorLineColor : this.lineColor;
            context.addLine(x, startY, x, endY, color, isMajor ? 1.5 : 1);
        }

        // Draw horizontal lines
        for (let y = startY; y <= endY; y += this.cellSize) {
            const isMajor = y % (this.cellSize * this.majorLineInterval) === 0;
            const color = isMajor ? this.majorLineColor : this.lineColor;
            context.addLine(startX, y, endX, y, color, isMajor ? 1.5 : 1);
        }

        // Draw axis lines
        if (this.showAxisLines) {
            // X axis (red)
            if (bottom <= 0 && top >= 0) {
                context.addLine(startX, 0, endX, 0, this.xAxisColor, 2);
            }
            // Y axis (green)
            if (left <= 0 && right >= 0) {
                context.addLine(0, startY, 0, endY, this.yAxisColor, 2);
            }
        }
    }
}

/**
 * Selection highlight overlay
 * 选区高亮覆盖层
 */
export class SelectionOverlay extends ViewportOverlayBase {
    override readonly id = 'selection';
    override priority = 100;

    /** Selection highlight color (ARGB packed) | 选区高亮颜色（ARGB 打包） */
    highlightColor = 0x404488FF;
    /** Selection border color (ARGB packed) | 选区边框颜色（ARGB 打包） */
    borderColor = 0xFF4488FF;
    /** Border thickness | 边框厚度 */
    borderThickness = 2;

    private _selections: Array<{ x: number; y: number; width: number; height: number }> = [];

    /**
     * Set selection rectangles
     * 设置选区矩形
     */
    setSelections(selections: Array<{ x: number; y: number; width: number; height: number }>): void {
        this._selections = selections;
    }

    /**
     * Clear all selections
     * 清除所有选区
     */
    clearSelections(): void {
        this._selections = [];
    }

    render(context: OverlayRenderContext): void {
        for (const sel of this._selections) {
            // Draw filled rectangle
            context.addFilledRect(sel.x, sel.y, sel.width, sel.height, this.highlightColor);
            // Draw border
            context.addRect(sel.x, sel.y, sel.width, sel.height, this.borderColor, this.borderThickness);
        }
    }
}
