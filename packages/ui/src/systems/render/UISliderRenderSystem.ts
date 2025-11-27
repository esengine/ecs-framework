/**
 * UI Slider Render System
 * UI 滑块渲染系统
 *
 * Renders UISliderComponent entities by submitting render primitives
 * to the shared UIRenderCollector.
 * 通过向共享的 UIRenderCollector 提交渲染原语来渲染 UISliderComponent 实体。
 */

import { EntitySystem, Matcher, Entity, ECSSystem } from '@esengine/ecs-framework';
import { UITransformComponent } from '../../components/UITransformComponent';
import { UISliderComponent, UISliderOrientation } from '../../components/widgets/UISliderComponent';
import { getUIRenderCollector } from './UIRenderCollector';

/**
 * UI Slider Render System
 * UI 滑块渲染系统
 *
 * Handles rendering of slider components including:
 * - Track (background bar)
 * - Fill (progress portion)
 * - Handle (draggable knob)
 * - Optional ticks
 *
 * 处理滑块组件的渲染，包括：
 * - 轨道（背景条）
 * - 填充（进度部分）
 * - 手柄（可拖动的旋钮）
 * - 可选刻度
 */
@ECSSystem('UISliderRender', { updateOrder: 111 })
export class UISliderRenderSystem extends EntitySystem {
    constructor() {
        super(Matcher.empty().all(UITransformComponent, UISliderComponent));
    }

    protected process(entities: readonly Entity[]): void {
        const collector = getUIRenderCollector();

        for (const entity of entities) {
            const transform = entity.getComponent(UITransformComponent)!;
            const slider = entity.getComponent(UISliderComponent)!;

            if (!transform.visible) continue;

            const x = transform.worldX ?? transform.x;
            const y = transform.worldY ?? transform.y;
            const width = (transform.computedWidth ?? transform.width) * transform.scaleX;
            const height = (transform.computedHeight ?? transform.height) * transform.scaleY;
            const alpha = transform.worldAlpha ?? transform.alpha;
            const baseOrder = 100 + transform.zIndex;

            const isHorizontal = slider.orientation === UISliderOrientation.Horizontal;
            const progress = slider.getProgress();

            // Calculate track dimensions and position
            // 计算轨道尺寸和位置
            const trackLength = isHorizontal ? width : height;
            const trackThickness = slider.trackThickness;

            // Calculate center position (x, y is top-left corner)
            // 计算中心位置（x, y 是左上角）
            const centerX = x + width / 2;
            const centerY = y + height / 2;

            // Render track (using center position with pivot 0.5)
            // 渲染轨道（使用中心位置，pivot 0.5）
            if (slider.trackAlpha > 0) {
                if (isHorizontal) {
                    collector.addRect(
                        centerX, centerY,
                        trackLength, trackThickness,
                        slider.trackColor,
                        slider.trackAlpha * alpha,
                        baseOrder,
                        { pivotX: 0.5, pivotY: 0.5 }
                    );
                } else {
                    collector.addRect(
                        centerX, centerY,
                        trackThickness, trackLength,
                        slider.trackColor,
                        slider.trackAlpha * alpha,
                        baseOrder,
                        { pivotX: 0.5, pivotY: 0.5 }
                    );
                }
            }

            // Render fill
            // 渲染填充
            if (progress > 0 && slider.fillAlpha > 0) {
                const fillLength = trackLength * progress;

                if (isHorizontal) {
                    // Fill from left
                    const fillX = centerX - trackLength / 2 + fillLength / 2;
                    collector.addRect(
                        fillX, centerY,
                        fillLength, trackThickness,
                        slider.fillColor,
                        slider.fillAlpha * alpha,
                        baseOrder + 0.1,
                        { pivotX: 0.5, pivotY: 0.5 }
                    );
                } else {
                    // Fill from bottom
                    const fillY = centerY + trackLength / 2 - fillLength / 2;
                    collector.addRect(
                        centerX, fillY,
                        trackThickness, fillLength,
                        slider.fillColor,
                        slider.fillAlpha * alpha,
                        baseOrder + 0.1,
                        { pivotX: 0.5, pivotY: 0.5 }
                    );
                }
            }

            // Render ticks
            // 渲染刻度
            if (slider.showTicks && slider.tickCount > 0) {
                this.renderTicks(
                    collector, centerX, centerY,
                    trackLength, trackThickness,
                    slider, alpha, baseOrder + 0.05,
                    isHorizontal
                );
            }

            // Render handle
            // 渲染手柄
            const handleColor = slider.getCurrentHandleColor();
            const handleX = isHorizontal
                ? centerX - trackLength / 2 + trackLength * progress
                : centerX;
            const handleY = isHorizontal
                ? centerY
                : centerY + trackLength / 2 - trackLength * progress;

            // Handle shadow (if enabled)
            // 手柄阴影（如果启用）
            if (slider.handleShadow) {
                collector.addRect(
                    handleX + 1, handleY + 2,
                    slider.handleWidth, slider.handleHeight,
                    0x000000,
                    0.3 * alpha,
                    baseOrder + 0.15,
                    { pivotX: 0.5, pivotY: 0.5 }
                );
            }

            // Handle body
            // 手柄主体
            collector.addRect(
                handleX, handleY,
                slider.handleWidth, slider.handleHeight,
                handleColor,
                alpha,
                baseOrder + 0.2,
                { pivotX: 0.5, pivotY: 0.5 }
            );

            // Handle border (if any)
            // 手柄边框（如果有）
            if (slider.handleBorderWidth > 0) {
                this.renderHandleBorder(
                    collector,
                    handleX, handleY,
                    slider.handleWidth, slider.handleHeight,
                    slider.handleBorderWidth,
                    slider.handleBorderColor,
                    alpha,
                    baseOrder + 0.25
                );
            }
        }
    }

