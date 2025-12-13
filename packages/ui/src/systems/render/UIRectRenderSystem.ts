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

            const transform = entity.getComponent(UITransformComponent);
            const render = entity.getComponent(UIRenderComponent);

            // 空值检查 - 组件可能在反序列化或初始化期间尚未就绪
            // Null check - component may not be ready during deserialization or initialization
            if (!transform || !render) continue;

            if (!transform.worldVisible) continue;

            const x = transform.worldX ?? transform.x;
            const y = transform.worldY ?? transform.y;
            // 使用世界缩放（考虑父级缩放）
            const scaleX = transform.worldScaleX ?? transform.scaleX;
            const scaleY = transform.worldScaleY ?? transform.scaleY;
            const width = (transform.computedWidth ?? transform.width) * scaleX;
            const height = (transform.computedHeight ?? transform.height) * scaleY;
            const alpha = transform.worldAlpha ?? transform.alpha;
            // 使用世界旋转（考虑父级旋转）
            const rotation = transform.worldRotation ?? transform.rotation;
            // 使用排序层和层内顺序 | Use sorting layer and order in layer
            const sortingLayer = transform.sortingLayer;
            const orderInLayer = transform.orderInLayer;
            // 使用 transform 的 pivot 作为旋转/缩放中心
            const pivotX = transform.pivotX;
            const pivotY = transform.pivotY;

            // worldX/worldY 是元素左下角位置，需要转换为以 pivot 为中心的位置
            // pivot 相对于元素的偏移：(width * pivotX, height * pivotY)
            // 渲染位置 = 左下角 + pivot 偏移
            const renderX = x + width * pivotX;
            const renderY = y + height * pivotY;

            // Render shadow if enabled
            // 如果启用，渲染阴影
            if (render.shadowEnabled && render.shadowAlpha > 0) {
                collector.addRect(
                    renderX + render.shadowOffsetX,
                    renderY + render.shadowOffsetY,
                    width + render.shadowBlur * 2,
                    height + render.shadowBlur * 2,
                    render.shadowColor,
                    render.shadowAlpha * alpha,
                    sortingLayer,
                    orderInLayer - 1, // Shadow renders below main content
                    {
                        rotation,
                        pivotX,
                        pivotY
                    }
                );
            }

            // Render texture if present
            // 如果有纹理，渲染纹理
            if (render.textureGuid) {
                const textureGuid = typeof render.textureGuid === 'string' ? render.textureGuid : undefined;
                const textureId = typeof render.textureGuid === 'number' ? render.textureGuid : undefined;

                collector.addRect(
                    renderX, renderY,
                    width, height,
                    render.textureTint,
                    alpha,
                    sortingLayer,
                    orderInLayer,
                    {
                        rotation,
                        pivotX,
                        pivotY,
                        textureId,
                        textureGuid,
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
                    renderX, renderY,
                    width, height,
                    render.backgroundColor,
                    render.backgroundAlpha * alpha,
                    sortingLayer,
                    orderInLayer,
                    {
                        rotation,
                        pivotX,
                        pivotY
                    }
                );
            }

            // Render border if present
            // 如果有边框，渲染边框
            if (render.borderWidth > 0 && render.borderAlpha > 0) {
                this.renderBorder(
                    collector,
                    renderX, renderY, width, height,
                    render.borderWidth,
                    render.borderColor,
                    render.borderAlpha * alpha,
                    sortingLayer,
                    orderInLayer + 1, // Border renders above main content
                    rotation,
                    pivotX,
                    pivotY
                );
            }
        }
    }

    /**
     * Render border using pivot-based coordinates
     * 使用基于 pivot 的坐标渲染边框
     */
    private renderBorder(
        collector: ReturnType<typeof getUIRenderCollector>,
        centerX: number, centerY: number,
        width: number, height: number,
        borderWidth: number,
        borderColor: number,
        alpha: number,
        sortingLayer: string,
        orderInLayer: number,
        rotation: number,
        pivotX: number,
        pivotY: number
    ): void {
        // 计算矩形的左下角位置（相对于 pivot 中心）
        const left = centerX - width * pivotX;
        const bottom = centerY - height * pivotY;
        const right = left + width;
        const top = bottom + height;

        // Top border
        const topBorderCenterX = (left + right) / 2;
        const topBorderCenterY = top - borderWidth / 2;
        collector.addRect(
            topBorderCenterX, topBorderCenterY,
            width, borderWidth,
            borderColor, alpha, sortingLayer, orderInLayer,
            { rotation, pivotX: 0.5, pivotY: 0.5 }
        );

        // Bottom border
        const bottomBorderCenterY = bottom + borderWidth / 2;
        collector.addRect(
            topBorderCenterX, bottomBorderCenterY,
            width, borderWidth,
            borderColor, alpha, sortingLayer, orderInLayer,
            { rotation, pivotX: 0.5, pivotY: 0.5 }
        );

        // Left border (excluding corners)
        const sideBorderHeight = height - borderWidth * 2;
        const leftBorderCenterX = left + borderWidth / 2;
        const sideBorderCenterY = (top + bottom) / 2;
        collector.addRect(
            leftBorderCenterX, sideBorderCenterY,
            borderWidth, sideBorderHeight,
            borderColor, alpha, sortingLayer, orderInLayer,
            { rotation, pivotX: 0.5, pivotY: 0.5 }
        );

        // Right border (excluding corners)
        const rightBorderCenterX = right - borderWidth / 2;
        collector.addRect(
            rightBorderCenterX, sideBorderCenterY,
            borderWidth, sideBorderHeight,
            borderColor, alpha, sortingLayer, orderInLayer,
            { rotation, pivotX: 0.5, pivotY: 0.5 }
        );
    }
}
