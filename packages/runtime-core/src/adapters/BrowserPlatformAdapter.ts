/**
 * Browser Platform Adapter
 * 浏览器平台适配器
 *
 * 用于独立浏览器运行时的平台适配器
 * Platform adapter for standalone browser runtime
 */

import type {
    IPlatformAdapter,
    IPathResolver,
    PlatformCapabilities,
    PlatformAdapterConfig
} from '../IPlatformAdapter';
import type { IPlatformInputSubsystem } from '@esengine/platform-common';

/**
 * 浏览器路径解析模式
 * Browser path resolve mode
 */
export type BrowserPathResolveMode = 'proxy' | 'direct';

/**
 * 浏览器路径解析器
 * Browser path resolver
 *
 * 支持两种模式：
 * - 'proxy': 使用 /asset?path=... 格式（编辑器 "Run in Browser" 使用）
 * - 'direct': 使用直接路径如 /assets/path.png（独立 Web 构建使用）
 *
 * Supports two modes:
 * - 'proxy': Uses /asset?path=... format (for editor "Run in Browser")
 * - 'direct': Uses direct paths like /assets/path.png (for standalone web builds)
 */
export class BrowserPathResolver implements IPathResolver {
    private _baseUrl: string;
    private _mode: BrowserPathResolveMode;

    constructor(baseUrl: string = '/assets', mode: BrowserPathResolveMode = 'proxy') {
        this._baseUrl = baseUrl;
        this._mode = mode;
    }

    resolve(path: string): string {
        // 如果已经是完整 URL，直接返回
        // If already a full URL, return as-is
        if (path.startsWith('http://') ||
            path.startsWith('https://') ||
            path.startsWith('data:') ||
            path.startsWith('blob:') ||
            path.startsWith('/asset?')) {
            return path;
        }

        if (this._mode === 'proxy') {
            // Proxy mode: use /asset?path=... format
            // 代理模式：使用 /asset?path=... 格式
            return `/asset?path=${encodeURIComponent(path)}`;
        }

        // Direct mode: use direct URL paths
        // 直接模式：使用直接 URL 路径

        // 规范化路径：移除 ./ 前缀，统一斜杠
        // Normalize path: remove ./ prefix, unify slashes
        let normalizedPath = path.replace(/\\/g, '/');

        // 移除开头的 ./
        if (normalizedPath.startsWith('./')) {
            normalizedPath = normalizedPath.substring(2);
        }

        // 移除开头的 /
        if (normalizedPath.startsWith('/')) {
            normalizedPath = normalizedPath.substring(1);
        }

        // 如果路径以 assets/ 开头，移除它（避免与 baseUrl 重复）
        // If path starts with assets/, remove it (avoid duplication with baseUrl)
        if (normalizedPath.startsWith('assets/')) {
            normalizedPath = normalizedPath.substring(7);
        }

        // 确保 baseUrl 没有尾部斜杠
        // Ensure baseUrl has no trailing slash
        const base = this._baseUrl.replace(/\/+$/, '');

        return `${base}/${normalizedPath}`;
    }

    /**
     * 更新基础 URL
     * Update base URL
     */
    setBaseUrl(baseUrl: string): void {
        this._baseUrl = baseUrl;
    }

    /**
     * 设置解析模式
     * Set resolve mode
     */
    setMode(mode: BrowserPathResolveMode): void {
        this._mode = mode;
    }
}

/**
 * 浏览器平台适配器配置
 * Browser platform adapter configuration
 */
export interface BrowserPlatformConfig {
    /** WASM 模块（预加载的）| Pre-loaded WASM module */
    wasmModule?: any;
    /** WASM 模块加载器（异步加载）| Async WASM module loader */
    wasmModuleLoader?: () => Promise<any>;
    /** 资产基础 URL | Asset base URL */
    assetBaseUrl?: string;
    /**
     * 路径解析模式 | Path resolve mode
     * - 'proxy': 使用 /asset?path=... 格式（默认，编辑器使用）
     * - 'direct': 使用直接路径（独立 Web 构建使用）
     */
    pathResolveMode?: BrowserPathResolveMode;
    /**
     * 输入子系统工厂函数
     * Input subsystem factory function
     */
    inputSubsystemFactory?: () => IPlatformInputSubsystem;
}

/**
 * 浏览器平台适配器
 * Browser platform adapter
 */
export class BrowserPlatformAdapter implements IPlatformAdapter {
    readonly name = 'browser';

    readonly capabilities: PlatformCapabilities = {
        fileSystem: false,
        hotReload: false,
        gizmos: false,
        grid: false,
        sceneEditing: false
    };

    private _pathResolver: BrowserPathResolver;
    private _canvas: HTMLCanvasElement | null = null;
    private _config: BrowserPlatformConfig;
    private _viewportSize = { width: 0, height: 0 };
    private _inputSubsystem: IPlatformInputSubsystem | null = null;

    constructor(config: BrowserPlatformConfig = {}) {
        this._config = config;
        this._pathResolver = new BrowserPathResolver(
            config.assetBaseUrl || '/assets',
            config.pathResolveMode || 'proxy'
        );
    }

    get pathResolver(): IPathResolver {
        return this._pathResolver;
    }

    async initialize(config: PlatformAdapterConfig): Promise<void> {
        // 获取 Canvas
        this._canvas = document.getElementById(config.canvasId) as HTMLCanvasElement;
        if (!this._canvas) {
            throw new Error(`Canvas not found: ${config.canvasId}`);
        }

        // 设置尺寸
        const width = config.width || window.innerWidth;
        const height = config.height || window.innerHeight;
        this._canvas.width = width;
        this._canvas.height = height;
        this._viewportSize = { width, height };

        if (this._config.inputSubsystemFactory) {
            this._inputSubsystem = this._config.inputSubsystemFactory();
        }
    }

    async getWasmModule(): Promise<any> {
        // 如果已提供模块，直接返回
        if (this._config.wasmModule) {
            return this._config.wasmModule;
        }

        // 如果提供了加载器，使用加载器
        if (this._config.wasmModuleLoader) {
            return this._config.wasmModuleLoader();
        }

        // 默认：尝试动态导入
        throw new Error('No WASM module or loader provided');
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
        return false;
    }

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
