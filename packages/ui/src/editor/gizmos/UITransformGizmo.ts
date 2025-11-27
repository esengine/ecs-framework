import type { Entity } from '@esengine/ecs-framework';
import type { IGizmoRenderData, IRectGizmoData, GizmoColor } from '@esengine/editor-core';
import { GizmoRegistry } from '@esengine/editor-core';
import { UITransformComponent } from '../../components';

const UI_GIZMO_COLOR: GizmoColor = { r: 0.2, g: 0.6, b: 1, a: 0.8 };
const UI_GIZMO_COLOR_UNSELECTED: GizmoColor = { r: 0.2, g: 0.6, b: 1, a: 0.3 };

function uiTransformGizmoProvider(
    transform: UITransformComponent,
    _entity: Entity,
    isSelected: boolean
): IGizmoRenderData[] {
    if (!transform.visible) {
        return [];
    }

    // Use world coordinates (computed by UILayoutSystem) if available
    // Otherwise fallback to local coordinates
    // 使用世界坐标（由 UILayoutSystem 计算），如果可用
    // 否则回退到本地坐标
    const x = transform.worldX ?? transform.x;
    const y = transform.worldY ?? transform.y;
    const width = (transform.computedWidth ?? transform.width) * transform.scaleX;
    const height = (transform.computedHeight ?? transform.height) * transform.scaleY;

    // Use bottom-left position with origin at (0, 0)
    // x, y is bottom-left corner in UITransform coordinate system (Y-up)
    // This matches Gizmo origin=(0,0) which means reference point is at bottom-left
    // 使用左下角位置，原点在 (0, 0)
    // UITransform 坐标系中 x, y 是左下角（Y 向上）
    // 这与 Gizmo origin=(0,0) 匹配，表示参考点在左下角
    const gizmo: IRectGizmoData = {
        type: 'rect',
        x,
        y,
        width,
        height,
        rotation: transform.rotation,
        originX: 0,
        originY: 0,
        color: isSelected ? UI_GIZMO_COLOR : UI_GIZMO_COLOR_UNSELECTED,
        showHandles: isSelected
    };

    return [gizmo];
}

export function registerUITransformGizmo(): void {
    GizmoRegistry.register(UITransformComponent, uiTransformGizmoProvider);
}

export function unregisterUITransformGizmo(): void {
    GizmoRegistry.unregister(UITransformComponent);
}
