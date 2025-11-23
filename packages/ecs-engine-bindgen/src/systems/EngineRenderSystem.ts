/**
 * Engine render system for ECS.
 * 用于ECS的引擎渲染系统。
 */

import { EntitySystem, Matcher, Entity, ComponentType, ECSSystem, Component, Core } from '@esengine/ecs-framework';
import { SpriteComponent, CameraComponent, TransformComponent } from '@esengine/ecs-components';
import type { EngineBridge } from '../core/EngineBridge';
import { RenderBatcher } from '../core/RenderBatcher';
import type { SpriteRenderData } from '../types';
import type { ITransformComponent } from '../core/SpriteRenderHelper';

/**
 * Type for transform component constructor.
 * 变换组件构造函数类型。
 */
export type TransformComponentType = ComponentType & (new (...args: any[]) => Component & ITransformComponent);

/**
 * ECS System for rendering sprites using the Rust engine.
 * 使用Rust引擎渲染精灵的ECS系统。
 *
 * This system extends EntitySystem and integrates with the ECS lifecycle.
 * 此系统扩展EntitySystem并与ECS生命周期集成。
 *
 * @example
 * ```typescript
 * // Create transform component | 创建变换组件
 * @ECSComponent('Transform')
 * class Transform extends Component implements ITransformComponent {
 *     position = { x: 0, y: 0 };
 *     rotation = 0;
 *     scale = { x: 1, y: 1 };
 * }
 *
 * // Initialize bridge | 初始化桥接
 * const bridge = new EngineBridge({ canvasId: 'canvas' });
 * await bridge.initialize();
 *
 * // Add system to scene | 将系统添加到场景
 * const renderSystem = new EngineRenderSystem(bridge, Transform);
 * scene.addSystem(renderSystem);
 * ```
 */
@ECSSystem('EngineRender', { updateOrder: 1000 }) // Render system executes last | 渲染系统最后执行
export class EngineRenderSystem extends EntitySystem {
    private bridge: EngineBridge;
    private batcher: RenderBatcher;
    private transformType: TransformComponentType;
    private showGizmos = true;
    private selectedEntityIds: Set<number> = new Set();
    private transformMode: 'select' | 'move' | 'rotate' | 'scale' = 'select';

    // Reusable map to avoid allocation per frame
    // 可重用的映射以避免每帧分配
    private entityRenderMap: Map<number, SpriteRenderData> = new Map();

    /**
     * Create a new engine render system.
     * 创建新的引擎渲染系统。
     *
     * @param bridge - Engine bridge instance | 引擎桥接实例
     * @param transformType - Transform component class (must implement ITransformComponent) | 变换组件类（必须实现ITransformComponent）
     */
    constructor(bridge: EngineBridge, transformType: TransformComponentType) {
        // Match entities with both Sprite and Transform components
        // 匹配同时具有Sprite和Transform组件的实体
        super(Matcher.empty().all(SpriteComponent, transformType));

        this.bridge = bridge;
        this.batcher = new RenderBatcher();
        this.transformType = transformType;
    }

    /**
     * Called when system is initialized.
     * 系统初始化时调用。
     */
    public override initialize(): void {
        super.initialize();
        this.logger.info('EngineRenderSystem initialized | 引擎渲染系统初始化完成');
    }

    /**
     * Called before processing entities.
     * 处理实体之前调用。
     */
    protected override onBegin(): void {

        // Clear the batch | 清空批处理
        this.batcher.clear();

        // Clear screen with dark background | 用深色背景清屏
        this.bridge.clear(0.1, 0.1, 0.12, 1);

        // Update input | 更新输入
        this.bridge.updateInput();
    }

