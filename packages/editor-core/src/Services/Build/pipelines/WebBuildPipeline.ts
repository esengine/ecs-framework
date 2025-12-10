/**
 * Web Platform Build Pipeline.
 * Web 平台构建管线。
 *
 * Supports two build modes:
 * 支持两种构建模式：
 *
 * 1. split-bundles (recommended): Core runtime + plugins loaded on demand
 *    分包模式（推荐）：核心运行时 + 插件按需加载
 *    - Smaller initial load (~150KB core)
 *    - Better caching (plugins cached separately)
 *    - Best for production games
 *
 * 2. single-bundle: All code in one file
 *    单包模式：所有代码打包到一个文件
 *    - Single HTTP request
 *    - Best for small games / playable ads
 *
 * Output structure (split-bundles):
 * 输出结构（分包模式）：
 * ```
 * build/web/
 * ├── index.html
 * ├── libs/
 * │   ├── esengine.core.js      # Core runtime
 * │   ├── plugins/              # Plugin bundles
 * │   │   ├── sprite.js
 * │   │   ├── tilemap.js
 * │   │   └── ...
 * │   └── wasm/                 # WASM files
 * │       └── es_engine_bg.wasm
 * ├── assets/
 * │   └── ...
 * ├── scenes/
 * │   └── main.ecs
 * └── asset-catalog.json
 * ```
 */

import type {
    IBuildPipeline,
    BuildConfig,
    BuildResult,
    BuildProgress,
    BuildStep,
    BuildContext,
    WebBuildConfig,
    InlineConfig
} from '../IBuildPipeline';
import { BuildPlatform, BuildStatus } from '../IBuildPipeline';
import type { ModuleManifest } from '../../Module/ModuleTypes';
import { hashFileInfo } from '@esengine/asset-system';

// ============================================================================
// Build File System Interface
// ============================================================================

/**
 * Build file system interface.
 * 构建文件系统接口。
 *
 * Implemented by editor-app's BuildFileSystemService.
 * 由 editor-app 的 BuildFileSystemService 实现。
 */
export interface IBuildFileSystem {
    prepareBuildDirectory(outputPath: string): Promise<void>;
    copyDirectory(src: string, dst: string, patterns?: string[]): Promise<number>;
    bundleScripts(options: {
        entryPoints: string[];
        outputDir: string;
        format: 'esm' | 'iife';
        bundleName: string;
        minify: boolean;
        sourceMap: boolean;
        external: string[];
        projectRoot: string;
        define?: Record<string, string>;
        globalName?: string;
        /** Module alias mappings | 模块别名映射 */
        alias?: Record<string, string>;
        /** Files to inject at the start of bundle | 在打包开始时注入的文件 */
        inject?: string[];
        /** Banner code to prepend to bundle | 添加到打包文件开头的代码 */
        banner?: string;
    }): Promise<{
        success: boolean;
        outputFile?: string;
        outputSize?: number;
        error?: string;
        warnings: string[];
    }>;
    /** List files by extension | 按扩展名列出文件 */
    listFilesByExtension(dirPath: string, extensions: string[], recursive?: boolean): Promise<string[]>;
    generateHtml(outputPath: string, title: string, scripts: string[], bodyContent?: string): Promise<void>;
    getFileSize(filePath: string): Promise<number>;
    getDirectorySize(dirPath: string): Promise<number>;
    writeJsonFile(filePath: string, content: string): Promise<void>;
    listFilesByExtension(dirPath: string, extensions: string[], recursive?: boolean): Promise<string[]>;
    copyFile(src: string, dst: string): Promise<void>;
    pathExists(path: string): Promise<boolean>;
    readFile(path: string): Promise<string>;
    writeFile(path: string, content: string): Promise<void>;
    readJson<T>(path: string): Promise<T>;
    createDirectory(path: string): Promise<void>;
    readBinaryFileAsBase64?(path: string): Promise<string>;
    /** Delete a file | 删除文件 */
    deleteFile?(path: string): Promise<void>;
}

// ============================================================================
// Module Classification
// ============================================================================

/**
 * Check if a module is a core module.
 * Uses the "isCore" field from module.json instead of hardcoded list.
 * 检查模块是否是核心模块。
 * 使用 module.json 中的 "isCore" 字段，而非硬编码列表。
 */
function isCoreModule(module: ModuleManifest): boolean {
    return module.isCore === true;
}

// ============================================================================
// Web Build Pipeline
// ============================================================================

/**
 * Web Platform Build Pipeline.
 * Web 平台构建管线。
 */
export class WebBuildPipeline implements IBuildPipeline {
    readonly platform = BuildPlatform.Web;
    readonly displayName = 'Web / H5';
    readonly description = 'Build for web browsers | 构建为 Web 应用';
    readonly icon = 'globe';

    private _fileSystem: IBuildFileSystem | null = null;
    private _enabledModules: string[] = [];
    private _disabledModules: string[] = [];
    private _engineModulesPath: string = '';

    // ========================================================================
    // Configuration
    // ========================================================================

    setFileSystem(fileSystem: IBuildFileSystem): void {
        this._fileSystem = fileSystem;
    }

    setEnabledModules(modules: string[]): void {
        this._enabledModules = modules;
    }

    setDisabledModules(modules: string[]): void {
        this._disabledModules = modules;
    }

    setEngineModulesPath(path: string): void {
        this._engineModulesPath = path;
    }

    getDefaultConfig(): WebBuildConfig {
        return {
            platform: BuildPlatform.Web,
            outputPath: './build/web',
            isRelease: true,
            sourceMap: false,
            buildMode: 'split-bundles',
            minify: true,
            generateHtml: true,
            assetLoadingStrategy: 'on-demand',
            generateAssetCatalog: true
        };
    }

    validateConfig(config: BuildConfig): string[] {
        const errors: string[] = [];
        const webConfig = config as WebBuildConfig;

        if (!webConfig.outputPath) {
            errors.push('Output path is required | 输出路径不能为空');
        }

        const validModes = ['single-bundle', 'split-bundles', 'single-file'];
        if (!validModes.includes(webConfig.buildMode)) {
            errors.push('Build mode must be "split-bundles", "single-bundle", or "single-file" | 构建模式必须是 "split-bundles"、"single-bundle" 或 "single-file"');
        }

        if (!webConfig.scenes || webConfig.scenes.length === 0) {
            errors.push('At least one scene must be selected | 至少需要选择一个场景');
        }

        return errors;
    }

    // ========================================================================
    // Build Steps
    // ========================================================================

    getSteps(config: BuildConfig): BuildStep[] {
        const webConfig = config as WebBuildConfig;

        // Single-file mode has a completely different pipeline
        // 单文件模式使用完全不同的构建管线
        if (webConfig.buildMode === 'single-file') {
            return [
                {
                    id: 'prepare',
                    name: 'Prepare build directory | 准备构建目录',
                    execute: this._stepPrepare.bind(this)
                },
                {
                    id: 'analyze',
                    name: 'Analyze project | 分析项目',
                    execute: this._stepAnalyze.bind(this)
                },
                {
                    id: 'bundle-single-file',
                    name: 'Build single file | 构建单文件',
                    execute: this._stepBundleSingleFile.bind(this)
                }
            ];
        }

        // Standard pipeline for split-bundles and single-bundle modes
        // 分包和单包模式的标准管线
        const steps: BuildStep[] = [
            {
                id: 'prepare',
                name: 'Prepare build directory | 准备构建目录',
                execute: this._stepPrepare.bind(this)
            },
            {
                id: 'analyze',
                name: 'Analyze project | 分析项目',
                execute: this._stepAnalyze.bind(this)
            },
            {
                id: 'bundle-runtime',
                name: 'Bundle runtime | 打包运行时',
                execute: webConfig.buildMode === 'split-bundles'
                    ? this._stepBundleSplit.bind(this)
                    : this._stepBundleSingle.bind(this)
            },
            {
                id: 'copy-assets',
                name: 'Copy assets | 复制资产',
                execute: this._stepCopyAssets.bind(this)
            },
            {
                id: 'copy-scenes',
                name: 'Copy scenes | 复制场景',
                execute: this._stepCopyScenes.bind(this)
            },
            {
                id: 'bundle-user-scripts',
                name: 'Bundle user scripts | 打包用户脚本',
                execute: this._stepBundleUserScripts.bind(this)
            }
        ];

        if (webConfig.generateAssetCatalog !== false) {
            steps.push({
                id: 'generate-catalog',
                name: 'Generate asset catalog | 生成资产清单',
                execute: this._stepGenerateCatalog.bind(this)
            });
        }

        if (webConfig.generateHtml) {
            steps.push({
                id: 'generate-html',
                name: 'Generate HTML | 生成 HTML',
                execute: this._stepGenerateHtml.bind(this)
            });
        }

        // Always generate server scripts (required for WASM loading and ESM imports)
        // 始终生成启动脚本（WASM 加载和 ESM 导入需要 HTTP 服务器）
        steps.push({
            id: 'generate-server-scripts',
            name: 'Generate server scripts | 生成启动脚本',
            execute: this._stepGenerateServerScripts.bind(this)
        });

        return steps;
    }

    // ========================================================================
    // Build Execution
    // ========================================================================

