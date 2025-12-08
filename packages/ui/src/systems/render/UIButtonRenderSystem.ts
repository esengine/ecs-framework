/**
 * UI Button Render System
 * UI 按钮渲染系统
 *
 * Renders UIButtonComponent entities by submitting render primitives
 * to the shared UIRenderCollector.
 * 通过向共享的 UIRenderCollector 提交渲染原语来渲染 UIButtonComponent 实体。
 */

import { EntitySystem, Matcher, Entity, ECSSystem } from '@esengine/esengine';
import { UITransformComponent } from '../../components/UITransformComponent';
import { UIButtonComponent } from '../../components/widgets/UIButtonComponent';
import { UIRenderComponent } from '../../components/UIRenderComponent';
import { getUIRenderCollector } from './UIRenderCollector';

/**
 * UI Button Render System
 * UI 按钮渲染系统
 *
 * Handles rendering of button components including:
 * - Background color (with state-based color changes)
 * - Texture support (normal, hover, pressed, disabled)
 * - Combined color + texture mode
 *
 * 处理按钮组件的渲染，包括：
 * - 背景颜色（带状态变化的颜色）
 * - 纹理支持（正常、悬停、按下、禁用）
 * - 颜色 + 纹理组合模式
 *
 * Note: Button text is rendered by UITextRenderSystem if UITextComponent is present.
 * 注意：如果存在 UITextComponent，按钮文本由 UITextRenderSystem 渲染。
 */
@ECSSystem('UIButtonRender', { updateOrder: 113 })
export class UIButtonRenderSystem extends EntitySystem {
    constructor() {
        super(Matcher.empty().all(UITransformComponent, UIButtonComponent));
    }

    protected process(entities: readonly Entity[]): void {
        const collector = getUIRenderCollector();

        for (const entity of entities) {
            const transform = entity.getComponent(UITransformComponent)!;
            const button = entity.getComponent(UIButtonComponent)!;
            const render = entity.getComponent(UIRenderComponent);

            if (!transform.visible) continue;

            const x = transform.worldX ?? transform.x;
            const y = transform.worldY ?? transform.y;
            // 使用世界缩放和旋转
            const scaleX = transform.worldScaleX ?? transform.scaleX;
            const scaleY = transform.worldScaleY ?? transform.scaleY;
            const rotation = transform.worldRotation ?? transform.rotation;
            const width = (transform.computedWidth ?? transform.width) * scaleX;
            const height = (transform.computedHeight ?? transform.height) * scaleY;
            const alpha = transform.worldAlpha ?? transform.alpha;
            const baseOrder = 100 + transform.zIndex;
            // 使用 transform 的 pivot 作为旋转/缩放中心
            const pivotX = transform.pivotX;
            const pivotY = transform.pivotY;
            // 渲染位置 = 左下角 + pivot 偏移
            const renderX = x + width * pivotX;
            const renderY = y + height * pivotY;

            // Render texture if in texture or both mode
            // 如果在纹理或两者模式下，渲染纹理
            if (button.useTexture()) {
                const textureGuid = button.getStateTextureGuid('normal');
                if (textureGuid) {
                    collector.addRect(
                        renderX, renderY,
                        width, height,
                        0xFFFFFF,  // White tint for texture
                        alpha,
                        baseOrder,
                        {
                            rotation,
                            pivotX,
                            pivotY,
                            texturePath: textureGuid
                        }
                    );
                }
            }

            // Render color background if in color or both mode
            // 如果在颜色或两者模式下，渲染颜色背景
            if (button.useColor()) {
                const bgAlpha = render?.backgroundAlpha ?? 1;
                if (bgAlpha > 0) {
                    collector.addRect(
                        renderX, renderY,
                        width, height,
                        button.currentColor,
                        bgAlpha * alpha,
                        baseOrder + (button.useTexture() ? 0.05 : 0),
                        {
                            rotation,
                            pivotX,
                            pivotY
                        }
                    );
                }
            }

            // Render border if UIRenderComponent has border
            // 如果 UIRenderComponent 有边框，渲染边框
            if (render && render.borderWidth > 0 && render.borderAlpha > 0) {
                this.renderBorder(
                    collector,
                    renderX, renderY, width, height,
                    render.borderWidth,
                    render.borderColor,
                    render.borderAlpha * alpha,
                    baseOrder + 0.1,
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
        sortOrder: number,
        rotation: number,
        pivotX: number,
        pivotY: number
    ): void {
        // 计算矩形的边界（相对于 pivot 中心）
        const left = centerX - width * pivotX;
        const bottom = centerY - height * pivotY;
        const right = left + width;
        const top = bottom + height;

        // Top border
        collector.addRect(
            (left + right) / 2, top - borderWidth / 2,
            width, borderWidth,
            borderColor, alpha, sortOrder,
            { rotation, pivotX: 0.5, pivotY: 0.5 }
        );

        // Bottom border
        collector.addRect(
            (left + right) / 2, bottom + borderWidth / 2,
            width, borderWidth,
            borderColor, alpha, sortOrder,
            { rotation, pivotX: 0.5, pivotY: 0.5 }
        );

        // Left border (excluding corners)
        const sideBorderHeight = height - borderWidth * 2;
        collector.addRect(
            left + borderWidth / 2, (top + bottom) / 2,
            borderWidth, sideBorderHeight,
            borderColor, alpha, sortOrder,
            { rotation, pivotX: 0.5, pivotY: 0.5 }
        );

        // Right border (excluding corners)
        collector.addRect(
            right - borderWidth / 2, (top + bottom) / 2,
            borderWidth, sideBorderHeight,
            borderColor, alpha, sortOrder,
            { rotation, pivotX: 0.5, pivotY: 0.5 }
        );
    }
}
