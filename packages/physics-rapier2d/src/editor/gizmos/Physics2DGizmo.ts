/**
 * Physics 2D Gizmo Implementation
 * 2D 物理 Gizmo 实现
 *
 * Registers gizmo providers for physics components using the GizmoRegistry.
 * Rendered via Rust WebGL engine for optimal performance.
 * 使用 GizmoRegistry 为物理组件注册 gizmo 提供者。
 * 通过 Rust WebGL 引擎渲染以获得最佳性能。
 */

import type { Entity } from '@esengine/ecs-framework';
import type {
    IGizmoRenderData,
    IRectGizmoData,
    ICircleGizmoData,
    ILineGizmoData,
    GizmoColor
} from '@esengine/editor-core';
import { GizmoColors, GizmoRegistry } from '@esengine/editor-core';
import { TransformComponent } from '@esengine/ecs-components';

import { BoxCollider2DComponent } from '../../components/BoxCollider2DComponent';
import { CircleCollider2DComponent } from '../../components/CircleCollider2DComponent';
import { CapsuleCollider2DComponent } from '../../components/CapsuleCollider2DComponent';
import { PolygonCollider2DComponent } from '../../components/PolygonCollider2DComponent';
import { Rigidbody2DComponent } from '../../components/Rigidbody2DComponent';
import { RigidbodyType2D } from '../../types/Physics2DTypes';

/**
 * Collider gizmo color based on selection state
 * 根据选择状态设置碰撞体 gizmo 颜色
 */
function getColliderColor(isSelected: boolean, isTrigger: boolean): GizmoColor {
    if (isTrigger) {
        return isSelected
            ? { r: 1, g: 0.5, b: 0, a: 0.8 }   // Orange for selected trigger
            : { r: 1, g: 0.5, b: 0, a: 0.4 };  // Semi-transparent orange for unselected trigger
    }
    return isSelected
        ? GizmoColors.collider                  // Cyan for selected collider
        : { ...GizmoColors.collider, a: 0.4 }; // Semi-transparent cyan for unselected
}

/**
 * Rigidbody indicator color based on body type
 * 根据刚体类型设置指示器颜色
 */
function getRigidbodyColor(bodyType: RigidbodyType2D, isSelected: boolean): GizmoColor {
    const alpha = isSelected ? 0.8 : 0.4;
    switch (bodyType) {
        case RigidbodyType2D.Dynamic:
            return { r: 0, g: 0.8, b: 1, a: alpha };    // Light blue for dynamic
        case RigidbodyType2D.Kinematic:
            return { r: 1, g: 0.8, b: 0, a: alpha };    // Yellow for kinematic
        case RigidbodyType2D.Static:
            return { r: 0.5, g: 0.5, b: 0.5, a: alpha }; // Gray for static
        default:
            return { r: 1, g: 1, b: 1, a: alpha };
    }
}

/**
 * BoxCollider2D gizmo provider
 * 矩形碰撞体 gizmo 提供者
 */
function boxCollider2DGizmoProvider(
    collider: BoxCollider2DComponent,
    entity: Entity,
    isSelected: boolean
): IGizmoRenderData[] {
    const transform = entity.getComponent(TransformComponent);
    if (!transform) return [];

    const gizmos: IGizmoRenderData[] = [];
    const color = getColliderColor(isSelected, collider.isTrigger);

    // Get rotation (handle both number and Vector3)
    const rotation = typeof transform.rotation === 'number'
        ? transform.rotation
        : transform.rotation.z;

    // Calculate world position with offset
    const worldX = transform.position.x + collider.offset.x * transform.scale.x;
    const worldY = transform.position.y + collider.offset.y * transform.scale.y;

    const rectGizmo: IRectGizmoData = {
        type: 'rect',
        x: worldX,
        y: worldY,
        width: collider.width * transform.scale.x,
        height: collider.height * transform.scale.y,
        rotation: rotation + collider.rotationOffset,
        originX: 0.5,
        originY: 0.5,
        color,
        showHandles: false
    };
    gizmos.push(rectGizmo);

    return gizmos;
}

