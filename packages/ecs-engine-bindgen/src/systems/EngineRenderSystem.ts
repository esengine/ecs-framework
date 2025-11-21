/**
 * Engine render system for ECS.
 * 用于ECS的引擎渲染系统。
 */

import { EntitySystem, Matcher, Entity, ComponentType, ECSSystem, Component } from '@esengine/ecs-framework';
import type { EngineBridge } from '../core/EngineBridge';
import { RenderBatcher } from '../core/RenderBatcher';
import { SpriteComponent } from '../components/SpriteComponent';
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
    protected begin(): void {
        // Clear the batch | 清空批处理
        this.batcher.clear();

        // Clear screen | 清屏
        this.bridge.clear(0, 0, 0, 1);

        // Update input | 更新输入
        this.bridge.updateInput();
    }

    /**
     * Process all matched entities.
     * 处理所有匹配的实体。
     *
     * @param entities - Entities to process | 要处理的实体
     */
    protected process(entities: readonly Entity[]): void {
        for (const entity of entities) {
            const sprite = entity.getComponent(SpriteComponent);
            const transform = entity.getComponent(this.transformType) as unknown as ITransformComponent | null;

            if (!sprite || !transform || !sprite.visible) {
                continue;
            }

            // Calculate UV with flip | 计算带翻转的UV
            let uv = sprite.uv;
            if (sprite.flipX || sprite.flipY) {
                uv = [...sprite.uv] as [number, number, number, number];
                if (sprite.flipX) {
                    [uv[0], uv[2]] = [uv[2], uv[0]];
                }
                if (sprite.flipY) {
                    [uv[1], uv[3]] = [uv[3], uv[1]];
                }
            }

            const renderData: SpriteRenderData = {
                x: transform.position.x,
                y: transform.position.y,
                rotation: transform.rotation,
                scaleX: transform.scale.x,
                scaleY: transform.scale.y,
                originX: sprite.originX,
                originY: sprite.originY,
                textureId: sprite.textureId,
                uv,
                color: sprite.color
            };

            this.batcher.addSprite(renderData);
        }
    }

    /**
     * Called after processing entities.
     * 处理实体之后调用。
     */
    protected end(): void {
        // Submit batch and render | 提交批处理并渲染
        if (!this.batcher.isEmpty) {
            this.bridge.submitSprites(this.batcher.getSprites());
        }
        this.bridge.render();
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
