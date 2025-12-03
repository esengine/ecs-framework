/**
 * User Code Service Implementation.
 * 用户代码服务实现。
 *
 * Provides compilation, loading, and hot-reload for user-written scripts.
 * 提供用户脚本的编译、加载和热更新功能。
 */

import type { IService } from '@esengine/ecs-framework';
import { Injectable, createLogger } from '@esengine/ecs-framework';
import type {
    IUserCodeService,
    UserScriptInfo,
    UserCodeCompileOptions,
    UserCodeCompileResult,
    CompileError,
    UserCodeModule,
    HotReloadEvent
} from './IUserCodeService';
import {
    UserCodeTarget,
    SCRIPTS_DIR,
    EDITOR_SCRIPTS_DIR,
    USER_CODE_OUTPUT_DIR
} from './IUserCodeService';
import type { IFileSystem, FileEntry } from '../IFileSystem';

const logger = createLogger('UserCodeService');

/**
 * User Code Service.
 * 用户代码服务。
 *
 * Handles scanning, compilation, loading, and hot-reload of user scripts.
 * 处理用户脚本的扫描、编译、加载和热更新。
 */
@Injectable()
export class UserCodeService implements IService, IUserCodeService {
    private _fileSystem: IFileSystem;
    private _runtimeModule: UserCodeModule | undefined;
    private _editorModule: UserCodeModule | undefined;
    private _watching = false;
    private _watchCallbacks: Array<(event: HotReloadEvent) => void> = [];
    private _currentProjectPath: string | undefined;
    private _eventUnlisten: (() => void) | undefined;

    constructor(fileSystem: IFileSystem) {
        this._fileSystem = fileSystem;
    }

    /**
     * Scan project for user scripts.
     * 扫描项目中的用户脚本。
     *
     * @param projectPath - Project root path | 项目根路径
     * @returns Discovered script files | 发现的脚本文件
     */
    async scan(projectPath: string): Promise<UserScriptInfo[]> {
        const scripts: UserScriptInfo[] = [];
        const sep = projectPath.includes('\\') ? '\\' : '/';
        const scriptsDir = `${projectPath}${sep}${SCRIPTS_DIR}`;

        try {
            // Check if scripts directory exists | 检查脚本目录是否存在
            const exists = await this._fileSystem.exists(scriptsDir);
            if (!exists) {
                logger.debug('Scripts directory not found | 脚本目录不存在:', scriptsDir);
                return scripts;
            }

            // Scan all TypeScript files | 扫描所有 TypeScript 文件
            const files = await this._scanDirectory(scriptsDir, '');

            for (const file of files) {
                const isEditorScript = file.relativePath.startsWith(`${EDITOR_SCRIPTS_DIR}${sep}`) ||
                                       file.relativePath.startsWith(`${EDITOR_SCRIPTS_DIR}/`);

                const scriptInfo: UserScriptInfo = {
                    path: file.absolutePath,
                    relativePath: file.relativePath,
                    target: isEditorScript ? UserCodeTarget.Editor : UserCodeTarget.Runtime,
                    exports: await this._extractExports(file.absolutePath),
                    lastModified: file.lastModified
                };

                scripts.push(scriptInfo);
            }

            logger.info(`Scanned ${scripts.length} scripts | 扫描到 ${scripts.length} 个脚本`, {
                runtime: scripts.filter(s => s.target === UserCodeTarget.Runtime).length,
                editor: scripts.filter(s => s.target === UserCodeTarget.Editor).length
            });

            return scripts;
        } catch (error) {
            logger.error('Failed to scan scripts | 扫描脚本失败:', error);
            return scripts;
        }
    }

