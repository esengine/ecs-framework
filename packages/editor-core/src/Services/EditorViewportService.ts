/**
 * Editor Viewport Service
 * 编辑器视口服务
 *
 * Manages editor viewports with preview scene support and overlay rendering.
 * 管理带有预览场景支持和覆盖层渲染的编辑器视口。
 */

import type { IViewportService, ViewportCameraConfig } from './IViewportService';
import type { IPreviewScene } from './PreviewSceneService';
import { PreviewSceneService } from './PreviewSceneService';
import type { IViewportOverlay, OverlayRenderContext } from '../Rendering/IViewportOverlay';

/**
 * Configuration for an editor viewport
 * 编辑器视口配置
 */
export interface EditorViewportConfig {
    /** Unique viewport identifier | 唯一视口标识符 */
    id: string;
    /** Canvas element ID | 画布元素 ID */
    canvasId: string;
    /** Preview scene ID (null = main scene) | 预览场景 ID（null = 主场景） */
    previewSceneId?: string;
    /** Whether to show grid | 是否显示网格 */
    showGrid?: boolean;
    /** Whether to show gizmos | 是否显示辅助线 */
    showGizmos?: boolean;
    /** Initial camera configuration | 初始相机配置 */
    camera?: ViewportCameraConfig;
    /** Clear color | 清除颜色 */
    clearColor?: { r: number; g: number; b: number; a: number };
}

/**
 * Viewport state
 * 视口状态
 */
interface ViewportState {
    config: EditorViewportConfig;
    camera: ViewportCameraConfig;
    overlays: Map<string, IViewportOverlay>;
    lastUpdateTime: number;
}

/**
 * Gizmo renderer interface (provided by engine)
 * 辅助线渲染器接口（由引擎提供）
 */
export interface IGizmoRenderer {
    addLine(x1: number, y1: number, x2: number, y2: number, color: number, thickness?: number): void;
    addRect(x: number, y: number, width: number, height: number, color: number, thickness?: number): void;
    addFilledRect(x: number, y: number, width: number, height: number, color: number): void;
    addCircle(x: number, y: number, radius: number, color: number, thickness?: number): void;
    addFilledCircle(x: number, y: number, radius: number, color: number): void;
    addText?(text: string, x: number, y: number, color: number, fontSize?: number): void;
    clear(): void;
}

/**
 * Editor Viewport Service Interface
 * 编辑器视口服务接口
 */
export interface IEditorViewportService {
    /**
     * Set the viewport service (from EngineService)
     * 设置视口服务（来自 EngineService）
     */
    setViewportService(service: IViewportService): void;

    /**
     * Set the gizmo renderer (from EngineService)
     * 设置辅助线渲染器（来自 EngineService）
     */
    setGizmoRenderer(renderer: IGizmoRenderer): void;

    /**
     * Register a new viewport
     * 注册新视口
     */
    registerViewport(config: EditorViewportConfig): void;

    /**
     * Unregister a viewport
     * 注销视口
     */
    unregisterViewport(id: string): void;

    /**
     * Get viewport configuration
     * 获取视口配置
     */
    getViewportConfig(id: string): EditorViewportConfig | null;

    /**
     * Set viewport camera
     * 设置视口相机
     */
    setViewportCamera(id: string, camera: ViewportCameraConfig): void;

    /**
     * Get viewport camera
     * 获取视口相机
     */
    getViewportCamera(id: string): ViewportCameraConfig | null;

    /**
     * Add overlay to a viewport
     * 向视口添加覆盖层
     */
    addOverlay(viewportId: string, overlay: IViewportOverlay): void;

    /**
     * Remove overlay from a viewport
     * 从视口移除覆盖层
     */
    removeOverlay(viewportId: string, overlayId: string): void;

    /**
     * Get overlay by ID
     * 通过 ID 获取覆盖层
     */
    getOverlay<T extends IViewportOverlay>(viewportId: string, overlayId: string): T | null;

