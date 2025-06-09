/**
 * WASM ECS核心全局实例
 */

import { WasmEcsCore } from './core';

export const ecsCore = new WasmEcsCore();

export async function initializeEcs(silent: boolean = false): Promise<boolean> {
    ecsCore.setSilent(silent);
    return await ecsCore.initialize();
} 