    /**
     * Compile user scripts.
     * 编译用户脚本。
     *
     * @param options - Compilation options | 编译选项
     * @returns Compilation result | 编译结果
     */
    async compile(options: UserCodeCompileOptions): Promise<UserCodeCompileResult> {
        const startTime = Date.now();
        const errors: CompileError[] = [];
        const warnings: CompileError[] = [];

        const sep = options.projectPath.includes('\\') ? '\\' : '/';
        const scriptsDir = `${options.projectPath}${sep}${SCRIPTS_DIR}`;
        const outputDir = options.outputDir || `${options.projectPath}${sep}${USER_CODE_OUTPUT_DIR}`;

        try {
            // Scan scripts first | 先扫描脚本
            const allScripts = await this.scan(options.projectPath);
            const targetScripts = allScripts.filter(s => s.target === options.target);

            if (targetScripts.length === 0) {
                logger.info(`No ${options.target} scripts to compile | 没有需要编译的 ${options.target} 脚本`);
                return {
                    success: true,
                    outputPath: undefined,
                    errors: [],
                    warnings: [],
                    duration: Date.now() - startTime
                };
            }

            // Ensure output directory exists | 确保输出目录存在
            await this._ensureDirectory(outputDir);

            // Determine output file name | 确定输出文件名
            const outputFileName = options.target === UserCodeTarget.Runtime
                ? 'user-runtime.js'
                : 'user-editor.js';
            const outputPath = `${outputDir}${sep}${outputFileName}`;

            // Build entry point content | 构建入口点内容
            const entryContent = this._buildEntryPoint(targetScripts, scriptsDir, options.target);

            // Create temporary entry file | 创建临时入口文件
            const entryPath = `${outputDir}${sep}_entry_${options.target}.ts`;
            await this._fileSystem.writeFile(entryPath, entryContent);

            // Compile using esbuild (via Tauri command or direct) | 使用 esbuild 编译
            const compileResult = await this._runEsbuild({
                entryPath,
                outputPath,
                format: options.format || 'esm',
                sourceMap: options.sourceMap ?? true,
                minify: options.minify ?? false,
                external: this._getExternalDependencies(options.target),
                projectRoot: options.projectPath
            });

            if (!compileResult.success) {
                errors.push(...compileResult.errors);
            }

            // Clean up temporary entry file | 清理临时入口文件
            try {
                await this._fileSystem.deleteFile(entryPath);
            } catch {
                // Ignore cleanup errors | 忽略清理错误
            }

            const duration = Date.now() - startTime;
            logger.info(`Compilation ${compileResult.success ? 'succeeded' : 'failed'} | 编译${compileResult.success ? '成功' : '失败'}`, {
                target: options.target,
                duration: `${duration}ms`,
                files: targetScripts.length
            });

            return {
                success: compileResult.success,
                outputPath: compileResult.success ? outputPath : undefined,
                errors,
                warnings,
                duration
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            errors.push({ message: errorMessage });

            logger.error('Compilation failed | 编译失败:', error);

            return {
                success: false,
                errors,
                warnings,
                duration: Date.now() - startTime
            };
        }
    }

    /**
     * Load compiled user code module.
     * 加载编译后的用户代码模块。
     *
     * @param modulePath - Path to compiled JS file | 编译后的 JS 文件路径
     * @param target - Target environment | 目标环境
     * @returns Loaded module | 加载的模块
     */
    async load(modulePath: string, target: UserCodeTarget): Promise<UserCodeModule> {
        try {
            // Add cache-busting query parameter for hot reload | 添加缓存破坏参数用于热更新
            const cacheBuster = `?t=${Date.now()}`;
            const moduleUrl = `file://${modulePath}${cacheBuster}`;

            // Dynamic import the module | 动态导入模块
            const moduleExports = await import(/* @vite-ignore */ moduleUrl);

            const module: UserCodeModule = {
                id: `user-${target}-${Date.now()}`,
                target,
                exports: { ...moduleExports },
                version: String(Date.now()),
                loadedAt: Date.now()
            };

            // Store reference | 存储引用
            if (target === UserCodeTarget.Runtime) {
                this._runtimeModule = module;
            } else {
                this._editorModule = module;
            }

            logger.info(`Module loaded | 模块已加载`, {
                target,
                exports: Object.keys(module.exports).length
            });

            return module;
        } catch (error) {
            logger.error('Failed to load module | 加载模块失败:', error);
            throw error;
        }
    }

    /**
     * Unload user code module.
     * 卸载用户代码模块。
     *
     * @param target - Target environment to unload | 要卸载的目标环境
     */
    async unload(target: UserCodeTarget): Promise<void> {
        if (target === UserCodeTarget.Runtime) {
            this._runtimeModule = undefined;
        } else {
            this._editorModule = undefined;
        }
        logger.info(`Module unloaded | 模块已卸载`, { target });
    }

    /**
     * Get currently loaded module.
     * 获取当前加载的模块。
     *
     * @param target - Target environment | 目标环境
     * @returns Loaded module or undefined | 加载的模块或 undefined
     */
    getModule(target: UserCodeTarget): UserCodeModule | undefined {
        return target === UserCodeTarget.Runtime ? this._runtimeModule : this._editorModule;
    }

    /**
     * Register runtime components/systems from user module.
     * 从用户模块注册运行时组件/系统。
     *
     * @param module - User code module | 用户代码模块
     */
    registerComponents(module: UserCodeModule): void {
        if (module.target !== UserCodeTarget.Runtime) {
            logger.warn('Cannot register components from editor module | 无法从编辑器模块注册组件');
            return;
        }

        let componentCount = 0;
        let systemCount = 0;

        for (const [name, exported] of Object.entries(module.exports)) {
            if (typeof exported !== 'function') {
                continue;
            }

            // Check if it's a Component subclass | 检查是否是 Component 子类
            if (this._isComponentClass(exported)) {
                // Register with ComponentRegistry | 注册到 ComponentRegistry
                // Note: Actual registration depends on runtime context
                // 注意：实际注册取决于运行时上下文
                logger.debug(`Found component: ${name} | 发现组件: ${name}`);
                componentCount++;
            }

            // Check if it's a System subclass | 检查是否是 System 子类
            if (this._isSystemClass(exported)) {
                logger.debug(`Found system: ${name} | 发现系统: ${name}`);
                systemCount++;
            }
        }

        logger.info(`Registered user code | 注册用户代码`, {
            components: componentCount,
            systems: systemCount
        });
    }

    /**
     * Register editor extensions from user module.
     * 从用户模块注册编辑器扩展。
     *
     * @param module - User code module | 用户代码模块
     */
    registerEditorExtensions(module: UserCodeModule): void {
        if (module.target !== UserCodeTarget.Editor) {
            logger.warn('Cannot register editor extensions from runtime module | 无法从运行时模块注册编辑器扩展');
            return;
        }

        let inspectorCount = 0;
        let gizmoCount = 0;
        let panelCount = 0;

        for (const [name, exported] of Object.entries(module.exports)) {
            if (typeof exported !== 'function') {
                continue;
            }

            // Check for inspector | 检查检查器
            if (this._isInspectorClass(exported)) {
                logger.debug(`Found inspector: ${name} | 发现检查器: ${name}`);
                inspectorCount++;
            }

            // Check for gizmo | 检查 Gizmo
            if (this._isGizmoClass(exported)) {
                logger.debug(`Found gizmo: ${name} | 发现 Gizmo: ${name}`);
                gizmoCount++;
            }

            // Check for panel | 检查面板
            if (this._isPanelComponent(exported)) {
                logger.debug(`Found panel: ${name} | 发现面板: ${name}`);
                panelCount++;
            }
        }

        logger.info(`Registered editor extensions | 注册编辑器扩展`, {
            inspectors: inspectorCount,
            gizmos: gizmoCount,
            panels: panelCount
        });
    }

    /**
     * Start watching for file changes (hot reload).
     * 开始监视文件变更（热更新）。
     *
     * @param projectPath - Project root path | 项目根路径
     * @param onReload - Callback when code is reloaded | 代码重新加载时的回调
     */
    async watch(projectPath: string, onReload: (event: HotReloadEvent) => void): Promise<void> {
        if (this._watching) {
            this._watchCallbacks.push(onReload);
            return;
        }

        this._currentProjectPath = projectPath;

        try {
            // Check if we're in Tauri environment | 检查是否在 Tauri 环境
            if (typeof window !== 'undefined' && '__TAURI__' in window) {
                const { invoke } = await import('@tauri-apps/api/core');
                const { listen } = await import('@tauri-apps/api/event');

                // Start backend file watcher | 启动后端文件监视器
                await invoke('watch_scripts', {
                    projectPath,
                    scriptsDir: SCRIPTS_DIR
                });

                // Listen for file change events | 监听文件变更事件
                this._eventUnlisten = await listen<{
                    changeType: string;
                    paths: string[];
                }>('user-code:file-changed', async (event) => {
                    const { changeType, paths } = event.payload;

                    logger.info('File change detected | 检测到文件变更', { changeType, paths });

                    // Determine which targets are affected | 确定受影响的目标
                    const isEditorChange = paths.some(p =>
                        p.includes(`${EDITOR_SCRIPTS_DIR}/`) || p.includes(`${EDITOR_SCRIPTS_DIR}\\`)
                    );
                    const target = isEditorChange ? UserCodeTarget.Editor : UserCodeTarget.Runtime;

                    // Get previous module | 获取之前的模块
                    const previousModule = this.getModule(target);

                    // Recompile the affected target | 重新编译受影响的目标
                    const compileResult = await this.compile({
                        projectPath,
                        target
                    });

                    if (compileResult.success && compileResult.outputPath) {
                        // Reload the module | 重新加载模块
                        const newModule = await this.load(compileResult.outputPath, target);

                        // Create hot reload event | 创建热更新事件
                        const hotReloadEvent: HotReloadEvent = {
                            target,
                            changedFiles: paths,
                            previousModule,
                            newModule
                        };

                        this._notifyHotReload(hotReloadEvent);
                    } else {
                        logger.error('Hot reload compilation failed | 热更新编译失败', compileResult.errors);
                    }
                });

                this._watching = true;
                this._watchCallbacks.push(onReload);

                logger.info('Started watching for changes | 开始监视文件变更', {
                    path: `${projectPath}/${SCRIPTS_DIR}`
                });
            } else {
                // Not in Tauri - just register callback for manual triggers
                // 不在 Tauri 环境 - 只注册回调用于手动触发
                logger.warn('File watching not available outside Tauri | 文件监视在 Tauri 外不可用');
                this._watching = true;
                this._watchCallbacks.push(onReload);
            }
        } catch (error) {
            logger.error('Failed to start watching | 启动监视失败:', error);
            throw error;
        }
    }

    /**
     * Stop watching for file changes.
     * 停止监视文件变更。
     */
    async stopWatch(): Promise<void> {
        if (!this._watching) {
            return;
        }

        try {
            // Unsubscribe from Tauri events | 取消订阅 Tauri 事件
            if (this._eventUnlisten) {
                this._eventUnlisten();
                this._eventUnlisten = undefined;
            }

            // Stop backend file watcher | 停止后端文件监视器
            if (typeof window !== 'undefined' && '__TAURI__' in window) {
                const { invoke } = await import('@tauri-apps/api/core');
                await invoke('stop_watch_scripts', {
                    projectPath: this._currentProjectPath
                });
            }
        } catch (error) {
            logger.warn('Error stopping file watcher | 停止文件监视器时出错:', error);
        }

        this._watching = false;
        this._watchCallbacks = [];
        this._currentProjectPath = undefined;

        logger.info('Stopped watching for changes | 停止监视文件变更');
    }

    /**
     * Check if watching is active.
     * 检查是否正在监视。
     */
    isWatching(): boolean {
        return this._watching;
    }

    /**
     * Dispose service resources.
     * 释放服务资源。
     */
    dispose(): void {
        this.stopWatch();
        this._runtimeModule = undefined;
        this._editorModule = undefined;
    }

    // ==================== Private Methods | 私有方法 ====================

    /**
     * Scan directory recursively for TypeScript files.
     * 递归扫描目录中的 TypeScript 文件。
     */
    private async _scanDirectory(
        baseDir: string,
        relativePath: string
    ): Promise<Array<{ absolutePath: string; relativePath: string; lastModified: number }>> {
        const results: Array<{ absolutePath: string; relativePath: string; lastModified: number }> = [];
        const sep = baseDir.includes('\\') ? '\\' : '/';
        const currentDir = relativePath ? `${baseDir}${sep}${relativePath}` : baseDir;

        try {
            const entries: FileEntry[] = await this._fileSystem.listDirectory(currentDir);

            for (const entry of entries) {
                const entryRelativePath = relativePath ? `${relativePath}${sep}${entry.name}` : entry.name;
                const entryAbsolutePath = `${baseDir}${sep}${entryRelativePath}`;

                if (entry.isDirectory) {
                    // Recursively scan subdirectories | 递归扫描子目录
                    const subResults = await this._scanDirectory(baseDir, entryRelativePath);
                    results.push(...subResults);
                } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
                    results.push({
                        absolutePath: entryAbsolutePath,
                        relativePath: entryRelativePath,
                        lastModified: entry.modified?.getTime() || Date.now()
                    });
                }
            }
        } catch (error) {
            logger.warn(`Failed to scan directory | 扫描目录失败: ${currentDir}`, error);
        }

        return results;
    }

