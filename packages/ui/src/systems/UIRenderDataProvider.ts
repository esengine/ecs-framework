/**
 * UI Render Data Provider
 * UI 渲染数据提供者
 *
 * This class serves as a coordinator/facade for the UI render systems.
 * It provides the IRenderDataProvider interface for EngineRenderSystem.
 *
 * 此类作为 UI 渲染系统的协调器/外观。
 * 它为 EngineRenderSystem 提供 IRenderDataProvider 接口。
 *
 * The actual rendering logic is delegated to specialized render systems:
 * - UIRectRenderSystem: Basic rectangles and images
 * - UITextRenderSystem: Text rendering
 * - UIButtonRenderSystem: Button components
 * - UIProgressBarRenderSystem: Progress bars
 * - UISliderRenderSystem: Sliders
 * - UIScrollViewRenderSystem: Scroll views
 *
 * 实际的渲染逻辑委托给专门的渲染系统：
 * - UIRectRenderSystem: 基础矩形和图像
 * - UITextRenderSystem: 文本渲染
 * - UIButtonRenderSystem: 按钮组件
 * - UIProgressBarRenderSystem: 进度条
 * - UISliderRenderSystem: 滑块
 * - UIScrollViewRenderSystem: 滚动视图
 *
 * Render mode is controlled by EngineRenderSystem.previewMode:
 * - Editor mode (previewMode=false): UI renders in world space with sprites
 * - Preview mode (previewMode=true): UI renders as screen overlay
 *
 * 渲染模式由 EngineRenderSystem.previewMode 控制：
 * - 编辑器模式 (previewMode=false): UI 与精灵一起在世界空间渲染
 * - 预览模式 (previewMode=true): UI 作为屏幕叠加层渲染
 */

import { getUIRenderCollector, type ProviderRenderData } from './render/UIRenderCollector';

// Re-export ProviderRenderData for convenience
// 为方便起见重新导出 ProviderRenderData
export { type ProviderRenderData } from './render/UIRenderCollector';

/**
 * Interface for render data providers
 * 渲染数据提供者接口
 */
export interface IRenderDataProvider {
    getRenderData(): readonly ProviderRenderData[];
}

/**
 * Interface for UI render data providers
 * UI 渲染数据提供者接口
 */
export interface IUIRenderDataProvider extends IRenderDataProvider {
    /** Check if there is content to render | 检查是否有内容需要渲染 */
    hasContent(): boolean;
}

/**
 * UI Render Data Provider
 * UI 渲染数据提供者
 *
 * This is a facade that collects render data from the UIRenderCollector.
 * The actual rendering is done by the specialized render systems that run
 * before this provider's getRenderData() is called.
 *
 * 这是一个从 UIRenderCollector 收集渲染数据的外观。
 * 实际渲染由在调用此提供者的 getRenderData() 之前运行的专门渲染系统完成。
 *
 * Usage:
 * 1. Add all UI render systems to the scene (UIRectRenderSystem, UITextRenderSystem, etc.)
 * 2. Register this provider with EngineRenderSystem
 * 3. The render systems populate the collector, and this provider returns the data
 *
 * 用法：
 * 1. 将所有 UI 渲染系统添加到场景（UIRectRenderSystem、UITextRenderSystem 等）
 * 2. 将此提供者注册到 EngineRenderSystem
 * 3. 渲染系统填充收集器，此提供者返回数据
 */
export class UIRenderDataProvider implements IUIRenderDataProvider {
    /**
     * Get render data from the collector
     * 从收集器获取渲染数据
     */
    getRenderData(): readonly ProviderRenderData[] {
        const collector = getUIRenderCollector();
        return collector.getRenderData();
    }

    /**
     * Check if there is content to render
     * 检查是否有内容需要渲染
     */
    hasContent(): boolean {
        const collector = getUIRenderCollector();
        return !collector.isEmpty;
    }

    /**
     * Clear the collector (call at start of frame)
     * 清除收集器（在帧开始时调用）
     */
    clearCollector(): void {
        const collector = getUIRenderCollector();
        collector.clear();
    }

    /**
     * Dispose resources
     * 释放资源
     */
    dispose(): void {
        // Nothing to dispose currently
        // 当前没有需要释放的资源
    }
}
