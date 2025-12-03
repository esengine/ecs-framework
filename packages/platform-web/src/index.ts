/**
 * @esengine/platform-web
 *
 * Web/H5 Platform Adapter
 * Web/H5 平台适配器
 *
 * Provides browser-specific implementations:
 * - BrowserRuntime: Main entry point for game builds
 * - BrowserAssetReader: Asset loading via fetch API
 * - Web subsystems: Canvas, Input, Storage, WASM
 *
 * @packageDocumentation
 */

// ============================================
// Runtime (main entry for game builds)
// ============================================
export {
    BrowserRuntime,
    create,
    type RuntimeConfig
} from './BrowserRuntime';

// Default export for convenient usage in game builds
export { default } from './BrowserRuntime';

// Asset reader
export { BrowserAssetReader } from './BrowserAssetReader';

// ============================================
// Web Platform Subsystems
// ============================================
export { WebCanvasSubsystem } from './subsystems/WebCanvasSubsystem';
export { WebInputSubsystem } from './subsystems/WebInputSubsystem';
export { WebStorageSubsystem } from './subsystems/WebStorageSubsystem';
export { WebWASMSubsystem } from './subsystems/WebWASMSubsystem';

// ============================================
// Web-specific Systems
// ============================================
export { Canvas2DRenderSystem } from './systems/Canvas2DRenderSystem';

// ============================================
// Platform Detection Utilities
// ============================================

/**
 * Check if running in web browser
 * 检查是否在浏览器中运行
 */
export function isWebPlatform(): boolean {
    return typeof window !== 'undefined' && typeof document !== 'undefined';
}

/**
 * Get canvas element by ID
 * 根据 ID 获取 canvas 元素
 */
export function getWebCanvas(canvasId: string): HTMLCanvasElement | null {
    return document.getElementById(canvasId) as HTMLCanvasElement | null;
}

/**
 * Create a new canvas element
 * 创建新的 canvas 元素
 */
export function createWebCanvas(width: number, height: number): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
}
