/**
 * WASM模块导出
 */

export * from './types';
export { WasmLoader } from './loader';
export { JavaScriptFallback } from './fallback';
export { WasmEcsCore } from './core';
export { ecsCore, initializeEcs } from './instance'; 