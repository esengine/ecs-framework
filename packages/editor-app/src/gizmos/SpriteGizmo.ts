/**
 * Sprite Gizmo Implementation
 * 精灵 Gizmo 实现
 *
 * Registers gizmo provider for SpriteComponent using the GizmoRegistry.
 * Rendered via Rust WebGL engine for optimal performance.
 * 使用 GizmoRegistry 为 SpriteComponent 注册 gizmo 提供者。
 * 通过 Rust WebGL 引擎渲染以获得最佳性能。
 */

import type { Entity } from '@esengine/ecs-framework';
import type { IGizmoRenderData, IRectGizmoData, GizmoColor } from '@esengine/editor-core';
import { GizmoColors, GizmoRegistry } from '@esengine/editor-core';
import { TransformComponent } from '@esengine/engine-core';
import { SpriteComponent } from '@esengine/sprite';

/**
 * Gizmo provider function for SpriteComponent.
 * SpriteComponent 的 gizmo 提供者函数。
 */
function spriteGizmoProvider(
    sprite: SpriteComponent,
    entity: Entity,
    isSelected: boolean
): IGizmoRenderData[] {
    const transform = entity.getComponent(TransformComponent);
    if (!transform) {
        return [];
    }

    // Calculate world-space dimensions
    // 计算世界空间尺寸
    const width = sprite.width * transform.scale.x;
    const height = sprite.height * transform.scale.y;

    // Get rotation (handle both number and Vector3)
    // 获取旋转（处理数字和 Vector3 两种情况）
    const rotation = typeof transform.rotation === 'number'
        ? transform.rotation
        : transform.rotation.z;

    // Use predefined colors based on selection state
    // 根据选择状态使用预定义颜色
    const color: GizmoColor = isSelected
        ? GizmoColors.selected
        : GizmoColors.unselected;

    const gizmo: IRectGizmoData = {
        type: 'rect',
        x: transform.position.x,
        y: transform.position.y,
        width,
        height,
        rotation,
        originX: sprite.anchorX,
        originY: sprite.anchorY,
        color,
        showHandles: false  // Selection handles are drawn separately by EngineRenderSystem
    };

    return [gizmo];
}

/**
 * Register gizmo provider for SpriteComponent.
 * 为 SpriteComponent 注册 gizmo 提供者。
 *
 * Uses the GizmoRegistry pattern for clean separation between
 * game components and editor functionality.
 * 使用 GizmoRegistry 模式实现游戏组件和编辑器功能的清晰分离。
 */
export function registerSpriteGizmo(): void {
    GizmoRegistry.register(SpriteComponent, spriteGizmoProvider);
}

/**
 * Unregister gizmo provider for SpriteComponent.
 * 取消注册 SpriteComponent 的 gizmo 提供者。
 */
export function unregisterSpriteGizmo(): void {
    GizmoRegistry.unregister(SpriteComponent);
}
