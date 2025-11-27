/**
 * UI ProgressBar Render System
 * UI 进度条渲染系统
 *
 * Renders UIProgressBarComponent entities by submitting render primitives
 * to the shared UIRenderCollector.
 * 通过向共享的 UIRenderCollector 提交渲染原语来渲染 UIProgressBarComponent 实体。
 */

import { EntitySystem, Matcher, Entity, ECSSystem } from '@esengine/ecs-framework';
import { UITransformComponent } from '../../components/UITransformComponent';
import { UIProgressBarComponent, UIProgressDirection, UIProgressFillMode } from '../../components/widgets/UIProgressBarComponent';
import { getUIRenderCollector } from './UIRenderCollector';

/**
 * UI ProgressBar Render System
 * UI 进度条渲染系统
 *
 * Handles rendering of progress bar components including:
 * - Background rectangle
 * - Fill rectangle (based on progress value)
 * - Support for different directions (LTR, RTL, TTB, BTT)
 * - Segmented display
 *
 * 处理进度条组件的渲染，包括：
 * - 背景矩形
 * - 填充矩形（基于进度值）
 * - 支持不同方向（左到右、右到左、上到下、下到上）
 * - 分段显示
 */
@ECSSystem('UIProgressBarRender', { updateOrder: 110 })
export class UIProgressBarRenderSystem extends EntitySystem {
    constructor() {
        super(Matcher.empty().all(UITransformComponent, UIProgressBarComponent));
    }

    protected process(entities: readonly Entity[]): void {
        const collector = getUIRenderCollector();

        for (const entity of entities) {
            const transform = entity.getComponent(UITransformComponent)!;
            const progressBar = entity.getComponent(UIProgressBarComponent)!;

            if (!transform.visible) continue;

            const x = transform.worldX ?? transform.x;
            const y = transform.worldY ?? transform.y;
            const width = (transform.computedWidth ?? transform.width) * transform.scaleX;
            const height = (transform.computedHeight ?? transform.height) * transform.scaleY;
            const alpha = transform.worldAlpha ?? transform.alpha;
            const baseOrder = 100 + transform.zIndex;

            // Render background (x, y is top-left corner)
            // 渲染背景（x, y 是左上角）
            if (progressBar.backgroundAlpha > 0) {
                collector.addRect(
                    x, y, width, height,
                    progressBar.backgroundColor,
                    progressBar.backgroundAlpha * alpha,
                    baseOrder,
                    {
                        rotation: transform.rotation,
                        pivotX: 0,
                        pivotY: 0
                    }
                );
            }

            // Render border
            // 渲染边框
            if (progressBar.borderWidth > 0) {
                this.renderBorder(
                    collector, x, y, width, height,
                    progressBar.borderWidth,
                    progressBar.borderColor,
                    alpha,
                    baseOrder + 0.2,
                    transform
                );
            }

            // Render fill
            // 渲染填充
            const progress = progressBar.getProgress();
            if (progress > 0 && progressBar.fillAlpha > 0) {
                if (progressBar.showSegments) {
                    this.renderSegmentedFill(
                        collector, x, y, width, height,
                        progress, progressBar, alpha, baseOrder + 0.1, transform
                    );
                } else {
                    this.renderSolidFill(
                        collector, x, y, width, height,
                        progress, progressBar, alpha, baseOrder + 0.1, transform
                    );
                }
            }
        }
    }

    /**
     * Render solid fill rectangle
     * 渲染实心填充矩形
     *
     * Note: x, y is the top-left corner of the progress bar
     * 注意：x, y 是进度条的左上角
     */
    private renderSolidFill(
        collector: ReturnType<typeof getUIRenderCollector>,
        x: number, y: number, width: number, height: number,
        progress: number,
        progressBar: UIProgressBarComponent,
        alpha: number,
        sortOrder: number,
        transform: UITransformComponent
    ): void {
        let fillX = x;
        let fillY = y;
        let fillWidth = width;
        let fillHeight = height;

        // Calculate fill dimensions based on direction
        // x, y is top-left corner, so calculations are simpler
        // 根据方向计算填充尺寸
        // x, y 是左上角，所以计算更简单
        switch (progressBar.direction) {
            case UIProgressDirection.LeftToRight:
                fillWidth = width * progress;
                // Fill starts from left (fillX = x, no change)
                break;

            case UIProgressDirection.RightToLeft:
                fillWidth = width * progress;
                // Fill starts from right
                fillX = x + width - fillWidth;
                break;

            case UIProgressDirection.BottomToTop:
                fillHeight = height * progress;
                // Fill starts from bottom
                fillY = y + height - fillHeight;
                break;

            case UIProgressDirection.TopToBottom:
                fillHeight = height * progress;
                // Fill starts from top (fillY = y, no change)
                break;
        }

        // Determine fill color (gradient or solid)
        // 确定填充颜色（渐变或实心）
        let fillColor = progressBar.fillColor;
        if (progressBar.useGradient) {
            // Simple linear interpolation between start and end colors
            // 简单的起始和结束颜色线性插值
            fillColor = this.lerpColor(
                progressBar.gradientStartColor,
                progressBar.gradientEndColor,
                progress
            );
        }

        collector.addRect(
            fillX, fillY, fillWidth, fillHeight,
            fillColor,
            progressBar.fillAlpha * alpha,
            sortOrder,
            {
                rotation: transform.rotation,
                pivotX: 0,
                pivotY: 0
            }
        );
    }

