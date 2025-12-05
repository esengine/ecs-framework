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
 * 浏览器路径解析器
 * Browser path resolver
 */
export class BrowserPathResolver implements IPathResolver {
    private _baseUrl: string;

    constructor(baseUrl: string = '') {
        this._baseUrl = baseUrl;
    }

    resolve(path: string): string {
        // 如果已经是完整 URL，直接返回
        if (path.startsWith('http://') ||
            path.startsWith('https://') ||
            path.startsWith('data:') ||
            path.startsWith('blob:') ||
            path.startsWith('/asset?')) {
            return path;
        }

        // 相对路径，添加资产请求前缀
        return `/asset?path=${encodeURIComponent(path)}`;
    }

    /**
     * 更新基础 URL
     */
    setBaseUrl(baseUrl: string): void {
        this._baseUrl = baseUrl;
    }
}

/**
 * 浏览器平台适配器配置
 */
export interface BrowserPlatformConfig {
    /** WASM 模块（预加载的）*/
    wasmModule?: any;
    /** WASM 模块加载器（异步加载）*/
    wasmModuleLoader?: () => Promise<any>;
    /** 资产基础 URL */
    assetBaseUrl?: string;
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
        this._pathResolver = new BrowserPathResolver(config.assetBaseUrl || '');
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
