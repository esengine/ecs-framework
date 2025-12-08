/**
 * Tilemap Gizmo Implementation
 * Tilemap Gizmo 实现
 *
 * Registers gizmo provider for TilemapComponent using the GizmoRegistry.
 * Rendered via Rust WebGL engine for optimal performance.
 * 使用 GizmoRegistry 为 TilemapComponent 注册 gizmo 提供者。
 * 通过 Rust WebGL 引擎渲染以获得最佳性能。
 */

import type { Entity } from '@esengine/ecs-framework';
import type { IGizmoRenderData, IRectGizmoData, IGridGizmoData, GizmoColor } from '@esengine/editor-core';
import { GizmoColors, GizmoRegistry } from '@esengine/editor-core';
import { TransformComponent } from '@esengine/engine-core';
import { TilemapComponent } from '@esengine/tilemap';
import { TilemapCollider2DComponent, TilemapColliderMode } from '@esengine/tilemap';

/**
 * Tilemap Collider Gizmo 颜色配置
 */
const TilemapColliderGizmoColors = {
    /** 碰撞体边框 - 青色 */
    collider: { r: 0.0, g: 0.8, b: 0.8, a: 0.8 } as GizmoColor,
    /** 碰撞体填充 - 半透明青色 */
    colliderFill: { r: 0.0, g: 0.8, b: 0.8, a: 0.2 } as GizmoColor,
    /** 选中时的碰撞体 - 亮青色 */
    colliderSelected: { r: 0.0, g: 1.0, b: 1.0, a: 1.0 } as GizmoColor,
    /** 触发器 - 橙色 */
    trigger: { r: 1.0, g: 0.6, b: 0.0, a: 0.8 } as GizmoColor,
};

/**
 * Gizmo provider function for TilemapComponent.
 * TilemapComponent 的 gizmo 提供者函数。
 *
 * Provides gizmo data including:
 * - Outer boundary rectangle
 * - Tile grid overlay (when selected)
 *
 * 提供的 gizmo 数据包括：
 * - 外部边界矩形
 * - 瓦片网格覆盖层（选中时）
 */
function tilemapGizmoProvider(
    tilemap: TilemapComponent,
    entity: Entity,
    isSelected: boolean
): IGizmoRenderData[] {
    const transform = entity.getComponent(TransformComponent);

    if (!transform) {
        return [];
    }

    const gizmos: IGizmoRenderData[] = [];

    // Calculate tilemap world bounds
    // 计算 tilemap 世界边界
    const width = tilemap.width * tilemap.tileWidth * transform.scale.x;
    const height = tilemap.height * tilemap.tileHeight * transform.scale.y;

    // Get rotation (handle both number and Vector3)
    // 获取旋转（处理数字和 Vector3 两种情况）
    const rotation = typeof transform.rotation === 'number'
        ? transform.rotation
        : transform.rotation.z;

    // Center position (tilemap origin is at bottom-left)
    // 中心位置（tilemap 原点在左下角）
    const centerX = transform.position.x + width / 2;
    const centerY = transform.position.y + height / 2;

    // Use predefined colors based on selection state
    // 根据选择状态使用预定义颜色
    const boundaryColor: GizmoColor = isSelected
        ? GizmoColors.selected
        : GizmoColors.unselected;

    // Outer boundary rectangle
    // 外部边界矩形
    const boundaryGizmo: IRectGizmoData = {
        type: 'rect',
        x: centerX,
        y: centerY,
        width,
        height,
        rotation,
        originX: 0.5,
        originY: 0.5,
        color: boundaryColor,
        showHandles: false
    };
    gizmos.push(boundaryGizmo);

    // Grid overlay (only when selected for performance)
    // 网格覆盖层（仅选中时显示以保证性能）
    if (isSelected) {
        const gridColor: GizmoColor = { ...GizmoColors.grid, a: 0.3 };

        const gridGizmo: IGridGizmoData = {
            type: 'grid',
            x: transform.position.x,
            y: transform.position.y,
            width,
            height,
            cols: tilemap.width,
            rows: tilemap.height,
            color: gridColor
        };
        gizmos.push(gridGizmo);
    }

    return gizmos;
}

