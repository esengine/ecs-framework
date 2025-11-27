/**
 * UI Button Render System
 * UI 按钮渲染系统
 *
 * Renders UIButtonComponent entities by submitting render primitives
 * to the shared UIRenderCollector.
 * 通过向共享的 UIRenderCollector 提交渲染原语来渲染 UIButtonComponent 实体。
 */

import { EntitySystem, Matcher, Entity, ECSSystem } from '@esengine/ecs-framework';
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
            const width = (transform.computedWidth ?? transform.width) * transform.scaleX;
            const height = (transform.computedHeight ?? transform.height) * transform.scaleY;
            const alpha = transform.worldAlpha ?? transform.alpha;
            const baseOrder = 100 + transform.zIndex;

            // Render texture if in texture or both mode
            // 如果在纹理或两者模式下，渲染纹理
            if (button.useTexture()) {
                const texture = button.getStateTexture('normal');
                if (texture) {
                    collector.addRect(
                        x, y,
                        width, height,
                        0xFFFFFF,  // White tint for texture
                        alpha,
                        baseOrder,
                        {
                            rotation: transform.rotation,
                            pivotX: 0,
                            pivotY: 0,
                            texturePath: texture
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
                        x, y,
                        width, height,
                        button.currentColor,
                        bgAlpha * alpha,
                        baseOrder + (button.useTexture() ? 0.05 : 0),
                        {
                            rotation: transform.rotation,
                            pivotX: 0,
                            pivotY: 0
                        }
                    );
                }
            }

            // Render border if UIRenderComponent has border
            // 如果 UIRenderComponent 有边框，渲染边框
            if (render && render.borderWidth > 0 && render.borderAlpha > 0) {
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
        // Top border
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