    /**
     * Render segmented fill
     * 渲染分段填充
     *
     * Note: x, y is the top-left corner of the progress bar
     * 注意：x, y 是进度条的左上角
     */
    private renderSegmentedFill(
        collector: ReturnType<typeof getUIRenderCollector>,
        x: number, y: number, width: number, height: number,
        progress: number,
        progressBar: UIProgressBarComponent,
        alpha: number,
        sortOrder: number,
        transform: UITransformComponent
    ): void {
        const segments = progressBar.segments;
        const gap = progressBar.segmentGap;
        const filledSegments = Math.ceil(progress * segments);

        const isHorizontal = progressBar.direction === UIProgressDirection.LeftToRight ||
                            progressBar.direction === UIProgressDirection.RightToLeft;

        // Calculate segment dimensions
        // 计算段尺寸
        let segmentWidth: number;
        let segmentHeight: number;

        if (isHorizontal) {
            segmentWidth = (width - gap * (segments - 1)) / segments;
            segmentHeight = height;
        } else {
            segmentWidth = width;
            segmentHeight = (height - gap * (segments - 1)) / segments;
        }

        // x, y is already top-left corner
        // x, y 已经是左上角
        const baseX = x;
        const baseY = y;

        for (let i = 0; i < filledSegments && i < segments; i++) {
            let segX: number;
            let segY: number;

            // Calculate segment position based on direction (using top-left positions)
            // 根据方向计算段位置（使用左上角位置）
            switch (progressBar.direction) {
                case UIProgressDirection.LeftToRight:
                    segX = baseX + i * (segmentWidth + gap);
                    segY = baseY;
                    break;

                case UIProgressDirection.RightToLeft:
                    segX = baseX + width - (i + 1) * segmentWidth - i * gap;
                    segY = baseY;
                    break;

                case UIProgressDirection.TopToBottom:
                    segX = baseX;
                    segY = baseY + i * (segmentHeight + gap);
                    break;

                case UIProgressDirection.BottomToTop:
                    segX = baseX;
                    segY = baseY + height - (i + 1) * segmentHeight - i * gap;
                    break;

                default:
                    segX = baseX + i * (segmentWidth + gap);
                    segY = baseY;
            }

            // Determine segment color
            // 确定段颜色
            let segmentColor = progressBar.fillColor;
            if (progressBar.useGradient) {
                const t = segments > 1 ? i / (segments - 1) : 0;
                segmentColor = this.lerpColor(
                    progressBar.gradientStartColor,
                    progressBar.gradientEndColor,
                    t
                );
            }

            // Use top-left position with pivot 0,0
            // 使用左上角位置，pivot 0,0
            collector.addRect(
                segX, segY,
                segmentWidth,
                segmentHeight,
                segmentColor,
                progressBar.fillAlpha * alpha,
                sortOrder + i * 0.001,  // Slight offset for each segment
                {
                    rotation: transform.rotation,
                    pivotX: 0,
                    pivotY: 0
                }
            );
        }
    }

    /**
     * Render border
     * 渲染边框
     *
     * Note: x, y is the top-left corner of the progress bar
     * 注意：x, y 是进度条的左上角
     */
    private renderBorder(
        collector: ReturnType<typeof getUIRenderCollector>,
        x: number, y: number, width: number, height: number,
        borderWidth: number,
        borderColor: number,
        alpha: number,
        sortOrder: number,
        _transform: UITransformComponent
    ): void {
        // x, y is already top-left corner
        // x, y 已经是左上角

        // Top border
        collector.addRect(
            x, y,
            width, borderWidth,
            borderColor, alpha, sortOrder,
            { pivotX: 0, pivotY: 0 }
        );

        // Bottom border
        collector.addRect(
            x, y + height - borderWidth,
            width, borderWidth,
            borderColor, alpha, sortOrder,
            { pivotX: 0, pivotY: 0 }
        );

        // Left border (excluding corners)
        collector.addRect(
            x, y + borderWidth,
            borderWidth, height - borderWidth * 2,
            borderColor, alpha, sortOrder,
            { pivotX: 0, pivotY: 0 }
        );

        // Right border (excluding corners)
        collector.addRect(
            x + width - borderWidth, y + borderWidth,
            borderWidth, height - borderWidth * 2,
            borderColor, alpha, sortOrder,
            { pivotX: 0, pivotY: 0 }
        );
    }

    /**
     * Linear interpolation between two colors
     * 两种颜色之间的线性插值
     */
    private lerpColor(color1: number, color2: number, t: number): number {
        const r1 = (color1 >> 16) & 0xFF;
        const g1 = (color1 >> 8) & 0xFF;
        const b1 = color1 & 0xFF;

        const r2 = (color2 >> 16) & 0xFF;
        const g2 = (color2 >> 8) & 0xFF;
        const b2 = color2 & 0xFF;

        const r = Math.round(r1 + (r2 - r1) * t);
        const g = Math.round(g1 + (g2 - g1) * t);
        const b = Math.round(b1 + (b2 - b1) * t);

        return (r << 16) | (g << 8) | b;
    }
}
