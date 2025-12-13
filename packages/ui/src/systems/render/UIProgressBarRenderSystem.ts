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
import { UIProgressBarComponent, UIProgressDirection } from '../../components/widgets/UIProgressBarComponent';
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
            const transform = entity.getComponent(UITransformComponent);
            const progressBar = entity.getComponent(UIProgressBarComponent);

            // 空值检查 | Null check
            if (!transform || !progressBar) continue;

            if (!transform.worldVisible) continue;

            const x = transform.worldX ?? transform.x;
            const y = transform.worldY ?? transform.y;
            // 使用世界缩放和旋转
            const scaleX = transform.worldScaleX ?? transform.scaleX;
            const scaleY = transform.worldScaleY ?? transform.scaleY;
            const rotation = transform.worldRotation ?? transform.rotation;
            const width = (transform.computedWidth ?? transform.width) * scaleX;
            const height = (transform.computedHeight ?? transform.height) * scaleY;
            const alpha = transform.worldAlpha ?? transform.alpha;
            // 使用排序层和层内顺序 | Use sorting layer and order in layer
            const sortingLayer = transform.sortingLayer;
            const orderInLayer = transform.orderInLayer;
            // 使用 transform 的 pivot 作为旋转/缩放中心
            const pivotX = transform.pivotX;
            const pivotY = transform.pivotY;
            // 渲染位置 = 左下角 + pivot 偏移
            const renderX = x + width * pivotX;
            const renderY = y + height * pivotY;

            // Render background
            // 渲染背景
            if (progressBar.backgroundAlpha > 0) {
                collector.addRect(
                    renderX, renderY, width, height,
                    progressBar.backgroundColor,
                    progressBar.backgroundAlpha * alpha,
                    sortingLayer,
                    orderInLayer,
                    {
                        rotation,
                        pivotX,
                        pivotY
                    }
                );
            }

            // Render border
            // 渲染边框
            if (progressBar.borderWidth > 0) {
                this.renderBorder(
                    collector, renderX, renderY, width, height,
                    progressBar.borderWidth,
                    progressBar.borderColor,
                    alpha,
                    sortingLayer,
                    orderInLayer + 2,
                    transform,
                    pivotX,
                    pivotY
                );
            }

            // Render fill
            // 渲染填充
            const progress = progressBar.getProgress();
            if (progress > 0 && progressBar.fillAlpha > 0) {
                if (progressBar.showSegments) {
                    this.renderSegmentedFill(
                        collector, renderX, renderY, width, height,
                        progress, progressBar, alpha, sortingLayer, orderInLayer + 1, transform,
                        pivotX, pivotY
                    );
                } else {
                    this.renderSolidFill(
                        collector, renderX, renderY, width, height,
                        progress, progressBar, alpha, sortingLayer, orderInLayer + 1, transform,
                        pivotX, pivotY
                    );
                }
            }
        }
    }

    /**
     * Render solid fill rectangle
     * 渲染实心填充矩形
     *
     * Note: centerX, centerY is the pivot position of the progress bar
     * 注意：centerX, centerY 是进度条的 pivot 位置
     */
    private renderSolidFill(
        collector: ReturnType<typeof getUIRenderCollector>,
        centerX: number, centerY: number, width: number, height: number,
        progress: number,
        progressBar: UIProgressBarComponent,
        alpha: number,
        sortingLayer: string,
        orderInLayer: number,
        transform: UITransformComponent,
        pivotX: number,
        pivotY: number
    ): void {
        const rotation = transform.worldRotation ?? transform.rotation;

        // 计算进度条的边界（相对于 pivot 中心）
        const left = centerX - width * pivotX;
        const bottom = centerY - height * pivotY;

        let fillX: number;
        let fillY: number;
        let fillWidth = width;
        let fillHeight = height;

        // Calculate fill dimensions based on direction
        // 根据方向计算填充尺寸
        switch (progressBar.direction) {
            case UIProgressDirection.LeftToRight:
                fillWidth = width * progress;
                fillX = left + fillWidth / 2;
                fillY = bottom + height / 2;
                break;

            case UIProgressDirection.RightToLeft:
                fillWidth = width * progress;
                fillX = left + width - fillWidth / 2;
                fillY = bottom + height / 2;
                break;

            case UIProgressDirection.BottomToTop:
                fillHeight = height * progress;
                fillX = left + width / 2;
                fillY = bottom + fillHeight / 2;
                break;

            case UIProgressDirection.TopToBottom:
                fillHeight = height * progress;
                fillX = left + width / 2;
                fillY = bottom + height - fillHeight / 2;
                break;

            default:
                fillX = left + fillWidth / 2;
                fillY = bottom + height / 2;
        }

        // Determine fill color (gradient or solid)
        // 确定填充颜色（渐变或实心）
        let fillColor = progressBar.fillColor;
        if (progressBar.useGradient) {
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
            sortingLayer,
            orderInLayer,
            {
                rotation,
                pivotX: 0.5,
                pivotY: 0.5
            }
        );
    }

    /**
     * Render segmented fill
     * 渲染分段填充
     *
     * Note: centerX, centerY is the pivot position of the progress bar
     * 注意：centerX, centerY 是进度条的 pivot 位置
     */
    private renderSegmentedFill(
        collector: ReturnType<typeof getUIRenderCollector>,
        centerX: number, centerY: number, width: number, height: number,
        progress: number,
        progressBar: UIProgressBarComponent,
        alpha: number,
        sortingLayer: string,
        orderInLayer: number,
        transform: UITransformComponent,
        pivotX: number,
        pivotY: number
    ): void {
        const rotation = transform.worldRotation ?? transform.rotation;
        const segments = progressBar.segments;
        const gap = progressBar.segmentGap;
        const filledSegments = Math.ceil(progress * segments);

        const isHorizontal = progressBar.direction === UIProgressDirection.LeftToRight ||
                            progressBar.direction === UIProgressDirection.RightToLeft;

        // 计算进度条的边界（相对于 pivot 中心）
        const left = centerX - width * pivotX;
        const bottom = centerY - height * pivotY;

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

        for (let i = 0; i < filledSegments && i < segments; i++) {
            let segCenterX: number;
            let segCenterY: number;

            // Calculate segment center position based on direction
            // 根据方向计算段中心位置
            switch (progressBar.direction) {
                case UIProgressDirection.LeftToRight:
                    segCenterX = left + i * (segmentWidth + gap) + segmentWidth / 2;
                    segCenterY = bottom + height / 2;
                    break;

                case UIProgressDirection.RightToLeft:
                    segCenterX = left + width - i * (segmentWidth + gap) - segmentWidth / 2;
                    segCenterY = bottom + height / 2;
                    break;

                case UIProgressDirection.TopToBottom:
                    segCenterX = left + width / 2;
                    segCenterY = bottom + height - i * (segmentHeight + gap) - segmentHeight / 2;
                    break;

                case UIProgressDirection.BottomToTop:
                    segCenterX = left + width / 2;
                    segCenterY = bottom + i * (segmentHeight + gap) + segmentHeight / 2;
                    break;

                default:
                    segCenterX = left + i * (segmentWidth + gap) + segmentWidth / 2;
                    segCenterY = bottom + height / 2;
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

            // Use center position with pivot 0.5, 0.5
            // 使用中心位置，pivot 0.5, 0.5
            collector.addRect(
                segCenterX, segCenterY,
                segmentWidth,
                segmentHeight,
                segmentColor,
                progressBar.fillAlpha * alpha,
                sortingLayer,
                orderInLayer,
                {
                    rotation,
                    pivotX: 0.5,
                    pivotY: 0.5
                }
            );
        }
    }

    /**
     * Render border
     * 渲染边框
     *
     * Note: centerX, centerY is the pivot position of the progress bar
     * 注意：centerX, centerY 是进度条的 pivot 位置
     */
    private renderBorder(
        collector: ReturnType<typeof getUIRenderCollector>,
        centerX: number, centerY: number, width: number, height: number,
        borderWidth: number,
        borderColor: number,
        alpha: number,
        sortingLayer: string,
        orderInLayer: number,
        transform: UITransformComponent,
        pivotX: number,
        pivotY: number
    ): void {
        const rotation = transform.worldRotation ?? transform.rotation;

        // 计算边界（相对于 pivot 中心）
        const left = centerX - width * pivotX;
        const bottom = centerY - height * pivotY;
        const right = left + width;
        const top = bottom + height;

        // Top border
        collector.addRect(
            (left + right) / 2, top - borderWidth / 2,
            width, borderWidth,
            borderColor, alpha, sortingLayer, orderInLayer,
            { rotation, pivotX: 0.5, pivotY: 0.5 }
        );

        // Bottom border
        collector.addRect(
            (left + right) / 2, bottom + borderWidth / 2,
            width, borderWidth,
            borderColor, alpha, sortingLayer, orderInLayer,
            { rotation, pivotX: 0.5, pivotY: 0.5 }
        );

        // Left border (excluding corners)
        const sideBorderHeight = height - borderWidth * 2;
        collector.addRect(
            left + borderWidth / 2, (top + bottom) / 2,
            borderWidth, sideBorderHeight,
            borderColor, alpha, sortingLayer, orderInLayer,
            { rotation, pivotX: 0.5, pivotY: 0.5 }
        );

        // Right border (excluding corners)
        collector.addRect(
            right - borderWidth / 2, (top + bottom) / 2,
            borderWidth, sideBorderHeight,
            borderColor, alpha, sortingLayer, orderInLayer,
            { rotation, pivotX: 0.5, pivotY: 0.5 }
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
