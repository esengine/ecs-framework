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
import { TransformComponent } from '@esengine/ecs-components';
import { TilemapComponent } from '@esengine/tilemap';

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
 * Register gizmo provider for TilemapComponent.
 * 为 TilemapComponent 注册 gizmo 提供者。
 *
 * Uses the GizmoRegistry pattern for clean separation between
 * game components and editor functionality.
 * 使用 GizmoRegistry 模式实现游戏组件和编辑器功能的清晰分离。
 */
export function registerTilemapGizmo(): void {
    GizmoRegistry.register(TilemapComponent, tilemapGizmoProvider);
}

/**
 * Unregister gizmo provider for TilemapComponent.
 * 取消注册 TilemapComponent 的 gizmo 提供者。
 */
export function unregisterTilemapGizmo(): void {
    GizmoRegistry.unregister(TilemapComponent);
}
