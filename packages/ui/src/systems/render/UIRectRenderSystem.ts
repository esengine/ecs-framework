/**
 * UI Rect Render System
 * UI 矩形渲染系统
 *
 * Renders basic UIRenderComponent entities (those without specialized widget components)
 * by submitting render primitives to the shared UIRenderCollector.
 * 通过向共享的 UIRenderCollector 提交渲染原语来渲染基础 UIRenderComponent 实体
 * （没有专门 widget 组件的实体）。
 */

import { EntitySystem, Matcher, Entity, ECSSystem } from '@esengine/ecs-framework';
import { UITransformComponent } from '../../components/UITransformComponent';
import { UIRenderComponent } from '../../components/UIRenderComponent';
import { UIButtonComponent } from '../../components/widgets/UIButtonComponent';
import { UIProgressBarComponent } from '../../components/widgets/UIProgressBarComponent';
import { UISliderComponent } from '../../components/widgets/UISliderComponent';
import { UIScrollViewComponent } from '../../components/widgets/UIScrollViewComponent';
import { getUIRenderCollector } from './UIRenderCollector';

/**
 * UI Rect Render System
 * UI 矩形渲染系统
 *
 * Handles rendering of basic UI elements with UIRenderComponent that don't have
 * specialized widget components (like buttons, progress bars, etc.).
 *
 * This is the "catch-all" renderer for simple rectangles, images, and panels.
 *
 * 处理具有 UIRenderComponent 但没有专门 widget 组件（如按钮、进度条等）的基础 UI 元素的渲染。
 * 这是简单矩形、图像和面板的"兜底"渲染器。
 */
@ECSSystem('UIRectRender', { updateOrder: 100 })
export class UIRectRenderSystem extends EntitySystem {
    constructor() {
        super(Matcher.empty().all(UITransformComponent, UIRenderComponent));
    }

    protected process(entities: readonly Entity[]): void {
        const collector = getUIRenderCollector();

        for (const entity of entities) {
            // Skip if entity has specialized widget components
            // (they have their own render systems)
            // 如果实体有专门的 widget 组件，跳过（它们有自己的渲染系统）
            if (entity.hasComponent(UIButtonComponent) ||
                entity.hasComponent(UIProgressBarComponent) ||
                entity.hasComponent(UISliderComponent) ||
                entity.hasComponent(UIScrollViewComponent)) {
                continue;
            }

            const transform = entity.getComponent(UITransformComponent)!;
            const render = entity.getComponent(UIRenderComponent)!;

            if (!transform.visible) continue;

            const x = transform.worldX ?? transform.x;
            const y = transform.worldY ?? transform.y;
            const width = (transform.computedWidth ?? transform.width) * transform.scaleX;
            const height = (transform.computedHeight ?? transform.height) * transform.scaleY;
            const alpha = transform.worldAlpha ?? transform.alpha;
            const baseOrder = 100 + transform.zIndex;

            // Use top-left position with origin at (0, 0)
            // Like Sprite: x,y is anchor position, origin determines where anchor is on the rect
            // For UI: x,y is top-left corner, so origin should be (0, 0)
            // 使用左上角位置，原点在 (0, 0)
            // 类似 Sprite：x,y 是锚点位置，origin 决定锚点在矩形上的位置
            // 对于 UI：x,y 是左上角，所以 origin 应该是 (0, 0)

            // Render shadow if enabled
            // 如果启用，渲染阴影
            if (render.shadowEnabled && render.shadowAlpha > 0) {
                collector.addRect(
                    x + render.shadowOffsetX - render.shadowBlur,
                    y + render.shadowOffsetY - render.shadowBlur,
                    width + render.shadowBlur * 2,
                    height + render.shadowBlur * 2,
                    render.shadowColor,
                    render.shadowAlpha * alpha,
                    baseOrder - 0.1,
                    {
                        rotation: transform.rotation,
                        pivotX: 0,
                        pivotY: 0
                    }
                );
            }

            // Render texture if present
            // 如果有纹理，渲染纹理
            if (render.texture) {
                const texturePath = typeof render.texture === 'string' ? render.texture : undefined;
                const textureId = typeof render.texture === 'number' ? render.texture : undefined;

                collector.addRect(
                    x, y,
                    width, height,
                    render.textureTint,
                    alpha,
                    baseOrder,
                    {
                        rotation: transform.rotation,
                        pivotX: 0,
                        pivotY: 0,
                        textureId,
                        texturePath,
                        uv: render.textureUV
                            ? [render.textureUV.u0, render.textureUV.v0, render.textureUV.u1, render.textureUV.v1]
                            : undefined
                    }
                );
            }
            // Render background color if fill is enabled
            // 如果启用填充，渲染背景颜色
            else if (render.fillBackground && render.backgroundAlpha > 0) {
                collector.addRect(
                    x, y,
                    width, height,
                    render.backgroundColor,
                    render.backgroundAlpha * alpha,
                    baseOrder,
                    {
                        rotation: transform.rotation,
                        pivotX: 0,
                        pivotY: 0
                    }
                );
            }

            // Render border if present
            // 如果有边框，渲染边框
            if (render.borderWidth > 0 && render.borderAlpha > 0) {
                this.renderBorder(
                    collector,
                    x, y, width, height,
                    render.borderWidth,
                    render.borderColor,
                    render.borderAlpha * alpha,
                    baseOrder + 0.1,
                    transform.rotation
                );
            }
        }
    }

    /**
     * Render border using top-left coordinates
     * 使用左上角坐标渲染边框
     */
    private renderBorder(
        collector: ReturnType<typeof getUIRenderCollector>,
        x: number, y: number,
        width: number, height: number,
        borderWidth: number,
        borderColor: number,
        alpha: number,
        sortOrder: number,
        rotation: number
    ): void {
        // Top border (from top-left corner)
        collector.addRect(
            x, y,
            width, borderWidth,
            borderColor, alpha, sortOrder,
            { rotation, pivotX: 0, pivotY: 0 }
        );

        // Bottom border
        collector.addRect(
            x, y + height - borderWidth,
            width, borderWidth,
            borderColor, alpha, sortOrder,
            { rotation, pivotX: 0, pivotY: 0 }
        );

        // Left border (excluding corners)
        collector.addRect(
            x, y + borderWidth,
            borderWidth, height - borderWidth * 2,
            borderColor, alpha, sortOrder,
            { rotation, pivotX: 0, pivotY: 0 }
        );

        // Right border (excluding corners)
        collector.addRect(
            x + width - borderWidth, y + borderWidth,
            borderWidth, height - borderWidth * 2,
            borderColor, alpha, sortOrder,
            { rotation, pivotX: 0, pivotY: 0 }
        );
    }
}