    /**
     * Extract exported names from a TypeScript file.
     * 从 TypeScript 文件中提取导出的名称。
     */
    private async _extractExports(filePath: string): Promise<string[]> {
        try {
            const content = await this._fileSystem.readFile(filePath);
            const exports: string[] = [];

            // Simple regex-based extraction | 简单的正则表达式提取
            // Match: export class ClassName, export function funcName, export const varName
            const exportClassRegex = /export\s+class\s+(\w+)/g;
            const exportFunctionRegex = /export\s+function\s+(\w+)/g;
            const exportConstRegex = /export\s+const\s+(\w+)/g;
            const exportDefaultRegex = /export\s+default\s+(?:class|function)?\s*(\w+)?/g;

            let match;
            while ((match = exportClassRegex.exec(content)) !== null) {
                exports.push(match[1]);
            }
            while ((match = exportFunctionRegex.exec(content)) !== null) {
                exports.push(match[1]);
            }
            while ((match = exportConstRegex.exec(content)) !== null) {
                exports.push(match[1]);
            }
            while ((match = exportDefaultRegex.exec(content)) !== null) {
                if (match[1]) {
                    exports.push(match[1]);
                }
            }

            return exports;
        } catch {
            return [];
        }
    }

    /**
     * Build entry point content that re-exports all user scripts.
     * 构建重新导出所有用户脚本的入口点内容。
     */
    private _buildEntryPoint(
        scripts: UserScriptInfo[],
        scriptsDir: string,
        target: UserCodeTarget
    ): string {
        const lines: string[] = [
            '// Auto-generated entry point for user scripts',
            '// 自动生成的用户脚本入口点',
            ''
        ];

        for (const script of scripts) {
            // Convert absolute path to relative import | 将绝对路径转换为相对导入
            const relativePath = script.relativePath.replace(/\\/g, '/').replace(/\.tsx?$/, '');

            if (script.exports.length > 0) {
                lines.push(`export { ${script.exports.join(', ')} } from './${SCRIPTS_DIR}/${relativePath}';`);
            } else {
                // Re-export everything if we couldn't detect specific exports
                // 如果无法检测到具体导出，则重新导出所有内容
                lines.push(`export * from './${SCRIPTS_DIR}/${relativePath}';`);
            }
        }

        return lines.join('\n');
    }

