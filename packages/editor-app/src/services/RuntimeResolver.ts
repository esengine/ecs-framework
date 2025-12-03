/**
 * 运行时模块解析器
 * Runtime Module Resolver
 */

import { TauriAPI } from '../api/tauri';

/**
 * 运行时模块清单
 * Module manifest for runtime modules
 */
export interface ModuleManifest {
    id: string;
    name: string;
    version: string;
    dependencies: string[];
    hasRuntime: boolean;
    pluginExport?: string;
    requiresWasm?: boolean;
    wasmPaths?: string[];
    runtimeWasmPath?: string;
    externalDependencies?: string[];
}

export class RuntimeResolver {
    private static instance: RuntimeResolver;
    private baseDir: string = '';
    private engineModulesPath: string = '';
    private initialized: boolean = false;

    private constructor() {}

    static getInstance(): RuntimeResolver {
        if (!RuntimeResolver.instance) {
            RuntimeResolver.instance = new RuntimeResolver();
        }
        return RuntimeResolver.instance;
    }

    /**
     * 初始化运行时解析器
     * Initialize the runtime resolver
     */
    async initialize(): Promise<void> {
        if (this.initialized) return;

        // 查找工作区根目录 | Find workspace root
        const currentDir = await TauriAPI.getCurrentDir();
        this.baseDir = await this.findWorkspaceRoot(currentDir);

        // 查找引擎模块路径 | Find engine modules path
        this.engineModulesPath = await this.findEngineModulesPath();

        this.initialized = true;
    }

    /**
     * 查找工作区根目录
     * Find workspace root by looking for workspace markers
     */
    private async findWorkspaceRoot(startPath: string): Promise<string> {
        let currentPath = startPath;

        for (let i = 0; i < 5; i++) {
            // 检查是否在 src-tauri 目录 | Check if we're in src-tauri
            if (currentPath.endsWith('src-tauri')) {
                const parts = currentPath.split(/[/\\]/);
                parts.pop();
                parts.pop();
                parts.pop();
                return parts.join('\\');
            }

            // 检查工作区标记 | Check for workspace markers
            const workspaceMarkers = [
                `${currentPath}\\pnpm-workspace.yaml`,
                `${currentPath}\\packages\\editor-app`,
                `${currentPath}\\packages\\platform-web`
            ];

            for (const marker of workspaceMarkers) {
                if (await TauriAPI.pathExists(marker)) {
                    return currentPath;
                }
            }

            // Go up one level
            const parts = currentPath.split(/[/\\]/);
            parts.pop();
            currentPath = parts.join('\\');
        }

        return startPath;
    }

    /**
     * Find engine modules path (where compiled modules with module.json are)
     * 查找引擎模块路径（编译后的模块和 module.json 所在位置）
     */
    private async findEngineModulesPath(): Promise<string> {
        // Try installed editor location first
        const installedPath = 'C:/Program Files/ESEngine Editor/engine';
        if (await TauriAPI.pathExists(`${installedPath}/index.json`)) {
            return installedPath;
        }

        // Try workspace packages directory (dev mode)
        const workspacePath = `${this.baseDir}\\packages`;
        if (await TauriAPI.pathExists(`${workspacePath}\\core\\module.json`)) {
            return workspacePath;
        }

        return workspacePath;
    }

    /**
     * Get list of available runtime modules
     * 获取可用的运行时模块列表
     *
     * Scans the packages directory for module.json files instead of hardcoding
     * 扫描 packages 目录查找 module.json 文件，而不是硬编码
     */
    async getAvailableModules(): Promise<ModuleManifest[]> {
        if (!this.initialized) {
            await this.initialize();
        }

        const modules: ModuleManifest[] = [];

        // Try to read index.json if it exists (installed editor)
        const indexPath = `${this.engineModulesPath}\\index.json`;
        if (await TauriAPI.pathExists(indexPath)) {
            try {
                const indexContent = await TauriAPI.readFileContent(indexPath);
                const indexData = JSON.parse(indexContent) as { modules: ModuleManifest[] };
                return indexData.modules.filter(m => m.hasRuntime);
            } catch (e) {
                console.warn('[RuntimeResolver] Failed to read index.json:', e);
            }
        }

        // Scan packages directory for module.json files
        const packageEntries = await TauriAPI.listDirectory(this.engineModulesPath);
        for (const entry of packageEntries) {
            if (!entry.is_dir) continue;

            const manifestPath = `${this.engineModulesPath}\\${entry.name}\\module.json`;
            if (await TauriAPI.pathExists(manifestPath)) {
                try {
                    const content = await TauriAPI.readFileContent(manifestPath);
                    const manifest = JSON.parse(content) as ModuleManifest;
                    if (manifest.hasRuntime !== false) {
                        modules.push(manifest);
                    }
                } catch (e) {
                    console.warn(`[RuntimeResolver] Failed to read module.json for ${entry.name}:`, e);
                }
            }
        }

        // Sort by dependencies
        return this.sortModulesByDependencies(modules);
    }

