/**
 * Module Registry Service.
 * 模块注册表服务。
 *
 * Manages engine modules, their dependencies, and project configurations.
 * 管理引擎模块、其依赖关系和项目配置。
 */

import type {
    ModuleManifest,
    ModuleRegistryEntry,
    ModuleDisableValidation,
    ProjectModuleConfig,
    SceneModuleUsage,
    ScriptModuleUsage
} from './ModuleTypes';

/**
 * File system interface for module operations.
 * 模块操作的文件系统接口。
 */
export interface IModuleFileSystem {
    /** Read JSON file | 读取 JSON 文件 */
    readJson<T>(path: string): Promise<T>;
    /** Write JSON file | 写入 JSON 文件 */
    writeJson(path: string, data: unknown): Promise<void>;
    /** Check if path exists | 检查路径是否存在 */
    pathExists(path: string): Promise<boolean>;
    /** List files by extension | 按扩展名列出文件 */
    listFiles(dir: string, extensions: string[], recursive?: boolean): Promise<string[]>;
    /** Read file as text | 读取文件为文本 */
    readText(path: string): Promise<string>;
}

/**
 * Module Registry Service.
 * 模块注册表服务。
 */
export class ModuleRegistry {
    private _modules: Map<string, ModuleRegistryEntry> = new Map();
    private _projectConfig: ProjectModuleConfig = { enabled: [] };
    private _fileSystem: IModuleFileSystem | null = null;
    private _engineModulesPath: string = '';
    private _projectPath: string = '';

    /**
     * Initialize the registry.
     * 初始化注册表。
     *
     * @param fileSystem - File system service | 文件系统服务
     * @param engineModulesPath - Path to engine modules | 引擎模块路径
     */
    async initialize(
        fileSystem: IModuleFileSystem,
        engineModulesPath: string
    ): Promise<void> {
        this._fileSystem = fileSystem;
        this._engineModulesPath = engineModulesPath;

        // Load all module manifests | 加载所有模块清单
        await this._loadModuleManifests();
    }

    /**
     * Set current project.
     * 设置当前项目。
     *
     * @param projectPath - Project path | 项目路径
     */
    async setProject(projectPath: string): Promise<void> {
        this._projectPath = projectPath;
        await this._loadProjectConfig();
        this._updateModuleStates();
    }

    /**
     * Get all registered modules.
     * 获取所有注册的模块。
     */
    getAllModules(): ModuleRegistryEntry[] {
        return Array.from(this._modules.values());
    }

    /**
     * Get module by ID.
     * 通过 ID 获取模块。
     */
    getModule(id: string): ModuleRegistryEntry | undefined {
        return this._modules.get(id);
    }

    /**
     * Get enabled modules for current project.
     * 获取当前项目启用的模块。
     */
    getEnabledModules(): ModuleRegistryEntry[] {
        return this.getAllModules().filter(m => m.isEnabled);
    }

    /**
     * Get modules by category.
     * 按分类获取模块。
     */
    getModulesByCategory(): Map<string, ModuleRegistryEntry[]> {
        const categories = new Map<string, ModuleRegistryEntry[]>();

        for (const module of this._modules.values()) {
            const category = module.category;
            if (!categories.has(category)) {
                categories.set(category, []);
            }
            categories.get(category)!.push(module);
        }

        return categories;
    }

    /**
     * Validate if a module can be disabled.
     * 验证模块是否可以禁用。
     *
     * @param moduleId - Module ID | 模块 ID
     */
    async validateDisable(moduleId: string): Promise<ModuleDisableValidation> {
        const module = this._modules.get(moduleId);

        if (!module) {
            return {
                canDisable: false,
                reason: 'core',
                message: `Module "${moduleId}" not found | 未找到模块 "${moduleId}"`
            };
        }

        // Core modules cannot be disabled | 核心模块不能禁用
        if (module.isCore) {
            return {
                canDisable: false,
                reason: 'core',
                message: `"${module.displayName}" is a core module and cannot be disabled | "${module.displayName}" 是核心模块，不能禁用`
            };
        }

        // Check if other enabled modules depend on this | 检查其他启用的模块是否依赖此模块
        const dependents = this._getEnabledDependents(moduleId);
        if (dependents.length > 0) {
            return {
                canDisable: false,
                reason: 'dependency',
                message: `The following enabled modules depend on "${module.displayName}" | 以下启用的模块依赖 "${module.displayName}"`,
                dependentModules: dependents
            };
        }

        // Check scene usage | 检查场景使用
        const sceneUsages = await this._checkSceneUsage(moduleId);
        if (sceneUsages.length > 0) {
            return {
                canDisable: false,
                reason: 'scene-usage',
                message: `"${module.displayName}" components are used in scenes | "${module.displayName}" 组件在场景中使用`,
                sceneUsages
            };
        }

        // Check script usage | 检查脚本使用
        const scriptUsages = await this._checkScriptUsage(moduleId);
        if (scriptUsages.length > 0) {
            return {
                canDisable: false,
                reason: 'script-usage',
                message: `"${module.displayName}" is imported in scripts | "${module.displayName}" 在脚本中被导入`,
                scriptUsages
            };
        }

        return { canDisable: true };
    }

