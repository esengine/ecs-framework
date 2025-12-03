/**
 * Rapier2D 加载器配置
 * Rapier2D loader configuration
 */

import type { WasmLibraryConfig } from '@esengine/platform-common';
import { isEditorEnvironment } from '@esengine/platform-common';

/**
 * 获取 WASM 路径
 * Get WASM path based on environment
 */
function getWasmPath(): string {
    const isEditor = isEditorEnvironment();
    const path = isEditor
        ? 'engine/physics-rapier2d/rapier_wasm2d_bg.wasm'
        : 'wasm/rapier_wasm2d_bg.wasm';

    console.log(`[Rapier2D] isEditor=${isEditor}, wasmPath=${path}`);
    return path;
}

/**
 * Rapier2D 加载器配置
 *
 * Web 平台：使用标准版（独立 WASM 文件）
 * 小游戏平台：使用独立 WASM 文件 + WXWebAssembly 加载
 */
export const Rapier2DLoaderConfig: WasmLibraryConfig = {
    name: 'Rapier2D',

    web: {
        /**
         * WASM 文件路径
         * 编辑器: engine/physics-rapier2d/rapier_wasm2d_bg.wasm
         * 运行时: wasm/rapier_wasm2d_bg.wasm
         */
        get wasmPath(): string {
            return getWasmPath();
        }
    },

    minigame: {
        /**
         * WASM 文件路径（相对于小游戏根目录）
         */
        wasmPath: 'wasm/rapier_wasm2d_bg.wasm',

        /**
         * iOS 微信小游戏需要 TextDecoder polyfill
         */
        needsTextDecoderPolyfill: true,

        /**
         * iOS 微信小游戏需要 TextEncoder polyfill
         */
        needsTextEncoderPolyfill: true,
    }
};
