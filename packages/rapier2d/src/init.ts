/**
 * RAPIER initialization module with dynamic WASM loading support.
 * RAPIER 初始化模块，支持动态 WASM 加载。
 */

import wasmInit from "../pkg/rapier_wasm2d";

/**
 * Input types for WASM initialization.
 * WASM 初始化的输入类型。
 */
export type InitInput =
    | RequestInfo         // URL string or Request object
    | URL                 // URL object
    | Response            // Fetch Response object
    | BufferSource        // ArrayBuffer or TypedArray
    | WebAssembly.Module; // Pre-compiled module

let initialized = false;

/**
 * Initializes RAPIER.
 * Has to be called and awaited before using any library methods.
 *
 * 初始化 RAPIER。
 * 必须在使用任何库方法之前调用并等待。
 *
 * @param input - WASM source (required). Can be URL, Response, ArrayBuffer, etc.
 *                WASM 源（必需）。可以是 URL、Response、ArrayBuffer 等。
 *
 * @example
 * // Load from URL | 从 URL 加载
 * await RAPIER.init('wasm/rapier_wasm2d_bg.wasm');
 *
 * @example
 * // Load from fetch response | 从 fetch 响应加载
 * const response = await fetch('wasm/rapier_wasm2d_bg.wasm');
 * await RAPIER.init(response);
 *
 * @example
 * // Load from ArrayBuffer | 从 ArrayBuffer 加载
 * const buffer = await fetch('wasm/rapier_wasm2d_bg.wasm').then(r => r.arrayBuffer());
 * await RAPIER.init(buffer);
 */
export async function init(input?: InitInput): Promise<void> {
    if (initialized) {
        return;
    }

    await wasmInit(input);
    initialized = true;
}

/**
 * Check if RAPIER is already initialized.
 * 检查 RAPIER 是否已初始化。
 */
export function isInitialized(): boolean {
    return initialized;
}
