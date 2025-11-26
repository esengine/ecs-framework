import { EntitySystem, Matcher, Entity, Time, ECSSystem } from '@esengine/ecs-framework';
import { UIProgressBarComponent } from '../components/widgets/UIProgressBarComponent';
import { UISliderComponent } from '../components/widgets/UISliderComponent';
import { UIButtonComponent } from '../components/widgets/UIButtonComponent';

/**
 * 缓动函数类型
 * Easing function type
 */
export type EasingFunction = (t: number) => number;

/**
 * 预定义缓动函数
 * Predefined easing functions
 */
export const Easing = {
    linear: (t: number) => t,

    // Quad
    easeInQuad: (t: number) => t * t,
    easeOutQuad: (t: number) => t * (2 - t),
    easeInOutQuad: (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,

    // Cubic
    easeInCubic: (t: number) => t * t * t,
    easeOutCubic: (t: number) => (--t) * t * t + 1,
    easeInOutCubic: (t: number) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,

    // Quart
    easeInQuart: (t: number) => t * t * t * t,
    easeOutQuart: (t: number) => 1 - (--t) * t * t * t,
    easeInOutQuart: (t: number) => t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t,

    // Quint
    easeInQuint: (t: number) => t * t * t * t * t,
    easeOutQuint: (t: number) => 1 + (--t) * t * t * t * t,
    easeInOutQuint: (t: number) => t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * (--t) * t * t * t * t,

    // Sine
    easeInSine: (t: number) => 1 - Math.cos(t * Math.PI / 2),
    easeOutSine: (t: number) => Math.sin(t * Math.PI / 2),
    easeInOutSine: (t: number) => -(Math.cos(Math.PI * t) - 1) / 2,

    // Expo
    easeInExpo: (t: number) => t === 0 ? 0 : Math.pow(2, 10 * (t - 1)),
    easeOutExpo: (t: number) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
    easeInOutExpo: (t: number) => {
        if (t === 0) return 0;
        if (t === 1) return 1;
        if (t < 0.5) return Math.pow(2, 20 * t - 10) / 2;
        return (2 - Math.pow(2, -20 * t + 10)) / 2;
    },

    // Circ
    easeInCirc: (t: number) => 1 - Math.sqrt(1 - t * t),
    easeOutCirc: (t: number) => Math.sqrt(1 - (--t) * t),
    easeInOutCirc: (t: number) => t < 0.5
        ? (1 - Math.sqrt(1 - 4 * t * t)) / 2
        : (Math.sqrt(1 - Math.pow(-2 * t + 2, 2)) + 1) / 2,

    // Back
    easeInBack: (t: number) => {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return c3 * t * t * t - c1 * t * t;
    },
    easeOutBack: (t: number) => {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    },
    easeInOutBack: (t: number) => {
        const c1 = 1.70158;
        const c2 = c1 * 1.525;
        return t < 0.5
            ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
            : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
    },

    // Elastic
    easeInElastic: (t: number) => {
        if (t === 0) return 0;
        if (t === 1) return 1;
        return -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * ((2 * Math.PI) / 3));
    },
    easeOutElastic: (t: number) => {
        if (t === 0) return 0;
        if (t === 1) return 1;
        return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1;
    },
    easeInOutElastic: (t: number) => {
        if (t === 0) return 0;
        if (t === 1) return 1;
        const c5 = (2 * Math.PI) / 4.5;
        return t < 0.5
            ? -(Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * c5)) / 2
            : (Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * c5)) / 2 + 1;
    },

    // Bounce
    easeInBounce: (t: number) => 1 - Easing.easeOutBounce(1 - t),
    easeOutBounce: (t: number) => {
        const n1 = 7.5625;
        const d1 = 2.75;
        if (t < 1 / d1) {
            return n1 * t * t;
        } else if (t < 2 / d1) {
            return n1 * (t -= 1.5 / d1) * t + 0.75;
        } else if (t < 2.5 / d1) {
            return n1 * (t -= 2.25 / d1) * t + 0.9375;
        } else {
            return n1 * (t -= 2.625 / d1) * t + 0.984375;
        }
    },
    easeInOutBounce: (t: number) => t < 0.5
        ? (1 - Easing.easeOutBounce(1 - 2 * t)) / 2
        : (1 + Easing.easeOutBounce(2 * t - 1)) / 2,

    // 简化别名
    easeIn: (t: number) => t * t,
    easeOut: (t: number) => t * (2 - t),
    easeInOut: (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
};