    /**
     * Get all overlays for a viewport
     * 获取视口的所有覆盖层
     */
    getOverlays(viewportId: string): IViewportOverlay[];

    /**
     * Render a specific viewport
     * 渲染特定视口
     */
    renderViewport(id: string): void;

    /**
     * Update viewport (process preview scene systems and overlays)
     * 更新视口（处理预览场景系统和覆盖层）
     */
    updateViewport(id: string, deltaTime: number): void;

    /**
     * Resize a viewport
     * 调整视口大小
     */
    resizeViewport(id: string, width: number, height: number): void;

    /**
     * Check if a viewport exists
     * 检查视口是否存在
     */
    hasViewport(id: string): boolean;

    /**
     * Get all viewport IDs
     * 获取所有视口 ID
     */
    getViewportIds(): string[];

    /**
     * Dispose the service
     * 释放服务
     */
    dispose(): void;
}

/**
 * Editor Viewport Service Implementation
 * 编辑器视口服务实现
 */
export class EditorViewportService implements IEditorViewportService {
    private static _instance: EditorViewportService | null = null;

    private _viewportService: IViewportService | null = null;
    private _gizmoRenderer: IGizmoRenderer | null = null;
    private _viewports: Map<string, ViewportState> = new Map();
    private _previewSceneService = PreviewSceneService.getInstance();
    private _viewportDimensions: Map<string, { width: number; height: number }> = new Map();

    private constructor() {}

    /**
     * Get singleton instance
     * 获取单例实例
     */
    static getInstance(): EditorViewportService {
        if (!EditorViewportService._instance) {
            EditorViewportService._instance = new EditorViewportService();
        }
        return EditorViewportService._instance;
    }

    setViewportService(service: IViewportService): void {
        this._viewportService = service;
    }

    setGizmoRenderer(renderer: IGizmoRenderer): void {
        this._gizmoRenderer = renderer;
    }

    registerViewport(config: EditorViewportConfig): void {
        if (this._viewports.has(config.id)) {
            console.warn(`[EditorViewportService] Viewport "${config.id}" already registered`);
            return;
        }

        // Register with viewport service
        if (this._viewportService) {
            this._viewportService.registerViewport(config.id, config.canvasId);
            this._viewportService.setViewportConfig(config.id, config.showGrid ?? false, config.showGizmos ?? false);

            if (config.camera) {
                this._viewportService.setViewportCamera(config.id, config.camera);
            }
        }

        // Create viewport state
        const state: ViewportState = {
            config,
            camera: config.camera ?? { x: 0, y: 0, zoom: 1 },
            overlays: new Map(),
            lastUpdateTime: performance.now()
        };

        this._viewports.set(config.id, state);
    }

    unregisterViewport(id: string): void {
        const state = this._viewports.get(id);
        if (!state) return;

        // Dispose overlays
        for (const overlay of state.overlays.values()) {
            overlay.dispose?.();
        }

        // Unregister from viewport service
        if (this._viewportService) {
            this._viewportService.unregisterViewport(id);
        }

        this._viewports.delete(id);
        this._viewportDimensions.delete(id);
    }

    getViewportConfig(id: string): EditorViewportConfig | null {
        return this._viewports.get(id)?.config ?? null;
    }

    setViewportCamera(id: string, camera: ViewportCameraConfig): void {
        const state = this._viewports.get(id);
        if (!state) return;

        state.camera = camera;

        if (this._viewportService) {
            this._viewportService.setViewportCamera(id, camera);
        }
    }

    getViewportCamera(id: string): ViewportCameraConfig | null {
        return this._viewports.get(id)?.camera ?? null;
    }

    addOverlay(viewportId: string, overlay: IViewportOverlay): void {
        const state = this._viewports.get(viewportId);
        if (!state) {
            console.warn(`[EditorViewportService] Viewport "${viewportId}" not found`);
            return;
        }

        if (state.overlays.has(overlay.id)) {
            console.warn(`[EditorViewportService] Overlay "${overlay.id}" already exists in viewport "${viewportId}"`);
            return;
        }

        state.overlays.set(overlay.id, overlay);
    }

