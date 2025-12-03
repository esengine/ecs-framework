/**
 * Viewport Service Implementation
 * 视口服务实现
 *
 * Implements IViewportService using EngineService.
 * 使用 EngineService 实现 IViewportService。
 */

import type { IViewportService, ViewportCameraConfig } from '@esengine/editor-core';
import { EngineService } from './EngineService';

/**
 * ViewportService - Wraps EngineService for IViewportService interface
 * ViewportService - 为 IViewportService 接口包装 EngineService
 */
export class ViewportService implements IViewportService {
    private static _instance: ViewportService | null = null;
    private _engineService: EngineService;

    private constructor() {
        this._engineService = EngineService.getInstance();
    }

    /**
     * Get singleton instance
     * 获取单例实例
     */
    static getInstance(): ViewportService {
        if (!ViewportService._instance) {
            ViewportService._instance = new ViewportService();
        }
        return ViewportService._instance;
    }

    /**
     * Check if the service is initialized
     * 检查服务是否已初始化
     */
    isInitialized(): boolean {
        return this._engineService.isInitialized();
    }

    /**
     * Register a viewport with a canvas element
     * 注册一个视口和画布元素
     */
    registerViewport(viewportId: string, canvasId: string): void {
        this._engineService.registerViewport(viewportId, canvasId);
    }

    /**
     * Unregister a viewport
     * 注销一个视口
     */
    unregisterViewport(viewportId: string): void {
        this._engineService.unregisterViewport(viewportId);
    }

    /**
     * Set camera for a specific viewport
     * 设置特定视口的相机
     */
    setViewportCamera(viewportId: string, config: ViewportCameraConfig): void {
        this._engineService.setViewportCamera(viewportId, {
            x: config.x,
            y: config.y,
            zoom: config.zoom,
            rotation: config.rotation ?? 0
        });
    }

    /**
     * Get camera for a specific viewport
     * 获取特定视口的相机
     */
    getViewportCamera(viewportId: string): ViewportCameraConfig | null {
        return this._engineService.getViewportCamera(viewportId);
    }

    /**
     * Set viewport configuration (grid, gizmos visibility)
     * 设置视口配置（网格、辅助线可见性）
     */
    setViewportConfig(viewportId: string, showGrid: boolean, showGizmos: boolean): void {
        this._engineService.setViewportConfig(viewportId, showGrid, showGizmos);
    }

    /**
     * Resize a specific viewport
     * 调整特定视口的大小
     */
    resizeViewport(viewportId: string, width: number, height: number): void {
        this._engineService.resizeViewport(viewportId, width, height);
    }

    /**
     * Render to a specific viewport
     * 渲染到特定视口
     */
    renderToViewport(viewportId: string): void {
        this._engineService.renderToViewport(viewportId);
    }

    /**
     * Load a texture and return its ID
     * 加载纹理并返回其 ID
     */
    async loadTexture(path: string): Promise<number> {
        return await this._engineService.loadTextureAsset(path);
    }

    /**
     * Dispose resources
     * 释放资源
     */
    dispose(): void {
        // ViewportService is a lightweight wrapper, no resources to dispose
        // The underlying EngineService manages its own lifecycle
    }
}
