/**
 * User Code Service Implementation.
 * 用户代码服务实现。
 *
 * Provides compilation, loading, and hot-reload for user-written scripts.
 * 提供用户脚本的编译、加载和热更新功能。
 */

import type { IService } from '@esengine/esengine';
import { Injectable, createLogger, PlatformDetector, ComponentRegistry as CoreComponentRegistry } from '@esengine/esengine';
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
import type { ComponentInspectorRegistry, IComponentInspector } from '../ComponentInspectorRegistry';
import { GizmoRegistry } from '../../Gizmos/GizmoRegistry';

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

    /**
     * 已注册的用户系统实例
     * Registered user system instances
     */
    private _registeredSystems: any[] = [];

    /**
     * 已注册的用户 Inspector ID 列表
     * Registered user inspector IDs
     */
    private _registeredInspectorIds: string[] = [];

    /**
     * 已注册的用户 Gizmo 组件类型
     * Registered user gizmo component types
     */
    private _registeredGizmoTypes: any[] = [];

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

        // Store project path for later use in load() | 存储项目路径供 load() 使用
        this._currentProjectPath = options.projectPath;

        const sep = options.projectPath.includes('\\') ? '\\' : '/';
        const scriptsDir = `${options.projectPath}${sep}${SCRIPTS_DIR}`;
        // Ensure consistent path separators | 确保路径分隔符一致
        const userCodeOutputDir = USER_CODE_OUTPUT_DIR.replace(/\//g, sep);
        const outputDir = options.outputDir || `${options.projectPath}${sep}${userCodeOutputDir}`;

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

            // Create shim files for framework dependencies | 创建框架依赖的 shim 文件
            await this._createDependencyShims(outputDir, options.target);

            // Determine global name for IIFE output | 确定 IIFE 输出的全局名称
            const globalName = options.target === UserCodeTarget.Runtime
                ? '__USER_RUNTIME_EXPORTS__'
                : '__USER_EDITOR_EXPORTS__';

            // Build alias map for framework dependencies | 构建框架依赖的别名映射
            const shimPath = `${outputDir}${sep}_shim_ecs_framework.js`.replace(/\\/g, '/');
            const alias: Record<string, string> = {
                '@esengine/esengine': shimPath,
                '@esengine/core': shimPath,
                '@esengine/engine-core': shimPath,
                '@esengine/math': shimPath
            };

            // Compile using esbuild (via Tauri command or direct) | 使用 esbuild 编译
            // Use IIFE format to avoid ES module import issues in Tauri
            // 使用 IIFE 格式以避免 Tauri 中的 ES 模块导入问题
            const compileResult = await this._runEsbuild({
                entryPath,
                outputPath,
                format: 'iife',  // Always use IIFE for Tauri compatibility | 始终使用 IIFE 以兼容 Tauri
                globalName,
                sourceMap: options.sourceMap ?? true,
                minify: options.minify ?? false,
                external: [],  // Don't use external, use alias instead | 不使用 external，使用 alias
                alias,
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
            let moduleExports: Record<string, any>;

            if (PlatformDetector.isTauriEnvironment()) {
                // In Tauri, read file content and execute via script tag
                // 在 Tauri 中，读取文件内容并通过 script 标签执行
                // This avoids CORS and module resolution issues
                // 这避免了 CORS 和模块解析问题
                const { invoke } = await import('@tauri-apps/api/core');

                const content = await invoke<string>('read_file_content', {
                    path: modulePath
                });

                logger.debug(`Loading module via script injection`, { originalPath: modulePath });

                // Execute module code and capture exports | 执行模块代码并捕获导出
                moduleExports = await this._executeModuleCode(content, target);
            } else {
                // Fallback to file:// for non-Tauri environments
                // 非 Tauri 环境使用 file://
                const cacheBuster = `?t=${Date.now()}`;
                const moduleUrl = `file://${modulePath}${cacheBuster}`;
                moduleExports = await import(/* @vite-ignore */ moduleUrl);
            }

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
    registerComponents(module: UserCodeModule, componentRegistry?: any): void {
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
                logger.debug(`Found component: ${name} | 发现组件: ${name}`);

                // Register with Core ComponentRegistry for serialization/deserialization
                // 注册到核心 ComponentRegistry 用于序列化/反序列化
                try {
                    CoreComponentRegistry.register(exported);
                    // Debug: verify registration
                    const registeredType = CoreComponentRegistry.getComponentType(name);
                    if (registeredType) {
                        logger.info(`Component ${name} registered to core registry successfully`);
                    } else {
                        logger.warn(`Component ${name} registered but not found by name lookup`);
                    }
                } catch (err) {
                    logger.warn(`Failed to register component ${name} to core registry | 注册组件 ${name} 到核心注册表失败:`, err);
                }

                // Register with Editor ComponentRegistry for UI display
                // 注册到编辑器 ComponentRegistry 用于 UI 显示
                if (componentRegistry && typeof componentRegistry.register === 'function') {
                    try {
                        componentRegistry.register({
                            name: name,
                            type: exported,
                            category: 'User',  // User-defined components | 用户自定义组件
                            description: `User component: ${name}`
                        });
                    } catch (err) {
                        logger.warn(`Failed to register component ${name} to editor registry | 注册组件 ${name} 到编辑器注册表失败:`, err);
                    }
                }

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
     * Hot reload: update existing component instances to use new class prototype.
     * 热更新：更新现有组件实例以使用新类的原型。
     *
     * This is the core of hot reload - it updates the prototype chain of existing
     * instances so they use the new methods from the updated class while preserving
     * their data (properties).
     * 这是热更新的核心 - 它更新现有实例的原型链，使它们使用更新后类的新方法，
     * 同时保留它们的数据（属性）。
     *
     * @param module - New user code module | 新的用户代码模块
     * @returns Number of instances updated | 更新的实例数量
     */
    hotReloadInstances(module: UserCodeModule): number {
        if (module.target !== UserCodeTarget.Runtime) {
            return 0;
        }

        // Access scene through Core.scene
        // 通过 Core.scene 访问场景
        const Core = (window as any).__ESENGINE__?.ecsFramework?.Core;
        const scene = Core?.scene;
        if (!scene || !scene.entities) {
            logger.warn('No active scene for hot reload | 没有活动场景用于热更新');
            return 0;
        }

        let updatedCount = 0;

        // EntityList.buffer contains all entities
        // EntityList.buffer 包含所有实体
        const entities: any[] = scene.entities.buffer || [];

        for (const entity of entities) {
            if (!entity) continue;

            // entity.components is a getter that returns readonly Component[]
            // entity.components 是一个 getter，返回 readonly Component[]
            const components = entity.components;
            if (!components || !Array.isArray(components)) continue;

            for (const component of components) {
                if (!component) continue;

                // Get the component's type name
                // 获取组件的类型名称
                const typeName = component.constructor?.name;
                if (!typeName) continue;

                // Check if we have a new version of this component class
                // 检查是否有此组件类的新版本
                const newClass = module.exports[typeName];
                if (!newClass || typeof newClass !== 'function') continue;

                // Check if this is actually a different class (hot reload scenario)
                // 检查这是否确实是不同的类（热更新场景）
                if (component.constructor === newClass) continue;

                // Update the prototype chain to use the new class
                // 更新原型链以使用新类
                try {
                    Object.setPrototypeOf(component, newClass.prototype);
                    updatedCount++;
                    logger.debug(`Hot reloaded component instance: ${typeName} on entity ${entity.name || entity.id}`);
                } catch (err) {
                    logger.warn(`Failed to hot reload ${typeName}:`, err);
                }
            }
        }

        if (updatedCount > 0) {
            logger.info(`Hot reload: updated ${updatedCount} component instances | 热更新：更新了 ${updatedCount} 个组件实例`);
        }

        return updatedCount;
    }

    /**
     * Register user systems to scene.
     * 注册用户系统到场景。
     *
     * @param module - User code module | 用户代码模块
     * @param scene - Scene to add systems | 要添加系统的场景
     * @returns Array of registered system instances | 注册的系统实例数组
     */
    registerSystems(module: UserCodeModule, scene: any): any[] {
        if (module.target !== UserCodeTarget.Runtime) {
            logger.warn('Cannot register systems from editor module | 无法从编辑器模块注册系统');
            return [];
        }

        if (!scene) {
            logger.warn('No scene provided for system registration | 未提供场景用于系统注册');
            return [];
        }

        // 先移除之前注册的用户系统 | Remove previously registered user systems first
        this.unregisterSystems(scene);

        const registeredSystems: any[] = [];

        for (const [name, exported] of Object.entries(module.exports)) {
            if (typeof exported !== 'function') {
                continue;
            }

            // 检查是否是 System 子类 | Check if it's a System subclass
            if (this._isSystemClass(exported)) {
                try {
                    // 获取系统元数据 | Get system metadata
                    const metadata = (exported as any).__systemMetadata__;
                    const updateOrder = metadata?.updateOrder ?? 0;
                    const enabled = metadata?.enabled !== false;

                    // 实例化系统 | Instantiate system
                    const systemInstance = new (exported as any)();

                    // 设置系统属性 | Set system properties
                    if (typeof systemInstance.updateOrder !== 'undefined') {
                        systemInstance.updateOrder = updateOrder;
                    }
                    if (typeof systemInstance.enabled !== 'undefined') {
                        systemInstance.enabled = enabled;
                    }

                    // 标记为用户系统，便于后续识别和移除 | Mark as user system for later identification and removal
                    systemInstance.__isUserSystem__ = true;
                    systemInstance.__userSystemName__ = name;

                    // 添加到场景 | Add to scene
                    scene.addSystem(systemInstance);
                    registeredSystems.push(systemInstance);

                    logger.info(`Registered user system: ${name} | 注册用户系统: ${name}`, {
                        updateOrder,
                        enabled
                    });
                } catch (err) {
                    logger.error(`Failed to register system ${name} | 注册系统 ${name} 失败:`, err);
                }
            }
        }

        this._registeredSystems = registeredSystems;

        logger.info(`Registered ${registeredSystems.length} user systems | 注册了 ${registeredSystems.length} 个用户系统`);

        return registeredSystems;
    }

    /**
     * Unregister user systems from scene.
     * 从场景注销用户系统。
     *
     * @param scene - Scene to remove systems | 要移除系统的场景
     */
    unregisterSystems(scene: any): void {
        if (!scene) {
            return;
        }

        for (const system of this._registeredSystems) {
            try {
                scene.removeSystem(system);
                logger.debug(`Removed user system: ${system.__userSystemName__} | 移除用户系统: ${system.__userSystemName__}`);
            } catch (err) {
                logger.warn(`Failed to remove system ${system.__userSystemName__}:`, err);
            }
        }

        this._registeredSystems = [];
    }

    /**
     * Get registered user systems.
     * 获取已注册的用户系统。
     *
     * @returns Array of registered system instances | 注册的系统实例数组
     */
    getRegisteredSystems(): any[] {
        return [...this._registeredSystems];
    }

    /**
     * Hot reload user systems.
     * 热更新用户系统。
     *
     * Removes old systems and registers new ones from the updated module.
     * 移除旧系统并从更新的模块注册新系统。
     *
     * @param module - New user code module | 新的用户代码模块
     * @param scene - Scene to update systems | 要更新系统的场景
     * @returns Array of newly registered system instances | 新注册的系统实例数组
     */
    hotReloadSystems(module: UserCodeModule, scene: any): any[] {
        logger.info('Hot reloading user systems | 热更新用户系统');
        return this.registerSystems(module, scene);
    }

    /**
     * Register editor extensions from user module.
     * 从用户模块注册编辑器扩展。
     *
     * @param module - User code module | 用户代码模块
     * @param inspectorRegistry - Component inspector registry | 组件检查器注册表
     */
    registerEditorExtensions(module: UserCodeModule, inspectorRegistry?: ComponentInspectorRegistry): void {
        if (module.target !== UserCodeTarget.Editor) {
            logger.warn('Cannot register editor extensions from runtime module | 无法从运行时模块注册编辑器扩展');
            return;
        }

        // 先移除之前注册的扩展
        this.unregisterEditorExtensions(inspectorRegistry);

        let inspectorCount = 0;
        let gizmoCount = 0;

        for (const [name, exported] of Object.entries(module.exports)) {
            if (typeof exported !== 'function') {
                continue;
            }

            // 注册 Inspector
            if (this._isInspectorClass(exported)) {
                try {
                    const inspector = new (exported as any)() as IComponentInspector;
                    if (inspectorRegistry) {
                        inspectorRegistry.register(inspector);
                        this._registeredInspectorIds.push(inspector.id);
                        logger.info(`Registered user inspector: ${name} (${inspector.id})`);
                        inspectorCount++;
                    }
                } catch (err) {
                    logger.error(`Failed to register inspector ${name}:`, err);
                }
            }

            // 注册 Gizmo
            if (this._isGizmoClass(exported)) {
                try {
                    const gizmoProvider = new (exported as any)();
                    const targetComponent = gizmoProvider.targetComponent;
                    if (targetComponent) {
                        GizmoRegistry.register(targetComponent, (component, entity, isSelected) => {
                            return gizmoProvider.draw(component, entity, isSelected);
                        });
                        this._registeredGizmoTypes.push(targetComponent);
                        logger.info(`Registered user gizmo for: ${targetComponent.name || name}`);
                        gizmoCount++;
                    }
                } catch (err) {
                    logger.error(`Failed to register gizmo ${name}:`, err);
                }
            }
        }

        logger.info(`Registered editor extensions | 注册编辑器扩展`, {
            inspectors: inspectorCount,
            gizmos: gizmoCount
        });
    }

    /**
     * Unregister editor extensions.
     * 注销编辑器扩展。
     *
     * @param inspectorRegistry - Component inspector registry | 组件检查器注册表
     */
    unregisterEditorExtensions(inspectorRegistry?: ComponentInspectorRegistry): void {
        // 注销 Inspector
        if (inspectorRegistry) {
            for (const id of this._registeredInspectorIds) {
                inspectorRegistry.unregister(id);
            }
        }
        this._registeredInspectorIds = [];

        // 注销 Gizmo
        for (const componentType of this._registeredGizmoTypes) {
            GizmoRegistry.unregister(componentType);
        }
        this._registeredGizmoTypes = [];
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
            if (PlatformDetector.isTauriEnvironment()) {
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
            if (PlatformDetector.isTauriEnvironment()) {
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
     *
     * Entry file is in: {projectPath}/.esengine/compiled/_entry_runtime.ts
     * Scripts are in: {projectPath}/scripts/
     * So the relative path from entry to scripts is: ../../scripts/
     *
     * For IIFE format, we inject shims that map global variables to module imports.
     * This allows user code to use `import { Component } from '@esengine/esengine'`
     * while actually accessing `window.__ESENGINE_FRAMEWORK__`.
     * 对于 IIFE 格式，我们注入 shim 将全局变量映射到模块导入。
     * 这使用户代码可以使用 `import { Component } from '@esengine/esengine'`，
     * 实际上访问的是 `window.__ESENGINE_FRAMEWORK__`。
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

        // Entry file is in .esengine/compiled/, need to go up 2 levels to reach project root
        // 入口文件在 .esengine/compiled/ 目录，需要上升 2 级到达项目根目录
        const relativePrefix = `../../${SCRIPTS_DIR}`;

        for (const script of scripts) {
            // Convert absolute path to relative import | 将绝对路径转换为相对导入
            const relativePath = script.relativePath.replace(/\\/g, '/').replace(/\.tsx?$/, '');

            if (script.exports.length > 0) {
                lines.push(`export { ${script.exports.join(', ')} } from '${relativePrefix}/${relativePath}';`);
            } else {
                // Re-export everything if we couldn't detect specific exports
                // 如果无法检测到具体导出，则重新导出所有内容
                lines.push(`export * from '${relativePrefix}/${relativePath}';`);
            }
        }

        return lines.join('\n');
    }

    /**
     * Create shim files that map global variables to module imports.
     * 创建将全局变量映射到模块导入的 shim 文件。
     *
     * This is used for IIFE format to resolve external dependencies.
     * The shim exports the global __ESENGINE__.ecsFramework which is set by PluginSDKRegistry.
     * 这用于 IIFE 格式解析外部依赖。
     * shim 导出全局的 __ESENGINE__.ecsFramework，由 PluginSDKRegistry 设置。
     *
     * @param outputDir - Output directory | 输出目录
     * @param target - Target environment | 目标环境
     * @returns Array of shim file paths | shim 文件路径数组
     */
    private async _createDependencyShims(
        outputDir: string,
        target: UserCodeTarget
    ): Promise<string[]> {
        const sep = outputDir.includes('\\') ? '\\' : '/';
        const shimPaths: string[] = [];

        // Create shim for @esengine/esengine | 为 @esengine/esengine 创建 shim
        // This uses window.__ESENGINE__.ecsFramework set by PluginSDKRegistry
        // 这使用 PluginSDKRegistry 设置的 window.__ESENGINE__.ecsFramework
        const ecsShimPath = `${outputDir}${sep}_shim_ecs_framework.js`;
        const ecsShimContent = `// Shim for @esengine/esengine
// Maps to window.__ESENGINE__.ecsFramework set by PluginSDKRegistry
module.exports = (typeof window !== 'undefined' && window.__ESENGINE__ && window.__ESENGINE__.ecsFramework) || {};
`;
        await this._fileSystem.writeFile(ecsShimPath, ecsShimContent);
        shimPaths.push(ecsShimPath);

        return shimPaths;
    }

    /**
     * Get external dependencies that should not be bundled.
     * 获取不应打包的外部依赖。
     */
    private _getExternalDependencies(target: UserCodeTarget): string[] {
        const common = [
            '@esengine/esengine',
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
        globalName?: string;
        sourceMap: boolean;
        minify: boolean;
        external: string[];
        alias?: Record<string, string>;
        projectRoot: string;
    }): Promise<{ success: boolean; errors: CompileError[] }> {
        try {
            // Check if we're in Tauri environment | 检查是否在 Tauri 环境
            if (PlatformDetector.isTauriEnvironment()) {
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
                        globalName: options.globalName,
                        sourceMap: options.sourceMap,
                        minify: options.minify,
                        external: options.external,
                        alias: options.alias,
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
     * Execute compiled module code and return exports.
     * 执行编译后的模块代码并返回导出。
     *
     * The code should be in IIFE format that sets a global variable.
     * 代码应该是设置全局变量的 IIFE 格式。
     *
     * @param code - Compiled JavaScript code | 编译后的 JavaScript 代码
     * @param target - Target environment | 目标环境
     * @returns Module exports | 模块导出
     */
    private async _executeModuleCode(
        code: string,
        target: UserCodeTarget
    ): Promise<Record<string, any>> {
        // Determine global name based on target | 根据目标确定全局名称
        const globalName = target === UserCodeTarget.Runtime
            ? '__USER_RUNTIME_EXPORTS__'
            : '__USER_EDITOR_EXPORTS__';

        // Clear any previous exports | 清除之前的导出
        (window as any)[globalName] = undefined;

        try {
            // esbuild generates: var __USER_RUNTIME_EXPORTS__ = (() => {...})();
            // When executed via new Function(), var declarations stay in function scope
            // We need to replace "var globalName" with "window.globalName" to expose it
            // esbuild 生成: var __USER_RUNTIME_EXPORTS__ = (() => {...})();
            // 通过 new Function() 执行时，var 声明在函数作用域内
            // 需要替换 "var globalName" 为 "window.globalName" 以暴露到全局
            const modifiedCode = code.replace(
                new RegExp(`^"use strict";\\s*var ${globalName}`, 'm'),
                `"use strict";\nwindow.${globalName}`
            );

            // Execute the IIFE code | 执行 IIFE 代码
            // eslint-disable-next-line no-new-func
            const executeScript = new Function(modifiedCode);
            executeScript();

            // Get exports from global | 从全局获取导出
            const exports = (window as any)[globalName] || {};

            return exports;
        } catch (error) {
            logger.error('Failed to execute user code | 执行用户代码失败:', error);
            throw error;
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
     *
     * Uses the actual Component class from the global framework to check inheritance.
     * 使用全局框架中的实际 Component 类来检查继承关系。
     */
    private _isComponentClass(cls: any): boolean {
        // Get Component class from global framework | 从全局框架获取 Component 类
        const framework = (window as any).__ESENGINE__?.ecsFramework;

        if (!framework?.Component) {
            return false;
        }

        // Use instanceof or prototype chain check | 使用 instanceof 或原型链检查
        try {
            const ComponentClass = framework.Component;

            // Check if cls.prototype is an instance of Component
            // 检查 cls.prototype 是否是 Component 的实例
            return cls.prototype instanceof ComponentClass ||
                   ComponentClass.prototype.isPrototypeOf(cls.prototype);
        } catch {
            return false;
        }
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