    /**
     * Enable a module.
     * 启用模块。
     *
     * @param moduleId - Module ID | 模块 ID
     */
    async enableModule(moduleId: string): Promise<boolean> {
        const module = this._modules.get(moduleId);
        if (!module) return false;

        // Enable dependencies first | 先启用依赖
        for (const depId of module.dependencies) {
            if (!this._projectConfig.enabled.includes(depId)) {
                await this.enableModule(depId);
            }
        }

        // Enable this module | 启用此模块
        if (!this._projectConfig.enabled.includes(moduleId)) {
            this._projectConfig.enabled.push(moduleId);
            await this._saveProjectConfig();
            this._updateModuleStates();
        }

        return true;
    }

    /**
     * Disable a module.
     * 禁用模块。
     *
     * @param moduleId - Module ID | 模块 ID
     * @param force - Force disable even if validation fails | 即使验证失败也强制禁用
     */
    async disableModule(moduleId: string, force: boolean = false): Promise<boolean> {
        if (!force) {
            const validation = await this.validateDisable(moduleId);
            if (!validation.canDisable) {
                return false;
            }
        }

        const index = this._projectConfig.enabled.indexOf(moduleId);
        if (index !== -1) {
            this._projectConfig.enabled.splice(index, 1);
            await this._saveProjectConfig();
            this._updateModuleStates();
        }

        return true;
    }

    /**
     * Get total build size for enabled modules (JS + WASM).
     * 获取启用模块的总构建大小（JS + WASM）。
     */
    getTotalBuildSize(): { jsSize: number; wasmSize: number; total: number } {
        let jsSize = 0;
        let wasmSize = 0;
        for (const module of this.getEnabledModules()) {
            jsSize += module.jsSize || 0;
            wasmSize += module.wasmSize || 0;
        }
        return { jsSize, wasmSize, total: jsSize + wasmSize };
    }

    /**
     * Generate build entry file content.
     * 生成构建入口文件内容。
     *
     * Creates a dynamic entry that only imports enabled modules.
     * 创建仅导入启用模块的动态入口。
     */
    generateBuildEntry(): string {
        const enabledModules = this.getEnabledModules();
        const lines: string[] = [
            '// Auto-generated build entry',
            '// 自动生成的构建入口',
            ''
        ];

        // Export core modules | 导出核心模块
        const coreModules = enabledModules.filter(m => m.isCore);
        for (const module of coreModules) {
            lines.push(`export * from '${module.name}';`);
        }

        lines.push('');

        // Export optional modules | 导出可选模块
        const optionalModules = enabledModules.filter(m => !m.isCore);
        for (const module of optionalModules) {
            lines.push(`export * from '${module.name}';`);
        }

        lines.push('');
        lines.push('// Module registration');
        lines.push('// 模块注册');
        lines.push(`import { registerModule } from '@esengine/core';`);
        lines.push('');

        // Import module classes | 导入模块类
        for (const module of optionalModules) {
            const moduleName = this._toModuleClassName(module.id);
            lines.push(`import { ${moduleName} } from '${module.name}';`);
        }

        lines.push('');

        // Register modules | 注册模块
        for (const module of optionalModules) {
            const moduleName = this._toModuleClassName(module.id);
            lines.push(`registerModule(${moduleName});`);
        }

        return lines.join('\n');
    }

    // ==================== Private Methods | 私有方法 ====================