/**
 * 缓动函数名称映射
 * Easing function name mapping
 */
export type EasingName = keyof typeof Easing;

/**
 * UI 动画系统
 * UI Animation System - Handles value interpolation and animations
 */
@ECSSystem('UIAnimation')
export class UIAnimationSystem extends EntitySystem {
    constructor() {
        // 匹配任何可能有动画的组件
        super(Matcher.empty());
    }

    /**
     * 获取缓动函数
     * Get easing function by name
     */
    public getEasingFunction(name: string): EasingFunction {
        return (Easing as Record<string, EasingFunction>)[name] ?? Easing.linear;
    }

    protected process(entities: readonly Entity[]): void {
        const dt = Time.deltaTime;

        for (const entity of entities) {
            // 处理进度条动画
            this.updateProgressBar(entity, dt);

            // 处理滑块动画
            this.updateSlider(entity, dt);

            // 处理按钮颜色动画
            this.updateButtonColor(entity, dt);
        }
    }

    /**
     * 更新进度条动画
     * Update progress bar animation
     */
    private updateProgressBar(entity: Entity, dt: number): void {
        const progress = entity.getComponent(UIProgressBarComponent);
        if (!progress) return;

        // 如果目标值和显示值不同，进行插值
        if (progress.displayValue !== progress.targetValue) {
            const easingFn = this.getEasingFunction(progress.easing);
            const range = progress.maxValue - progress.minValue;
            const speed = range / progress.transitionDuration;

            const diff = progress.targetValue - progress.displayValue;
            const direction = Math.sign(diff);
            const step = Math.min(Math.abs(diff), speed * dt);

            progress.displayValue += direction * step;

            // 接近目标时直接设置
            if (Math.abs(progress.displayValue - progress.targetValue) < 0.01) {
                progress.displayValue = progress.targetValue;
            }

            progress.value = progress.displayValue;
        }
    }

    /**
     * 更新滑块动画
     * Update slider animation
     */
    private updateSlider(entity: Entity, dt: number): void {
        const slider = entity.getComponent(UISliderComponent);
        if (!slider) return;

        // 如果正在拖拽，直接设置（不做动画）
        if (slider.dragging) {
            slider.displayValue = slider.targetValue;
            slider.value = slider.targetValue;
            return;
        }

        // 平滑插值
        if (slider.displayValue !== slider.targetValue) {
            const range = slider.maxValue - slider.minValue;
            const speed = range / slider.transitionDuration;

            const diff = slider.targetValue - slider.displayValue;
            const direction = Math.sign(diff);
            const step = Math.min(Math.abs(diff), speed * dt);

            slider.displayValue += direction * step;

            if (Math.abs(slider.displayValue - slider.targetValue) < 0.01) {
                slider.displayValue = slider.targetValue;
            }

            slider.value = slider.displayValue;
        }
    }

    /**
     * 更新按钮颜色动画
     * Update button color animation
     */
    private updateButtonColor(entity: Entity, dt: number): void {
        const button = entity.getComponent(UIButtonComponent);
        if (!button) return;

        if (button.currentColor !== button.targetColor) {
            // 颜色插值
            button.currentColor = this.lerpColor(
                button.currentColor,
                button.targetColor,
                Math.min(1, dt / button.transitionDuration)
            );
        }
    }

    /**
     * 颜色线性插值
     * Linear interpolate between two colors
     */
    private lerpColor(from: number, to: number, t: number): number {
        const fromR = (from >> 16) & 0xFF;
        const fromG = (from >> 8) & 0xFF;
        const fromB = from & 0xFF;

        const toR = (to >> 16) & 0xFF;
        const toG = (to >> 8) & 0xFF;
        const toB = to & 0xFF;

        const r = Math.round(fromR + (toR - fromR) * t);
        const g = Math.round(fromG + (toG - fromG) * t);
        const b = Math.round(fromB + (toB - fromB) * t);

        return (r << 16) | (g << 8) | b;
    }

    /**
     * 数值线性插值
     * Linear interpolate between two values
     */
    public lerp(from: number, to: number, t: number): number {
        return from + (to - from) * t;
    }

    /**
     * 应用缓动的插值
     * Interpolate with easing
     */
    public ease(from: number, to: number, t: number, easing: EasingName = 'linear'): number {
        const easingFn = this.getEasingFunction(easing);
        return this.lerp(from, to, easingFn(t));
    }
}
