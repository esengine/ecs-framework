/**
 * Physics 2D Gizmo Implementation
 * 2D 物理 Gizmo 实现
 *
 * 使用 GizmoRegistry 为物理组件注册 gizmo 提供者。
 * 通过 Rust WebGL 引擎渲染。
 */

import type { Entity } from '@esengine/ecs-framework';
import type {
    IGizmoRenderData,
    IRectGizmoData,
    ICircleGizmoData,
    ILineGizmoData,
    ICapsuleGizmoData,
    GizmoColor
} from '@esengine/editor-core';
import { GizmoRegistry } from '@esengine/editor-core';
import { TransformComponent } from '@esengine/ecs-components';

import { BoxCollider2DComponent } from '@esengine/physics-rapier2d/BoxCollider2DComponent';
import { CircleCollider2DComponent } from '@esengine/physics-rapier2d/CircleCollider2DComponent';
import { CapsuleCollider2DComponent } from '@esengine/physics-rapier2d/CapsuleCollider2DComponent';
import { PolygonCollider2DComponent } from '@esengine/physics-rapier2d/PolygonCollider2DComponent';
import { Rigidbody2DComponent } from '@esengine/physics-rapier2d/Rigidbody2DComponent';
import { RigidbodyType2D } from '@esengine/physics-rapier2d/Physics2DTypes';

/**
 * 物理 Gizmo 颜色配置
 */
const PhysicsGizmoColors = {
    collider: { r: 0.0, g: 0.8, b: 0.0, a: 1.0 } as GizmoColor,
    trigger: { r: 1.0, g: 0.6, b: 0.0, a: 1.0 } as GizmoColor,
    selected: { r: 0.0, g: 1.0, b: 1.0, a: 1.0 } as GizmoColor,
    dynamicBody: { r: 0.2, g: 0.6, b: 1.0, a: 0.9 } as GizmoColor,
    kinematicBody: { r: 0.8, g: 0.3, b: 1.0, a: 0.9 } as GizmoColor,
    staticBody: { r: 0.5, g: 0.5, b: 0.5, a: 0.7 } as GizmoColor,
    velocity: { r: 1.0, g: 0.2, b: 0.2, a: 0.9 } as GizmoColor,
    centerMark: { r: 1.0, g: 1.0, b: 1.0, a: 0.8 } as GizmoColor,
};

/**
 * 获取碰撞体 Gizmo 颜色
 */
function getColliderColor(isSelected: boolean, isTrigger: boolean): GizmoColor {
    if (isSelected) {
        return PhysicsGizmoColors.selected;
    }
    if (isTrigger) {
        return PhysicsGizmoColors.trigger;
    }
    return PhysicsGizmoColors.collider;
}

/**
 * 获取刚体类型颜色
 */
function getRigidbodyColor(bodyType: RigidbodyType2D, isSelected: boolean): GizmoColor {
    const baseAlpha = isSelected ? 1.0 : 0.7;

    switch (bodyType) {
        case RigidbodyType2D.Dynamic:
            return { ...PhysicsGizmoColors.dynamicBody, a: baseAlpha };
        case RigidbodyType2D.Kinematic:
            return { ...PhysicsGizmoColors.kinematicBody, a: baseAlpha };
        case RigidbodyType2D.Static:
            return { ...PhysicsGizmoColors.staticBody, a: baseAlpha };
        default:
            return { r: 1, g: 1, b: 1, a: baseAlpha };
    }
}

/**
 * 创建中心点标记 Gizmo (十字形)
 */