    /**
     * Load module manifests from engine modules directory.
     * 从引擎模块目录加载模块清单。
     *
     * Reads index.json which contains all module data including build-time calculated sizes.
     * 读取 index.json，其中包含所有模块数据，包括构建时计算的大小。
     */
    private async _loadModuleManifests(): Promise<void> {
        if (!this._fileSystem) return;

        // Read module index from engine/ directory
        // 从 engine/ 目录读取模块索引
        const indexPath = `${this._engineModulesPath}/index.json`;

        try {
            if (await this._fileSystem.pathExists(indexPath)) {
                // Load from index.json generated by copy-modules script
                // 从 copy-modules 脚本生成的 index.json 加载
                const index = await this._fileSystem.readJson<{
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
                        jsSize?: number;
                        requiresWasm?: boolean;
                        wasmSize?: number;
                    }>;
                }>(indexPath);

                console.log(`[ModuleRegistry] Loaded ${index.modules.length} modules from index.json`);

                // Use data directly from index.json (includes jsSize, wasmSize)
                // 直接使用 index.json 中的数据（包含 jsSize、wasmSize）
                for (const m of index.modules) {
                    this._modules.set(m.id, {
                        id: m.id,
                        name: m.name,
                        displayName: m.displayName,
                        description: '',
                        version: '1.0.0',
                        category: m.category as any,
                        isCore: m.isCore,
                        defaultEnabled: m.isCore,
                        dependencies: [],
                        exports: {},
                        editorPackage: m.editorPackage,
                        jsSize: m.jsSize,
                        wasmSize: m.wasmSize,
                        requiresWasm: m.requiresWasm,
                        // Registry entry fields
                        path: `${this._engineModulesPath}/${m.id}`,
                        isEnabled: false,
                        dependents: [],
                        dependenciesSatisfied: true
                    });
                }

                // Load full manifests for additional fields (description, dependencies, exports)
                // 加载完整清单以获取额外字段（描述、依赖、导出）
                for (const m of index.modules) {
                    const manifestPath = `${this._engineModulesPath}/${m.id}/module.json`;
                    try {
                        if (await this._fileSystem.pathExists(manifestPath)) {
                            const manifest = await this._fileSystem.readJson<ModuleManifest>(manifestPath);
                            const existing = this._modules.get(m.id);
                            if (existing) {
                                // Merge manifest data but keep jsSize/wasmSize from index
                                // 合并清单数据但保留 index 中的 jsSize/wasmSize
                                existing.description = manifest.description || '';
                                existing.version = manifest.version || '1.0.0';
                                existing.dependencies = manifest.dependencies || [];
                                existing.exports = manifest.exports || {};
                                existing.tags = manifest.tags;
                                existing.icon = manifest.icon;
                                existing.platforms = manifest.platforms;
                                existing.canContainContent = manifest.canContainContent;
                            }
                        }
                    } catch {
                        // Ignore errors loading individual manifests
                    }
                }
            } else {
                console.warn(`[ModuleRegistry] index.json not found at ${indexPath}, run 'pnpm copy-modules' first`);
            }
        } catch (error) {
            console.error('[ModuleRegistry] Failed to load index.json:', error);
        }