    /**
     * Get external dependencies that should not be bundled.
     * 获取不应打包的外部依赖。
     */
    private _getExternalDependencies(target: UserCodeTarget): string[] {
        const common = [
            '@esengine/ecs-framework',
            '@esengine/engine-core',
            '@esengine/core',
            '@esengine/math'
        ];

        if (target === UserCodeTarget.Editor) {
            return [
                ...common,
                '@esengine/editor-core',
                'react',
                'react-dom'
            ];
        }

        return common;
    }

    /**
     * Run esbuild to compile TypeScript.
     * 运行 esbuild 编译 TypeScript。
     *
     * Uses Tauri command to invoke esbuild CLI.
     * 使用 Tauri 命令调用 esbuild CLI。
     */
    private async _runEsbuild(options: {
        entryPath: string;
        outputPath: string;
        format: 'esm' | 'iife';
        sourceMap: boolean;
        minify: boolean;
        external: string[];
        projectRoot: string;
    }): Promise<{ success: boolean; errors: CompileError[] }> {
        try {
            // Check if we're in Tauri environment | 检查是否在 Tauri 环境
            if (typeof window !== 'undefined' && '__TAURI__' in window) {
                // Use Tauri command | 使用 Tauri 命令
                const { invoke } = await import('@tauri-apps/api/core');

                const result = await invoke<{
                    success: boolean;
                    errors: Array<{
                        message: string;
                        file?: string;
                        line?: number;
                        column?: number;
                    }>;
                    outputPath?: string;
                }>('compile_typescript', {
                    options: {
                        entryPath: options.entryPath,
                        outputPath: options.outputPath,
                        format: options.format,
                        sourceMap: options.sourceMap,
                        minify: options.minify,
                        external: options.external,
                        projectRoot: options.projectRoot
                    }
                });

                return {
                    success: result.success,
                    errors: result.errors.map(e => ({
                        message: e.message,
                        file: e.file,
                        line: e.line,
                        column: e.column
                    }))
                };
            } else {
                // Not in Tauri environment, return mock success for development
                // 不在 Tauri 环境，返回模拟成功用于开发
                logger.warn('Not in Tauri environment, skipping compilation | 不在 Tauri 环境，跳过编译');
                return {
                    success: true,
                    errors: []
                };
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger.error('esbuild compilation failed | esbuild 编译失败:', error);

            return {
                success: false,
                errors: [{ message: errorMessage }]
            };
        }
    }

    /**
     * Ensure directory exists, create if not.
     * 确保目录存在，如果不存在则创建。
     */
    private async _ensureDirectory(dirPath: string): Promise<void> {
        try {
            const exists = await this._fileSystem.exists(dirPath);
            if (!exists) {
                await this._fileSystem.createDirectory(dirPath);
            }
        } catch (error) {
            logger.warn('Failed to ensure directory | 确保目录失败:', dirPath, error);
        }
    }

    /**
     * Check if a class extends Component.
     * 检查类是否继承自 Component。
     */
    private _isComponentClass(cls: any): boolean {
        // Check prototype chain for Component | 检查原型链中是否有 Component
        let proto = cls.prototype;
        while (proto) {
            if (proto.constructor?.name === 'Component') {
                return true;
            }
            proto = Object.getPrototypeOf(proto);
        }
        return false;
    }

    /**
     * Check if a class extends System.
     * 检查类是否继承自 System。
     */
    private _isSystemClass(cls: any): boolean {
        let proto = cls.prototype;
        while (proto) {
            const name = proto.constructor?.name;
            if (name === 'System' || name === 'EntityProcessingSystem') {
                return true;
            }
            proto = Object.getPrototypeOf(proto);
        }
        return false;
    }

    /**
     * Check if a class implements IComponentInspector.
     * 检查类是否实现了 IComponentInspector。
     */
    private _isInspectorClass(cls: any): boolean {
        // Check for inspector interface markers | 检查检查器接口标记
        const instance = cls.prototype;
        return instance &&
            typeof instance.canHandle === 'function' &&
            typeof instance.render === 'function' &&
            'targetComponents' in instance;
    }

    /**
     * Check if a class implements IGizmoProvider.
     * 检查类是否实现了 IGizmoProvider。
     */
    private _isGizmoClass(cls: any): boolean {
        const instance = cls.prototype;
        return instance &&
            typeof instance.draw === 'function' &&
            'targetComponent' in instance;
    }

    /**
     * Check if a value is a React panel component.
     * 检查值是否是 React 面板组件。
     */
    private _isPanelComponent(cls: any): boolean {
        // Check for panel descriptor | 检查面板描述符
        return cls.panelDescriptor !== undefined ||
            cls.displayName?.includes('Panel') ||
            cls.name?.includes('Panel');
    }

    /**
     * Notify callbacks of hot reload event.
     * 通知回调热更新事件。
     */
    private _notifyHotReload(event: HotReloadEvent): void {
        for (const callback of this._watchCallbacks) {
            try {
                callback(event);
            } catch (error) {
                logger.error('Hot reload callback error | 热更新回调错误:', error);
            }
        }
    }
}
