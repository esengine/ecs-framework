import type { Entity } from '@esengine/esengine';
import type { IGizmoRenderData, IRectGizmoData, GizmoColor } from '@esengine/editor-core';
import { GizmoRegistry } from '@esengine/editor-core';
import { UITransformComponent } from '@esengine/ui';

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
    // Use world scale for proper hierarchical transform inheritance
    // 使用世界缩放以正确继承层级变换
    const scaleX = transform.worldScaleX ?? transform.scaleX;
    const scaleY = transform.worldScaleY ?? transform.scaleY;
    const width = (transform.computedWidth ?? transform.width) * scaleX;
    const height = (transform.computedHeight ?? transform.height) * scaleY;
    // Use world rotation for proper hierarchical transform inheritance
    // 使用世界旋转以正确继承层级变换
    const rotation = transform.worldRotation ?? transform.rotation;
    // 使用 transform 的 pivot 作为旋转/缩放中心
    const pivotX = transform.pivotX;
    const pivotY = transform.pivotY;
    // 渲染位置 = 左下角 + pivot 偏移
    const renderX = x + width * pivotX;
    const renderY = y + height * pivotY;

    // Use pivot position with transform's pivot values as origin
    // 使用 transform 的 pivot 值作为 gizmo 的原点
    const gizmo: IRectGizmoData = {
        type: 'rect',
        x: renderX,
        y: renderY,
        width,
        height,
        rotation,
        originX: pivotX,
        originY: pivotY,
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
