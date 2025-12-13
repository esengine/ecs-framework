/**
 * 相机管理器 - 提供相机相关的全局服务
 * Camera Manager - Provides global camera services
 *
 * 主要功能：
 * - 管理主相机
 * - 屏幕坐标与世界坐标转换
 *
 * Main features:
 * - Manage main camera
 * - Screen to world coordinate conversion
 */

import type { Entity, IScene } from '@esengine/ecs-framework';
import type { IVector2 } from '@esengine/ecs-framework-math';
import { TransformComponent } from '@esengine/engine-core';
import { CameraComponent, ECameraProjection } from './CameraComponent';

/**
 * 相机管理器接口
 * Camera manager interface
 */
export interface ICameraManager {
    /**
     * 设置场景引用
     * Set scene reference
     */
    setScene(scene: IScene | null): void;

    /**
     * 设置视口尺寸
     * Set viewport size
     */
    setViewportSize(width: number, height: number): void;

    /**
     * 获取主相机实体
     * Get main camera entity
     */
    getMainCamera(): Entity | null;

    /**
     * 获取主相机组件
     * Get main camera component
     */
    getMainCameraComponent(): CameraComponent | null;

    /**
     * 屏幕坐标转世界坐标
     * Convert screen coordinates to world coordinates
     *
     * @param screenX 屏幕 X 坐标 | Screen X coordinate
     * @param screenY 屏幕 Y 坐标 | Screen Y coordinate
     * @returns 世界坐标 | World coordinates
     */
    screenToWorld(screenX: number, screenY: number): IVector2;

    /**
     * 世界坐标转屏幕坐标
     * Convert world coordinates to screen coordinates
     *
     * @param worldX 世界 X 坐标 | World X coordinate
     * @param worldY 世界 Y 坐标 | World Y coordinate
     * @returns 屏幕坐标 | Screen coordinates
     */
    worldToScreen(worldX: number, worldY: number): IVector2;
}

/**
 * 相机管理器实现
 * Camera manager implementation
 *
 * @example
 * ```typescript
 * // 获取全局实例
 * import { CameraManager } from '@esengine/camera';
 *
 * // 设置场景和视口
 * CameraManager.setScene(scene);
 * CameraManager.setViewportSize(800, 600);
 *
 * // 屏幕坐标转世界坐标
 * const worldPos = CameraManager.screenToWorld(mouseX, mouseY);
 * console.log(`World position: ${worldPos.x}, ${worldPos.y}`);
 * ```
 */
export class CameraManagerImpl implements ICameraManager {
    private _scene: IScene | null = null;
    private _viewportWidth: number = 800;
    private _viewportHeight: number = 600;
    private _mainCameraEntity: Entity | null = null;
    private _mainCameraEntityDirty: boolean = true;

    /**
     * 设置场景引用
     * Set scene reference
     */
    setScene(scene: IScene | null): void {
        this._scene = scene;
        this._mainCameraEntityDirty = true;
        this._mainCameraEntity = null;
    }

    /**
     * 设置视口尺寸
     * Set viewport size
     */
    setViewportSize(width: number, height: number): void {
        this._viewportWidth = Math.max(1, width);
        this._viewportHeight = Math.max(1, height);
    }

    /**
     * 获取视口宽度
     * Get viewport width
     */
    get viewportWidth(): number {
        return this._viewportWidth;
    }

    /**
     * 获取视口高度
     * Get viewport height
     */
    get viewportHeight(): number {
        return this._viewportHeight;
    }

    /**
     * 获取视口宽高比
     * Get viewport aspect ratio
     */
    get aspectRatio(): number {
        return this._viewportWidth / this._viewportHeight;
    }

    /**
     * 标记主相机需要重新查找
     * Mark main camera as dirty (needs re-lookup)
     */
    invalidateMainCamera(): void {
        this._mainCameraEntityDirty = true;
    }

    /**
     * 获取主相机实体
     * Get main camera entity
     */
    getMainCamera(): Entity | null {
        if (this._mainCameraEntityDirty || !this._mainCameraEntity) {
            this._mainCameraEntity = this._findMainCamera();
            this._mainCameraEntityDirty = false;
        }
        return this._mainCameraEntity;
    }

    /**
     * 获取主相机组件
     * Get main camera component
     */
    getMainCameraComponent(): CameraComponent | null {
        const entity = this.getMainCamera();
        return entity?.getComponent(CameraComponent) ?? null;
    }

    /**
     * 查找主相机（depth 最小的相机）
     * Find main camera (camera with lowest depth)
     */
    private _findMainCamera(): Entity | null {
        if (!this._scene) return null;

        let mainCamera: Entity | null = null;
        let lowestDepth = Infinity;

        // 使用 entities.buffer 遍历实体列表
        // Use entities.buffer to iterate entity list
        const entities = this._scene.entities.buffer;
        for (let i = 0; i < entities.length; i++) {
            const entity = entities[i];
            if (!entity.enabled) continue;

            const camera = entity.getComponent(CameraComponent);
            if (camera && camera.depth < lowestDepth) {
                lowestDepth = camera.depth;
                mainCamera = entity;
            }
        }

        return mainCamera;
    }

