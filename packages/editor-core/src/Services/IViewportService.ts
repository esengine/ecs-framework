/**
 * Viewport Service Interface
 * 视口服务接口
 *
 * Provides a unified interface for rendering viewports using the engine.
 * Used by editor panels that need to display game content (e.g., Tilemap Editor).
 *
 * 提供使用引擎渲染视口的统一接口。
 * 供需要显示游戏内容的编辑器面板使用（如 Tilemap 编辑器）。
 */

/**
 * Camera configuration for viewport
 * 视口相机配置
 */
export interface ViewportCameraConfig {
    x: number;
    y: number;
    zoom: number;
    rotation?: number;
}

/**
 * Viewport service interface
 * 视口服务接口
 */
export interface IViewportService {
    /**
     * Check if the renderer is initialized
     * 检查渲染器是否已初始化
     */
    isInitialized(): boolean;

    /**
     * Register a viewport with a canvas element
     * 注册一个视口和画布元素
     * @param viewportId - Unique identifier for the viewport | 视口的唯一标识符
     * @param canvasId - ID of the canvas element | 画布元素的 ID
     */
    registerViewport(viewportId: string, canvasId: string): void;

    /**
     * Unregister a viewport
     * 注销一个视口
     * @param viewportId - Viewport ID to unregister | 要注销的视口 ID
     */
    unregisterViewport(viewportId: string): void;

    /**
     * Set camera for a specific viewport
     * 设置特定视口的相机
     * @param viewportId - Viewport ID | 视口 ID
     * @param config - Camera configuration | 相机配置
     */
    setViewportCamera(viewportId: string, config: ViewportCameraConfig): void;

    /**
     * Get camera for a specific viewport
     * 获取特定视口的相机
     * @param viewportId - Viewport ID | 视口 ID
     * @returns Camera configuration or null | 相机配置或 null
     */
    getViewportCamera(viewportId: string): ViewportCameraConfig | null;

    /**
     * Set viewport configuration (grid, gizmos visibility)
     * 设置视口配置（网格、辅助线可见性）
     * @param viewportId - Viewport ID | 视口 ID
     * @param showGrid - Show grid | 显示网格
     * @param showGizmos - Show gizmos | 显示辅助线
     */
    setViewportConfig(viewportId: string, showGrid: boolean, showGizmos: boolean): void;

    /**
     * Resize a specific viewport
     * 调整特定视口的大小
     * @param viewportId - Viewport ID | 视口 ID
     * @param width - New width | 新宽度
     * @param height - New height | 新高度
     */
    resizeViewport(viewportId: string, width: number, height: number): void;

    /**
     * Render to a specific viewport
     * 渲染到特定视口
     * @param viewportId - Viewport ID | 视口 ID
     */
    renderToViewport(viewportId: string): void;

    /**
     * Load a texture and return its ID
     * 加载纹理并返回其 ID
     * @param path - Texture path | 纹理路径
     * @returns Promise resolving to texture ID | 解析为纹理 ID 的 Promise
     */
    loadTexture(path: string): Promise<number>;

    /**
     * Dispose resources (required by IService)
     * 释放资源（IService 要求）
     */
    dispose(): void;
}

/**
 * Service identifier for dependency injection
 * 依赖注入的服务标识符
 */
export const IViewportService_ID = Symbol.for('IViewportService');