/**
 * Gizmo provider function for TilemapCollider2DComponent.
 * TilemapCollider2DComponent 的 gizmo 提供者函数。
 *
 * Provides gizmo data for collision visualization:
 * - Shows collision rectangles (per-tile or merged)
 * - Different colors for trigger vs collider
 *
 * 提供碰撞可视化的 gizmo 数据：
 * - 显示碰撞矩形（每格或合并）
 * - 触发器和碰撞体使用不同颜色
 */
function tilemapCollider2DGizmoProvider(
    collider: TilemapCollider2DComponent,
    entity: Entity,
    isSelected: boolean
): IGizmoRenderData[] {
    const transform = entity.getComponent(TransformComponent);
    const tilemap = entity.getComponent(TilemapComponent);

    if (!transform || !tilemap) {
        return [];
    }

    const gizmos: IGizmoRenderData[] = [];

    // 获取碰撞颜色
    const color = isSelected
        ? TilemapColliderGizmoColors.colliderSelected
        : (collider.isTrigger ? TilemapColliderGizmoColors.trigger : TilemapColliderGizmoColors.collider);

    // 获取实体位置偏移
    const offsetX = transform.position.x;
    const offsetY = transform.position.y;
    const scaleX = transform.scale.x;
    const scaleY = transform.scale.y;

    // 获取旋转
    const rotation = typeof transform.rotation === 'number'
        ? transform.rotation
        : transform.rotation.z;

    // 计算地图总高度（像素），用于 Y 轴翻转
    // Calculate total map height (pixels) for Y-axis flip
    const mapPixelHeight = tilemap.height * tilemap.tileHeight;

    // 如果已有碰撞矩形缓存，直接使用
    if (collider._collisionRects.length > 0) {
        // 使用已生成的碰撞矩形
        for (const rect of collider._collisionRects) {
            // Y 轴翻转：rect.y 是从顶部计算的，需要翻转到底部
            // Y-axis flip: rect.y is calculated from top, needs flip to bottom
            const flippedY = mapPixelHeight - rect.y - rect.height;
            const worldX = offsetX + (rect.x + rect.width / 2) * scaleX;
            const worldY = offsetY + (flippedY + rect.height / 2) * scaleY;
            const worldWidth = rect.width * scaleX;
            const worldHeight = rect.height * scaleY;

            const rectGizmo: IRectGizmoData = {
                type: 'rect',
                x: worldX,
                y: worldY,
                width: worldWidth,
                height: worldHeight,
                rotation,
                originX: 0.5,
                originY: 0.5,
                color,
                showHandles: false
            };
            gizmos.push(rectGizmo);
        }
    } else {
        // 如果没有缓存，根据模式生成预览
        const collisionData = tilemap.collisionData;
        const width = tilemap.width;
        const height = tilemap.height;
        const tileWidth = tilemap.tileWidth;
        const tileHeight = tilemap.tileHeight;

        if (collider.colliderMode === TilemapColliderMode.PerTile) {
            // PerTile 模式：每个碰撞格子单独显示
            for (let row = 0; row < height; row++) {
                for (let col = 0; col < width; col++) {
                    if (collisionData[row * width + col] > 0) {
                        // Y 轴翻转：数据存储 row 0 在顶部，渲染时 Y-up 需要翻转
                        // Y-axis flip: data stores row 0 at top, rendering needs Y-up flip
                        const flippedRow = height - 1 - row;
                        const worldX = offsetX + (col * tileWidth + tileWidth / 2) * scaleX;
                        const worldY = offsetY + (flippedRow * tileHeight + tileHeight / 2) * scaleY;
                        const worldWidth = tileWidth * scaleX;
                        const worldHeight = tileHeight * scaleY;

                        const rectGizmo: IRectGizmoData = {
                            type: 'rect',
                            x: worldX,
                            y: worldY,
                            width: worldWidth,
                            height: worldHeight,
                            rotation,
                            originX: 0.5,
                            originY: 0.5,
                            color,
                            showHandles: false
                        };
                        gizmos.push(rectGizmo);
                    }
                }
            }
        } else {
            // Merged 模式：使用贪心算法合并相邻格子
            const rects = generateMergedRects(collisionData, width, height, tileWidth, tileHeight);

            for (const rect of rects) {
                // Y 轴翻转：rect.y 是从顶部计算的，需要翻转到底部
                // Y-axis flip: rect.y is calculated from top, needs flip to bottom
                const flippedY = mapPixelHeight - rect.y - rect.height;
                const worldX = offsetX + (rect.x + rect.width / 2) * scaleX;
                const worldY = offsetY + (flippedY + rect.height / 2) * scaleY;
                const worldWidth = rect.width * scaleX;
                const worldHeight = rect.height * scaleY;

                const rectGizmo: IRectGizmoData = {
                    type: 'rect',
                    x: worldX,
                    y: worldY,
                    width: worldWidth,
                    height: worldHeight,
                    rotation,
                    originX: 0.5,
                    originY: 0.5,
                    color,
                    showHandles: false
                };
                gizmos.push(rectGizmo);
            }
        }
    }

    return gizmos;
}

