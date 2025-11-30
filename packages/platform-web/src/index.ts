/**
 * @esengine/platform-web
 *
 * Web/H5 平台适配器 - 仅包含平台差异代码
 * 通用运行时逻辑在 @esengine/runtime-core
 *
 * @packageDocumentation
 */

// Web 平台子系统
export { WebCanvasSubsystem } from './subsystems/WebCanvasSubsystem';
export { WebInputSubsystem } from './subsystems/WebInputSubsystem';
export { WebStorageSubsystem } from './subsystems/WebStorageSubsystem';
export { WebWASMSubsystem } from './subsystems/WebWASMSubsystem';

// Web 特定系统
export { Canvas2DRenderSystem } from './systems/Canvas2DRenderSystem';

export function isWebPlatform(): boolean {
    return typeof window !== 'undefined' && typeof document !== 'undefined';
}

export function getWebCanvas(canvasId: string): HTMLCanvasElement | null {
    return document.getElementById(canvasId) as HTMLCanvasElement | null;
}

export function createWebCanvas(width: number, height: number): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
}