    /**
     * Process all matched entities.
     * 处理所有匹配的实体。
     *
     * @param entities - Entities to process | 要处理的实体
     */
    protected override process(entities: readonly Entity[]): void {
        // Clear and reuse map for gizmo drawing
        // 清空并重用映射用于绘制gizmo
        this.entityRenderMap.clear();

        for (const entity of entities) {
            const sprite = entity.getComponent(SpriteComponent);
            const transform = entity.getComponent(this.transformType) as unknown as ITransformComponent | null;

            if (!sprite || !transform) {
                continue;
            }

            // Calculate UV with flip | 计算带翻转的UV
            const uv: [number, number, number, number] = [0, 0, 1, 1];
            if (sprite.flipX || sprite.flipY) {
                if (sprite.flipX) {
                    [uv[0], uv[2]] = [uv[2], uv[0]];
                }
                if (sprite.flipY) {
                    [uv[1], uv[3]] = [uv[3], uv[1]];
                }
            }

            // Handle rotation as number or Vector3 (use z for 2D)
            const rotation = typeof transform.rotation === 'number'
                ? transform.rotation
                : transform.rotation.z;

            // Convert hex color string to packed RGBA | 将十六进制颜色字符串转换为打包的RGBA
            const color = this.hexToPackedColor(sprite.color, sprite.alpha);

            // Get texture ID from sprite component
            // 从精灵组件获取纹理ID
            // Use Rust engine's path-based texture loading for automatic caching
            // 使用Rust引擎的基于路径的纹理加载实现自动缓存
            let textureId = 0;
            if (sprite.texture) {
                textureId = this.bridge.getOrLoadTextureByPath(sprite.texture);
            } else {
                // Debug: sprite has no texture
                console.warn(`[EngineRenderSystem] Entity ${entity.id} has no texture`);
            }

            // Pass actual display dimensions (sprite size * transform scale)
            // 传递实际显示尺寸（sprite尺寸 * 变换缩放）
            const renderData: SpriteRenderData = {
                x: transform.position.x,
                y: transform.position.y,
                rotation,
                scaleX: sprite.width * transform.scale.x,
                scaleY: sprite.height * transform.scale.y,
                originX: sprite.anchorX,
                originY: sprite.anchorY,
                textureId,
                uv,
                color
            };

            this.batcher.addSprite(renderData);
            this.entityRenderMap.set(entity.id, renderData);
        }

        // Submit batch and render at the end of process | 在process结束时提交批处理并渲染
        if (!this.batcher.isEmpty) {
            const sprites = this.batcher.getSprites();
            this.bridge.submitSprites(sprites);
        }

        // Draw gizmos for selected entities (always, even if no sprites)
        // 为选中的实体绘制Gizmo（始终绘制，即使没有精灵）
        if (this.showGizmos && this.selectedEntityIds.size > 0) {
            for (const entityId of this.selectedEntityIds) {
                const renderData = this.entityRenderMap.get(entityId);
                if (renderData) {
                    this.bridge.addGizmoRect(
                        renderData.x,
                        renderData.y,
                        renderData.scaleX,
                        renderData.scaleY,
                        renderData.rotation,
                        renderData.originX,
                        renderData.originY,
                        0.0, 1.0, 0.5, 1.0,  // Green color | 绿色
                        true  // Show transform handles for selection gizmo
                    );
                }
            }
        }

        // Draw camera frustum gizmos
        // 绘制相机视锥体 gizmo
        if (this.showGizmos) {
            this.drawCameraFrustums();
        }

        this.bridge.render();
    }

