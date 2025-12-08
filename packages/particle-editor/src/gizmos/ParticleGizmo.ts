/**
 * Particle System Gizmo Implementation
 * 粒子系统 Gizmo 实现
 *
 * 显示粒子发射区域形状，支持 Transform 缩放和旋转。
 * Displays particle emission shape, supports Transform scale and rotation.
 */

import type { Entity } from '@esengine/esengine';
import type {
    IGizmoRenderData,
    IRectGizmoData,
    ICircleGizmoData,
    ILineGizmoData,
    GizmoColor
} from '@esengine/editor-core';
import { GizmoRegistry } from '@esengine/editor-core';
import { TransformComponent } from '@esengine/engine-core';
import { ParticleSystemComponent, EmissionShape } from '@esengine/particle';

/**
 * 粒子 Gizmo 颜色配置
 * Particle gizmo color configuration
 */
const ParticleGizmoColors = {
    emissionShape: { r: 1.0, g: 0.6, b: 0.0, a: 0.8 } as GizmoColor,
    emissionShapeSelected: { r: 1.0, g: 0.8, b: 0.2, a: 1.0 } as GizmoColor,
    direction: { r: 0.0, g: 0.8, b: 1.0, a: 0.9 } as GizmoColor,
    centerMark: { r: 1.0, g: 1.0, b: 1.0, a: 0.8 } as GizmoColor,
};

/**
 * 创建中心点标记 Gizmo (十字形)
 * Create center mark gizmo (cross shape)
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
 * 创建方向箭头
 * Create direction arrow
 */
function createDirectionArrow(
    x: number,
    y: number,
    direction: number,
    length: number,
    color: GizmoColor
): ILineGizmoData[] {
    const endX = x + Math.cos(direction) * length;
    const endY = y + Math.sin(direction) * length;
    const arrowSize = length * 0.2;
    const arrowAngle = Math.PI / 6;

    return [
        // 主线
        {
            type: 'line',
            points: [
                { x, y },
                { x: endX, y: endY }
            ],
            color,
            closed: false
        },
        // 箭头左
        {
            type: 'line',
            points: [
                { x: endX, y: endY },
                {
                    x: endX - arrowSize * Math.cos(direction - arrowAngle),
                    y: endY - arrowSize * Math.sin(direction - arrowAngle)
                }
            ],
            color,
            closed: false
        },
        // 箭头右
        {
            type: 'line',
            points: [
                { x: endX, y: endY },
                {
                    x: endX - arrowSize * Math.cos(direction + arrowAngle),
                    y: endY - arrowSize * Math.sin(direction + arrowAngle)
                }
            ],
            color,
            closed: false
        }
    ];
}

/**
 * ParticleSystemComponent gizmo provider
 * 粒子系统组件 gizmo 提供者
 */