    async build(
        config: BuildConfig,
        onProgress?: (progress: BuildProgress) => void,
        abortSignal?: AbortSignal
    ): Promise<BuildResult> {
        const startTime = Date.now();
        const warnings: string[] = [];
        const outputFiles: string[] = [];

        const steps = this.getSteps(config);
        const totalSteps = steps.length;

        // Derive project root from output path
        const outputPathParts = config.outputPath.replace(/\\/g, '/').split('/');
        const buildIndex = outputPathParts.lastIndexOf('build');
        const projectRoot = buildIndex > 0
            ? outputPathParts.slice(0, buildIndex).join('/')
            : '.';

        // Build log collector
        // 构建日志收集器
        const buildLogs: string[] = [
            `=== ESEngine Web Build Log ===`,
            `Build started: ${new Date().toISOString()}`,
            `Platform: Web`,
            `Build mode: ${(config as WebBuildConfig).buildMode}`,
            `Output path: ${config.outputPath}`,
            `Project root: ${projectRoot}`,
            ``
        ];

        const logMessage = (msg: string): void => {
            const timestamp = new Date().toISOString().slice(11, 23);
            const line = `[${timestamp}] ${msg}`;
            buildLogs.push(line);
            console.log(`[WebBuild] ${msg}`);
        };

        const context: BuildContext = {
            config,
            projectRoot,
            tempDir: `${projectRoot}/temp/build`,
            outputDir: config.outputPath,
            reportProgress: (msg, progress) => {
                logMessage(`${msg}${progress !== undefined ? ` (${progress}%)` : ''}`);
            },
            addWarning: (warning) => {
                warnings.push(warning);
                logMessage(`[WARNING] ${warning}`);
            },
            abortSignal: abortSignal || new AbortController().signal,
            data: new Map()
        };

        // Store file system and log function in context
        context.data.set('fileSystem', this._fileSystem);
        context.data.set('engineModulesPath', this._engineModulesPath);
        context.data.set('logMessage', logMessage);

        try {
            for (let i = 0; i < steps.length; i++) {
                const step = steps[i];

                if (abortSignal?.aborted) {
                    return this._createResult(false, config, startTime, outputFiles, warnings, 'Build cancelled | 构建已取消');
                }

                onProgress?.({
                    status: this._getStatusForStep(step.id),
                    message: step.name,
                    progress: Math.round((i / totalSteps) * 100),
                    currentStep: i + 1,
                    totalSteps,
                    warnings
                });

                console.log(`[WebBuild] Step ${i + 1}/${totalSteps}: ${step.name}`);
                await step.execute(context);
            }

            // Calculate final stats
            let stats: BuildResult['stats'] | undefined;
            if (this._fileSystem) {
                try {
                    const totalSize = await this._fileSystem.getDirectorySize(config.outputPath);
                    stats = { totalSize, jsSize: 0, wasmSize: 0, assetsSize: 0 };
                } catch {
                    // Ignore
                }
            }

            // Build completed successfully
            const duration = Date.now() - startTime;
            buildLogs.push('');
            buildLogs.push(`=== Build Completed ===`);
            buildLogs.push(`Duration: ${(duration / 1000).toFixed(2)}s`);
            buildLogs.push(`Total size: ${stats?.totalSize ? this._formatBytes(stats.totalSize) : 'unknown'}`);
            buildLogs.push(`Warnings: ${warnings.length}`);

            // Write build log to file
            // 写入构建日志文件
            if (this._fileSystem) {
                try {
                    await this._fileSystem.writeFile(
                        `${config.outputPath}/build.log`,
                        buildLogs.join('\n')
                    );
                    console.log(`[WebBuild] Build log written to: ${config.outputPath}/build.log`);
                } catch {
                    // Ignore log write errors
                }
            }

            onProgress?.({
                status: BuildStatus.Completed,
                message: 'Build completed | 构建完成',
                progress: 100,
                currentStep: totalSteps,
                totalSteps,
                warnings
            });

            return this._createResult(true, config, startTime, outputFiles, warnings, undefined, stats);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error('[WebBuild] Build failed:', errorMessage);

            // Log error
            buildLogs.push('');
            buildLogs.push(`=== Build Failed ===`);
            buildLogs.push(`Error: ${errorMessage}`);

            // Write build log even on failure
            if (this._fileSystem) {
                try {
                    await this._fileSystem.writeFile(
                        `${config.outputPath}/build.log`,
                        buildLogs.join('\n')
                    );
                } catch {
                    // Ignore
                }
            }

            onProgress?.({
                status: BuildStatus.Failed,
                message: 'Build failed | 构建失败',
                progress: 0,
                currentStep: 0,
                totalSteps,
                warnings,
                error: errorMessage
            });

            return this._createResult(false, config, startTime, outputFiles, warnings, errorMessage);
        }
    }

    async checkAvailability(): Promise<{ available: boolean; reason?: string }> {
        return { available: true };
    }

    // ========================================================================
    // Step Implementations
    // ========================================================================

    /**
     * Step 1: Prepare output directory.
     * 步骤 1：准备输出目录。
     */
    private async _stepPrepare(context: BuildContext): Promise<void> {
        const fs = this._getFileSystem(context);

        await fs.prepareBuildDirectory(context.outputDir);
        await fs.createDirectory(`${context.outputDir}/libs`);
        await fs.createDirectory(`${context.outputDir}/libs/plugins`);
        await fs.createDirectory(`${context.outputDir}/libs/wasm`);
        await fs.createDirectory(`${context.outputDir}/assets`);
        await fs.createDirectory(`${context.outputDir}/scenes`);

        console.log(`[WebBuild] Output directory prepared: ${context.outputDir}`);
    }

    /**
     * Step 2: Analyze project and determine required modules.
     * 步骤 2：分析项目并确定所需模块。
     */
    private async _stepAnalyze(context: BuildContext): Promise<void> {
        const fs = this._getFileSystem(context);
        const engineModulesPath = this._getEngineModulesPath(context);

        if (!engineModulesPath) {
            throw new Error('Engine modules path not available | 引擎模块路径不可用');
        }

        // Scan available modules
        const allModules: ModuleManifest[] = [];
        const coreModules: ModuleManifest[] = [];
        const pluginModules: ModuleManifest[] = [];

        try {
            const moduleJsonFiles = await this._findModuleJsonFiles(fs, engineModulesPath);

            for (const jsonPath of moduleJsonFiles) {
                try {
                    const manifest = await fs.readJson<ModuleManifest>(jsonPath);

                    // Skip if disabled
                    if (this._disabledModules.includes(manifest.id)) {
                        console.log(`[WebBuild] Skipping disabled module: ${manifest.id}`);
                        continue;
                    }

                    // Check if enabled (whitelist mode)
                    if (this._enabledModules.length > 0 && !this._enabledModules.includes(manifest.id)) {
                        // Check if it's a core module (always include)
                        if (!isCoreModule(manifest)) {
                            console.log(`[WebBuild] Skipping non-enabled module: ${manifest.id}`);
                            continue;
                        }
                    }

                    allModules.push(manifest);

                    if (isCoreModule(manifest)) {
                        coreModules.push(manifest);
                    } else {
                        pluginModules.push(manifest);
                    }
                } catch (err) {
                    console.warn(`[WebBuild] Failed to read module manifest: ${jsonPath}`, err);
                }
            }
        } catch (err) {
            console.warn(`[WebBuild] Failed to scan modules:`, err);
        }

        // Store in context for later steps
        context.data.set('allModules', allModules);
        context.data.set('coreModules', coreModules);
        context.data.set('pluginModules', pluginModules);

        // Log detailed module information
        // 记录详细的模块信息
        console.log(`[WebBuild] Found ${coreModules.length} core modules, ${pluginModules.length} plugin modules`);
        console.log(`[WebBuild] Core modules: ${coreModules.map(m => m.name || m.id).join(', ')}`);
        console.log(`[WebBuild] Plugin modules: ${pluginModules.map(m => m.name || m.id).join(', ')}`);
    }

    /**
     * Step 3a: Bundle split mode - core + separate plugins.
     * 步骤 3a：分包模式 - 核心包 + 独立插件包。
     *
     * Uses ESM format for optimal caching and tree-shaking.
     * Requires HTTP server to run (standard web development practice).
     * 使用 ESM 格式以获得最佳缓存和摇树优化。
     * 需要 HTTP 服务器运行（标准 Web 开发实践）。
     */
    private async _stepBundleSplit(context: BuildContext): Promise<void> {
        const fs = this._getFileSystem(context);
        const engineModulesPath = this._getEngineModulesPath(context);
        const webConfig = context.config as WebBuildConfig;
        const coreModules = context.data.get('coreModules') as ModuleManifest[] || [];
        const pluginModules = context.data.get('pluginModules') as ModuleManifest[] || [];

        const minify = webConfig.minify !== false && webConfig.isRelease;
        const sourceMap = webConfig.sourceMap === true;

        // 1. Bundle core modules into esengine.core.js (ESM format)
        // This generates a dynamic entry that re-exports all core module APIs
        // 生成动态入口文件，重新导出所有核心模块 API
        console.log(`[WebBuild] Bundling core runtime (ESM)...`);
        await this._bundleCoreRuntime(context, fs, coreModules, engineModulesPath, minify, sourceMap);

        // 2. Bundle plugin modules as separate ESM files
        // Each plugin is bundled with core modules marked as external (resolved via Import Map)
        // 每个插件单独打包，核心模块标记为 external（通过 Import Map 解析）
        console.log(`[WebBuild] Bundling plugin modules (ESM)...`);
        await this._bundlePluginModules(context, fs, coreModules, pluginModules, engineModulesPath, minify, sourceMap);

        // 3. Copy WASM files
        console.log(`[WebBuild] Copying WASM files...`);
        await this._copyWasmFiles(context, fs, [...coreModules, ...pluginModules], engineModulesPath);

        // Store for HTML generation
        context.data.set('buildMode', 'split-bundles');
    }

