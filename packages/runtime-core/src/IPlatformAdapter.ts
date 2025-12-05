/**
 * Platform Adapter Interface
 * 平台适配器接口
 *
 * 定义不同平台（编辑器、浏览器、原生）需要实现的适配器接口
 * Defines the adapter interface that different platforms need to implement
 */

import type { IPlatformInputSubsystem } from '@esengine/platform-common';

/**
 * 资源路径解析器
 * Asset path resolver
 */
export interface IPathResolver {
    /**
     * 解析资源路径为可加载的 URL
     * Resolve asset path to a loadable URL
     */
    resolve(path: string): string;
}

/**
 * 平台能力标识
 * Platform capability flags
 */
export interface PlatformCapabilities {
    /** 是否支持文件系统访问 / Supports file system access */
    fileSystem: boolean;
    /** 是否支持热重载 / Supports hot reload */
    hotReload: boolean;
    /** 是否支持 Gizmo 显示 / Supports gizmo display */
    gizmos: boolean;
    /** 是否支持网格显示 / Supports grid display */
    grid: boolean;
    /** 是否支持场景编辑 / Supports scene editing */
    sceneEditing: boolean;
}

/**
 * 平台适配器配置
 * Platform adapter configuration
 */
export interface PlatformAdapterConfig {
    /** Canvas 元素 ID */
    canvasId: string;
    /** 初始宽度 */
    width?: number;
    /** 初始高度 */
    height?: number;
    /** 是否为编辑器模式 */
    isEditor?: boolean;
}

/**
 * 平台适配器接口
 * Platform adapter interface
 *
 * 不同平台通过实现此接口来提供平台特定的功能
 * Different platforms implement this interface to provide platform-specific functionality
 */
export interface IPlatformAdapter {
    /**
     * 平台名称
     * Platform name
     */
    readonly name: string;

    /**
     * 平台能力
     * Platform capabilities
     */
    readonly capabilities: PlatformCapabilities;

    /**
     * 路径解析器
     * Path resolver
     */
    readonly pathResolver: IPathResolver;

    /**
     * 初始化平台
     * Initialize platform
     */
    initialize(config: PlatformAdapterConfig): Promise<void>;

    /**
     * 获取 WASM 模块
     * Get WASM module
     *
     * 不同平台可能以不同方式加载 WASM
     * Different platforms may load WASM in different ways
     */
    getWasmModule(): Promise<any>;

    /**
     * 获取 Canvas 元素
     * Get canvas element
     */
    getCanvas(): HTMLCanvasElement | null;

    /**
     * 调整视口大小
     * Resize viewport
     */
    resize(width: number, height: number): void;

    /**
     * 获取当前视口尺寸
     * Get current viewport size
     */
    getViewportSize(): { width: number; height: number };

    /**
     * 是否为编辑器模式
     * Whether in editor mode
     */
    isEditorMode(): boolean;

    /**
     * 设置是否显示网格（仅编辑器模式有效）
     * Set whether to show grid (only effective in editor mode)
     */
    setShowGrid?(show: boolean): void;

    /**
     * 设置是否显示 Gizmos（仅编辑器模式有效）
     * Set whether to show gizmos (only effective in editor mode)
     */
    setShowGizmos?(show: boolean): void;

    /**
     * 获取输入子系统
     * Get input subsystem
     *
     * 返回平台特定的输入子系统实现
     * Returns platform-specific input subsystem implementation
     */
    getInputSubsystem?(): IPlatformInputSubsystem | null;

    /**
     * 释放资源
     * Dispose resources
     */
    dispose(): void;
}

/**
 * 默认路径解析器（直接返回路径）
 * Default path resolver (returns path as-is)
 */
export class DefaultPathResolver implements IPathResolver {
    resolve(path: string): string {
        // 如果已经是 URL，直接返回
        if (path.startsWith('http://') ||
            path.startsWith('https://') ||
            path.startsWith('data:') ||
            path.startsWith('blob:')) {
            return path;
        }
        return path;
    }
}
