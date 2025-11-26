/**
 * @esengine/ui - ECS-based UI System
 *
 * 基于 ECS 架构的 UI 系统，支持 WebGL 渲染
 * ECS-based UI system with WebGL rendering support
 *
 * @example
 * ```typescript
 * import { UIBuilder, UILayoutSystem, UIInputSystem, UIAnimationSystem } from '@esengine/ui';
 *
 * // 创建 UI Scene
 * const uiScene = world.createScene('ui');
 *
 * // 添加 UI 系统
 * uiScene.addSystem(new UILayoutSystem());
 * uiScene.addSystem(new UIInputSystem());
 * uiScene.addSystem(new UIAnimationSystem());
 *
 * // 使用 UIBuilder 创建元素
 * const ui = new UIBuilder(uiScene);
 *
 * const button = ui.button({
 *     x: 100, y: 100,
 *     width: 120, height: 40,
 *     label: 'Click Me',
 *     onClick: () => console.log('Clicked!')
 * });
 *
 * const progressBar = ui.progressBar({
 *     x: 100, y: 160,
 *     width: 200, height: 20,
 *     value: 75,
 *     maxValue: 100
 * });
 * ```
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

// Systems
export { UILayoutSystem } from './systems/UILayoutSystem';
export { UIInputSystem, MouseButton, type UIInputEvent } from './systems/UIInputSystem';
export { UIAnimationSystem, Easing, type EasingFunction, type EasingName } from './systems/UIAnimationSystem';
export { UIRenderDataProvider, type UIRenderData } from './systems/UIRenderDataProvider';

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