/**
 * 生成合并的碰撞矩形（贪心算法）
 * 用于 Gizmo 预览，与 TilemapCollider2DComponent 中的算法相同
 */
function generateMergedRects(
    collisionData: Uint32Array,
    width: number,
    height: number,
    tileWidth: number,
    tileHeight: number
): Array<{ x: number; y: number; width: number; height: number }> {
    if (collisionData.length === 0) {
        return [];
    }

    const processed = new Array(width * height).fill(false);
    const rects: Array<{ x: number; y: number; width: number; height: number }> = [];

    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            const index = row * width + col;

            if (processed[index] || collisionData[index] === 0) {
                continue;
            }

            // 找到水平方向最大范围
            let endCol = col;
            while (
                endCol < width &&
                collisionData[row * width + endCol] > 0 &&
                !processed[row * width + endCol]
            ) {
                endCol++;
            }
            const rectWidth = endCol - col;

            // 找到垂直方向最大范围
            let endRow = row;
            let canExtend = true;
            while (canExtend && endRow < height) {
                for (let c = col; c < endCol; c++) {
                    const idx = endRow * width + c;
                    if (collisionData[idx] === 0 || processed[idx]) {
                        canExtend = false;
                        break;
                    }
                }
                if (canExtend) {
                    endRow++;
                }
            }
            const rectHeight = endRow - row;

            // 标记所有包含的格子为已处理
            for (let r = row; r < endRow; r++) {
                for (let c = col; c < endCol; c++) {
                    processed[r * width + c] = true;
                }
            }

            // 添加合并后的矩形
            rects.push({
                x: col * tileWidth,
                y: row * tileHeight,
                width: rectWidth * tileWidth,
                height: rectHeight * tileHeight,
            });
        }
    }

    return rects;
}

/**
 * Register gizmo provider for TilemapComponent.
 * 为 TilemapComponent 注册 gizmo 提供者。
 *
 * Uses the GizmoRegistry pattern for clean separation between
 * game components and editor functionality.
 * 使用 GizmoRegistry 模式实现游戏组件和编辑器功能的清晰分离。
 */
export function registerTilemapGizmo(): void {
    GizmoRegistry.register(TilemapComponent, tilemapGizmoProvider);
    GizmoRegistry.register(TilemapCollider2DComponent, tilemapCollider2DGizmoProvider);
}

/**
 * Unregister gizmo provider for TilemapComponent.
 * 取消注册 TilemapComponent 的 gizmo 提供者。
 */
export function unregisterTilemapGizmo(): void {
    GizmoRegistry.unregister(TilemapComponent);
    GizmoRegistry.unregister(TilemapCollider2DComponent);
}