    /**
     * Draw camera frustum gizmos for all cameras in scene.
     * 为场景中所有相机绘制视锥体 gizmo。
     */
    private drawCameraFrustums(): void {
        const scene = Core.scene;
        if (!scene) return;

        const cameraEntities = scene.entities.findEntitiesWithComponent(CameraComponent);

        for (const entity of cameraEntities) {
            const camera = entity.getComponent(CameraComponent);
            const transform = entity.getComponent(TransformComponent);

            if (!camera || !transform) continue;

            // Calculate frustum size based on canvas size and orthographicSize
            // 根据 canvas 尺寸和 orthographicSize 计算视锥体大小
            // At runtime, zoom = 1 / orthographicSize
            // So visible area = canvas size * orthographicSize
            const canvas = document.getElementById('viewport-canvas') as HTMLCanvasElement;
            if (!canvas) continue;

            // The actual visible world units when running
            // 运行时实际可见的世界单位
            const zoom = camera.orthographicSize > 0 ? 1 / camera.orthographicSize : 1;
            const width = canvas.width / zoom;
            const height = canvas.height / zoom;

            // Handle rotation
            const rotation = typeof transform.rotation === 'number'
                ? transform.rotation
                : transform.rotation.z;

            // Draw frustum rectangle (white color for camera)
            // 绘制视锥体矩形（相机用白色）
            this.bridge.addGizmoRect(
                transform.position.x,
                transform.position.y,
                width,
                height,
                rotation,
                0.5,  // origin center
                0.5,
                1.0, 1.0, 1.0, 0.8,  // White color with some transparency
                false  // Don't show transform handles for camera frustum
            );
        }
    }

    /**
     * Set gizmo visibility.
     * 设置Gizmo可见性。
     */
    setShowGizmos(show: boolean): void {
        this.showGizmos = show;
    }

    /**
     * Get gizmo visibility.
     * 获取Gizmo可见性。
     */
    getShowGizmos(): boolean {
        return this.showGizmos;
    }

    /**
     * Set selected entity IDs.
     * 设置选中的实体ID。
     */
    setSelectedEntityIds(ids: number[]): void {
        this.selectedEntityIds = new Set(ids);
    }

    /**
     * Get selected entity IDs.
     * 获取选中的实体ID。
     */
    getSelectedEntityIds(): number[] {
        return Array.from(this.selectedEntityIds);
    }

    /**
     * Set transform tool mode.
     * 设置变换工具模式。
     */
    setTransformMode(mode: 'select' | 'move' | 'rotate' | 'scale'): void {
        this.transformMode = mode;

        // Convert string mode to u8 for Rust engine
        const modeMap: Record<string, number> = {
            'select': 0,
            'move': 1,
            'rotate': 2,
            'scale': 3
        };
        this.bridge.setTransformMode(modeMap[mode]);
    }

    /**
     * Get transform tool mode.
     * 获取变换工具模式。
     */
    getTransformMode(): 'select' | 'move' | 'rotate' | 'scale' {
        return this.transformMode;
    }

    /**
     * Convert hex color string to packed RGBA.
     * 将十六进制颜色字符串转换为打包的RGBA。
     */
    private hexToPackedColor(hex: string, alpha: number): number {
        // Parse hex color like "#ffffff" or "#fff"
        let r = 255, g = 255, b = 255;
        if (hex.startsWith('#')) {
            const hexValue = hex.slice(1);
            if (hexValue.length === 3) {
                r = parseInt(hexValue[0] + hexValue[0], 16);
                g = parseInt(hexValue[1] + hexValue[1], 16);
                b = parseInt(hexValue[2] + hexValue[2], 16);
            } else if (hexValue.length === 6) {
                r = parseInt(hexValue.slice(0, 2), 16);
                g = parseInt(hexValue.slice(2, 4), 16);
                b = parseInt(hexValue.slice(4, 6), 16);
            }
        }
        const a = Math.round(alpha * 255);
        // Pack as 0xAABBGGRR for WebGL
        return ((a & 0xFF) << 24) | ((b & 0xFF) << 16) | ((g & 0xFF) << 8) | (r & 0xFF);
    }


    /**
     * Get the number of sprites rendered.
     * 获取渲染的精灵数量。
     */
    get spriteCount(): number {
        return this.batcher.count;
    }

    /**
     * Get engine statistics.
     * 获取引擎统计信息。
     */
    getStats() {
        return this.bridge.getStats();
    }

    /**
     * Load a texture.
     * 加载纹理。
     */
    loadTexture(id: number, url: string): void {
        this.bridge.loadTexture(id, url);
    }
}
