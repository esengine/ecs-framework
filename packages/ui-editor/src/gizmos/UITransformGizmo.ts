import type { Entity } from '@esengine/ecs-framework';
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

    const width = transform.width * transform.scaleX;
    const height = transform.height * transform.scaleY;

    const centerX = transform.x + width * transform.pivotX;
    const centerY = transform.y + height * transform.pivotY;

    const gizmo: IRectGizmoData = {
        type: 'rect',
        x: centerX,
        y: centerY,
        width,
        height,
        rotation: transform.rotation,
        originX: transform.pivotX,
        originY: transform.pivotY,
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
