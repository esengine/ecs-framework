/**
 * Sprite render helper utilities.
 * 精灵渲染辅助工具。
 */

import { Entity, Component } from '@esengine/ecs-framework';
import type { EngineBridge } from './EngineBridge';
import { RenderBatcher } from './RenderBatcher';
import { SpriteComponent } from '../components/SpriteComponent';
import type { SpriteRenderData } from '../types';

/**
 * Transform component interface.
 * 变换组件接口。
 *
 * Your transform component should implement this interface.
 * 你的变换组件应该实现此接口。
 */
export interface ITransformComponent {
    position: { x: number; y: number; z?: number };
    rotation: number | { x: number; y: number; z: number };
    scale: { x: number; y: number; z?: number };
}

/**
 * Helper class for rendering sprites (not an ECS System).
 * 精灵渲染辅助类（非ECS系统）。
 *
 * Use this for manual control over rendering, or use EngineRenderSystem
 * for automatic ECS integration.
 * 用于手动控制渲染，或使用EngineRenderSystem进行自动ECS集成。
 *
 * @example
 * ```typescript
 * const bridge = new EngineBridge({ canvasId: 'canvas' });
 * await bridge.initialize();
 *
 * const helper = new SpriteRenderHelper(bridge);
 *
 * // In game loop | 在游戏循环中
 * helper.collectSprites(entities, Transform);
 * helper.render();
 * ```
 */
export class SpriteRenderHelper {
    private bridge: EngineBridge;
    private batcher: RenderBatcher;

    /**
     * Create a new sprite render helper.
     * 创建新的精灵渲染辅助类。
     *
     * @param bridge - Engine bridge instance | 引擎桥接实例
     */
    constructor(bridge: EngineBridge) {
        this.bridge = bridge;
        this.batcher = new RenderBatcher();
    }

    /**
     * Collect sprite data from entities.
     * 从实体收集精灵数据。
     *
     * @param entities - Entities to process | 要处理的实体
     * @param transformType - Transform component class | 变换组件类
     */
    collectSprites<T extends Component & ITransformComponent>(
        entities: Entity[],
        transformType: new () => T
    ): void {
        this.batcher.clear();

        for (const entity of entities) {
            const sprite = entity.getComponent(SpriteComponent);
            const transform = entity.getComponent(transformType);

            if (!sprite || !transform || !sprite.visible) {
                continue;
            }

            // Calculate UV with flip | 计算带翻转的UV
            let uv = sprite.uv;
            if (sprite.flipX || sprite.flipY) {
                uv = [...sprite.uv] as [number, number, number, number];
                if (sprite.flipX) {
                    const temp = uv[0];
                    uv[0] = uv[2];
                    uv[2] = temp;
                }
                if (sprite.flipY) {
                    const temp = uv[1];
                    uv[1] = uv[3];
                    uv[3] = temp;
                }
            }

            // Handle rotation as number or Vector3 (use z for 2D)
            const rotation = typeof transform.rotation === 'number'
                ? transform.rotation
                : transform.rotation.z;

            const renderData: SpriteRenderData = {
                x: transform.position.x,
                y: transform.position.y,
                rotation,
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
     * Submit batched sprites and render.
     * 提交批处理的精灵并渲染。
     */
    render(): void {
        if (!this.batcher.isEmpty) {
            this.bridge.submitSprites(this.batcher.getSprites());
        }
        this.bridge.render();
    }

    /**
     * Get the number of sprites to be rendered.
     * 获取要渲染的精灵数量。
     */
    get spriteCount(): number {
        return this.batcher.count;
    }

    /**
     * Clear the current batch.
     * 清除当前批处理。
     */
    clear(): void {
        this.batcher.clear();
    }
}