    /**
     * Sort modules by dependencies (topological sort)
     * 按依赖排序模块（拓扑排序）
     */
    private sortModulesByDependencies(modules: ModuleManifest[]): ModuleManifest[] {
        const sorted: ModuleManifest[] = [];
        const visited = new Set<string>();
        const moduleMap = new Map(modules.map(m => [m.id, m]));

        const visit = (module: ModuleManifest) => {
            if (visited.has(module.id)) return;
            visited.add(module.id);
            for (const depId of (module.dependencies || [])) {
                const dep = moduleMap.get(depId);
                if (dep) visit(dep);
            }
            sorted.push(module);
        };

        for (const module of modules) {
            visit(module);
        }
        return sorted;
    }

    /**
     * Prepare runtime files for browser preview using ES Modules
     * 使用 ES 模块为浏览器预览准备运行时文件
     *
     * Creates libs/{moduleId}/{moduleId}.js structure matching published builds
     * 创建与发布构建一致的 libs/{moduleId}/{moduleId}.js 结构
     */
    async prepareRuntimeFiles(targetDir: string): Promise<{ modules: ModuleManifest[], importMap: Record<string, string> }> {
        if (!this.initialized) {
            await this.initialize();
        }

        // Ensure target directory exists
        if (!await TauriAPI.pathExists(targetDir)) {
            await TauriAPI.createDirectory(targetDir);
        }

        const libsDir = `${targetDir}\\libs`;
        if (!await TauriAPI.pathExists(libsDir)) {
            await TauriAPI.createDirectory(libsDir);
        }

        const modules = await this.getAvailableModules();
        const importMap: Record<string, string> = {};
        const copiedModules: string[] = [];

        // Copy each module's dist files
        for (const module of modules) {
            const moduleDistDir = `${this.engineModulesPath}\\${module.id}\\dist`;
            const moduleSrcFile = `${moduleDistDir}\\index.mjs`;

            // Check for index.mjs or index.js
            let srcFile = moduleSrcFile;
            if (!await TauriAPI.pathExists(srcFile)) {
                srcFile = `${moduleDistDir}\\index.js`;
            }

            if (await TauriAPI.pathExists(srcFile)) {
                const dstModuleDir = `${libsDir}\\${module.id}`;
                if (!await TauriAPI.pathExists(dstModuleDir)) {
                    await TauriAPI.createDirectory(dstModuleDir);
                }

                const dstFile = `${dstModuleDir}\\${module.id}.js`;
                await TauriAPI.copyFile(srcFile, dstFile);

                // Copy all chunk files (code splitting creates chunk-*.js files)
                // 复制所有 chunk 文件（代码分割会创建 chunk-*.js 文件）
                await this.copyChunkFiles(moduleDistDir, dstModuleDir);

                // Add to import map
                importMap[`@esengine/${module.id}`] = `./libs/${module.id}/${module.id}.js`;

                // Also add common aliases
                if (module.id === 'core') {
                    importMap['@esengine/ecs-framework'] = `./libs/${module.id}/${module.id}.js`;
                }
                if (module.id === 'math') {
                    importMap['@esengine/ecs-framework-math'] = `./libs/${module.id}/${module.id}.js`;
                }

                copiedModules.push(module.id);
            }
        }

        // Copy external dependencies (e.g., rapier2d)
        await this.copyExternalDependencies(modules, libsDir, importMap);

        // Copy engine WASM files to libs/es-engine/
        await this.copyEngineWasm(libsDir);

        // Copy module-specific WASM files
        await this.copyModuleWasm(modules, targetDir);

        console.log(`[RuntimeResolver] Prepared ${copiedModules.length} modules for browser preview`);

        return { modules, importMap };
    }

    /**
     * Copy chunk files from dist directory (for code-split modules)
     * 复制 dist 目录中的 chunk 文件（用于代码分割的模块）
     */
    private async copyChunkFiles(srcDir: string, dstDir: string): Promise<void> {
        try {
            const entries = await TauriAPI.listDirectory(srcDir);
            for (const entry of entries) {
                // Copy chunk-*.js files and any other .js files (except index.*)
                if (!entry.is_dir && entry.name.endsWith('.js') && !entry.name.startsWith('index.')) {
                    const srcFile = `${srcDir}\\${entry.name}`;
                    const dstFile = `${dstDir}\\${entry.name}`;
                    await TauriAPI.copyFile(srcFile, dstFile);
                }
            }
        } catch (e) {
            // Ignore errors - some modules may not have chunk files
        }
    }