    /**
     * Step 3b: Bundle single mode - everything in one file.
     * 步骤 3b：单包模式 - 所有代码打包到一个文件。
     *
     * Generates a custom entry file that:
     * 1. Re-exports platform-web's BrowserRuntime
     * 2. Imports all plugins and registers them at load time
     * 生成一个自定义入口文件：
     * 1. 重新导出 platform-web 的 BrowserRuntime
     * 2. 导入所有插件并在加载时注册它们
     */
    private async _stepBundleSingle(context: BuildContext): Promise<void> {
        const fs = this._getFileSystem(context);
        const engineModulesPath = this._getEngineModulesPath(context);
        const webConfig = context.config as WebBuildConfig;
        const allModules = context.data.get('allModules') as ModuleManifest[] || [];

        const minify = webConfig.minify !== false && webConfig.isRelease;
        const sourceMap = webConfig.sourceMap === true;

        // Find platform-web entry point
        const platformWebDir = `${engineModulesPath}/platform-web`;
        const platformWebEntry = await this._findEntryPoint(fs, platformWebDir);

        if (!platformWebEntry) {
            throw new Error('Could not find platform-web entry point | 找不到 platform-web 入口文件');
        }

        // Build module alias map for bundling
        // 构建模块别名映射
        const moduleAliasMap: Record<string, string> = {};
        for (const module of allModules) {
            if (module.name) {
                const moduleDir = `${engineModulesPath}/${module.id}`;
                const moduleEntry = await this._findEntryPoint(fs, moduleDir);
                if (moduleEntry) {
                    moduleAliasMap[module.name] = moduleEntry;
                }
            }
        }
        context.data.set('moduleAliasMap', moduleAliasMap);

        // Generate custom entry file that imports and registers all plugins
        // 生成自定义入口文件，导入并注册所有插件
        const pluginModules = allModules.filter(m => m.pluginExport && m.name);
        const generatedEntryPath = `${context.outputDir}/libs/__single_bundle_entry.js`;

        const pluginImports = pluginModules.map((m, i) =>
            `import { ${m.pluginExport} as plugin_${i} } from '${m.name}';`
        ).join('\n');

        const pluginRegistrations = pluginModules.map((_, i) =>
            `    registerStaticPlugin(plugin_${i});`
        ).join('\n');

        // ====================================================================
        // Scan and include user scripts in the same bundle
        // 扫描并将用户脚本包含在同一个 bundle 中
        // ====================================================================
        // This is the key to solving the ComponentRegistry issue:
        // By bundling user scripts together with the engine, they share the
        // same @esengine/core module instance, so @ECSComponent decorators
        // register to the same ComponentRegistry that scene loading uses.
        // 这是解决 ComponentRegistry 问题的关键：
        // 将用户脚本与引擎打包在一起，它们共享同一个 @esengine/core 模块实例，
        // 因此 @ECSComponent 装饰器注册到场景加载使用的同一个 ComponentRegistry。
        const scriptsDir = `${context.projectRoot}/scripts`;
        let userScriptImports = '';
        let userScriptCount = 0;

        if (await fs.pathExists(scriptsDir)) {
            const scriptFiles = await fs.listFilesByExtension(scriptsDir, ['ts', 'js'], true);
            const validScripts = scriptFiles.filter(f => !f.endsWith('.d.ts'));

            if (validScripts.length > 0) {
                userScriptImports = validScripts.map((scriptPath, i) => {
                    // Convert absolute path to relative for import
                    // 将绝对路径转换为相对路径用于导入
                    return `import '${scriptPath.replace(/\\/g, '/')}';`;
                }).join('\n');
                userScriptCount = validScripts.length;
                console.log(`[WebBuild] Including ${userScriptCount} user scripts in single bundle`);
            }
        }

        const entryContent = `// Auto-generated single-bundle entry
// 自动生成的单包入口文件
import { registerStaticPlugin } from '@esengine/runtime-core';
${pluginImports}

// Register all plugins at load time
// 在加载时注册所有插件
${pluginRegistrations}

// Re-export platform-web as default
// 重新导出 platform-web
export { BrowserRuntime, create, default } from '@esengine/platform-web';
export * from '@esengine/platform-web';

// ============================================================================
// User Scripts (bundled together to share ComponentRegistry)
// 用户脚本（打包在一起以共享 ComponentRegistry）
// ============================================================================
${userScriptImports}
`;

        await fs.writeFile(generatedEntryPath, entryContent);
        console.log(`[WebBuild] Generated single-bundle entry with ${pluginModules.length} plugins and ${userScriptCount} user scripts`);

        // Bundle everything into one IIFE file using the generated entry
        const result = await fs.bundleScripts({
            entryPoints: [generatedEntryPath],
            outputDir: `${context.outputDir}/libs`,
            format: 'iife',
            bundleName: 'esengine.bundle',
            minify,
            sourceMap,
            external: [],
            projectRoot: context.projectRoot,
            globalName: 'ESEngine',
            alias: moduleAliasMap
        });

        if (!result.success) {
            throw new Error(`Failed to bundle: ${result.error}`);
        }

        // Clean up generated entry file
        // 清理生成的入口文件
        if (fs.deleteFile) {
            try {
                await fs.deleteFile(generatedEntryPath);
            } catch {
                // Ignore cleanup errors
            }
        }

        console.log(`[WebBuild] Created single bundle: ${result.outputFile} (${this._formatBytes(result.outputSize || 0)})`);

        // Copy WASM files
        await this._copyWasmFiles(context, fs, allModules, engineModulesPath);

        // Store for HTML generation
        context.data.set('buildMode', 'single-bundle');
    }

    /**
     * Step 4: Copy asset files.
     * 步骤 4：复制资产文件。
     */
    private async _stepCopyAssets(context: BuildContext): Promise<void> {
        const fs = this._getFileSystem(context);

        const assetsDir = `${context.projectRoot}/assets`;
        const outputAssetsDir = `${context.outputDir}/assets`;

        if (await fs.pathExists(assetsDir)) {
            const count = await fs.copyDirectory(assetsDir, outputAssetsDir, [
                '*.png', '*.jpg', '*.jpeg', '*.gif', '*.webp',
                '*.mp3', '*.ogg', '*.wav', '*.m4a',
                '*.json', '*.xml',
                '*.ttf', '*.woff', '*.woff2',
                '*.atlas', '*.fnt'
            ]);
            console.log(`[WebBuild] Copied ${count} asset files`);
        }
    }

    /**
     * Step 5: Copy scene files.
     * 步骤 5：复制场景文件。
     *
     * Only copies scenes specified in config.scenes.
     * If no scenes are selected, nothing is copied.
     *
     * 只复制 config.scenes 中指定的场景。
     * 如果没有选择任何场景，则不复制任何内容。
     */
    private async _stepCopyScenes(context: BuildContext): Promise<void> {
        const fs = this._getFileSystem(context);
        const { scenes } = context.config;

        if (!scenes || scenes.length === 0) {
            console.log('[WebBuild] No scenes selected, skipping scene copy');
            return;
        }

        const scenesDir = `${context.projectRoot}/scenes`;
        const outputScenesDir = `${context.outputDir}/scenes`;

        if (!await fs.pathExists(scenesDir)) {
            console.log('[WebBuild] No scenes directory found');
            return;
        }

        const allSceneFiles = await fs.listFilesByExtension(scenesDir, ['ecs', 'scene', 'json'], true);
        const scenesToCopy = this._filterScenesByWhitelist(allSceneFiles, scenes);

        console.log(`[WebBuild] Selected scenes: ${scenes.join(', ')}`);

        for (const scenePath of scenesToCopy) {
            const fileName = scenePath.split(/[/\\]/).pop() || '';
            await fs.copyFile(scenePath, `${outputScenesDir}/${fileName}`);
        }

        console.log(`[WebBuild] Copied ${scenesToCopy.length} scene files`);
    }

    /**
     * Step 6: Generate asset catalog.
     * 步骤 6：生成资产清单。
     *
     * Generates IAssetCatalog in unified format.
     * Reads .meta files from source project to get real GUIDs.
     * 生成统一格式的 IAssetCatalog。
     * 从源项目读取 .meta 文件获取真实的 GUID。
     */
    private async _stepGenerateCatalog(context: BuildContext): Promise<void> {
        const fs = this._getFileSystem(context);

        // Meta file format from asset-system-editor
        // 来自 asset-system-editor 的 meta 文件格式
        interface AssetMeta {
            guid: string;
            type: string;
            importSettings?: Record<string, unknown>;
            labels?: string[];
            version?: number;
            lastModified?: number;
        }

        // Use unified IAssetCatalog format from @esengine/asset-system
        // 使用 @esengine/asset-system 中统一的 IAssetCatalog 格式
        const catalog = {
            version: '1.0.0',
            createdAt: Date.now(),
            loadStrategy: 'file' as const,  // Web builds use file-based loading
            entries: {} as Record<string, {
                guid: string;
                path: string;
                type: string;
                size: number;
                hash: string;
            }>
        };

        // Collect assets from project source directories
        // 从项目源目录收集资产
        const sourceAssetDirs = ['assets', 'scenes', 'scripts'];
        const outputAssetsDir = `${context.outputDir}/assets`;
        const outputScenesDir = `${context.outputDir}/scenes`;

        for (const dirName of sourceAssetDirs) {
            const sourceDir = `${context.projectRoot}/${dirName}`;
            if (!await fs.pathExists(sourceDir)) continue;

            const metaFiles = await fs.listFilesByExtension(sourceDir, ['.meta'], true);

            for (const metaFile of metaFiles) {
                try {
                    const meta = await fs.readJson<AssetMeta>(metaFile);
                    if (!meta.guid) continue;

                    const assetSourcePath = metaFile.replace(/\.meta$/, '');

                    let outputPath: string;
                    let relativePath: string;

                    if (dirName === 'scenes') {
                        const fileName = assetSourcePath.split(/[/\\]/).pop() || '';
                        outputPath = `${outputScenesDir}/${fileName}`;
                        relativePath = `scenes/${fileName}`;
                    } else if (dirName === 'assets') {
                        const relativeToAssets = assetSourcePath.replace(sourceDir, '').replace(/^[/\\]/, '');
                        outputPath = `${outputAssetsDir}/${relativeToAssets}`;
                        relativePath = `assets/${relativeToAssets}`;
                    } else {
                        continue;
                    }

                    relativePath = relativePath.replace(/\\/g, '/');

                    if (!await fs.pathExists(outputPath)) continue;

                    const size = await fs.getFileSize(outputPath);

                    catalog.entries[meta.guid] = {
                        guid: meta.guid,
                        path: relativePath,
                        type: meta.type || this._getAssetType(assetSourcePath.split('.').pop() || ''),
                        size,
                        hash: hashFileInfo(relativePath, size)
                    };
                } catch (error) {
                    console.warn(`[WebBuild] Failed to process meta file: ${metaFile}`, error);
                }
            }
        }

        await fs.writeFile(
            `${context.outputDir}/asset-catalog.json`,
            JSON.stringify(catalog, null, 2)
        );

        console.log(`[WebBuild] Generated asset catalog: ${Object.keys(catalog.entries).length} assets, strategy=${catalog.loadStrategy}`);
    }

    /**
     * Step 7: Generate HTML file.
     * 步骤 7：生成 HTML 文件。
     */
    private async _stepGenerateHtml(context: BuildContext): Promise<void> {
        const fs = this._getFileSystem(context);

        const buildMode = context.data.get('buildMode') as string;
        const coreModules = context.data.get('coreModules') as ModuleManifest[] || [];
        const pluginModules = context.data.get('pluginModules') as ModuleManifest[] || [];

        // Find main scene
        let mainScenePath = './scenes/main.ecs';
        const scenesDir = `${context.outputDir}/scenes`;
        if (await fs.pathExists(scenesDir)) {
            const sceneFiles = await fs.listFilesByExtension(scenesDir, ['.ecs', '.scene']);
            if (sceneFiles.length > 0) {
                const sceneName = sceneFiles[0].split(/[/\\]/).pop();
                mainScenePath = `./scenes/${sceneName}`;
            }
        }

        // Check if any core module has wasmConfig with runtimePath
        // 检查是否有核心模块配置了 wasmConfig 和 runtimePath
        const wasmModule = coreModules.find(m => m.wasmConfig?.runtimePath);
        const wasmRuntimePath = wasmModule?.wasmConfig?.runtimePath || null;

        const html = buildMode === 'single-bundle'
            ? this._generateSingleBundleHtml(mainScenePath, wasmRuntimePath)
            : this._generateSplitBundlesHtml(mainScenePath, wasmRuntimePath, coreModules, pluginModules);

        await fs.writeFile(`${context.outputDir}/index.html`, html);
        console.log(`[WebBuild] Generated index.html (${buildMode} mode)`);
    }