function createCenterMarkGizmo(x: number, y: number, size: number, color: GizmoColor): ILineGizmoData[] {
    const halfSize = size / 2;
    return [
        {
            type: 'line',
            points: [
                { x: x - halfSize, y: y },
                { x: x + halfSize, y: y }
            ],
            color,
            closed: false
        },
        {
            type: 'line',
            points: [
                { x: x, y: y - halfSize },
                { x: x, y: y + halfSize }
            ],
            color,
            closed: false
        }
    ];
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

    const rotation = typeof transform.rotation === 'number'
        ? transform.rotation
        : transform.rotation.z;

    const worldX = transform.position.x + collider.offset.x * transform.scale.x;
    const worldY = transform.position.y + collider.offset.y * transform.scale.y;
    const scaledWidth = collider.width * transform.scale.x;
    const scaledHeight = collider.height * transform.scale.y;
    const totalRotation = rotation + collider.rotationOffset;

    // 主要矩形边框
    const rectGizmo: IRectGizmoData = {
        type: 'rect',
        x: worldX,
        y: worldY,
        width: scaledWidth,
        height: scaledHeight,
        rotation: totalRotation,
        originX: 0.5,
        originY: 0.5,
        color,
        showHandles: false
    };
    gizmos.push(rectGizmo);

    // 选中时显示中心点标记
    if (isSelected) {
        const centerMarkSize = Math.min(scaledWidth, scaledHeight) * 0.1;
        gizmos.push(...createCenterMarkGizmo(worldX, worldY, centerMarkSize, PhysicsGizmoColors.centerMark));
    }

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

    const worldX = transform.position.x + collider.offset.x * transform.scale.x;
    const worldY = transform.position.y + collider.offset.y * transform.scale.y;
    const scale = Math.max(Math.abs(transform.scale.x), Math.abs(transform.scale.y));
    const scaledRadius = collider.radius * scale;

    // 主要圆形边框
    const circleGizmo: ICircleGizmoData = {
        type: 'circle',
        x: worldX,
        y: worldY,
        radius: scaledRadius,
        color
    };
    gizmos.push(circleGizmo);

    // 选中时显示额外信息
    if (isSelected) {
        // 中心点标记
        const centerMarkSize = scaledRadius * 0.15;
        gizmos.push(...createCenterMarkGizmo(worldX, worldY, centerMarkSize, PhysicsGizmoColors.centerMark));

        // 半径指示线 (从中心到右边缘)
        const rotation = typeof transform.rotation === 'number'
            ? transform.rotation
            : transform.rotation.z;
        const cos = Math.cos(rotation);
        const sin = Math.sin(rotation);

        gizmos.push({
            type: 'line',
            points: [
                { x: worldX, y: worldY },
                { x: worldX + scaledRadius * cos, y: worldY + scaledRadius * sin }
            ],
            color: PhysicsGizmoColors.selected,
            closed: false
        } as ILineGizmoData);

        // 边缘小圆点
        gizmos.push({
            type: 'circle',
            x: worldX + scaledRadius * cos,
            y: worldY + scaledRadius * sin,
            radius: scaledRadius * 0.08,
            color: PhysicsGizmoColors.selected
        } as ICircleGizmoData);
    }

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

    const rotation = typeof transform.rotation === 'number'
        ? transform.rotation
        : transform.rotation.z;
    const totalRotation = rotation + collider.rotationOffset;

    const worldX = transform.position.x + collider.offset.x * transform.scale.x;
    const worldY = transform.position.y + collider.offset.y * transform.scale.y;

    const radius = collider.radius * transform.scale.x;
    const halfHeight = collider.halfHeight * transform.scale.y;

    // 使用原生胶囊 Gizmo 类型
    gizmos.push({
        type: 'capsule',
        x: worldX,
        y: worldY,
        radius,
        halfHeight,
        rotation: totalRotation,
        color
    } as ICapsuleGizmoData);

    if (isSelected) {
        const centerMarkSize = radius * 0.15;
        gizmos.push(...createCenterMarkGizmo(worldX, worldY, centerMarkSize, PhysicsGizmoColors.centerMark));
    }

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

    const rotation = typeof transform.rotation === 'number'
        ? transform.rotation
        : transform.rotation.z;
    const totalRotation = rotation + collider.rotationOffset;
    const cos = Math.cos(totalRotation);
    const sin = Math.sin(totalRotation);

    const worldX = transform.position.x + collider.offset.x * transform.scale.x;
    const worldY = transform.position.y + collider.offset.y * transform.scale.y;

    const worldPoints = collider.vertices.map(v => {
        const scaledX = v.x * transform.scale.x;
        const scaledY = v.y * transform.scale.y;
        const rotatedX = scaledX * cos - scaledY * sin;
        const rotatedY = scaledX * sin + scaledY * cos;
        return {
            x: worldX + rotatedX,
            y: worldY + rotatedY
        };
    });

    gizmos.push({
        type: 'line',
        points: worldPoints,
        color,
        closed: true
    } as ILineGizmoData);

    if (isSelected) {
        // 中心点标记
        const centerMarkSize = 0.5;
        gizmos.push(...createCenterMarkGizmo(worldX, worldY, centerMarkSize, PhysicsGizmoColors.centerMark));

        // 顶点标记
        const vertexSize = 0.15;
        for (const point of worldPoints) {
            gizmos.push({
                type: 'circle',
                x: point.x,
                y: point.y,
                radius: vertexSize,
                color: PhysicsGizmoColors.selected
            } as ICircleGizmoData);
        }
    }

    return gizmos;
}

/**
 * Rigidbody2D gizmo provider
 * 刚体 gizmo 提供者
 */
function rigidbody2DGizmoProvider(
    rigidbody: Rigidbody2DComponent,
    entity: Entity,
    isSelected: boolean
): IGizmoRenderData[] {
    const transform = entity.getComponent(TransformComponent);
    if (!transform) return [];

    const gizmos: IGizmoRenderData[] = [];
    const bodyColor = getRigidbodyColor(rigidbody.bodyType, isSelected);

    if (isSelected) {
        // 刚体类型标记
        gizmos.push({
            type: 'circle',
            x: transform.position.x,
            y: transform.position.y,
            radius: 0.3,
            color: bodyColor
        } as ICircleGizmoData);

        // 速度向量
        const velMagnitude = Math.sqrt(
            rigidbody.velocity.x * rigidbody.velocity.x +
            rigidbody.velocity.y * rigidbody.velocity.y
        );

        if (velMagnitude > 0.1) {
            const scale = 0.5;
            const endX = transform.position.x + rigidbody.velocity.x * scale;
            const endY = transform.position.y + rigidbody.velocity.y * scale;

            // 速度线
            gizmos.push({
                type: 'line',
                points: [
                    { x: transform.position.x, y: transform.position.y },
                    { x: endX, y: endY }
                ],
                color: PhysicsGizmoColors.velocity,
                closed: false
            } as ILineGizmoData);

            // 箭头
            const arrowSize = 0.3;
            const angle = Math.atan2(rigidbody.velocity.y, rigidbody.velocity.x);
            const arrowAngle = Math.PI / 6;

            gizmos.push({
                type: 'line',
                points: [
                    { x: endX, y: endY },
                    {
                        x: endX - arrowSize * Math.cos(angle - arrowAngle),
                        y: endY - arrowSize * Math.sin(angle - arrowAngle)
                    }
                ],
                color: PhysicsGizmoColors.velocity,
                closed: false
            } as ILineGizmoData);

            gizmos.push({
                type: 'line',
                points: [
                    { x: endX, y: endY },
                    {
                        x: endX - arrowSize * Math.cos(angle + arrowAngle),
                        y: endY - arrowSize * Math.sin(angle + arrowAngle)
                    }
                ],
                color: PhysicsGizmoColors.velocity,
                closed: false
            } as ILineGizmoData);
        }
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