/**
 * CircleCollider2D gizmo provider
 * 圆形碰撞体 gizmo 提供者
 */
function circleCollider2DGizmoProvider(
    collider: CircleCollider2DComponent,
    entity: Entity,
    isSelected: boolean
): IGizmoRenderData[] {
    const transform = entity.getComponent(TransformComponent);
    if (!transform) return [];

    const gizmos: IGizmoRenderData[] = [];
    const color = getColliderColor(isSelected, collider.isTrigger);

    // Calculate world position with offset
    const worldX = transform.position.x + collider.offset.x * transform.scale.x;
    const worldY = transform.position.y + collider.offset.y * transform.scale.y;

    // Use the larger scale for radius (circles should remain circular)
    const scale = Math.max(Math.abs(transform.scale.x), Math.abs(transform.scale.y));

    const circleGizmo: ICircleGizmoData = {
        type: 'circle',
        x: worldX,
        y: worldY,
        radius: collider.radius * scale,
        color
    };
    gizmos.push(circleGizmo);

    return gizmos;
}

/**
 * CapsuleCollider2D gizmo provider
 * 胶囊碰撞体 gizmo 提供者
 */
function capsuleCollider2DGizmoProvider(
    collider: CapsuleCollider2DComponent,
    entity: Entity,
    isSelected: boolean
): IGizmoRenderData[] {
    const transform = entity.getComponent(TransformComponent);
    if (!transform) return [];

    const gizmos: IGizmoRenderData[] = [];
    const color = getColliderColor(isSelected, collider.isTrigger);

    // Get rotation
    const rotation = typeof transform.rotation === 'number'
        ? transform.rotation
        : transform.rotation.z;
    const totalRotation = rotation + collider.rotationOffset;

    // Calculate world position with offset
    const worldX = transform.position.x + collider.offset.x * transform.scale.x;
    const worldY = transform.position.y + collider.offset.y * transform.scale.y;

    const radius = collider.radius * transform.scale.x;
    const halfHeight = collider.halfHeight * transform.scale.y;

    // Draw capsule as two circles and connecting lines
    // 绘制胶囊体为两个圆和连接线
    const cos = Math.cos(totalRotation);
    const sin = Math.sin(totalRotation);

    // Top circle center
    const topCenterX = worldX - sin * halfHeight;
    const topCenterY = worldY + cos * halfHeight;

    // Bottom circle center
    const bottomCenterX = worldX + sin * halfHeight;
    const bottomCenterY = worldY - cos * halfHeight;

    // Top semicircle
    gizmos.push({
        type: 'circle',
        x: topCenterX,
        y: topCenterY,
        radius,
        color
    } as ICircleGizmoData);

    // Bottom semicircle
    gizmos.push({
        type: 'circle',
        x: bottomCenterX,
        y: bottomCenterY,
        radius,
        color
    } as ICircleGizmoData);

    // Connecting lines (left and right sides)
    const perpX = cos * radius;
    const perpY = sin * radius;

    gizmos.push({
        type: 'line',
        points: [
            { x: topCenterX - perpX, y: topCenterY - perpY },
            { x: bottomCenterX - perpX, y: bottomCenterY - perpY }
        ],
        color,
        closed: false
    } as ILineGizmoData);

    gizmos.push({
        type: 'line',
        points: [
            { x: topCenterX + perpX, y: topCenterY + perpY },
            { x: bottomCenterX + perpX, y: bottomCenterY + perpY }
        ],
        color,
        closed: false
    } as ILineGizmoData);

    return gizmos;
}

/**
 * PolygonCollider2D gizmo provider
 * 多边形碰撞体 gizmo 提供者
 */