    /**
     * Step 7: Bundle user scripts (components, systems, etc.).
     * 步骤 7：打包用户脚本（组件、系统等）。
     *
     * User scripts in project/scripts/ directory are bundled and loaded at runtime.
     * Configuration driven via module.json fields: userScriptEntries, userScriptExternals.
     * 项目 scripts/ 目录中的用户脚本会被打包并在运行时加载。
     * 通过 module.json 的 userScriptEntries 和 userScriptExternals 字段驱动配置。
     */
    private async _stepBundleUserScripts(context: BuildContext): Promise<void> {
        const fs = this._getFileSystem(context);

        const webConfig = context.config as WebBuildConfig;
        const coreModules = context.data.get('coreModules') as ModuleManifest[] || [];
        const minify = webConfig.isRelease;
        const sourceMap = webConfig.sourceMap ?? !webConfig.isRelease;
        const buildMode = webConfig.buildMode || 'split-bundles';

        // In single-bundle/single-file mode, user scripts are already included in the main bundle
        // Skip separate bundling to avoid duplicate code and ComponentRegistry issues
        // 在单包/单文件模式下，用户脚本已经包含在主 bundle 中
        // 跳过单独打包以避免代码重复和 ComponentRegistry 问题
        if (buildMode === 'single-bundle' || buildMode === 'single-file') {
            console.log('[WebBuild] User scripts already included in main bundle, skipping separate bundling');
            context.data.set('hasUserScripts', true);
            return;
        }

        // Find user scripts directory | 查找用户脚本目录
        const scriptsDir = `${context.projectRoot}/scripts`;
        const hasScripts = await fs.pathExists(scriptsDir);

        if (!hasScripts) {
            console.log('[WebBuild] No scripts directory found, skipping user scripts | 未找到脚本目录，跳过用户脚本');
            return;
        }

        // Get entry file names from module configuration
        // 从模块配置获取入口文件名
        const moduleWithEntries = coreModules.find(m => m.userScriptEntries && m.userScriptEntries.length > 0);
        const possibleEntries = moduleWithEntries?.userScriptEntries || ['index.ts', 'main.ts', 'game.ts', 'index.js', 'main.js'];
        let entryFiles: string[] = [];

        // First, try to find standard entry files
        // 首先尝试查找标准入口文件
        for (const entry of possibleEntries) {
            const entryPath = `${scriptsDir}/${entry}`;
            if (await fs.pathExists(entryPath)) {
                entryFiles = [entryPath];
                console.log(`[WebBuild] Found entry file: ${entryPath}`);
                break;
            }
        }

        // If no entry file found, scan for all .ts/.js files (excluding editor/ subdirectory)
        // 如果没有入口文件，扫描所有 .ts/.js 文件（排除 editor/ 子目录）
        if (entryFiles.length === 0) {
            const allFiles = await fs.listFilesByExtension(scriptsDir, ['ts', 'js'], false);
            entryFiles = allFiles.filter(f => !f.endsWith('.d.ts'));

            if (entryFiles.length === 0) {
                console.log('[WebBuild] No script files found | 未找到脚本文件');
                return;
            }

            console.log(`[WebBuild] Auto-discovered ${entryFiles.length} script files | 自动发现 ${entryFiles.length} 个脚本文件`);
        }

        console.log(`[WebBuild] Bundling user scripts: ${entryFiles.join(', ')}`);

        // ESM mode (split-bundles): external packages resolved via Import Map at runtime
        // ESM 模式（分包）：外部包通过运行时 Import Map 解析
        // Note: single-bundle/single-file modes return early above
        const moduleWithExternals = coreModules.find(m => m.userScriptExternals && m.userScriptExternals.length > 0);
        const external = moduleWithExternals?.userScriptExternals || [
            '@esengine/core',
            '@esengine/ecs-framework',
            '@esengine/engine-core'
        ];

        const result = await fs.bundleScripts({
            entryPoints: entryFiles,
            outputDir: `${context.outputDir}/libs`,
            format: 'esm',
            bundleName: 'user-scripts',
            minify,
            sourceMap,
            external,
            projectRoot: context.projectRoot,
            define: {
                'process.env.NODE_ENV': webConfig.isRelease ? '"production"' : '"development"'
            }
        });

        if (!result.success) {
            throw new Error(`User scripts bundling failed | 用户脚本打包失败: ${result.error}`);
        }

        result.warnings.forEach(w => context.addWarning(w));

        // Mark that user scripts are available | 标记用户脚本已可用
        context.data.set('hasUserScripts', true);

        console.log(`[WebBuild] Bundled user scripts: ${result.outputFile}`);
    }

    /**
     * Step 8: Generate server scripts for easy launching.
     * 步骤 8：生成启动脚本，方便用户运行。
     */
    private async _stepGenerateServerScripts(context: BuildContext): Promise<void> {
        const fs = this._getFileSystem(context);

        // Generate Windows batch file (ASCII only to avoid encoding issues)
        const batContent = `@echo off
chcp 65001 >nul 2>&1
echo ============================================
echo   ESEngine Game Server
echo ============================================
echo.

where npx >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not installed.
    echo Please install from https://nodejs.org
    pause
    exit /b 1
)

echo Starting server: http://localhost:3000
echo.
echo Open browser and go to: http://localhost:3000
echo Press Ctrl+C to stop
echo.

npx serve . -p 3000
`;

        // Generate shell script for macOS/Linux
        const shContent = `#!/bin/bash
echo "============================================"
echo "  ESEngine Game Server"
echo "  ESEngine 游戏服务器"
echo "============================================"
echo ""

# Check if npx is available | 检查 npx 是否可用
if ! command -v npx &> /dev/null; then
    echo "[ERROR] Node.js is not installed. Please install from https://nodejs.org"
    echo "[错误] Node.js 未安装。请从 https://nodejs.org 下载安装"
    exit 1
fi

echo "Starting local server on http://localhost:3000"
echo "启动本地服务器 http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop the server"
echo "按 Ctrl+C 停止服务器"
echo ""

npx serve . -p 3000
`;

        // Generate README
        const readmeContent = `# ESEngine Game Build

## How to Run | 如何运行

### Option 1: Use the launch script | 使用启动脚本

**Windows:**
Double-click \`start-server.bat\`
双击 \`start-server.bat\`

**macOS/Linux:**
\`\`\`bash
chmod +x start-server.sh
./start-server.sh
\`\`\`

### Option 2: Use any HTTP server | 使用任意 HTTP 服务器

\`\`\`bash
# Using npx serve (recommended) | 使用 npx serve（推荐）
npx serve . -p 3000

# Using Python | 使用 Python
python -m http.server 3000

# Using PHP | 使用 PHP
php -S localhost:3000
\`\`\`

Then open http://localhost:3000 in your browser.
然后在浏览器中打开 http://localhost:3000

### Option 3: Deploy to hosting | 部署到托管服务

Upload all files to any static hosting service:
将所有文件上传到任意静态托管服务：

- [Vercel](https://vercel.com)
- [Netlify](https://netlify.com)
- [GitHub Pages](https://pages.github.com)
- [Cloudflare Pages](https://pages.cloudflare.com)

## Why HTTP Server? | 为什么需要 HTTP 服务器？

Modern browsers block ES modules from loading via \`file://\` protocol for security reasons.
This is standard web development practice.

现代浏览器出于安全原因会阻止通过 \`file://\` 协议加载 ES 模块。
这是标准的 Web 开发实践。

---
Built with ESEngine | 使用 ESEngine 构建
`;

        await fs.writeFile(`${context.outputDir}/start-server.bat`, batContent);
        await fs.writeFile(`${context.outputDir}/start-server.sh`, shContent);
        await fs.writeFile(`${context.outputDir}/README.md`, readmeContent);

        console.log(`[WebBuild] Generated server scripts: start-server.bat, start-server.sh, README.md`);
    }

    // ========================================================================
    // Helper Methods
    // ========================================================================

    /**
     * Get file system from build context with type safety.
     * 从构建上下文获取文件系统（类型安全）。
     */
    private _getFileSystem(context: BuildContext): IBuildFileSystem {
        const fs = context.data.get('fileSystem') as IBuildFileSystem | null;
        if (!fs) {
            throw new Error('File system not available | 文件系统不可用');
        }
        return fs;
    }

    /**
     * Get engine modules path from build context.
     * 从构建上下文获取引擎模块路径。
     */
    private _getEngineModulesPath(context: BuildContext): string {
        return context.data.get('engineModulesPath') as string || this._engineModulesPath;
    }

    private async _findModuleJsonFiles(fs: IBuildFileSystem, basePath: string): Promise<string[]> {
        const results: string[] = [];
        const normalizedBase = basePath.replace(/\\/g, '/');

        // Search for module.json files in immediate subdirectories ONLY (not recursive)
        // 只在直接子目录中搜索 module.json 文件（非递归）
        // This avoids scanning node_modules which would be extremely slow
        // 这样可以避免扫描 node_modules，否则会非常慢
        try {
            // First try: Use non-recursive listing to get immediate JSON files
            // 首先尝试：使用非递归列表获取直接的 JSON 文件
            const topLevelJsonFiles = await fs.listFilesByExtension(basePath, ['json'], false);

            // Check for package.json files which indicate module directories
            // 检查 package.json 文件，这些文件指示模块目录
            const moduleDirectories: string[] = [];

            for (const file of topLevelJsonFiles) {
                const normalizedFile = file.replace(/\\/g, '/');

                // If we find module.json directly, add it
                // 如果直接找到 module.json，添加它
                if (normalizedFile.endsWith('/module.json')) {
                    results.push(file);
                }
                // If we find package.json, remember the directory to check for module.json
                // 如果找到 package.json，记住目录以检查 module.json
                else if (normalizedFile.endsWith('/package.json')) {
                    const dir = normalizedFile.slice(0, normalizedFile.lastIndexOf('/'));
                    moduleDirectories.push(dir);
                }
            }

            // For each directory with package.json, check if it also has module.json
            // 对于每个有 package.json 的目录，检查是否也有 module.json
            for (const dir of moduleDirectories) {
                const moduleJsonPath = `${dir}/module.json`;
                // Skip if already found
                // 跳过已找到的
                if (results.some(r => r.replace(/\\/g, '/') === moduleJsonPath)) {
                    continue;
                }
                if (await fs.pathExists(moduleJsonPath)) {
                    results.push(moduleJsonPath);
                }
            }

            // If still no results, try checking one level deeper (for dist/engine structure)
            // 如果仍然没有结果，尝试检查更深一级（用于 dist/engine 结构）
            if (results.length === 0) {
                // List all JSON files one level deep using pattern: basePath/*/module.json
                // 使用模式列出一级深度的所有 JSON 文件: basePath/*/module.json
                const deeperJsonFiles = await fs.listFilesByExtension(basePath, ['json'], true);

                for (const file of deeperJsonFiles) {
                    const normalizedFile = file.replace(/\\/g, '/');

                    // Only accept module.json at exactly one level deep
                    // 只接受精确一级深度的 module.json
                    if (normalizedFile.endsWith('/module.json')) {
                        const relativePath = normalizedFile.slice(normalizedBase.length + 1);
                        const parts = relativePath.split('/');

                        // Accept moduleName/module.json (2 parts) but skip node_modules
                        // 接受 moduleName/module.json (2 部分) 但跳过 node_modules
                        if (parts.length === 2 && parts[1] === 'module.json') {
                            // Skip node_modules and hidden directories
                            // 跳过 node_modules 和隐藏目录
                            if (!parts[0].startsWith('.') && parts[0] !== 'node_modules') {
                                results.push(file);
                            }
                        }
                    }
                }
            }
        } catch {
            // Ignore errors during scanning
        }

        console.log(`[WebBuild] Found ${results.length} module.json files in ${basePath}`);
        return results;
    }

