/**
 * Web 平台 WASM 子系统
 */

import type {
    IPlatformWASMSubsystem,
    IWASMInstance,
    WASMImports,
    WASMExports
} from '@esengine/platform-common';

/**
 * Web 平台 WASM 子系统实现
 */
export class WebWASMSubsystem implements IPlatformWASMSubsystem {
    async instantiate(path: string, imports?: WASMImports): Promise<IWASMInstance> {
        const response = await fetch(path);
        const buffer = await response.arrayBuffer();
        const result = await WebAssembly.instantiate(buffer, imports);

        return {
            exports: result.instance.exports as WASMExports
        };
    }

    isSupported(): boolean {
        return typeof WebAssembly !== 'undefined';
    }

    createMemory(initial: number, maximum?: number): WebAssembly.Memory {
        return new WebAssembly.Memory({
            initial,
            maximum
        });
    }

    createTable(initial: number, maximum?: number): WebAssembly.Table {
        return new WebAssembly.Table({
            element: 'anyfunc',
            initial,
            maximum
        });
    }
}