    removeOverlay(viewportId: string, overlayId: string): void {
        const state = this._viewports.get(viewportId);
        if (!state) return;

        const overlay = state.overlays.get(overlayId);
        if (overlay) {
            overlay.dispose?.();
            state.overlays.delete(overlayId);
        }
    }

    getOverlay<T extends IViewportOverlay>(viewportId: string, overlayId: string): T | null {
        const state = this._viewports.get(viewportId);
        if (!state) return null;

        return (state.overlays.get(overlayId) as T) ?? null;
    }

    getOverlays(viewportId: string): IViewportOverlay[] {
        const state = this._viewports.get(viewportId);
        if (!state) return [];

        // Return overlays sorted by priority
        return Array.from(state.overlays.values()).sort((a, b) => a.priority - b.priority);
    }

    updateViewport(id: string, deltaTime: number): void {
        const state = this._viewports.get(id);
        if (!state) return;

        // Update preview scene if configured
        if (state.config.previewSceneId) {
            const previewScene = this._previewSceneService.getScene(state.config.previewSceneId);
            if (previewScene) {
                previewScene.update(deltaTime);
            }
        }

        // Update overlays
        for (const overlay of state.overlays.values()) {
            if (overlay.visible && overlay.update) {
                overlay.update(deltaTime);
            }
        }

        state.lastUpdateTime = performance.now();
    }

    renderViewport(id: string): void {
        const state = this._viewports.get(id);
        if (!state || !this._viewportService) return;

        const dimensions = this._viewportDimensions.get(id) ?? { width: 800, height: 600 };
        const dpr = window.devicePixelRatio || 1;

        // Render overlays if gizmo renderer is available
        if (this._gizmoRenderer) {
            const context: OverlayRenderContext = {
                camera: state.camera,
                viewport: dimensions,
                dpr,
                deltaTime: (performance.now() - state.lastUpdateTime) / 1000,
                addLine: (x1, y1, x2, y2, color, thickness) =>
                    this._gizmoRenderer!.addLine(x1, y1, x2, y2, color, thickness),
                addRect: (x, y, w, h, color, thickness) =>
                    this._gizmoRenderer!.addRect(x, y, w, h, color, thickness),
                addFilledRect: (x, y, w, h, color) =>
                    this._gizmoRenderer!.addFilledRect(x, y, w, h, color),
                addCircle: (x, y, r, color, thickness) =>
                    this._gizmoRenderer!.addCircle(x, y, r, color, thickness),
                addFilledCircle: (x, y, r, color) =>
                    this._gizmoRenderer!.addFilledCircle(x, y, r, color),
                addText: this._gizmoRenderer.addText
                    ? (text, x, y, color, fontSize) =>
                          this._gizmoRenderer!.addText!(text, x, y, color, fontSize)
                    : undefined
            };

            // Render visible overlays in priority order
            const overlays = this.getOverlays(id);
            for (const overlay of overlays) {
                if (overlay.visible) {
                    overlay.render(context);
                }
            }
        }

        // Render through viewport service
        this._viewportService.renderToViewport(id);
    }

    resizeViewport(id: string, width: number, height: number): void {
        this._viewportDimensions.set(id, { width, height });

        if (this._viewportService) {
            this._viewportService.resizeViewport(id, width, height);
        }
    }

    hasViewport(id: string): boolean {
        return this._viewports.has(id);
    }

    getViewportIds(): string[] {
        return Array.from(this._viewports.keys());
    }

    dispose(): void {
        for (const id of this._viewports.keys()) {
            this.unregisterViewport(id);
        }
        this._viewportService = null;
        this._gizmoRenderer = null;
    }
}

/**
 * Service identifier for dependency injection
 * 依赖注入的服务标识符
 */
export const IEditorViewportServiceIdentifier = Symbol.for('IEditorViewportService');