    private async _findEntryPoint(fs: IBuildFileSystem, moduleDir: string): Promise<string | null> {
        const candidates = ['index.mjs', 'index.js', 'dist/index.mjs', 'dist/index.js'];

        for (const candidate of candidates) {
            const path = `${moduleDir}/${candidate}`;
            if (await fs.pathExists(path)) {
                return path;
            }
        }

        return null;
    }

    private async _bundleCoreRuntime(
        context: BuildContext,
        fs: IBuildFileSystem,
        coreModules: ModuleManifest[],
        engineModulesPath: string,
        minify: boolean,
        sourceMap: boolean
    ): Promise<void> {
        // Generate a dynamic entry file that re-exports all core modules
        // 生成动态入口文件，重新导出所有核心模块
        // Use actual file paths instead of package names so esbuild can resolve them
        // 使用实际文件路径而不是包名，这样 esbuild 可以解析它们
        const entryContent = this._generateCoreEntryContent(coreModules, engineModulesPath);
        const entryPath = `${context.outputDir}/_core_entry.js`;
        await fs.writeFile(entryPath, entryContent);

        console.log(`[WebBuild] Generated core entry with ${coreModules.length} modules:`);
        console.log(entryContent);

        // Bundle the dynamic entry file
        // 打包动态入口文件
        const bundleOptions = {
            entryPoints: [entryPath],
            outputDir: `${context.outputDir}/libs`,
            format: 'esm' as const,
            bundleName: 'esengine.core',
            minify,
            sourceMap,
            external: [], // Bundle all dependencies
            projectRoot: context.projectRoot
        };

        // Log bundle options for debugging
        console.log(`[WebBuild] Bundle options: ${JSON.stringify(bundleOptions, null, 2)}`);

        const result = await fs.bundleScripts(bundleOptions);

        if (!result.success) {
            throw new Error(`Failed to bundle core runtime: ${result.error}`);
        }

        // Clean up temporary entry file
        // 清理临时入口文件
        if (fs.deleteFile) {
            try {
                await fs.deleteFile(entryPath);
            } catch {
                // Ignore cleanup errors
            }
        }

        console.log(`[WebBuild] Core runtime: ${result.outputFile} (${this._formatBytes(result.outputSize || 0)})`);
    }

    /**
     * Generate core entry file content that re-exports all core modules.
     * Uses configuration from module.json instead of hardcoded values.
     * 生成重新导出所有核心模块的入口文件内容。
     * 使用 module.json 中的配置而非硬编码值。
     *
     * @param coreModules - List of core module manifests
     * @param _engineModulesPath - Base path to engine modules directory (unused, kept for API compatibility)
     */
    private _generateCoreEntryContent(coreModules: ModuleManifest[], _engineModulesPath: string): string {
        const lines: string[] = [
            '// Auto-generated core runtime entry',
            '// 自动生成的核心运行时入口',
            ''
        ];

        // Find module with coreServiceExports and generate explicit exports
        // 查找有 coreServiceExports 的模块并生成显式导出
        const moduleWithExports = coreModules.find(m => m.coreServiceExports && m.coreServiceExports.length > 0);
        if (moduleWithExports && moduleWithExports.coreServiceExports) {
            const packageName = moduleWithExports.name || `@esengine/${moduleWithExports.id}`;
            const exports = moduleWithExports.coreServiceExports.join(', ');
            lines.push('// Explicit exports to avoid naming conflicts');
            lines.push('// 显式导出避免命名冲突');
            lines.push(`export { ${exports} } from "${packageName}";`);
            lines.push('');
        }

        // Re-export all modules using package names
        // 使用包名重新导出所有模块
        for (const module of coreModules) {
            const packageName = module.name || `@esengine/${module.id}`;
            lines.push(`export * from '${packageName}';`);
        }

        // Find runtime entry module and add default export
        // 查找运行时入口模块并添加默认导出
        const runtimeEntry = coreModules.find(m => m.isRuntimeEntry === true);
        if (runtimeEntry) {
            const packageName = runtimeEntry.name || `@esengine/${runtimeEntry.id}`;
            lines.push('');
            lines.push('// Default export for runtime initialization');
            lines.push(`import BrowserRuntime from "${packageName}";`);
            lines.push('export default BrowserRuntime;');
        }

        return lines.join('\n');
    }

    private async _bundlePluginModules(
        context: BuildContext,
        fs: IBuildFileSystem,
        coreModules: ModuleManifest[],
        pluginModules: ModuleManifest[],
        engineModulesPath: string,
        minify: boolean,
        sourceMap: boolean
    ): Promise<void> {
        const pluginsDir = `${context.outputDir}/libs/plugins`;

        // Collect all package names for external marking:
        // 1. Core modules - always external
        // 2. Plugin modules - to avoid duplicating plugin code across bundles
        // 3. External dependencies declared in module.json - e.g., @esengine/rapier2d
        // 收集所有包名用于标记为 external：
        // 1. 核心模块 - 始终外部化
        // 2. 插件模块 - 避免在多个包中重复插件代码
        // 3. module.json 中声明的外部依赖 - 例如 @esengine/rapier2d
        const externalPackages = new Set<string>();

        // Add core module packages
        for (const m of coreModules) {
            if (m.name) externalPackages.add(m.name);
        }

        // Add plugin module packages
        for (const m of pluginModules) {
            if (m.name) externalPackages.add(m.name);
            // Add declared external dependencies (e.g., @esengine/rapier2d)
            if (m.externalDependencies) {
                for (const dep of m.externalDependencies) {
                    externalPackages.add(dep);
                }
            }
        }

        const external = Array.from(externalPackages);
        console.log(`[WebBuild] External packages for plugins: ${external.join(', ')}`);

        for (const module of pluginModules) {
            const moduleDir = `${engineModulesPath}/${module.id}`;
            const entryPoint = await this._findEntryPoint(fs, moduleDir);

            if (!entryPoint) {
                console.warn(`[WebBuild] No entry point found for plugin: ${module.id}`);
                continue;
            }

            // Bundle each plugin with all engine packages marked as external
            // 打包每个插件，将所有引擎包标记为 external
            const result = await fs.bundleScripts({
                entryPoints: [entryPoint],
                outputDir: pluginsDir,
                format: 'esm',
                bundleName: module.id,
                minify,
                sourceMap,
                external, // All engine modules resolved via Import Map
                projectRoot: context.projectRoot
            });

            if (result.success) {
                console.log(`[WebBuild] Bundled plugin: ${module.id} (${this._formatBytes(result.outputSize || 0)})`);
            } else {
                console.warn(`[WebBuild] Failed to bundle plugin ${module.id}: ${result.error}`);
            }
        }
    }

    /**
     * Copy WASM files based on unified wasmConfig in module.json.
     * 根据 module.json 中统一的 wasmConfig 复制 WASM 文件。
     *
     * Each module with requiresWasm=true should have wasmConfig specifying:
     * - files: Array of { src, dst } for file copying
     * - runtimePath: Path used by JS code at runtime
     *
     * 每个 requiresWasm=true 的模块应该有 wasmConfig 指定：
     * - files: 用于文件复制的 { src, dst } 数组
     * - runtimePath: JS 代码在运行时使用的路径
     */
    private async _copyWasmFiles(
        context: BuildContext,
        fs: IBuildFileSystem,
        modules: ModuleManifest[],
        engineModulesPath: string
    ): Promise<void> {
        for (const module of modules) {
            if (!module.requiresWasm || !module.wasmConfig) continue;

            for (const fileConfig of module.wasmConfig.files) {
                // src can be a string or array of candidate paths
                // src 可以是字符串或候选路径数组
                const srcCandidates = Array.isArray(fileConfig.src)
                    ? fileConfig.src
                    : [fileConfig.src];

                let copied = false;
                for (const srcRelative of srcCandidates) {
                    const srcPath = `${engineModulesPath}/${srcRelative}`;

                    if (await fs.pathExists(srcPath)) {
                        // Ensure destination directory exists
                        // 确保目标目录存在
                        const dstPath = `${context.outputDir}/${fileConfig.dst}`;
                        const dstDir = dstPath.substring(0, dstPath.lastIndexOf('/'));
                        await fs.createDirectory(dstDir);

                        await fs.copyFile(srcPath, dstPath);
                        console.log(`[WebBuild] Copied: ${srcRelative} -> ${fileConfig.dst}`);
                        copied = true;
                        break;
                    }
                }

                if (!copied) {
                    console.warn(`[WebBuild] WASM file not found for ${module.id}: ${srcCandidates.join(' or ')}`);
                }
            }
        }
    }

    /**
     * Generate common CSS styles for HTML output.
     * 生成 HTML 输出的公共 CSS 样式。
     */
    private _getCommonStyles(): string {
        return `
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { width: 100%; height: 100%; overflow: hidden; background: #1a1a2e; }
        #game-canvas { width: 100%; height: 100%; display: block; }
        #loading {
            position: fixed; inset: 0;
            display: flex; flex-direction: column;
            align-items: center; justify-content: center;
            background: #1a1a2e; color: #eee; font-family: system-ui, sans-serif;
        }
        .spinner {
            width: 40px; height: 40px;
            border: 3px solid #333; border-top-color: #4a9eff;
            border-radius: 50%; animation: spin 1s linear infinite;
        }
        .message { margin-top: 16px; font-size: 14px; }
        @keyframes spin { to { transform: rotate(360deg); } }
        #error {
            position: fixed; inset: 0; display: none;
            flex-direction: column; align-items: center; justify-content: center;
            background: #1a1a2e; color: #ff6b6b; font-family: system-ui, sans-serif;
            padding: 20px; text-align: center;
        }
        #error.show { display: flex; }
        #error pre {
            background: rgba(0,0,0,0.3); padding: 16px; border-radius: 8px;
            max-width: 600px; white-space: pre-wrap; word-break: break-word;
        }`;
    }