function polygonCollider2DGizmoProvider(
    collider: PolygonCollider2DComponent,
    entity: Entity,
    isSelected: boolean
): IGizmoRenderData[] {
    const transform = entity.getComponent(TransformComponent);
    if (!transform) return [];

    if (collider.vertices.length < 3) return [];

    const gizmos: IGizmoRenderData[] = [];
    const color = getColliderColor(isSelected, collider.isTrigger);

    // Get rotation
    const rotation = typeof transform.rotation === 'number'
        ? transform.rotation
        : transform.rotation.z;
    const totalRotation = rotation + collider.rotationOffset;
    const cos = Math.cos(totalRotation);
    const sin = Math.sin(totalRotation);

    // Transform vertices to world space
    const worldPoints = collider.vertices.map(v => {
        // Apply scale
        const scaledX = (v.x + collider.offset.x) * transform.scale.x;
        const scaledY = (v.y + collider.offset.y) * transform.scale.y;

        // Apply rotation
        const rotatedX = scaledX * cos - scaledY * sin;
        const rotatedY = scaledX * sin + scaledY * cos;

        // Apply translation
        return {
            x: transform.position.x + rotatedX,
            y: transform.position.y + rotatedY
        };
    });

    gizmos.push({
        type: 'line',
        points: worldPoints,
        color,
        closed: true
    } as ILineGizmoData);

    return gizmos;
}

/**
 * Rigidbody2D gizmo provider - shows velocity indicator when playing
 * 刚体 gizmo 提供者 - 播放时显示速度指示器
 */
function rigidbody2DGizmoProvider(
    rigidbody: Rigidbody2DComponent,
    entity: Entity,
    isSelected: boolean
): IGizmoRenderData[] {
    const transform = entity.getComponent(TransformComponent);
    if (!transform) return [];

    const gizmos: IGizmoRenderData[] = [];

    // Only show velocity indicator when selected and has significant velocity
    if (isSelected) {
        const velMagnitude = Math.sqrt(
            rigidbody.velocity.x * rigidbody.velocity.x +
            rigidbody.velocity.y * rigidbody.velocity.y
        );

        // Draw velocity indicator if moving
        if (velMagnitude > 0.1) {
            const color = getRigidbodyColor(rigidbody.bodyType, isSelected);
            const scale = 0.5; // Scale factor for velocity visualization

            gizmos.push({
                type: 'line',
                points: [
                    { x: transform.position.x, y: transform.position.y },
                    {
                        x: transform.position.x + rigidbody.velocity.x * scale,
                        y: transform.position.y + rigidbody.velocity.y * scale
                    }
                ],
                color,
                closed: false
            } as ILineGizmoData);
        }

        // Show body type indicator as small marker
        const markerColor = getRigidbodyColor(rigidbody.bodyType, true);
        gizmos.push({
            type: 'circle',
            x: transform.position.x,
            y: transform.position.y,
            radius: 0.1,
            color: markerColor
        } as ICircleGizmoData);
    }

    return gizmos;
}

/**
 * Register gizmo providers for all physics components.
 * 为所有物理组件注册 gizmo 提供者。
 */
export function registerPhysics2DGizmos(): void {
    GizmoRegistry.register(BoxCollider2DComponent, boxCollider2DGizmoProvider);
    GizmoRegistry.register(CircleCollider2DComponent, circleCollider2DGizmoProvider);
    GizmoRegistry.register(CapsuleCollider2DComponent, capsuleCollider2DGizmoProvider);
    GizmoRegistry.register(PolygonCollider2DComponent, polygonCollider2DGizmoProvider);
    GizmoRegistry.register(Rigidbody2DComponent, rigidbody2DGizmoProvider);
}

/**
 * Unregister gizmo providers for all physics components.
 * 取消注册所有物理组件的 gizmo 提供者。
 */
export function unregisterPhysics2DGizmos(): void {
    GizmoRegistry.unregister(BoxCollider2DComponent);
    GizmoRegistry.unregister(CircleCollider2DComponent);
    GizmoRegistry.unregister(CapsuleCollider2DComponent);
    GizmoRegistry.unregister(PolygonCollider2DComponent);
    GizmoRegistry.unregister(Rigidbody2DComponent);
}
