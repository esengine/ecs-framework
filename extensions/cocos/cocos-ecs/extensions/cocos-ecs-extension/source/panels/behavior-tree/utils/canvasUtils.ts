import { CanvasCoordinates } from '../types';

/**
 * 获取相对于画布的坐标（考虑缩放和平移）
 */
export function getCanvasCoordinates(
    event: MouseEvent, 
    canvasElement: HTMLElement | null,
    panX: number,
    panY: number,
    zoomLevel: number
): CanvasCoordinates {
    if (!canvasElement) {
        return { x: 0, y: 0 };
    }
    
    try {
        const rect = canvasElement.getBoundingClientRect();
        const x = (event.clientX - rect.left - panX) / zoomLevel;
        const y = (event.clientY - rect.top - panY) / zoomLevel;
        return { x, y };
    } catch (error) {
        return { x: 0, y: 0 };
    }
}

/**
 * 计算网格样式
 */
export function getGridStyle(panX: number, panY: number, zoomLevel: number) {
    const gridSize = 20 * zoomLevel;
    return {
        backgroundSize: `${gridSize}px ${gridSize}px`,
        backgroundPosition: `${panX % gridSize}px ${panY % gridSize}px`
    };
}

/**
 * 计算视图居中的平移值
 */
export function calculateCenterView(
    nodes: any[],
    canvasWidth: number,
    canvasHeight: number,
    zoomLevel: number
): { panX: number; panY: number } {
    if (nodes.length === 0) {
        return { panX: 0, panY: 0 };
    }
    
    // 计算所有节点的边界
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    nodes.forEach(node => {
        minX = Math.min(minX, node.x);
        minY = Math.min(minY, node.y);
        maxX = Math.max(maxX, node.x + 150);
        maxY = Math.max(maxY, node.y + 100);
    });
    
    // 计算中心点
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    
    // 设置平移，使内容居中
    const panX = canvasWidth / 2 - centerX * zoomLevel;
    const panY = canvasHeight / 2 - centerY * zoomLevel;
    
    return { panX, panY };
}

/**
 * 约束缩放级别
 */
export function constrainZoom(zoom: number): number {
    return Math.max(0.3, Math.min(zoom, 3));
}

/**
 * 计算缩放后的坐标
 */
export function transformCoordinate(
    x: number, 
    y: number, 
    panX: number, 
    panY: number, 
    zoomLevel: number
): { x: number; y: number } {
    return {
        x: x * zoomLevel + panX,
        y: y * zoomLevel + panY
    };
}

/**
 * 计算逆向变换的坐标（从屏幕坐标到画布坐标）
 */
export function inverseTransformCoordinate(
    screenX: number,
    screenY: number,
    panX: number,
    panY: number,
    zoomLevel: number
): { x: number; y: number } {
    return {
        x: (screenX - panX) / zoomLevel,
        y: (screenY - panY) / zoomLevel
    };
} 