    /**
     * Render ticks along the slider track
     * 沿滑块轨道渲染刻度
     */
    private renderTicks(
        collector: ReturnType<typeof getUIRenderCollector>,
        centerX: number, centerY: number,
        trackLength: number, trackThickness: number,
        slider: UISliderComponent,
        alpha: number,
        sortOrder: number,
        isHorizontal: boolean
    ): void {
        const tickCount = slider.tickCount + 2; // Include start and end ticks
        const tickSize = slider.tickSize;

        for (let i = 0; i < tickCount; i++) {
            const t = i / (tickCount - 1);

            let tickX: number;
            let tickY: number;
            let tickWidth: number;
            let tickHeight: number;

            if (isHorizontal) {
                tickX = centerX - trackLength / 2 + trackLength * t;
                tickY = centerY + trackThickness / 2 + tickSize / 2 + 2;
                tickWidth = 2;
                tickHeight = tickSize;
            } else {
                tickX = centerX + trackThickness / 2 + tickSize / 2 + 2;
                tickY = centerY + trackLength / 2 - trackLength * t;
                tickWidth = tickSize;
                tickHeight = 2;
            }

            collector.addRect(
                tickX, tickY,
                tickWidth, tickHeight,
                slider.tickColor,
                alpha,
                sortOrder,
                { pivotX: 0.5, pivotY: 0.5 }
            );
        }
    }

    /**
     * Render handle border
     * 渲染手柄边框
     */
    private renderHandleBorder(
        collector: ReturnType<typeof getUIRenderCollector>,
        x: number, y: number,
        width: number, height: number,
        borderWidth: number,
        borderColor: number,
        alpha: number,
        sortOrder: number
    ): void {
        const halfW = width / 2;
        const halfH = height / 2;
        const halfB = borderWidth / 2;

        // Top
        collector.addRect(
            x, y - halfH + halfB,
            width, borderWidth,
            borderColor, alpha, sortOrder,
            { pivotX: 0.5, pivotY: 0.5 }
        );

        // Bottom
        collector.addRect(
            x, y + halfH - halfB,
            width, borderWidth,
            borderColor, alpha, sortOrder,
            { pivotX: 0.5, pivotY: 0.5 }
        );

        // Left
        collector.addRect(
            x - halfW + halfB, y,
            borderWidth, height - borderWidth * 2,
            borderColor, alpha, sortOrder,
            { pivotX: 0.5, pivotY: 0.5 }
        );

        // Right
        collector.addRect(
            x + halfW - halfB, y,
            borderWidth, height - borderWidth * 2,
            borderColor, alpha, sortOrder,
            { pivotX: 0.5, pivotY: 0.5 }
        );
    }
}
