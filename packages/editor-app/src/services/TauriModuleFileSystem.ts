/**
 * Tauri Module File System
 * Tauri 模块文件系统
 *
 * Implements IModuleFileSystem interface for Tauri environment.
 * 为 Tauri 环境实现 IModuleFileSystem 接口。
 *
 * This reads module files via Tauri commands from the local file system.
 * 通过 Tauri 命令从本地文件系统读取模块文件。
 */

import { invoke } from '@tauri-apps/api/core';
import type { IModuleFileSystem } from '@esengine/editor-core';

/**
 * Module index structure from Tauri backend.
 * 来自 Tauri 后端的模块索引结构。
 */
interface ModuleIndex {
    version: string;
    generatedAt: string;
    modules: Array<{
        id: string;
        name: string;
        displayName: string;
        hasRuntime: boolean;
        editorPackage?: string;
        isCore: boolean;
        category: string;
    }>;
}

/**
 * Tauri-based module file system for reading module manifests.
 * 基于 Tauri 的模块文件系统，用于读取模块清单。
 */
export class TauriModuleFileSystem implements IModuleFileSystem {
    private _basePath: string = '';
    private _indexCache: ModuleIndex | null = null;

    /**
     * Read JSON file via Tauri command.
     * 通过 Tauri 命令读取 JSON 文件。
     */
    async readJson<T>(path: string): Promise<T> {
        // Check if reading index.json
        // 检查是否读取 index.json
        if (path.endsWith('/index.json') || path === 'index.json') {
            const index = await invoke<ModuleIndex>('read_engine_modules_index');
            this._indexCache = index;
            return index as unknown as T;
        }

        // Extract module ID from path like "/engine/sprite/module.json"
        // 从路径中提取模块 ID，如 "/engine/sprite/module.json"
        const match = path.match(/\/([^/]+)\/module\.json$/);
        if (match) {
            const moduleId = match[1];
            return await invoke<T>('read_module_manifest', { moduleId });
        }

        throw new Error(`Unsupported path: ${path}`);
    }

    /**
     * Write JSON file - not supported for engine modules.
     * 写入 JSON 文件 - 引擎模块不支持。
     */
    async writeJson(_path: string, _data: unknown): Promise<void> {
        throw new Error('Write operation not supported for engine modules');
    }

    /**
     * Check if path exists.
     * 检查路径是否存在。
     */
    async pathExists(path: string): Promise<boolean> {
        try {
            // For index.json, try to read it
            // 对于 index.json，尝试读取它
            if (path.endsWith('/index.json') || path === 'index.json') {
                console.log('[TauriModuleFileSystem] Checking index.json via Tauri command...');
                await invoke('read_engine_modules_index');
                console.log('[TauriModuleFileSystem] index.json exists');
                return true;
            }

            // For module.json, check if module exists in index
            // 对于 module.json，检查模块是否存在于索引中
            const match = path.match(/\/([^/]+)\/module\.json$/);
            if (match) {
                const moduleId = match[1];
                // Use cached index if available
                // 如果有缓存的索引则使用
                if (this._indexCache) {
                    return this._indexCache.modules.some(m => m.id === moduleId);
                }
                // Otherwise try to read the manifest
                // 否则尝试读取清单
                try {
                    await invoke('read_module_manifest', { moduleId });
                    return true;
                } catch {
                    return false;
                }
            }

            return false;
        } catch (err) {
            console.error('[TauriModuleFileSystem] pathExists error:', err);
            return false;
        }
    }

    /**
     * List files - not needed for module loading.
     * 列出文件 - 模块加载不需要。
     */
    async listFiles(_dir: string, _extensions: string[], _recursive?: boolean): Promise<string[]> {
        return [];
    }

    /**
     * Read file as text.
     * 读取文件为文本。
     */
    async readText(path: string): Promise<string> {
        const json = await this.readJson(path);
        return JSON.stringify(json);
    }

    /**
     * Get the base path to engine modules.
     * 获取引擎模块的基础路径。
     */
    async getBasePath(): Promise<string> {
        if (!this._basePath) {
            this._basePath = await invoke<string>('get_engine_modules_base_path');
        }
        return this._basePath;
    }
}

