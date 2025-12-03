/**
 * WASM 库加载器
 *
 * 提供跨平台的 WASM 库加载支持
 */

export { PlatformType } from './IWasmLibraryLoader';

export type {
    WasmLibraryConfig,
    PlatformInfo,
    IWasmLibraryLoader,
    IPlatformWasmLoader
} from './IWasmLibraryLoader';

export { WasmLibraryLoaderFactory } from './WasmLibraryLoaderFactory';