        // Compute dependents | 计算依赖者
        this._computeDependents();
    }

    /**
     * Compute which modules depend on each module.
     * 计算哪些模块依赖每个模块。
     */
    private _computeDependents(): void {
        for (const module of this._modules.values()) {
            module.dependents = [];
        }

        for (const module of this._modules.values()) {
            for (const depId of module.dependencies) {
                const dep = this._modules.get(depId);
                if (dep) {
                    dep.dependents.push(module.id);
                }
            }
        }
    }

    /**
     * Load project module configuration.
     * 加载项目模块配置。
     */
    private async _loadProjectConfig(): Promise<void> {
        if (!this._fileSystem || !this._projectPath) return;

        const configPath = `${this._projectPath}/esengine.project.json`;

        try {
            if (await this._fileSystem.pathExists(configPath)) {
                const config = await this._fileSystem.readJson<{ modules?: ProjectModuleConfig }>(configPath);
                this._projectConfig = config.modules || { enabled: this._getDefaultEnabledModules() };
            } else {
                // Create default config | 创建默认配置
                this._projectConfig = { enabled: this._getDefaultEnabledModules() };
            }
        } catch (error) {
            console.error('[ModuleRegistry] Failed to load project config:', error);
            this._projectConfig = { enabled: this._getDefaultEnabledModules() };
        }
    }

    /**
     * Save project module configuration.
     * 保存项目模块配置。
     */
    private async _saveProjectConfig(): Promise<void> {
        if (!this._fileSystem || !this._projectPath) return;

        const configPath = `${this._projectPath}/esengine.project.json`;

        try {
            let config: Record<string, unknown> = {};

            if (await this._fileSystem.pathExists(configPath)) {
                config = await this._fileSystem.readJson<Record<string, unknown>>(configPath);
            }

            config.modules = this._projectConfig;
            await this._fileSystem.writeJson(configPath, config);
        } catch (error) {
            console.error('[ModuleRegistry] Failed to save project config:', error);
        }
    }

    /**
     * Get default enabled modules.
     * 获取默认启用的模块。
     */
    private _getDefaultEnabledModules(): string[] {
        const defaults: string[] = [];

        for (const module of this._modules.values()) {
            if (module.isCore || module.defaultEnabled) {
                defaults.push(module.id);
            }
        }

        return defaults;
    }

    /**
     * Update module enabled states based on project config.
     * 根据项目配置更新模块启用状态。
     */
    private _updateModuleStates(): void {
        for (const module of this._modules.values()) {
            module.isEnabled = module.isCore || this._projectConfig.enabled.includes(module.id);
            module.dependenciesSatisfied = module.dependencies.every(
                depId => this._projectConfig.enabled.includes(depId) || this._modules.get(depId)?.isCore
            );
        }
    }

    /**
     * Get enabled modules that depend on the given module.
     * 获取依赖给定模块的已启用模块。
     */
    private _getEnabledDependents(moduleId: string): string[] {
        const module = this._modules.get(moduleId);
        if (!module) return [];

        return module.dependents.filter(depId => {
            const dep = this._modules.get(depId);
            return dep?.isEnabled;
        });
    }

    /**
     * Check if module is used in any scene.
     * 检查模块是否在任何场景中使用。
     */
    private async _checkSceneUsage(moduleId: string): Promise<SceneModuleUsage[]> {
        if (!this._fileSystem || !this._projectPath) return [];

        const module = this._modules.get(moduleId);
        if (!module || !module.exports.components?.length) return [];

        const usages: SceneModuleUsage[] = [];
        const sceneDir = `${this._projectPath}/assets`;

        try {
            const sceneFiles = await this._fileSystem.listFiles(sceneDir, ['.ecs'], true);

            for (const scenePath of sceneFiles) {
                const sceneContent = await this._fileSystem.readText(scenePath);
                const componentUsages: SceneModuleUsage['components'] = [];

                for (const componentName of module.exports.components) {
                    // Count occurrences of component type in scene
                    // 计算场景中组件类型的出现次数
                    const regex = new RegExp(`"type"\\s*:\\s*"${componentName}"`, 'g');
                    const matches = sceneContent.match(regex);
                    if (matches && matches.length > 0) {
                        componentUsages.push({
                            type: componentName,
                            count: matches.length
                        });
                    }
                }

                if (componentUsages.length > 0) {
                    usages.push({
                        scenePath,
                        components: componentUsages
                    });
                }
            }
        } catch (error) {
            console.warn('[ModuleRegistry] Failed to check scene usage:', error);
        }

        return usages;
    }

    /**
     * Check if module is imported in any user script.
     * 检查模块是否在任何用户脚本中被导入。
     */
    private async _checkScriptUsage(moduleId: string): Promise<ScriptModuleUsage[]> {
        if (!this._fileSystem || !this._projectPath) return [];

        const module = this._modules.get(moduleId);
        if (!module) return [];

        const usages: ScriptModuleUsage[] = [];
        const scriptsDir = `${this._projectPath}/scripts`;

        try {
            if (!await this._fileSystem.pathExists(scriptsDir)) {
                return [];
            }

            const scriptFiles = await this._fileSystem.listFiles(scriptsDir, ['.ts', '.tsx', '.js'], true);

            for (const scriptPath of scriptFiles) {
                const content = await this._fileSystem.readText(scriptPath);
                const lines = content.split('\n');

                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i];

                    // Check for import from module package | 检查模块包的导入
                    if (line.includes(module.name) && line.includes('import')) {
                        usages.push({
                            scriptPath,
                            line: i + 1,
                            importStatement: line.trim()
                        });
                    }

                    // Check for component imports | 检查组件导入
                    if (module.exports.components) {
                        for (const component of module.exports.components) {
                            if (line.includes(component) && line.includes('import')) {
                                usages.push({
                                    scriptPath,
                                    line: i + 1,
                                    importStatement: line.trim()
                                });
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.warn('[ModuleRegistry] Failed to check script usage:', error);
        }

        return usages;
    }

    /**
     * Convert module ID to class name.
     * 将模块 ID 转换为类名。
     */
    private _toModuleClassName(id: string): string {
        return id
            .split('-')
            .map(part => part.charAt(0).toUpperCase() + part.slice(1))
            .join('') + 'Module';
    }
}

// Export singleton instance | 导出单例实例
export const moduleRegistry = new ModuleRegistry();
