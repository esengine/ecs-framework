/**
 * UI ScrollView Render System
 * UI 滚动视图渲染系统
 *
 * Renders UIScrollViewComponent entities by submitting render primitives
 * to the shared UIRenderCollector.
 * 通过向共享的 UIRenderCollector 提交渲染原语来渲染 UIScrollViewComponent 实体。
 */

import { EntitySystem, Matcher, Entity, ECSSystem } from '@esengine/ecs-framework';
import { UITransformComponent } from '../../components/UITransformComponent';
import { UIScrollViewComponent, UIScrollbarVisibility } from '../../components/widgets/UIScrollViewComponent';
import { getUIRenderCollector } from './UIRenderCollector';

/**
 * UI ScrollView Render System
 * UI 滚动视图渲染系统
 *
 * Handles rendering of scrollview components including:
 * - Vertical scrollbar track and handle
 * - Horizontal scrollbar track and handle
 * - Scrollbar hover states
 *
 * 处理滚动视图组件的渲染，包括：
 * - 垂直滚动条轨道和手柄
 * - 水平滚动条轨道和手柄
 * - 滚动条悬停状态
 *
 * Note: The scrollview content area and clipping is handled by the layout system.
 * 注意：滚动视图内容区域和裁剪由布局系统处理。
 */
@ECSSystem('UIScrollViewRender', { updateOrder: 112 })
export class UIScrollViewRenderSystem extends EntitySystem {
    constructor() {
        super(Matcher.empty().all(UITransformComponent, UIScrollViewComponent));
    }

    protected process(entities: readonly Entity[]): void {
        const collector = getUIRenderCollector();

        for (const entity of entities) {
            const transform = entity.getComponent(UITransformComponent)!;
            const scrollView = entity.getComponent(UIScrollViewComponent)!;

            if (!transform.visible) continue;

            const x = transform.worldX ?? transform.x;
            const y = transform.worldY ?? transform.y;
            const width = (transform.computedWidth ?? transform.width) * transform.scaleX;
            const height = (transform.computedHeight ?? transform.height) * transform.scaleY;
            const alpha = transform.worldAlpha ?? transform.alpha;
            const baseOrder = 100 + transform.zIndex;

            // x, y is already top-left corner
            // x, y 已经是左上角
            const baseX = x;
            const baseY = y;

            // Render vertical scrollbar
            // 渲染垂直滚动条
            if (scrollView.needsVerticalScrollbar(height)) {
                this.renderVerticalScrollbar(
                    collector,
                    baseX, baseY, width, height,
                    scrollView, alpha, baseOrder
                );
            }

            // Render horizontal scrollbar
            // 渲染水平滚动条
            if (scrollView.needsHorizontalScrollbar(width)) {
                this.renderHorizontalScrollbar(
                    collector,
                    baseX, baseY, width, height,
                    scrollView, alpha, baseOrder
                );
            }
        }
    }

    /**
     * Render vertical scrollbar
     * 渲染垂直滚动条
     */
    private renderVerticalScrollbar(
        collector: ReturnType<typeof getUIRenderCollector>,
        baseX: number, baseY: number,
        viewWidth: number, viewHeight: number,
        scrollView: UIScrollViewComponent,
        alpha: number,
        baseOrder: number
    ): void {
        const scrollbarWidth = scrollView.scrollbarWidth;
        const hasHorizontal = scrollView.needsHorizontalScrollbar(viewWidth);
        const trackHeight = hasHorizontal ? viewHeight - scrollbarWidth : viewHeight;

        // Track position (right side of viewport)
        // 轨道位置（视口右侧）
        const trackX = baseX + viewWidth - scrollbarWidth / 2;
        const trackY = baseY + trackHeight / 2;

        // Render track
        // 渲染轨道
        if (scrollView.scrollbarTrackAlpha > 0) {
            collector.addRect(
                trackX, trackY,
                scrollbarWidth, trackHeight,
                scrollView.scrollbarTrackColor,
                scrollView.scrollbarTrackAlpha * alpha,
                baseOrder + 0.5,
                { pivotX: 0.5, pivotY: 0.5 }
            );
        }

        // Calculate handle metrics
        // 计算手柄尺寸
        const metrics = scrollView.getVerticalScrollbarMetrics(viewHeight);
        const handleY = baseY + metrics.position + metrics.size / 2;

        // Handle alpha (different when hovered)
        // 手柄透明度（悬停时不同）
        const handleAlpha = scrollView.verticalScrollbarHovered
            ? scrollView.scrollbarHoverAlpha
            : scrollView.scrollbarAlpha;

        // Render handle
        // 渲染手柄
        collector.addRect(
            trackX, handleY,
            scrollbarWidth - 2, metrics.size,
            scrollView.scrollbarColor,
            handleAlpha * alpha,
            baseOrder + 0.6,
            { pivotX: 0.5, pivotY: 0.5 }
        );
    }

    /**
     * Render horizontal scrollbar
     * 渲染水平滚动条
     */
    private renderHorizontalScrollbar(
        collector: ReturnType<typeof getUIRenderCollector>,
        baseX: number, baseY: number,
        viewWidth: number, viewHeight: number,
        scrollView: UIScrollViewComponent,
        alpha: number,
        baseOrder: number
    ): void {
        const scrollbarWidth = scrollView.scrollbarWidth;
        const hasVertical = scrollView.needsVerticalScrollbar(viewHeight);
        const trackWidth = hasVertical ? viewWidth - scrollbarWidth : viewWidth;

        // Track position (bottom of viewport)
        // 轨道位置（视口底部）
        const trackX = baseX + trackWidth / 2;
        const trackY = baseY + viewHeight - scrollbarWidth / 2;

        // Render track
        // 渲染轨道
        if (scrollView.scrollbarTrackAlpha > 0) {
            collector.addRect(
                trackX, trackY,
                trackWidth, scrollbarWidth,
                scrollView.scrollbarTrackColor,
                scrollView.scrollbarTrackAlpha * alpha,
                baseOrder + 0.5,
                { pivotX: 0.5, pivotY: 0.5 }
            );
        }

        // Calculate handle metrics
        // 计算手柄尺寸
        const metrics = scrollView.getHorizontalScrollbarMetrics(viewWidth);
        const handleX = baseX + metrics.position + metrics.size / 2;

        // Handle alpha (different when hovered)
        // 手柄透明度（悬停时不同）
        const handleAlpha = scrollView.horizontalScrollbarHovered
            ? scrollView.scrollbarHoverAlpha
            : scrollView.scrollbarAlpha;

        // Render handle
        // 渲染手柄
        collector.addRect(
            handleX, trackY,
            metrics.size, scrollbarWidth - 2,
            scrollView.scrollbarColor,
            handleAlpha * alpha,
            baseOrder + 0.6,
            { pivotX: 0.5, pivotY: 0.5 }
        );
    }
}