    /**
     * Copy external dependencies like rapier2d
     * 复制外部依赖如 rapier2d
     */
    private async copyExternalDependencies(
        modules: ModuleManifest[],
        libsDir: string,
        importMap: Record<string, string>
    ): Promise<void> {
        const externalDeps = new Set<string>();
        for (const m of modules) {
            if (m.externalDependencies) {
                for (const dep of m.externalDependencies) {
                    externalDeps.add(dep);
                }
            }
        }

        for (const dep of externalDeps) {
            const depId = dep.startsWith('@esengine/') ? dep.slice(10) : dep.replace(/^@[^/]+\//, '');
            const srcDistDir = `${this.engineModulesPath}\\${depId}\\dist`;
            let srcFile = `${srcDistDir}\\index.mjs`;
            if (!await TauriAPI.pathExists(srcFile)) {
                srcFile = `${srcDistDir}\\index.js`;
            }

            if (await TauriAPI.pathExists(srcFile)) {
                const dstModuleDir = `${libsDir}\\${depId}`;
                if (!await TauriAPI.pathExists(dstModuleDir)) {
                    await TauriAPI.createDirectory(dstModuleDir);
                }

                const dstFile = `${dstModuleDir}\\${depId}.js`;
                await TauriAPI.copyFile(srcFile, dstFile);

                // Copy chunk files for external dependencies too
                await this.copyChunkFiles(srcDistDir, dstModuleDir);

                importMap[dep] = `./libs/${depId}/${depId}.js`;
                console.log(`[RuntimeResolver] Copied external dependency: ${depId}`);
            }
        }
    }

    /**
     * Copy engine WASM files
     * 复制引擎 WASM 文件
     */
    private async copyEngineWasm(libsDir: string): Promise<void> {
        const esEngineDir = `${libsDir}\\es-engine`;
        if (!await TauriAPI.pathExists(esEngineDir)) {
            await TauriAPI.createDirectory(esEngineDir);
        }

        // Try different locations for engine WASM
        const wasmSearchPaths = [
            `${this.baseDir}\\packages\\engine\\pkg`,
            `${this.engineModulesPath}\\..\\..\\engine\\pkg`,
            'C:/Program Files/ESEngine Editor/wasm'
        ];

        const filesToCopy = ['es_engine_bg.wasm', 'es_engine.js', 'es_engine_bg.js'];

        for (const searchPath of wasmSearchPaths) {
            if (await TauriAPI.pathExists(searchPath)) {
                for (const file of filesToCopy) {
                    const srcFile = `${searchPath}\\${file}`;
                    if (await TauriAPI.pathExists(srcFile)) {
                        const dstFile = `${esEngineDir}\\${file}`;
                        await TauriAPI.copyFile(srcFile, dstFile);
                    }
                }
                console.log('[RuntimeResolver] Copied engine WASM from:', searchPath);
                return;
            }
        }

        console.warn('[RuntimeResolver] Engine WASM files not found');
    }

    /**
     * Copy module-specific WASM files (e.g., physics)
     * 复制模块特定的 WASM 文件（如物理）
     */
    private async copyModuleWasm(modules: ModuleManifest[], targetDir: string): Promise<void> {
        for (const module of modules) {
            if (!module.requiresWasm || !module.wasmPaths?.length) continue;

            const runtimePath = module.runtimeWasmPath || `wasm/${module.wasmPaths[0]}`;
            const dstPath = `${targetDir}\\${runtimePath.replace(/\//g, '\\')}`;
            const dstDir = dstPath.substring(0, dstPath.lastIndexOf('\\'));

            if (!await TauriAPI.pathExists(dstDir)) {
                await TauriAPI.createDirectory(dstDir);
            }

            // Search for the WASM file
            const wasmPath = module.wasmPaths[0];
            if (!wasmPath) continue;
            const wasmFileName = wasmPath.split(/[/\\]/).pop() || wasmPath;

            // Build search paths - check module's own pkg, external deps, and common locations
            const searchPaths: string[] = [
                `${this.engineModulesPath}\\${module.id}\\pkg\\${wasmFileName}`,
                `${this.baseDir}\\packages\\${module.id}\\pkg\\${wasmFileName}`,
            ];

            // Check external dependencies for WASM (e.g., physics-rapier2d uses rapier2d's WASM)
            if (module.externalDependencies) {
                for (const dep of module.externalDependencies) {
                    const depId = dep.startsWith('@esengine/') ? dep.slice(10) : dep.replace(/^@[^/]+\//, '');
                    searchPaths.push(`${this.engineModulesPath}\\${depId}\\pkg\\${wasmFileName}`);
                    searchPaths.push(`${this.baseDir}\\packages\\${depId}\\pkg\\${wasmFileName}`);
                }
            }

            for (const srcPath of searchPaths) {
                if (await TauriAPI.pathExists(srcPath)) {
                    await TauriAPI.copyFile(srcPath, dstPath);
                    console.log(`[RuntimeResolver] Copied ${module.id} WASM to ${runtimePath}`);
                    break;
                }
            }
        }
    }

    /**
     * Generate import map for runtime HTML
     * 生成运行时 HTML 的 import map
     */
    generateImportMapHtml(importMap: Record<string, string>): string {
        return `<script type="importmap">
    ${JSON.stringify({ imports: importMap }, null, 2).split('\n').join('\n    ')}
    </script>`;
    }

    /**
     * Get workspace root directory
     * 获取工作区根目录
     */
    getBaseDir(): string {
        return this.baseDir;
    }

    /**
     * Get engine modules path
     * 获取引擎模块路径
     */
    getEngineModulesPath(): string {
        return this.engineModulesPath;
    }
}
