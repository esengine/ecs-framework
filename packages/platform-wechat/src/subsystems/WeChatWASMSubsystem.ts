/**
 * 微信小游戏 WASM 子系统
 */

import type {
    IPlatformWASMSubsystem,
    IWASMInstance,
    WASMImports,
    WASMExports
} from '@esengine/platform-common';

/**
 * 微信小游戏 WASM 子系统实现
 */
export class WeChatWASMSubsystem implements IPlatformWASMSubsystem {
    async instantiate(path: string, imports?: WASMImports): Promise<IWASMInstance> {
        // 微信小游戏使用 WXWebAssembly.instantiate
        // path 应该是相对于小游戏根目录的 .wasm 文件路径
        if (typeof WXWebAssembly === 'undefined') {
            throw new Error('当前微信基础库版本不支持 WebAssembly');
        }

        const wxImports: WXWebAssembly.Imports | undefined = imports as WXWebAssembly.Imports | undefined;
        const instance = await WXWebAssembly.instantiate(path, wxImports);

        return {
            exports: instance.exports as WASMExports
        };
    }

    isSupported(): boolean {
        return typeof WXWebAssembly !== 'undefined';
    }

    /**
     * 获取 WASM 内存
     * 用于 Rust/WASM 引擎的内存交互
     */
    createMemory(initial: number, maximum?: number): WebAssembly.Memory {
        if (typeof WXWebAssembly === 'undefined') {
            throw new Error('当前微信基础库版本不支持 WebAssembly');
        }

        return new WXWebAssembly.Memory({
            initial,
            maximum,
            shared: false // 微信小游戏不支持 shared memory
        });
    }

    /**
     * 创建 WASM Table
     */
    createTable(initial: number, maximum?: number): WebAssembly.Table {
        if (typeof WXWebAssembly === 'undefined') {
            throw new Error('当前微信基础库版本不支持 WebAssembly');
        }

        return new WXWebAssembly.Table({
            element: 'anyfunc',
            initial,
            maximum
        });
    }
}
