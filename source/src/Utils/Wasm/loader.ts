/**
 * WASM模块加载器
 */

import { WasmModule, WasmEcsCoreInstance } from './types';

export class WasmLoader {
    private wasmModule: WasmModule | null = null;
    private wasmCore: WasmEcsCoreInstance | null = null;
    private silent = false;

    public setSilent(silent: boolean): void {
        this.silent = silent;
    }
    public async loadWasmModule(): Promise<boolean> {
        try {
            const wasmPath = '../../bin/wasm/ecs_wasm_core';
            this.wasmModule = await import(wasmPath);
            
            if (this.wasmModule) {
                await this.initializeWasmModule();
                this.wasmCore = new this.wasmModule.EcsCore();
            }
            
            return true;
        } catch (error) {
            if (!this.silent) {
                console.warn('WASM加载失败，使用JavaScript实现');
            }
            return false;
        }
    }

    private async initializeWasmModule(): Promise<void> {
        if (!this.wasmModule) return;

        if (typeof require !== 'undefined') {
            const fs = require('fs');
            const path = require('path');
            const currentDir = path.dirname(__filename);
            const wasmPath = path.resolve(currentDir, '../../bin/wasm/ecs_wasm_core_bg.wasm');
            
            if (fs.existsSync(wasmPath)) {
                const wasmBytes = fs.readFileSync(wasmPath);
                if (this.wasmModule.initSync) {
                    this.wasmModule.initSync(wasmBytes);
                } else {
                    await this.wasmModule.default({ module_or_path: wasmBytes });
                }
            } else {
                throw new Error(`WASM文件不存在: ${wasmPath}`);
            }
        } else {
            await this.wasmModule.default();
        }
    }

    public getWasmCore(): WasmEcsCoreInstance | null {
        return this.wasmCore;
    }

    public getWasmModule(): WasmModule | null {
        return this.wasmModule;
    }

    public cleanup(): void {
        if (this.wasmCore && this.wasmCore.free) {
            this.wasmCore.free();
        }
        this.wasmCore = null;
        this.wasmModule = null;
    }
} 