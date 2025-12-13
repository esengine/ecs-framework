/**
 * Editor Platform Adapter
 * 编辑器平台适配器
 *
 * 用于 Tauri 编辑器内嵌预览的平台适配器
 * Platform adapter for Tauri editor embedded preview
 */

import type {
    IPlatformAdapter,
    IPathResolver,
    PlatformCapabilities,
    PlatformAdapterConfig
} from '../IPlatformAdapter';
import type { IPlatformInputSubsystem } from '@esengine/platform-common';

/**
 * 编辑器路径解析器
 * Editor path resolver
 *
 * 使用 Tauri 的 convertFileSrc 转换本地文件路径
 * Uses Tauri's convertFileSrc to convert local file paths
 */
export class EditorPathResolver implements IPathResolver {
    private _pathTransformer: (path: string) => string;

    constructor(pathTransformer: (path: string) => string) {
        this._pathTransformer = pathTransformer;
    }

    resolve(path: string): string {
        // 如果已经是 URL，直接返回
        if (path.startsWith('http://') ||
            path.startsWith('https://') ||
            path.startsWith('data:') ||
            path.startsWith('blob:') ||
            path.startsWith('asset://')) {
            return path;
        }

        // 使用 Tauri 路径转换器
        return this._pathTransformer(path);
    }

    /**
     * 更新路径转换器
     */
    setPathTransformer(transformer: (path: string) => string): void {
        this._pathTransformer = transformer;
    }
}

/**
 * 编辑器平台适配器配置
 */
export interface EditorPlatformConfig {
    /** WASM 模块（预加载的）*/
    wasmModule: any;
    /** 路径转换函数（使用 Tauri 的 convertFileSrc）*/
    pathTransformer: (path: string) => string;
    /** Gizmo 数据提供者 */
    gizmoDataProvider?: (component: any, entity: any, isSelected: boolean) => any;
    /** Gizmo 检查函数 */
    hasGizmoProvider?: (component: any) => boolean;
    /**
     * 输入子系统工厂函数
     * Input subsystem factory function
     *
     * 用于在 Play 模式下接收游戏输入
     * Used to receive game input in Play mode
     */
    inputSubsystemFactory?: () => IPlatformInputSubsystem;
}

/**
 * 编辑器平台适配器
 * Editor platform adapter
 */
export class EditorPlatformAdapter implements IPlatformAdapter {
    readonly name = 'editor';

    readonly capabilities: PlatformCapabilities = {
        fileSystem: true,
        hotReload: true,
        gizmos: true,
        grid: true,
        sceneEditing: true
    };

    private _pathResolver: EditorPathResolver;
    private _canvas: HTMLCanvasElement | null = null;
    private _config: EditorPlatformConfig;
    private _viewportSize = { width: 0, height: 0 };
    private _showGrid = true;
    private _showGizmos = true;
    private _inputSubsystem: IPlatformInputSubsystem | null = null;

    constructor(config: EditorPlatformConfig) {
        this._config = config;
        this._pathResolver = new EditorPathResolver(config.pathTransformer);
    }

    get pathResolver(): IPathResolver {
        return this._pathResolver;
    }

    /**
     * 获取 Gizmo 数据提供者
     */
    get gizmoDataProvider() {
        return this._config.gizmoDataProvider;
    }

    /**
     * 获取 Gizmo 检查函数
     */
    get hasGizmoProvider() {
        return this._config.hasGizmoProvider;
    }

    async initialize(config: PlatformAdapterConfig): Promise<void> {
        // 获取 Canvas
        this._canvas = document.getElementById(config.canvasId) as HTMLCanvasElement;
        if (!this._canvas) {
            throw new Error(`Canvas not found: ${config.canvasId}`);
        }

        // 处理 DPR 缩放
        const dpr = window.devicePixelRatio || 1;
        const container = this._canvas.parentElement;

        if (container) {
            const rect = container.getBoundingClientRect();
            const width = config.width || Math.floor(rect.width * dpr);
            const height = config.height || Math.floor(rect.height * dpr);

            this._canvas.width = width;
            this._canvas.height = height;
            this._canvas.style.width = `${rect.width}px`;
            this._canvas.style.height = `${rect.height}px`;

            this._viewportSize = { width, height };
        } else {
            const width = config.width || window.innerWidth;
            const height = config.height || window.innerHeight;
            this._canvas.width = width;
            this._canvas.height = height;
            this._viewportSize = { width, height };
        }

        // 创建输入子系统（如果提供了工厂函数）
        // Create input subsystem (if factory provided)
        if (this._config.inputSubsystemFactory) {
            this._inputSubsystem = this._config.inputSubsystemFactory();
        }
    }

    async getWasmModule(): Promise<any> {
        return this._config.wasmModule;
    }

    getCanvas(): HTMLCanvasElement | null {
        return this._canvas;
    }

    resize(width: number, height: number): void {
        if (this._canvas) {
            this._canvas.width = width;
            this._canvas.height = height;
        }
        this._viewportSize = { width, height };
    }

    getViewportSize(): { width: number; height: number } {
        return { ...this._viewportSize };
    }

    isEditorMode(): boolean {
        return true;
    }

    setShowGrid(show: boolean): void {
        this._showGrid = show;
    }

    getShowGrid(): boolean {
        return this._showGrid;
    }

    setShowGizmos(show: boolean): void {
        this._showGizmos = show;
    }

    getShowGizmos(): boolean {
        return this._showGizmos;
    }

    /**
     * 获取输入子系统
     * Get input subsystem
     *
     * 用于 InputSystem 接收游戏输入事件
     * Used by InputSystem to receive game input events
     */
    getInputSubsystem(): IPlatformInputSubsystem | null {
        return this._inputSubsystem;
    }

    dispose(): void {
        if (this._inputSubsystem) {
            this._inputSubsystem.dispose?.();
            this._inputSubsystem = null;
        }
        this._canvas = null;
    }
}