    /**
     * Generate common HTML body content (loading, error, canvas).
     * 生成公共 HTML body 内容（加载、错误、画布）。
     */
    private _getCommonBodyContent(): string {
        return `
    <div id="loading">
        <div class="spinner"></div>
        <div class="message" id="loading-message">Loading...</div>
    </div>
    <div id="error">
        <h2>Failed to start game</h2>
        <pre id="error-message"></pre>
    </div>
    <canvas id="game-canvas"></canvas>`;
    }

    /**
     * Generate common JavaScript helper functions.
     * 生成公共 JavaScript 辅助函数。
     */
    private _getCommonScriptHelpers(): string {
        return `
            const loading = document.getElementById('loading');
            const loadingMessage = document.getElementById('loading-message');
            const errorDiv = document.getElementById('error');
            const errorMessage = document.getElementById('error-message');

            function showError(msg) {
                loading.style.display = 'none';
                errorMessage.textContent = msg;
                errorDiv.classList.add('show');
            }

            function updateLoading(msg) {
                loadingMessage.textContent = msg;
            }`;
    }

    /**
     * Generate Import Map from module manifests.
     * 从模块清单生成 Import Map。
     */
    private _generateImportMap(coreModules: ModuleManifest[], pluginModules: ModuleManifest[]): Record<string, string> {
        const imports: Record<string, string> = {};

        for (const module of coreModules) {
            if (module.name) {
                imports[module.name] = './libs/esengine.core.js';
            }
        }

        for (const module of pluginModules) {
            if (module.name) {
                imports[module.name] = `./libs/plugins/${module.id}.js`;
            }
            if (module.externalDependencies) {
                for (const dep of module.externalDependencies) {
                    if (!imports[dep]) {
                        const depId = dep.startsWith('@esengine/') ? dep.slice(10) : dep;
                        imports[dep] = `./libs/plugins/${depId}.js`;
                    }
                }
            }
        }

        return imports;
    }

    private _generateSingleBundleHtml(mainScenePath: string, wasmRuntimePath: string | null): string {
        const wasmImport = wasmRuntimePath
            ? `const wasmModule = await import('./${wasmRuntimePath}');`
            : `const wasmModule = null;`;

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <title>ESEngine Game</title>
    <style>${this._getCommonStyles()}
    </style>
</head>
<body>${this._getCommonBodyContent()}

    <!-- Single bundle includes engine, plugins, and user scripts -->
    <script src="libs/esengine.bundle.js"></script>
    <script>
        (async function() {${this._getCommonScriptHelpers()}

            try {
                if (typeof ESEngine === 'undefined') {
                    throw new Error('ESEngine not loaded');
                }

                updateLoading('Initializing...');
                ${wasmImport}

                const runtime = ESEngine.create({
                    canvasId: 'game-canvas',
                    width: window.innerWidth,
                    height: window.innerHeight,
                    assetBaseUrl: './assets',
                    assetCatalogUrl: './asset-catalog.json'
                });

                await runtime.initialize(wasmModule);

                updateLoading('Loading scene...');
                await runtime.loadScene('${mainScenePath}');

                loading.style.display = 'none';
                runtime.start();

                window.addEventListener('resize', () => {
                    runtime.handleResize(window.innerWidth, window.innerHeight);
                });

                console.log('[Game] Started successfully');
            } catch (error) {
                console.error('[Game] Failed to start:', error);
                showError(error.message || String(error));
            }
        })();
    </script>
</body>
</html>`;
    }

    private _generateSplitBundlesHtml(
        mainScenePath: string,
        wasmRuntimePath: string | null,
        coreModules: ModuleManifest[],
        pluginModules: ModuleManifest[]
    ): string {
        const pluginLoads = pluginModules
            .filter(m => m.pluginExport)
            .map(m => `                    ['${m.id}', '${m.pluginExport}']`)
            .join(',\n');

        const imports = this._generateImportMap(coreModules, pluginModules);
        const importMapJson = JSON.stringify({ imports }, null, 8);

        const wasmLoading = wasmRuntimePath ? `
            updateLoading('Loading WASM module...');
            const wasmModule = await import('./${wasmRuntimePath}');
            ` : `const wasmModule = null;`;

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <title>ESEngine Game</title>
    <script type="importmap">
${importMapJson}
    </script>
    <style>${this._getCommonStyles()}
    </style>
</head>
<body>${this._getCommonBodyContent()}

    <script type="module">${this._getCommonScriptHelpers()}

        try {
            updateLoading('Loading core runtime...');
            const { default: ESEngine } = await import('./libs/esengine.core.js');

            const runtime = ESEngine.create({
                canvasId: 'game-canvas',
                width: window.innerWidth,
                height: window.innerHeight,
                assetBaseUrl: './assets',
                assetCatalogUrl: './asset-catalog.json'
            });

            ${wasmLoading}

            updateLoading('Loading plugins...');
            const plugins = [
${pluginLoads}
                ];

            for (const [id, exportName] of plugins) {
                try {
                    const module = await import('./libs/plugins/' + id + '.js');
                    if (module[exportName]) {
                        runtime.registerPlugin(module[exportName]);
                    }
                } catch (e) {
                    console.warn('Failed to load plugin:', id, e.message);
                }
            }

            updateLoading('Loading user scripts...');
            try {
                const userScripts = await import('./libs/user-scripts.js');
                if (userScripts.register) {
                    userScripts.register(runtime);
                }
                console.log('[Game] User scripts loaded');
            } catch (e) {
                console.log('[Game] No user scripts or failed to load:', e.message);
            }

            updateLoading('Initializing...');
            await runtime.initialize(wasmModule);

            updateLoading('Loading scene...');
            await runtime.loadScene('${mainScenePath}');

            loading.style.display = 'none';
            runtime.start();

            window.addEventListener('resize', () => {
                runtime.handleResize(window.innerWidth, window.innerHeight);
            });

            console.log('[Game] Started successfully');
        } catch (error) {
            console.error('[Game] Failed to start:', error);
            showError(error.message || String(error));
        }
    </script>
</body>
</html>`;
    }

    private _getAssetType(ext: string): string {
        const typeMap: Record<string, string> = {
            'png': 'texture', 'jpg': 'texture', 'jpeg': 'texture', 'gif': 'texture', 'webp': 'texture',
            'mp3': 'audio', 'ogg': 'audio', 'wav': 'audio', 'm4a': 'audio',
            'json': 'data', 'xml': 'data',
            'ttf': 'font', 'woff': 'font', 'woff2': 'font',
            'atlas': 'atlas', 'fnt': 'font'
        };
        return typeMap[ext] || 'binary';
    }

    private _getStatusForStep(stepId: string): BuildStatus {
        const statusMap: Record<string, BuildStatus> = {
            'prepare': BuildStatus.Preparing,
            'analyze': BuildStatus.Preparing,
            'bundle-runtime': BuildStatus.Compiling,
            'copy-assets': BuildStatus.Copying,
            'copy-scenes': BuildStatus.Copying,
            'generate-catalog': BuildStatus.PostProcessing,
            'generate-html': BuildStatus.PostProcessing
        };
        return statusMap[stepId] || BuildStatus.Compiling;
    }

    private _createResult(
        success: boolean,
        config: BuildConfig,
        startTime: number,
        outputFiles: string[],
        warnings: string[],
        error?: string,
        stats?: BuildResult['stats']
    ): BuildResult {
        return {
            success,
            platform: config.platform,
            outputPath: config.outputPath,
            duration: Date.now() - startTime,
            outputFiles,
            warnings,
            error,
            stats
        };
    }

    private _formatBytes(bytes: number): string {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }

    /**
     * Filter scene files by whitelist.
     * 根据白名单过滤场景文件。
     *
     * @param allSceneFiles - All scene file paths
     * @param selectedScenes - Scene names/paths to include (whitelist)
     * @returns Filtered scene file paths
     */
    private _filterScenesByWhitelist(
        allSceneFiles: string[],
        selectedScenes: string[]
    ): string[] {
        return allSceneFiles.filter(scenePath => {
            const fileName = scenePath.split(/[/\\]/).pop() || '';
            const baseName = fileName.replace(/\.(ecs|scene|json)$/, '');
            return selectedScenes.some(s =>
                scenePath.includes(s) ||
                fileName === s ||
                baseName === s ||
                s.includes(fileName) ||
                s.includes(baseName)
            );
        });
    }


    // ========================================================================
    // Single File Build
    // ========================================================================

