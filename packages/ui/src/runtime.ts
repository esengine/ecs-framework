/**
 * @esengine/ui Runtime Entry Point
 *
 * This entry point exports only runtime-related code without any editor dependencies.
 * Use this for standalone game runtime builds.
 *
 * 此入口点仅导出运行时相关代码，不包含任何编辑器依赖。
 * 用于独立游戏运行时构建。
 */

// Components - Core
export {
    UITransformComponent,
    AnchorPreset
} from './components/UITransformComponent';

export {
    UIRenderComponent,
    UIRenderType,
    type UIBorderStyle,
    type UIShadowStyle
} from './components/UIRenderComponent';

export {
    UIInteractableComponent,
    type UICursorType
} from './components/UIInteractableComponent';

export {
    UITextComponent,
    type UITextAlign,
    type UITextVerticalAlign,
    type UITextOverflow,
    type UIFontWeight
} from './components/UITextComponent';

export {
    UILayoutComponent,
    UILayoutType,
    UIJustifyContent,
    UIAlignItems,
    type UIPadding
} from './components/UILayoutComponent';

// Components - Widgets
export {
    UIButtonComponent,
    type UIButtonStyle,
    type UIButtonDisplayMode
} from './components/widgets/UIButtonComponent';

export {
    UIProgressBarComponent,
    UIProgressDirection,
    UIProgressFillMode
} from './components/widgets/UIProgressBarComponent';

export {
    UISliderComponent,
    UISliderOrientation
} from './components/widgets/UISliderComponent';

export {
    UIScrollViewComponent,
    UIScrollbarVisibility
} from './components/widgets/UIScrollViewComponent';

// Systems - Core
export { UILayoutSystem } from './systems/UILayoutSystem';
export { UIInputSystem, MouseButton, type UIInputEvent } from './systems/UIInputSystem';
export { UIAnimationSystem, Easing, type EasingFunction, type EasingName } from './systems/UIAnimationSystem';
export { UIRenderDataProvider, type IRenderDataProvider, type IUIRenderDataProvider } from './systems/UIRenderDataProvider';

// Systems - Render (ECS-compliant render systems)
export {
    // Collector
    UIRenderCollector,
    getUIRenderCollector,
    resetUIRenderCollector,
    invalidateUIRenderCaches,
    type UIRenderPrimitive,
    type ProviderRenderData,
    // Render systems
    UIRenderBeginSystem,
    UIRectRenderSystem,
    UITextRenderSystem,
    UIButtonRenderSystem,
    UIProgressBarRenderSystem,
    UISliderRenderSystem,
    UIScrollViewRenderSystem
} from './systems/render';

// Rendering
export { WebGLUIRenderer } from './rendering/WebGLUIRenderer';
export { TextRenderer, type TextMeasurement, type TextRenderOptions } from './rendering/TextRenderer';

// Builder API
export {
    UIBuilder,
    type UIBaseConfig,
    type UIButtonConfig,
    type UITextConfig,
    type UIImageConfig,
    type UIProgressBarConfig,
    type UISliderConfig,
    type UIPanelConfig,
    type UIScrollViewConfig
} from './UIBuilder';

// Runtime module
export { UIRuntimeModule } from './UIRuntimeModule';
