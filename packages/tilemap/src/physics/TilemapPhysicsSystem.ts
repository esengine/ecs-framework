/**
 * TilemapPhysicsSystem
 * Tilemap 物理系统
 *
 * 负责将 TilemapComponent 的碰撞数据同步到物理世界。
 * 需要与 Physics2DSystem 配合使用。
 */

import { EntitySystem, Matcher, ECSSystem, type Entity, type Scene } from '@esengine/ecs-framework';
import { TransformComponent } from '@esengine/engine-core';
import { TilemapComponent } from '../TilemapComponent';
import { TilemapCollider2DComponent, type CollisionRect } from './TilemapCollider2DComponent';
import type { IPhysics2DWorld } from '@esengine/physics-rapier2d';

// 重新导出类型以保持向后兼容 | Re-export types for backward compatibility
export type IPhysicsWorld = IPhysics2DWorld;

/**
 * 物理系统接口
 */
export interface IPhysics2DSystem {
    world: IPhysicsWorld;
}

/**
 * Tilemap 物理系统
 *
 * 监听带有 TilemapComponent 和 TilemapCollider2DComponent 的实体，
 * 自动将碰撞数据转换为物理碰撞体。
 */
@ECSSystem('TilemapPhysics', { updateOrder: 50 })
export class TilemapPhysicsSystem extends EntitySystem {
    private _physicsWorld: IPhysicsWorld | null = null;
    private _pendingEntities: Entity[] = [];

    constructor() {
        super(Matcher.empty().all(TilemapComponent, TilemapCollider2DComponent));
    }

    /**
     * 设置物理世界引用
     */
    public setPhysicsWorld(world: IPhysicsWorld): void {
        this._physicsWorld = world;

        // 处理待处理的实体
        for (const entity of this._pendingEntities) {
            this._createColliders(entity);
        }
        this._pendingEntities = [];
    }

    protected override onAdded(entity: Entity): void {
        if (!this._physicsWorld) {
            this._pendingEntities.push(entity);
            return;
        }
        this._createColliders(entity);
    }

    protected override onRemoved(entity: Entity): void {
        this._removeColliders(entity);

        const idx = this._pendingEntities.indexOf(entity);
        if (idx >= 0) {
            this._pendingEntities.splice(idx, 1);
        }
    }

    protected override process(entities: readonly Entity[]): void {
        if (!this._physicsWorld) return;

        for (const entity of entities) {
            const tilemap = entity.getComponent(TilemapComponent);
            const collider = entity.getComponent(TilemapCollider2DComponent);

            if (!tilemap || !collider) continue;

            // 检查碰撞数据是否变化
            const currentVersion = tilemap.renderDirty ? Date.now() : collider._lastCollisionVersion;
            if (collider._needsRebuild || currentVersion !== collider._lastCollisionVersion) {
                this._rebuildColliders(entity);
                collider._lastCollisionVersion = currentVersion;
            }
        }
    }

    /**
     * 创建碰撞体
     */
    private _createColliders(entity: Entity): void {
        const tilemap = entity.getComponent(TilemapComponent);
        const collider = entity.getComponent(TilemapCollider2DComponent);
        const transform = entity.getComponent(TransformComponent);

        if (!tilemap || !collider || !this._physicsWorld) return;

        // 生成碰撞矩形
        const collisionData = tilemap.collisionData;
        collider.generateCollisionRects(
            collisionData,
            tilemap.width,
            tilemap.height,
            tilemap.tileWidth,
            tilemap.tileHeight
        );

        // 获取实体位置偏移
        const offsetX = transform?.position.x ?? 0;
        const offsetY = transform?.position.y ?? 0;

        // 计算地图总高度（像素），用于 Y 轴翻转
        // Calculate total map height (pixels) for Y-axis flip
        const mapPixelHeight = tilemap.height * tilemap.tileHeight;

        // 为每个碰撞矩形创建物理碰撞体
        for (const rect of collider._collisionRects) {
            // Y 轴翻转：rect.y 是从顶部计算的，需要翻转到底部
            // Y-axis flip: rect.y is calculated from top, needs flip to bottom
            const flippedY = mapPixelHeight - rect.y - rect.height;

            const handle = this._physicsWorld.createStaticCollider(
                entity.id,
                {
                    x: offsetX + rect.x + rect.width / 2,
                    y: offsetY + flippedY + rect.height / 2,
                },
                {
                    x: rect.width / 2,
                    y: rect.height / 2,
                },
                collider.collisionLayer,
                collider.collisionMask,
                collider.friction,
                collider.restitution,
                collider.isTrigger
            );

            if (handle !== null) {
                collider._colliderHandles.push(handle);
            }
        }

        collider._needsRebuild = false;
        this.logger.debug(`Created ${collider._colliderHandles.length} colliders for tilemap entity ${entity.name}`);
    }

    /**
     * 移除碰撞体
     */
    private _removeColliders(entity: Entity): void {
        const collider = entity.getComponent(TilemapCollider2DComponent);
        if (!collider || !this._physicsWorld) return;

        for (const handle of collider._colliderHandles) {
            this._physicsWorld.removeCollider(handle);
        }
        collider._colliderHandles = [];
    }

    /**
     * 重建碰撞体
     */
    private _rebuildColliders(entity: Entity): void {
        this._removeColliders(entity);
        this._createColliders(entity);
    }

    protected override onDestroy(): void {
        this._physicsWorld = null;
        this._pendingEntities = [];
    }
}