    /**
     * Step: Build single HTML file with everything inlined.
     * 步骤：构建单个 HTML 文件，内联所有内容。
     *
     * This is the main step for single-file mode. It:
     * 1. Bundles all JS code into one string
     * 2. Converts all WASM files to Base64
     * 3. Converts all assets to Base64 data URLs
     * 4. Inlines all scene JSON files
     * 5. Generates a single HTML file with everything embedded
     */
    private async _stepBundleSingleFile(context: BuildContext): Promise<void> {
        const fs = this._getFileSystem(context);
        const webConfig = context.config as WebBuildConfig;
        const engineModulesPath = this._getEngineModulesPath(context);
        const allModules = context.data.get('allModules') as ModuleManifest[] || [];

        // Ensure readBinaryFileAsBase64 is available
        // 确保 readBinaryFileAsBase64 可用
        if (!fs.readBinaryFileAsBase64) {
            throw new Error('Single-file build requires readBinaryFileAsBase64 support | 单文件构建需要 readBinaryFileAsBase64 支持');
        }

        const inlineConfig: InlineConfig = {
            inlineJs: true,
            inlineWasm: true,
            inlineAssets: true,
            inlineScenes: true,
            ...webConfig.inlineConfig
        };

        const minify = webConfig.minify !== false && webConfig.isRelease;

        // 1. Build module alias map
        // 1. 构建模块别名映射
        const moduleAliasMap: Record<string, string> = {};
        for (const module of allModules) {
            if (module.name) {
                const moduleDir = `${engineModulesPath}/${module.id}`;
                const moduleEntry = await this._findEntryPoint(fs, moduleDir);
                if (moduleEntry) {
                    moduleAliasMap[module.name] = moduleEntry;
                }
            }
        }

        // Find engine core module and its JS bindings path from wasmConfig.files
        // 从 wasmConfig.files 中找到引擎核心模块及其 JS 绑定路径
        const engineCoreModule = allModules.find(m => m.wasmConfig?.isEngineCore);
        let wasmBindingsAlias: string | null = null;
        let wasmBindingsPath: string | null = null;

        if (engineCoreModule?.wasmConfig?.files) {
            // Find the .js file in wasmConfig.files (wasm-bindgen JS bindings)
            // 在 wasmConfig.files 中找到 .js 文件（wasm-bindgen JS 绑定）
            for (const fileConfig of engineCoreModule.wasmConfig.files) {
                const srcPaths = Array.isArray(fileConfig.src) ? fileConfig.src : [fileConfig.src];
                for (const srcPath of srcPaths) {
                    if (srcPath.endsWith('.js')) {
                        const fullPath = `${engineModulesPath}/${srcPath}`;
                        if (await fs.pathExists(fullPath)) {
                            // Use a unique alias based on module id
                            wasmBindingsAlias = `__wasm_bindings_${engineCoreModule.id.replace(/-/g, '_')}`;
                            wasmBindingsPath = fullPath;
                            moduleAliasMap[wasmBindingsAlias] = fullPath;
                            console.log(`[WebBuild] Found WASM JS bindings: ${srcPath} -> alias: ${wasmBindingsAlias}`);
                            break;
                        }
                    }
                }
                if (wasmBindingsPath) break;
            }
        }

        // 2. Generate entry file with plugin registration AND user scripts
        // 2. 生成带插件注册和用户脚本的入口文件
        const pluginModules = allModules.filter(m => m.pluginExport && m.name);
        const tempEntryPath = `${context.outputDir}/__single_file_entry.js`;

        const pluginImports = pluginModules.map((m, i) =>
            `import { ${m.pluginExport} as plugin_${i} } from '${m.name}';`
        ).join('\n');

        const pluginRegistrations = pluginModules.map((_, i) =>
            `    registerStaticPlugin(plugin_${i});`
        ).join('\n');

        // Include user scripts in the same bundle to share ComponentRegistry
        // 将用户脚本包含在同一个 bundle 中以共享 ComponentRegistry
        const userScriptsDir = `${context.projectRoot}/scripts`;
        let userScriptImports = '';
        if (await fs.pathExists(userScriptsDir)) {
            const scriptFiles = await fs.listFilesByExtension(userScriptsDir, ['ts', 'js'], true);
            const validScripts = scriptFiles.filter(f => !f.endsWith('.d.ts'));
            if (validScripts.length > 0) {
                userScriptImports = validScripts.map(scriptPath =>
                    `import '${scriptPath.replace(/\\/g, '/')}';`
                ).join('\n');
                console.log(`[WebBuild] Including ${validScripts.length} user scripts in single-file bundle`);
            }
        }

        // Generate WASM bindings import if engine core module found
        // 如果找到引擎核心模块，生成 WASM 绑定导入
        const wasmBindingsImport = wasmBindingsAlias
            ? `// WASM bindings for synchronous initialization (single-file mode)
// WASM 绑定用于同步初始化（单文件模式）
import { initSync as _wasmInitSync, GameEngine as _WasmGameEngine } from '${wasmBindingsAlias}';
export { _wasmInitSync as wasmInitSync, _WasmGameEngine as WasmGameEngine };
`
            : '';

        const entryContent = `// Auto-generated single-file entry
import { registerStaticPlugin } from '@esengine/runtime-core';
${pluginImports}

// Register all plugins at load time
${pluginRegistrations}

// Re-export platform-web
export { BrowserRuntime, create, default } from '@esengine/platform-web';
export * from '@esengine/platform-web';

${wasmBindingsImport}
// User scripts (bundled together to share ComponentRegistry)
${userScriptImports}
`;

        await fs.writeFile(tempEntryPath, entryContent);

        // 3. Bundle JS code
        // 3. 打包 JS 代码
        console.log('[WebBuild] Bundling JavaScript...');
        const bundleResult = await fs.bundleScripts({
            entryPoints: [tempEntryPath],
            outputDir: context.outputDir,
            format: 'iife',
            bundleName: '__temp_bundle',
            minify,
            sourceMap: false,
            external: [],
            projectRoot: context.projectRoot,
            globalName: 'ESEngine',
            alias: moduleAliasMap
        });

        if (!bundleResult.success) {
            throw new Error(`Failed to bundle: ${bundleResult.error}`);
        }

        // Read bundled JS content (includes engine, plugins, and user scripts)
        // 读取打包后的 JS 内容（包含引擎、插件和用户脚本）
        const bundledJsPath = `${context.outputDir}/__temp_bundle.js`;
        const jsContent = await fs.readFile(bundledJsPath);
        console.log(`[WebBuild] JS bundle size: ${this._formatBytes(jsContent.length)}`);

        // Note: User scripts are already included in the main bundle (step 2)
        // to share ComponentRegistry. No separate bundling needed.
        // 注意：用户脚本已经包含在主 bundle 中（步骤 2）以共享 ComponentRegistry，无需单独打包。

        // 4. Collect WASM files as Base64 and identify core engine WASM
        // 4. 收集 WASM 文件并转 Base64，同时识别核心引擎 WASM
        const wasmData: Record<string, string> = {};
        let engineCoreWasmKey: string | null = null;

        if (inlineConfig.inlineWasm !== false) {
            console.log('[WebBuild] Inlining WASM files...');
            for (const module of allModules) {
                if (module.wasmConfig?.files) {
                    for (const wasmFile of module.wasmConfig.files) {
                        // Try each source path
                        const srcPaths = Array.isArray(wasmFile.src) ? wasmFile.src : [wasmFile.src];
                        for (const srcPath of srcPaths) {
                            const wasmPath = `${engineModulesPath}/${srcPath}`;
                            if (await fs.pathExists(wasmPath)) {
                                const base64 = await fs.readBinaryFileAsBase64(wasmPath);
                                const wasmKey = wasmFile.dst.split('/').pop() || srcPath.split('/').pop() || module.id;

                                // Only include .wasm files (not .js bindings)
                                if (wasmKey.endsWith('.wasm')) {
                                    wasmData[wasmKey] = base64;
                                    console.log(`[WebBuild] Inlined WASM: ${wasmKey} (${this._formatBytes(base64.length * 0.75)})`);

                                    // Track core engine WASM for initialization
                                    // 跟踪核心引擎 WASM 用于初始化
                                    if (module.wasmConfig.isEngineCore) {
                                        engineCoreWasmKey = wasmKey;
                                        console.log(`[WebBuild] Identified core engine WASM: ${wasmKey}`);
                                    }
                                }
                                break; // Found the file, no need to try other paths
                            }
                        }
                    }
                }
            }
        }

        // Store engine core WASM key for HTML generation
        context.data.set('engineCoreWasmKey', engineCoreWasmKey);

        // 6. Collect assets as Base64 data URLs
        // 6. 收集资产并转 Base64 data URL
        const assetData: Record<string, { dataUrl: string; type: string }> = {};
        if (inlineConfig.inlineAssets !== false) {
            const assetsDir = `${context.projectRoot}/assets`;
            if (await fs.pathExists(assetsDir)) {
                console.log('[WebBuild] Inlining assets...');
                const assetExtensions = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'mp3', 'ogg', 'wav', 'ttf', 'woff', 'woff2', 'json'];
                const assetFiles = await fs.listFilesByExtension(assetsDir, assetExtensions, true);

                for (const assetPath of assetFiles) {
                    const ext = assetPath.split('.').pop()?.toLowerCase() || '';
                    const relativePath = assetPath.replace(assetsDir, '').replace(/\\/g, '/').replace(/^\//, '');
                    const mimeType = this._getMimeType(ext);

                    if (ext === 'json') {
                        // JSON files are read as text
                        const content = await fs.readFile(assetPath);
                        assetData[relativePath] = {
                            dataUrl: `data:application/json;base64,${Buffer.from(content).toString('base64')}`,
                            type: 'data'
                        };
                    } else {
                        // Binary files
                        const base64 = await fs.readBinaryFileAsBase64(assetPath);
                        assetData[relativePath] = {
                            dataUrl: `data:${mimeType};base64,${base64}`,
                            type: this._getAssetType(ext)
                        };
                    }
                }
                console.log(`[WebBuild] Inlined ${Object.keys(assetData).length} assets`);
            }
        }

        // 7. Collect and inline scenes (only selected scenes)
        // 7. 收集并内联场景（仅选中的场景）
        const sceneData: Record<string, unknown> = {};
        if (inlineConfig.inlineScenes !== false && webConfig.scenes && webConfig.scenes.length > 0) {
            const scenesDir = `${context.projectRoot}/scenes`;
            if (await fs.pathExists(scenesDir)) {
                console.log('[WebBuild] Inlining scenes...');
                const allSceneFiles = await fs.listFilesByExtension(scenesDir, ['ecs', 'scene', 'json'], true);
                const sceneFiles = this._filterScenesByWhitelist(allSceneFiles, webConfig.scenes);

                console.log(`[WebBuild] Selected scenes: ${webConfig.scenes.join(', ')}`);

                for (const scenePath of sceneFiles) {
                    const relativePath = scenePath.replace(scenesDir, '').replace(/\\/g, '/').replace(/^\//, '');
                    try {
                        const content = await fs.readJson<unknown>(scenePath);
                        sceneData[relativePath] = content;
                    } catch {
                        console.warn(`[WebBuild] Failed to read scene: ${relativePath}`);
                    }
                }
                console.log(`[WebBuild] Inlined ${Object.keys(sceneData).length} scenes`);
            }
        } else {
            console.log('[WebBuild] No scenes selected, skipping scene inlining');
        }

        // 8. Find main scene
        // 8. 查找主场景
        let mainScenePath = 'scenes/GameScene.ecs';
        const projectConfigPath = `${context.projectRoot}/project.json`;
        if (await fs.pathExists(projectConfigPath)) {
            try {
                const projectConfig = await fs.readJson<{ mainScene?: string }>(projectConfigPath);
                if (projectConfig.mainScene) {
                    mainScenePath = projectConfig.mainScene;
                }
            } catch {
                // Use default
            }
        }

        // 9. Generate single HTML file
        // 9. 生成单个 HTML 文件
        const html = this._generateSingleFileHtml(
            jsContent,
            wasmData,
            assetData,
            sceneData,
            mainScenePath,
            engineCoreWasmKey
        );

        const outputHtmlPath = `${context.outputDir}/index.html`;
        await fs.writeFile(outputHtmlPath, html);
        console.log(`[WebBuild] Generated single file: ${outputHtmlPath} (${this._formatBytes(html.length)})`);

        // 10. Cleanup temp files
        // 10. 清理临时文件
        if (fs.deleteFile) {
            const tempFiles = [
                tempEntryPath,
                bundledJsPath,
                `${context.outputDir}/__temp_user_scripts.js`,
                `${context.outputDir}/__user_scripts_entry.js`
            ];
            for (const tempFile of tempFiles) {
                try {
                    await fs.deleteFile(tempFile);
                } catch {
                    // Ignore
                }
            }
        }

        // Store build info
        context.data.set('buildMode', 'single-file');
        context.data.set('outputFiles', [outputHtmlPath]);
    }

    /**
     * Generate user scripts entry file.
     * 生成用户脚本入口文件。
     */
    private _generateUserScriptsEntry(scriptFiles: string[], projectRoot: string): string {
        const imports: string[] = [];
        const registrations: string[] = [];

        for (let i = 0; i < scriptFiles.length; i++) {
            const scriptPath = scriptFiles[i].replace(/\\/g, '/');
            const relativePath = scriptPath.replace(projectRoot.replace(/\\/g, '/'), '.');
            imports.push(`import * as script_${i} from '${relativePath}';`);
            registrations.push(`    registerScript(script_${i});`);
        }

        return `${imports.join('\n')}

function registerScript(module) {
    // Register exported components/systems
    for (const [name, exported] of Object.entries(module)) {
        if (typeof exported === 'function' && exported.prototype) {
            window.__ESEngineUserComponents = window.__ESEngineUserComponents || {};
            window.__ESEngineUserComponents[name] = exported;
        }
    }
}

${registrations.join('\n')}

export function register(runtime) {
    // Components are already registered globally
    console.log('[UserScripts] Registered', Object.keys(window.__ESEngineUserComponents || {}).length, 'components');
}
`;
    }

    /**
     * Generate single HTML file with all content inlined.
     * 生成内联所有内容的单个 HTML 文件。
     *
     * Note: User scripts are already bundled in jsContent to share ComponentRegistry.
     * 注意：用户脚本已经打包在 jsContent 中以共享 ComponentRegistry。
     *
     * @param engineCoreWasmKey - The key for core engine WASM (from module.json wasmConfig.isEngineCore)
     */
    private _generateSingleFileHtml(
        jsContent: string,
        wasmData: Record<string, string>,
        assetData: Record<string, { dataUrl: string; type: string }>,
        sceneData: Record<string, unknown>,
        mainScenePath: string,
        engineCoreWasmKey: string | null
    ): string {
        // Build inline data object
        const inlineData = {
            wasm: wasmData,
            assets: assetData,
            scenes: sceneData
        };

        const inlineDataJson = JSON.stringify(inlineData);

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <title>ESEngine Game</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { width: 100%; height: 100%; overflow: hidden; background: #1a1a2e; }
        #game-canvas { display: block; width: 100%; height: 100%; }
        #loading {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            background: #1a1a2e; color: #fff; font-family: system-ui, sans-serif; z-index: 1000;
        }
        #loading-text { margin-top: 20px; font-size: 14px; color: #888; }
        .spinner {
            width: 40px; height: 40px; border: 3px solid #333;
            border-top-color: #4a90d9; border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        #error {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            display: none; flex-direction: column; align-items: center; justify-content: center;
            background: #1a1a2e; color: #ff6b6b; font-family: system-ui, sans-serif; z-index: 1001;
            padding: 20px; text-align: center;
        }
    </style>
</head>
<body>
    <canvas id="game-canvas"></canvas>
    <div id="loading">
        <div class="spinner"></div>
        <div id="loading-text">Loading...</div>
    </div>
    <div id="error">
        <h2>Error</h2>
        <p id="error-message"></p>
    </div>

    <!-- Inline Data -->
    <script id="__ESENGINE_INLINE_DATA__" type="application/json">${inlineDataJson}</script>

    <!-- Fetch Interceptor (must run BEFORE engine loads) -->
    <script>
(function() {
    // Parse inline data FIRST before anything else
    const inlineDataEl = document.getElementById('__ESENGINE_INLINE_DATA__');
    const inlineData = JSON.parse(inlineDataEl.textContent);
    window.__ESENGINE_INLINE__ = inlineData;

    // Prepare WASM binary cache
    const wasmCache = {};
    for (const [name, base64] of Object.entries(inlineData.wasm || {})) {
        wasmCache[name] = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
    }

    // Prepare asset cache (convert dataUrl back to fetch response)
    const assetCache = {};
    for (const [path, data] of Object.entries(inlineData.assets || {})) {
        assetCache[path] = data;
    }

    // Build empty catalog for BrowserFileSystemService
    const emptyCatalog = {
        version: 1,
        loadStrategy: 'file',
        entries: {},
        bundles: []
    };

    // Patch fetch BEFORE engine loads
    const originalFetch = window.fetch;
    window.fetch = async function(url, options) {
        const urlStr = typeof url === 'string' ? url : url.toString();

        // Intercept asset-catalog.json
        if (urlStr.includes('asset-catalog.json')) {
            console.log('[SingleFile] Intercepted catalog request');
            return new Response(JSON.stringify(emptyCatalog), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Intercept WASM requests
        for (const [name, binary] of Object.entries(wasmCache)) {
            if (urlStr.includes(name)) {
                console.log('[SingleFile] Intercepted WASM:', name);
                return new Response(binary, {
                    status: 200,
                    headers: { 'Content-Type': 'application/wasm' }
                });
            }
        }

        // Intercept asset requests
        for (const [path, data] of Object.entries(assetCache)) {
            if (urlStr.includes(path) || urlStr.endsWith(path)) {
                console.log('[SingleFile] Intercepted asset:', path);
                // Convert data URL to blob
                const response = await fetch(data.dataUrl);
                return response;
            }
        }

        // Intercept scene requests
        for (const [scenePath, sceneData] of Object.entries(inlineData.scenes || {})) {
            if (urlStr.includes(scenePath)) {
                console.log('[SingleFile] Intercepted scene:', scenePath);
                return new Response(JSON.stringify(sceneData), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }

        // For file:// protocol, block other requests to prevent CORS errors
        if (window.location.protocol === 'file:') {
            console.warn('[SingleFile] Blocked request (file:// mode):', urlStr);
            return new Response('', { status: 404 });
        }

        return originalFetch(url, options);
    };

    console.log('[SingleFile] Fetch interceptor installed');
})();
    </script>

    <!-- Engine Bundle (includes plugins and user scripts) -->
    <script>
${jsContent}
    </script>

    <!-- Bootstrap -->
    <script>
(async function() {
    const loading = document.getElementById('loading');
    const loadingText = document.getElementById('loading-text');
    const errorDiv = document.getElementById('error');
    const errorMessage = document.getElementById('error-message');
    const inlineData = window.__ESENGINE_INLINE__;

    function updateLoading(text) {
        loadingText.textContent = text;
    }

    function showError(msg) {
        loading.style.display = 'none';
        errorDiv.style.display = 'flex';
        errorMessage.textContent = msg;
    }

    try {
        updateLoading('Initializing...');

        if (typeof ESEngine === 'undefined') {
            throw new Error('ESEngine not loaded');
        }

        // Initialize WASM from inline Base64 using exported wasmInitSync
        // The engine core WASM is identified by wasmConfig.isEngineCore in module.json
        // Engine core WASM key: ${engineCoreWasmKey ? `'${engineCoreWasmKey}'` : 'null'}
        let wasmModule = null;
        const engineCoreWasmKey = ${engineCoreWasmKey ? `'${engineCoreWasmKey}'` : 'null'};
        const wasmBase64 = engineCoreWasmKey ? inlineData.wasm[engineCoreWasmKey] : null;

        if (wasmBase64 && ESEngine.wasmInitSync && ESEngine.WasmGameEngine) {
            updateLoading('Loading WASM...');
            const wasmBinary = Uint8Array.from(atob(wasmBase64), c => c.charCodeAt(0));

            // Use wasmInitSync to synchronously initialize wasm-bindgen module
            // 使用 wasmInitSync 同步初始化 wasm-bindgen 模块
            ESEngine.wasmInitSync({ module: wasmBinary });
            console.log('[SingleFile] WASM initialized via wasmInitSync');

            // Create a mock wasm module object for BrowserRuntime
            // EngineBridge.initializeWithModule expects: wasmModule.GameEngine
            // 创建一个模拟的 wasm 模块对象供 BrowserRuntime 使用
            wasmModule = {
                // Skip default() since we already called initSync
                default: () => Promise.resolve(),
                // Provide GameEngine class from ESEngine exports
                GameEngine: ESEngine.WasmGameEngine
            };
        } else if (wasmBase64) {
            // Fallback: no wasmInitSync exported (shouldn't happen for engine core)
            console.warn('[SingleFile] wasmInitSync not found, WASM may not work');
        }

        // Create runtime
        const runtime = ESEngine.create({
            canvasId: 'game-canvas',
            width: window.innerWidth,
            height: window.innerHeight,
            assetBaseUrl: './',
            assetCatalogUrl: './asset-catalog.json'
        });

        updateLoading('Initializing runtime...');
        await runtime.initialize(wasmModule);

        updateLoading('Loading scene...');

        // Load scene from inline data
        const scenePath = '${mainScenePath}'.replace('scenes/', '');
        const sceneKey = Object.keys(inlineData.scenes).find(k => k.includes(scenePath)) || Object.keys(inlineData.scenes)[0];

        if (sceneKey && inlineData.scenes[sceneKey]) {
            await runtime.loadSceneFromData(inlineData.scenes[sceneKey]);
        } else {
            throw new Error('No scene found: ' + scenePath);
        }

        loading.style.display = 'none';
        runtime.start();

        window.addEventListener('resize', () => {
            runtime.handleResize(window.innerWidth, window.innerHeight);
        });

        console.log('[Game] Started successfully (single-file mode)');
    } catch (error) {
        console.error('[Game] Failed to start:', error);
        showError(error.message || String(error));
    }
})();
    </script>
</body>
</html>`;
    }

    /**
     * Get MIME type for file extension.
     * 获取文件扩展名的 MIME 类型。
     */
    private _getMimeType(ext: string): string {
        const mimeTypes: Record<string, string> = {
            'png': 'image/png',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'gif': 'image/gif',
            'webp': 'image/webp',
            'svg': 'image/svg+xml',
            'mp3': 'audio/mpeg',
            'ogg': 'audio/ogg',
            'wav': 'audio/wav',
            'm4a': 'audio/mp4',
            'ttf': 'font/ttf',
            'woff': 'font/woff',
            'woff2': 'font/woff2',
            'json': 'application/json',
            'wasm': 'application/wasm'
        };
        return mimeTypes[ext] || 'application/octet-stream';
    }
}