    /**
     * 屏幕坐标转世界坐标
     * Convert screen coordinates to world coordinates
     *
     * 对于正交相机：
     * - 屏幕坐标 (0, 0) 在左上角
     * - orthographicSize 是可见区域的半高度
     *
     * For orthographic camera:
     * - Screen coordinates (0, 0) at top-left
     * - orthographicSize is half-height of visible area
     */
    screenToWorld(screenX: number, screenY: number): IVector2 {
        const camera = this.getMainCameraComponent();
        const cameraEntity = this.getMainCamera();

        if (!camera || !cameraEntity) {
            // 没有相机时，返回简单的偏移 | No camera, return simple offset
            return {
                x: screenX - this._viewportWidth / 2,
                y: screenY - this._viewportHeight / 2
            };
        }

        // 获取相机位置 | Get camera position
        const transform = cameraEntity.getComponent(TransformComponent);
        const cameraX = transform?.worldPosition.x ?? 0;
        const cameraY = transform?.worldPosition.y ?? 0;

        if (camera.projection === ECameraProjection.Orthographic) {
            return this._screenToWorldOrthographic(screenX, screenY, camera, cameraX, cameraY);
        } else {
            // 透视相机暂不支持，返回正交结果
            // Perspective camera not supported yet, return orthographic result
            return this._screenToWorldOrthographic(screenX, screenY, camera, cameraX, cameraY);
        }
    }

    /**
     * 正交相机的屏幕到世界转换
     * Screen to world conversion for orthographic camera
     */
    private _screenToWorldOrthographic(
        screenX: number,
        screenY: number,
        camera: CameraComponent,
        cameraX: number,
        cameraY: number
    ): IVector2 {
        const orthoSize = camera.orthographicSize;
        const aspect = this.aspectRatio;

        // 归一化设备坐标 (NDC) [-1, 1]
        // Normalized Device Coordinates (NDC) [-1, 1]
        const ndcX = (screenX / this._viewportWidth) * 2 - 1;
        const ndcY = 1 - (screenY / this._viewportHeight) * 2; // Y 轴翻转 | Flip Y axis

        // 世界坐标 | World coordinates
        const worldX = cameraX + ndcX * orthoSize * aspect;
        const worldY = cameraY + ndcY * orthoSize;

        return { x: worldX, y: worldY };
    }

    /**
     * 世界坐标转屏幕坐标
     * Convert world coordinates to screen coordinates
     */
    worldToScreen(worldX: number, worldY: number): IVector2 {
        const camera = this.getMainCameraComponent();
        const cameraEntity = this.getMainCamera();

        if (!camera || !cameraEntity) {
            // 没有相机时，返回简单的偏移 | No camera, return simple offset
            return {
                x: worldX + this._viewportWidth / 2,
                y: worldY + this._viewportHeight / 2
            };
        }

        // 获取相机位置 | Get camera position
        const transform = cameraEntity.getComponent(TransformComponent);
        const cameraX = transform?.worldPosition.x ?? 0;
        const cameraY = transform?.worldPosition.y ?? 0;

        if (camera.projection === ECameraProjection.Orthographic) {
            return this._worldToScreenOrthographic(worldX, worldY, camera, cameraX, cameraY);
        } else {
            // 透视相机暂不支持 | Perspective camera not supported yet
            return this._worldToScreenOrthographic(worldX, worldY, camera, cameraX, cameraY);
        }
    }

    /**
     * 正交相机的世界到屏幕转换
     * World to screen conversion for orthographic camera
     */
    private _worldToScreenOrthographic(
        worldX: number,
        worldY: number,
        camera: CameraComponent,
        cameraX: number,
        cameraY: number
    ): IVector2 {
        const orthoSize = camera.orthographicSize;
        const aspect = this.aspectRatio;

        // 相对于相机的偏移 | Offset relative to camera
        const offsetX = worldX - cameraX;
        const offsetY = worldY - cameraY;

        // NDC 坐标 | NDC coordinates
        const ndcX = offsetX / (orthoSize * aspect);
        const ndcY = offsetY / orthoSize;

        // 屏幕坐标 | Screen coordinates
        const screenX = (ndcX + 1) * 0.5 * this._viewportWidth;
        const screenY = (1 - ndcY) * 0.5 * this._viewportHeight; // Y 轴翻转 | Flip Y axis

        return { x: screenX, y: screenY };
    }
}

/**
 * 全局相机管理器实例
 * Global camera manager instance
 */
export const CameraManager = new CameraManagerImpl();
