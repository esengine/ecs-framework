/**
 * UI Render Systems
 * UI 渲染系统
 *
 * This module contains all UI render systems that follow ECS architecture.
 * Each system is responsible for rendering a specific type of UI component.
 *
 * 此模块包含所有遵循 ECS 架构的 UI 渲染系统。
 * 每个系统负责渲染特定类型的 UI 组件。
 */

// Core render infrastructure
// 核心渲染基础设施
export {
    UIRenderCollector,
    getUIRenderCollector,
    resetUIRenderCollector,
    registerCacheInvalidationCallback,
    unregisterCacheInvalidationCallback,
    invalidateUIRenderCaches,
    type UIRenderPrimitive,
    type ProviderRenderData
} from './UIRenderCollector';

// Render systems
// 渲染系统
export { UIRenderBeginSystem } from './UIRenderBeginSystem';
export { UIRectRenderSystem } from './UIRectRenderSystem';
export { UITextRenderSystem } from './UITextRenderSystem';
export { UIButtonRenderSystem } from './UIButtonRenderSystem';
export { UIProgressBarRenderSystem } from './UIProgressBarRenderSystem';
export { UISliderRenderSystem } from './UISliderRenderSystem';
export { UIScrollViewRenderSystem } from './UIScrollViewRenderSystem';