function particleSystemGizmoProvider(
    particle: ParticleSystemComponent,
    entity: Entity,
    isSelected: boolean
): IGizmoRenderData[] {
    const transform = entity.getComponent(TransformComponent);
    if (!transform) return [];

    const gizmos: IGizmoRenderData[] = [];
    const color = isSelected
        ? ParticleGizmoColors.emissionShapeSelected
        : ParticleGizmoColors.emissionShape;

    // 获取 Transform 数据 | Get transform data
    const worldX = transform.worldPosition?.x ?? transform.position.x;
    const worldY = transform.worldPosition?.y ?? transform.position.y;

    const rot = transform.worldRotation ?? transform.rotation;
    const worldRotation = rot?.z ?? 0;

    const scale = transform.worldScale ?? transform.scale;
    const scaleX = scale?.x ?? 1;
    const scaleY = scale?.y ?? 1;

    // 从加载的资产获取发射形状配置 | Get emission shape config from loaded asset
    const asset = particle.loadedAsset;
    const emissionShape = asset?.emissionShape ?? EmissionShape.Point;
    const shapeRadius = (asset?.shapeRadius ?? 0) * Math.max(scaleX, scaleY);
    const shapeWidth = (asset?.shapeWidth ?? 0) * scaleX;
    const shapeHeight = (asset?.shapeHeight ?? 0) * scaleY;
    const shapeAngle = (asset?.shapeAngle ?? 30) * Math.PI / 180; // 转换为弧度
    const direction = ((asset?.direction ?? 90) * Math.PI / 180) + worldRotation; // 转换为弧度并应用世界旋转

    // 根据发射形状绘制 Gizmo | Draw gizmo based on emission shape
    switch (emissionShape) {
        case EmissionShape.Point:
            // 点发射：显示中心点和方向 | Point: show center and direction
            gizmos.push(...createCenterMarkGizmo(worldX, worldY, 10, color));
            if (isSelected) {
                gizmos.push(...createDirectionArrow(worldX, worldY, direction, 30, ParticleGizmoColors.direction));
            }
            break;

        case EmissionShape.Circle:
            // 填充圆形：显示圆形区域 | Filled circle: show circle area
            gizmos.push({
                type: 'circle',
                x: worldX,
                y: worldY,
                radius: shapeRadius || 20,
                color
            } as ICircleGizmoData);
            if (isSelected) {
                gizmos.push(...createCenterMarkGizmo(worldX, worldY, 8, ParticleGizmoColors.centerMark));
                gizmos.push(...createDirectionArrow(worldX, worldY, direction, shapeRadius + 20 || 40, ParticleGizmoColors.direction));
            }
            break;

        case EmissionShape.Ring:
            // 圆环：显示圆环边缘 | Ring: show ring edge
            gizmos.push({
                type: 'circle',
                x: worldX,
                y: worldY,
                radius: shapeRadius || 20,
                color
            } as ICircleGizmoData);
            if (isSelected) {
                gizmos.push(...createCenterMarkGizmo(worldX, worldY, 8, ParticleGizmoColors.centerMark));
            }
            break;

        case EmissionShape.Rectangle:
            // 矩形：显示矩形区域 | Rectangle: show rect area
            gizmos.push({
                type: 'rect',
                x: worldX,
                y: worldY,
                width: shapeWidth || 40,
                height: shapeHeight || 20,
                rotation: worldRotation,
                originX: 0.5,
                originY: 0.5,
                color,
                showHandles: false
            } as IRectGizmoData);
            if (isSelected) {
                gizmos.push(...createCenterMarkGizmo(worldX, worldY, 8, ParticleGizmoColors.centerMark));
                gizmos.push(...createDirectionArrow(worldX, worldY, direction, Math.max(shapeWidth, shapeHeight) / 2 + 20 || 40, ParticleGizmoColors.direction));
            }
            break;

        case EmissionShape.Edge:
            // 矩形边缘：显示矩形边框 | Rectangle edge: show rect border
            gizmos.push({
                type: 'rect',
                x: worldX,
                y: worldY,
                width: shapeWidth || 40,
                height: shapeHeight || 20,
                rotation: worldRotation,
                originX: 0.5,
                originY: 0.5,
                color,
                showHandles: false
            } as IRectGizmoData);
            if (isSelected) {
                gizmos.push(...createCenterMarkGizmo(worldX, worldY, 8, ParticleGizmoColors.centerMark));
            }
            break;

        case EmissionShape.Line:
            // 线段：显示发射线 | Line: show emission line
            {
                const halfWidth = (shapeWidth || 40) / 2;
                const cos = Math.cos(direction + Math.PI / 2);
                const sin = Math.sin(direction + Math.PI / 2);
                gizmos.push({
                    type: 'line',
                    points: [
                        { x: worldX + cos * halfWidth, y: worldY + sin * halfWidth },
                        { x: worldX - cos * halfWidth, y: worldY - sin * halfWidth }
                    ],
                    color,
                    closed: false
                } as ILineGizmoData);
                if (isSelected) {
                    gizmos.push(...createCenterMarkGizmo(worldX, worldY, 8, ParticleGizmoColors.centerMark));
                    gizmos.push(...createDirectionArrow(worldX, worldY, direction, halfWidth + 20, ParticleGizmoColors.direction));
                }
            }
            break;

        case EmissionShape.Cone:
            // 圆锥/扇形：显示扇形区域 | Cone/fan: show fan area
            {
                const radius = shapeRadius || 30;
                const halfAngle = shapeAngle / 2;
                const startAngle = direction - halfAngle;
                const endAngle = direction + halfAngle;

                // 绘制扇形的两条边和弧线 | Draw two edges and arc of the fan
                const segments = 16;
                const points: { x: number; y: number }[] = [{ x: worldX, y: worldY }];
                for (let i = 0; i <= segments; i++) {
                    const angle = startAngle + (endAngle - startAngle) * (i / segments);
                    points.push({
                        x: worldX + Math.cos(angle) * radius,
                        y: worldY + Math.sin(angle) * radius
                    });
                }
                points.push({ x: worldX, y: worldY });

                gizmos.push({
                    type: 'line',
                    points,
                    color,
                    closed: true
                } as ILineGizmoData);

                if (isSelected) {
                    gizmos.push(...createCenterMarkGizmo(worldX, worldY, 8, ParticleGizmoColors.centerMark));
                    gizmos.push(...createDirectionArrow(worldX, worldY, direction, radius + 20, ParticleGizmoColors.direction));
                }
            }
            break;

        default:
            // 默认：显示中心点 | Default: show center point
            gizmos.push(...createCenterMarkGizmo(worldX, worldY, 10, color));
            break;
    }

    return gizmos;
}

/**
 * Register gizmo provider for ParticleSystemComponent.
 * 为 ParticleSystemComponent 注册 gizmo 提供者。
 */
export function registerParticleGizmo(): void {
    GizmoRegistry.register(ParticleSystemComponent, particleSystemGizmoProvider);
}

/**
 * Unregister gizmo provider for ParticleSystemComponent.
 * 取消注册 ParticleSystemComponent 的 gizmo 提供者。
 */
export function unregisterParticleGizmo(): void {
    GizmoRegistry.unregister(ParticleSystemComponent);
}
