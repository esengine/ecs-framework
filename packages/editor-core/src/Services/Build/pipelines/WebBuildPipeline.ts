/**
 * Web Platform Build Pipeline.
 * Web 平台构建管线。
 *
 * Packages the project as a web application that can run in browsers.
 * 将项目打包为可在浏览器中运行的 Web 应用。
 */

import type {
    IBuildPipeline,
    BuildConfig,
    BuildResult,
    BuildProgress,
    BuildStep,
    BuildContext,
    WebBuildConfig
} from '../IBuildPipeline';
import { BuildPlatform, BuildStatus } from '../IBuildPipeline';
import type { ModuleManifest } from '../../Module/ModuleTypes';

/**
 * Build file system interface.
 * 构建文件系统接口。
 *
 * This interface is implemented by the editor-app's BuildFileSystemService.
 * 此接口由 editor-app 的 BuildFileSystemService 实现。
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
    }): Promise<{
        success: boolean;
        outputFile?: string;
        outputSize?: number;
        error?: string;
        warnings: string[];
    }>;
    generateHtml(
        outputPath: string,
        title: string,
        scripts: string[],
        bodyContent?: string
    ): Promise<void>;
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
    /** Read binary file as base64 | 读取二进制文件为 base64 */
    readBinaryFileAsBase64?(path: string): Promise<string>;
}

/**
 * Web Platform Build Pipeline.
 * Web 平台构建管线。
 *
 * Build steps:
 * 构建步骤：
 * 1. Prepare output directory | 准备输出目录
 * 2. Compile TypeScript | 编译 TypeScript
 * 3. Bundle runtime | 打包运行时
 * 4. Copy asset files | 复制资源文件
 * 5. Generate HTML | 生成 HTML
 * 6. Post-process optimization | 后处理优化
 */
export class WebBuildPipeline implements IBuildPipeline {
    readonly platform = BuildPlatform.Web;
    readonly displayName = 'Web / H5';
    readonly description = 'Build as a web application that can run in browsers | 构建为可在浏览器中运行的 Web 应用';
    readonly icon = 'globe';

    private _fileSystem: IBuildFileSystem | null = null;
    private _enabledModules: string[] = [];
    private _disabledModules: string[] = [];
    private _engineModulesPath: string = '';

    /**
     * Set build file system service.
     * 设置构建文件系统服务。
     *
     * @param fileSystem - Build file system service | 构建文件系统服务
     */
    setFileSystem(fileSystem: IBuildFileSystem): void {
        this._fileSystem = fileSystem;
    }

    /**
     * Set enabled modules for build (whitelist approach).
     * 设置构建时启用的模块（白名单方式）。
     *
     * @param modules - List of enabled module IDs | 启用的模块 ID 列表
     */
    setEnabledModules(modules: string[]): void {
        this._enabledModules = modules;
    }

    /**
     * Set disabled modules for build (blacklist approach).
     * 设置构建时禁用的模块（黑名单方式）。
     *
     * @param modules - List of disabled module IDs | 禁用的模块 ID 列表
     */
    setDisabledModules(modules: string[]): void {
        this._disabledModules = modules;
    }

    /**
     * Set engine modules path.
     * 设置引擎模块路径。
     *
     * @param path - Path to engine modules directory | 引擎模块目录路径
     */
    setEngineModulesPath(path: string): void {
        this._engineModulesPath = path;
    }

    /**
     * Get default configuration.
     * 获取默认配置。
     */
    getDefaultConfig(): WebBuildConfig {
        return {
            platform: BuildPlatform.Web,
            outputPath: './dist/web',
            isRelease: true,
            sourceMap: false,
            format: 'iife',
            bundleModules: true,
            generateHtml: true
        };
    }

    /**
     * Validate configuration.
     * 验证配置。
     *
     * @param config - Build configuration | 构建配置
     * @returns Validation error list | 验证错误列表
     */
    validateConfig(config: BuildConfig): string[] {
        const errors: string[] = [];
        const webConfig = config as WebBuildConfig;

        if (!webConfig.outputPath) {
            errors.push('Output path cannot be empty | 输出路径不能为空');
        }

        if (webConfig.format !== 'iife' && webConfig.format !== 'esm') {
            errors.push('Output format must be iife or esm | 输出格式必须是 iife 或 esm');
        }

        return errors;
    }

    /**
     * Get build steps.
     * 获取构建步骤。
     *
     * @param config - Build configuration | 构建配置
     * @returns Build step list | 构建步骤列表
     */
    getSteps(config: BuildConfig): BuildStep[] {
        const webConfig = config as WebBuildConfig;

        const steps: BuildStep[] = [
            {
                id: 'prepare',
                name: 'Prepare output directory | 准备输出目录',
                execute: this._prepareOutputDir.bind(this)
            },
            {
                id: 'compile',
                name: 'Compile TypeScript | 编译 TypeScript',
                execute: this._compileTypeScript.bind(this)
            },
            {
                id: 'bundle-runtime',
                name: 'Bundle runtime | 打包运行时',
                execute: this._bundleRuntime.bind(this)
            },
            {
                id: 'copy-assets',
                name: 'Copy asset files | 复制资源文件',
                execute: this._copyAssets.bind(this)
            }
        ];

        if (webConfig.generateHtml) {
            steps.push({
                id: 'generate-html',
                name: 'Generate HTML | 生成 HTML',
                execute: this._generateHtml.bind(this)
            });
        }

        if (webConfig.isRelease) {
            steps.push({
                id: 'optimize',
                name: 'Optimize and compress | 优化压缩',
                execute: this._optimize.bind(this),
                optional: true
            });
        }

        return steps;
    }

    /**
     * Execute build.
     * 执行构建。
     *
     * @param config - Build configuration | 构建配置
     * @param onProgress - Progress callback | 进度回调
     * @param abortSignal - Abort signal | 中止信号
     * @returns Build result | 构建结果
     */
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

        const outputPathParts = config.outputPath.replace(/\\/g, '/').split('/');
        const buildIndex = outputPathParts.lastIndexOf('build');
        const projectRoot = buildIndex > 0
            ? outputPathParts.slice(0, buildIndex).join('/')
            : '.';

        const context: BuildContext = {
            config,
            projectRoot,
            tempDir: `${projectRoot}/temp/build`,
            outputDir: config.outputPath,
            reportProgress: () => {},
            addWarning: (warning) => warnings.push(warning),
            abortSignal: abortSignal || new AbortController().signal,
            data: new Map()
        };

        context.data.set('fileSystem', this._fileSystem);

        try {
            for (let i = 0; i < steps.length; i++) {
                const step = steps[i];

                if (abortSignal?.aborted) {
                    return {
                        success: false,
                        platform: config.platform,
                        outputPath: config.outputPath,
                        duration: Date.now() - startTime,
                        outputFiles,
                        warnings,
                        error: 'Build cancelled | 构建已取消'
                    };
                }

                onProgress?.({
                    status: this._getStatusForStep(step.id),
                    message: step.name,
                    progress: Math.round((i / totalSteps) * 100),
                    currentStep: i + 1,
                    totalSteps,
                    warnings
                });

                await step.execute(context);
            }

            let stats: BuildResult['stats'] | undefined;
            if (this._fileSystem) {
                try {
                    const totalSize = await this._fileSystem.getDirectorySize(config.outputPath);
                    stats = { totalSize, jsSize: 0, wasmSize: 0, assetsSize: 0 };
                } catch {
                    // Ignore
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

            return {
                success: true,
                platform: config.platform,
                outputPath: config.outputPath,
                duration: Date.now() - startTime,
                outputFiles,
                warnings,
                stats
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);

            onProgress?.({
                status: BuildStatus.Failed,
                message: 'Build failed | 构建失败',
                progress: 0,
                currentStep: 0,
                totalSteps,
                warnings,
                error: errorMessage
            });

            return {
                success: false,
                platform: config.platform,
                outputPath: config.outputPath,
                duration: Date.now() - startTime,
                outputFiles,
                warnings,
                error: errorMessage
            };
        }
    }

    /**
     * Check availability.
     * 检查可用性。
     *
     * Web platform is always available.
     * Web 平台始终可用。
     */
    async checkAvailability(): Promise<{ available: boolean; reason?: string }> {
        return { available: true };
    }

    /**
     * Get build status for step.
     * 获取步骤的构建状态。
     */
    private _getStatusForStep(stepId: string): BuildStatus {
        switch (stepId) {
            case 'prepare':
                return BuildStatus.Preparing;
            case 'compile':
            case 'bundle-runtime':
                return BuildStatus.Compiling;
            case 'copy-assets':
                return BuildStatus.Copying;
            case 'generate-html':
            case 'optimize':
                return BuildStatus.PostProcessing;
            default:
                return BuildStatus.Compiling;
        }
    }

    private async _prepareOutputDir(context: BuildContext): Promise<void> {
        const fs = context.data.get('fileSystem') as IBuildFileSystem | undefined;

        if (fs) {
            await fs.prepareBuildDirectory(context.outputDir);
            console.log('[WebBuild] Prepared output directory | 准备输出目录:', context.outputDir);
        } else {
            console.warn('[WebBuild] No file system service, skipping directory preparation | 无文件系统服务，跳过目录准备');
        }
    }

    private async _compileTypeScript(context: BuildContext): Promise<void> {
        const fs = context.data.get('fileSystem') as IBuildFileSystem | undefined;
        const webConfig = context.config as WebBuildConfig;

        if (!fs) {
            console.warn('[WebBuild] No file system service, skipping TypeScript compilation | 无文件系统服务，跳过 TypeScript 编译');
            return;
        }

        const scriptsDir = `${context.projectRoot}/scripts`;
        if (!await fs.pathExists(scriptsDir)) {
            console.log('[WebBuild] No scripts directory, skipping user code compilation');
            return;
        }

        const possibleEntries = ['index.ts', 'main.ts', 'game.ts', 'index.js', 'main.js'];
        let entryFile: string | null = null;
        for (const entry of possibleEntries) {
            const entryPath = `${scriptsDir}/${entry}`;
            if (await fs.pathExists(entryPath)) {
                entryFile = entryPath;
                break;
            }
        }

        if (!entryFile) {
            console.log('[WebBuild] No entry file found in scripts directory');
            return;
        }

        const result = await fs.bundleScripts({
            entryPoints: [entryFile],
            outputDir: context.outputDir,
            format: webConfig.format || 'iife',
            bundleName: 'user-code',
            minify: webConfig.isRelease,
            sourceMap: webConfig.sourceMap,
            external: ['@esengine/esengine', '@esengine/core'],
            projectRoot: context.projectRoot,
            define: {
                'process.env.NODE_ENV': webConfig.isRelease ? '"production"' : '"development"'
            }
        });

        if (!result.success) {
            throw new Error(`User code compilation failed: ${result.error}`);
        }

        result.warnings.forEach(w => context.addWarning(w));
        console.log('[WebBuild] Compiled TypeScript:', result.outputFile);
    }

    /**
     * Bundle runtime.
     * 打包运行时。
     *
     * bundleModules=true: Bundle all into runtime.browser.js
     * bundleModules=false: Copy individual module files to libs/
     */
    private async _bundleRuntime(context: BuildContext): Promise<void> {
        const fs = context.data.get('fileSystem') as IBuildFileSystem | undefined;
        const webConfig = context.config as WebBuildConfig;

        if (!fs) {
            console.warn('[WebBuild] No file system service, skipping runtime bundling | 无文件系统服务，跳过运行时打包');
            return;
        }

        const modulesPath = this._engineModulesPath || await this._findEngineModulesPath(context, fs);
        if (!modulesPath) {
            await this._copyPrebuiltRuntime(context, fs);
            return;
        }

        // Priority: disabledModules (blacklist) > enabledModules (whitelist) > defaults
        let enabledModules: string[];
        const disabledModules = context.config.disabledModules?.length
            ? context.config.disabledModules
            : this._disabledModules;

        if (disabledModules.length > 0) {
            const allModules = await this._getDefaultModules(modulesPath, fs);
            enabledModules = allModules.filter(id => !disabledModules.includes(id));
            console.log(`[WebBuild] Blacklist mode, disabled ${disabledModules.length} modules`);
        } else if (context.config.enabledModules?.length) {
            enabledModules = context.config.enabledModules;
        } else if (this._enabledModules.length > 0) {
            enabledModules = this._enabledModules;
        } else {
            enabledModules = await this._getDefaultModules(modulesPath, fs);
        }

        const modules = await this._loadModuleManifests(modulesPath, enabledModules, fs);

        if (modules.length === 0) {
            console.warn('[WebBuild] No modules found, falling back to pre-built runtime');
            await this._copyPrebuiltRuntime(context, fs);
            return;
        }

        console.log(`[WebBuild] Building with ${modules.length} modules:`, modules.map(m => m.id).join(', '));
        context.data.set('enabledModules', modules);

        if (webConfig.bundleModules !== false) {
            await this._bundleModulesIntoOne(context, fs, modules, modulesPath, webConfig);
        } else {
            await this._copyModulesSeparately(context, fs, modules, modulesPath);
            await this._copyExternalDependencies(context, fs, modules, modulesPath);
        }

        if (modules.some(m => m.requiresWasm)) {
            await this._copyWasmFiles(context, fs, modulesPath);
        }

        // Copy module WASM files to runtime paths (based on module.json runtimeWasmPath)
        await this._copyModuleWasmToRuntimePaths(context, fs, modules, modulesPath);
    }

    /**
     * Copy module WASM files to their runtime paths.
     * 将模块 WASM 文件复制到运行时路径。
     *
     * Uses runtimeWasmPath from module.json to determine destination.
     */
    private async _copyModuleWasmToRuntimePaths(
        context: BuildContext,
        fs: IBuildFileSystem,
        modules: ModuleManifest[],
        modulesPath: string | null
    ): Promise<void> {
        for (const module of modules) {
            if (!module.requiresWasm || !module.runtimeWasmPath || !module.wasmPaths?.length) {
                continue;
            }

            const wasmFileName = module.wasmPaths[0];
            const runtimePath = module.runtimeWasmPath;
            const dstPath = `${context.outputDir}/${runtimePath}`;
            const dstDir = dstPath.substring(0, dstPath.lastIndexOf('/'));

            // Build search paths including external dependencies
            const searchPaths: string[] = [];

            // Module's own pkg directory
            if (modulesPath) {
                searchPaths.push(`${modulesPath}/${module.id}/pkg/${wasmFileName}`);
            }
            searchPaths.push(`${context.outputDir}/libs/${module.id}/pkg/${wasmFileName}`);

            // External dependencies' pkg directories
            if (module.externalDependencies) {
                for (const dep of module.externalDependencies) {
                    const depId = dep.startsWith('@esengine/') ? dep.slice(10) : dep.replace(/^@[^/]+\//, '');
                    if (modulesPath) {
                        searchPaths.push(`${modulesPath}/${depId}/pkg/${wasmFileName}`);
                    }
                    searchPaths.push(`${context.outputDir}/libs/${depId}/pkg/${wasmFileName}`);
                }
            }

            let copied = false;
            for (const srcPath of searchPaths) {
                if (await fs.pathExists(srcPath)) {
                    await fs.createDirectory(dstDir);
                    await fs.copyFile(srcPath, dstPath);
                    console.log(`[WebBuild] Copied ${module.id} WASM to ${runtimePath}`);
                    copied = true;
                    break;
                }
            }

            if (!copied) {
                console.warn(`[WebBuild] WASM not found for ${module.id}: ${wasmFileName}`);
            }
        }
    }

    /**
     * Bundle all modules into a single JS file.
     * 将所有模块打包成单个 JS 文件。
     */
    private async _bundleModulesIntoOne(
        context: BuildContext,
        fs: IBuildFileSystem,
        modules: ModuleManifest[],
        modulesPath: string,
        _webConfig: WebBuildConfig
    ): Promise<void> {
        const libsDir = `${context.outputDir}/libs`;
        await fs.createDirectory(libsDir);

        const jsContents: string[] = [];
        let totalSize = 0;

        jsContents.push('/**');
        jsContents.push(' * ESEngine Runtime - Auto-bundled modules');
        jsContents.push(` * Generated: ${new Date().toISOString()}`);
        jsContents.push(` * Modules: ${modules.map(m => m.id).join(', ')}`);
        jsContents.push(' */');
        jsContents.push('');

        for (const module of modules) {
            const modulePath = `${modulesPath}/${module.id}/index.js`;

            if (await fs.pathExists(modulePath)) {
                try {
                    const content = await fs.readFile(modulePath);
                    jsContents.push(`// === Module: ${module.id} ===`);
                    jsContents.push(content);
                    jsContents.push('');
                    totalSize += content.length;
                } catch (err) {
                    context.addWarning(`Failed to read module ${module.id}: ${err}`);
                }
            } else {
                console.log(`[WebBuild] Module ${module.id} has no runtime (no index.js)`);
            }
        }

        const outputPath = `${libsDir}/runtime.browser.js`;
        await fs.writeFile(outputPath, jsContents.join('\n'));
        console.log(`[WebBuild] Bundled runtime: ${outputPath} (${this._formatBytes(totalSize)})`);
    }

    /**
     * Copy modules as separate folders: libs/{moduleId}/{moduleId}.js
     * 将模块复制为单独的文件夹：libs/{moduleId}/{moduleId}.js
     */
    private async _copyModulesSeparately(
        context: BuildContext,
        fs: IBuildFileSystem,
        modules: ModuleManifest[],
        modulesPath: string
    ): Promise<void> {
        const libsDir = `${context.outputDir}/libs`;
        await fs.createDirectory(libsDir);
        const copySourceMaps = context.config.sourceMap === true;
        let totalSize = 0;
        const copiedModules: string[] = [];

        for (const module of modules) {
            const srcModuleDir = `${modulesPath}/${module.id}`;
            const srcPath = `${srcModuleDir}/index.js`;

            if (await fs.pathExists(srcPath)) {
                const dstModuleDir = `${libsDir}/${module.id}`;
                await fs.createDirectory(dstModuleDir);

                const dstPath = `${dstModuleDir}/${module.id}.js`;
                await fs.copyFile(srcPath, dstPath);

                const size = await fs.getFileSize(srcPath);
                totalSize += size;
                copiedModules.push(module.id);

                if (copySourceMaps) {
                    const srcMapPath = `${srcPath}.map`;
                    if (await fs.pathExists(srcMapPath)) {
                        await fs.copyFile(srcMapPath, `${dstPath}.map`);
                    }
                }

                if (module.includes && module.includes.length > 0) {
                    const includedFiles = await this._resolveIncludes(fs, srcModuleDir, module.includes);
                    for (const file of includedFiles) {
                        const fileName = file.split(/[/\\]/).pop() || file;
                        const includeDstPath = `${dstModuleDir}/${fileName}`;
                        await fs.copyFile(file, includeDstPath);
                        totalSize += await fs.getFileSize(file);

                        if (copySourceMaps) {
                            const includeMapPath = `${file}.map`;
                            if (await fs.pathExists(includeMapPath)) {
                                await fs.copyFile(includeMapPath, `${includeDstPath}.map`);
                            }
                        }
                    }
                }

                // Copy pkg JS files (skip WASM if runtimeWasmPath is set)
                const pkgSrcDir = `${srcModuleDir}/pkg`;
                if (await fs.pathExists(pkgSrcDir)) {
                    const pkgDstDir = `${dstModuleDir}/pkg`;
                    await fs.createDirectory(pkgDstDir);
                    const pkgFiles = await fs.listFilesByExtension(pkgSrcDir, ['js'], false);
                    for (const pkgFile of pkgFiles) {
                        const fileName = pkgFile.split(/[/\\]/).pop() || '';
                        await fs.copyFile(pkgFile, `${pkgDstDir}/${fileName}`);
                    }
                }

                // Copy WASM only if module doesn't have runtimeWasmPath (will be copied to that location instead)
                if (module.requiresWasm && module.wasmPaths && module.wasmPaths.length > 0 && !module.runtimeWasmPath) {
                    for (const wasmRelPath of module.wasmPaths) {
                        const wasmFileName = wasmRelPath.split(/[/\\]/).pop() || wasmRelPath;
                        const possiblePaths = [
                            `${srcModuleDir}/${wasmRelPath}`,
                            `${srcModuleDir}/${wasmFileName}`,
                            `${srcModuleDir}/pkg/${wasmFileName}`,
                        ];
                        for (const wasmSrcPath of possiblePaths) {
                            if (await fs.pathExists(wasmSrcPath)) {
                                const wasmDstDir = `${dstModuleDir}/pkg`;
                                await fs.createDirectory(wasmDstDir);
                                await fs.copyFile(wasmSrcPath, `${wasmDstDir}/${wasmFileName}`);
                                console.log(`[WebBuild] Copied WASM to ${module.id}/pkg/: ${wasmFileName}`);
                                break;
                            }
                        }
                    }
                }
            }
        }

        console.log(`[WebBuild] Copied ${copiedModules.length} modules (${this._formatBytes(totalSize)})`);
    }

    private async _resolveIncludes(
        fs: IBuildFileSystem,
        moduleDir: string,
        includes: string[]
    ): Promise<string[]> {
        const resolvedFiles: string[] = [];
        const allJsFiles = await fs.listFilesByExtension(moduleDir, ['js'], false);

        for (const pattern of includes) {
            const regexPattern = pattern
                .replace(/\\/g, '\\\\')
                .replace(/\./g, '\\.')
                .replace(/\*/g, '.*')
                .replace(/\?/g, '.');
            const regex = new RegExp(`^${regexPattern}$`);

            for (const filePath of allJsFiles) {
                const fileName = filePath.split(/[/\\]/).pop() || '';
                if (regex.test(fileName) && !resolvedFiles.includes(filePath)) {
                    resolvedFiles.push(filePath);
                }
            }
        }

        return resolvedFiles;
    }

    /**
     * Copy external dependencies (e.g., @esengine/rapier2d) to output directory.
     * 复制外部依赖（如 @esengine/rapier2d）到输出目录。
     */
    private async _copyExternalDependencies(
        context: BuildContext,
        fs: IBuildFileSystem,
        modules: ModuleManifest[],
        modulesPath: string
    ): Promise<void> {
        const externalDeps = new Set<string>();
        for (const m of modules) {
            if (m.externalDependencies) {
                for (const dep of m.externalDependencies) {
                    externalDeps.add(dep);
                }
            }
        }

        if (externalDeps.size === 0) return;

        const libsDir = `${context.outputDir}/libs`;
        await fs.createDirectory(libsDir);
        const copySourceMaps = context.config.sourceMap === true;
        let totalSize = 0;
        const copiedDeps: string[] = [];

        for (const dep of externalDeps) {
            const depId = dep.startsWith('@esengine/') ? dep.slice(10) : dep.replace(/^@[^/]+\//, '');
            const srcModuleDir = `${modulesPath}/${depId}`;
            const srcPath = `${srcModuleDir}/index.js`;

            if (await fs.pathExists(srcPath)) {
                const dstModuleDir = `${libsDir}/${depId}`;
                await fs.createDirectory(dstModuleDir);

                const dstPath = `${dstModuleDir}/${depId}.js`;
                await fs.copyFile(srcPath, dstPath);

                const size = await fs.getFileSize(srcPath);
                totalSize += size;
                copiedDeps.push(depId);

                if (copySourceMaps) {
                    const srcMapPath = `${srcPath}.map`;
                    if (await fs.pathExists(srcMapPath)) {
                        await fs.copyFile(srcMapPath, `${dstPath}.map`);
                    }
                }

                // Copy pkg directory for WASM bindings (../pkg relative import)
                // Only copy JS files, skip WASM (managed by runtimeWasmPath)
                const pkgSrcDir = `${srcModuleDir}/pkg`;
                if (await fs.pathExists(pkgSrcDir)) {
                    const pkgDstDir = `${dstModuleDir}/pkg`;
                    await fs.createDirectory(pkgDstDir);
                    const pkgJsFiles = await fs.listFilesByExtension(pkgSrcDir, ['js'], false);
                    for (const pkgFile of pkgJsFiles) {
                        const fileName = pkgFile.split(/[/\\]/).pop() || '';
                        await fs.copyFile(pkgFile, `${pkgDstDir}/${fileName}`);
                    }
                }

                console.log(`[WebBuild] Copied external: ${depId} (${this._formatBytes(size)})`);
            } else {
                console.warn(`[WebBuild] External dependency not found: ${dep}`);
            }
        }

        if (copiedDeps.length > 0) {
            console.log(`[WebBuild] Copied ${copiedDeps.length} external dependencies`);
        }
    }

    private async _findEngineModulesPath(
        context: BuildContext,
        fs: IBuildFileSystem
    ): Promise<string | null> {
        const editorPaths = [
            'C:/Program Files/ESEngine Editor/engine',
            this._engineModulesPath,
            `${context.projectRoot}/node_modules/@esengine`
        ].filter(Boolean) as string[];

        for (const basePath of editorPaths) {
            const indexPath = `${basePath}/index.json`;
            if (await fs.pathExists(indexPath)) {
                console.log(`[WebBuild] Found engine modules at: ${basePath}`);
                return basePath;
            }
            const corePath = `${basePath}/core/module.json`;
            if (await fs.pathExists(corePath)) {
                console.log(`[WebBuild] Found engine modules at: ${basePath}`);
                return basePath;
            }
        }

        console.warn('[WebBuild] Engine modules path not found');
        return null;
    }

    private async _getDefaultModules(
        modulesPath: string,
        fs: IBuildFileSystem
    ): Promise<string[]> {
        const indexPath = `${modulesPath}/index.json`;
        if (await fs.pathExists(indexPath)) {
            try {
                const indexData = await fs.readJson<{
                    modules: Array<{ id: string; hasRuntime?: boolean; isCore?: boolean }>;
                }>(indexPath);
                const moduleIds = indexData.modules.map(m => m.id);
                console.log(`[WebBuild] Found ${moduleIds.length} modules from index.json`);
                return moduleIds;
            } catch (err) {
                console.warn('[WebBuild] Failed to read index.json:', err);
            }
        }

        // Fallback to core modules only
        const available: string[] = [];
        const coreModules = ['core', 'math', 'engine-core', 'asset-system'];
        for (const id of coreModules) {
            const manifestPath = `${modulesPath}/${id}/module.json`;
            if (await fs.pathExists(manifestPath)) {
                available.push(id);
            }
        }
        return available;
    }

    private async _loadModuleManifests(
        modulesPath: string,
        moduleIds: string[],
        fs: IBuildFileSystem
    ): Promise<ModuleManifest[]> {
        const manifests: ModuleManifest[] = [];

        for (const id of moduleIds) {
            const manifestPath = `${modulesPath}/${id}/module.json`;
            try {
                if (await fs.pathExists(manifestPath)) {
                    const manifest = await fs.readJson<ModuleManifest>(manifestPath);
                    manifests.push(manifest);
                }
            } catch (error) {
                console.warn(`[WebBuild] Failed to load module manifest: ${id}`, error);
            }
        }

        return this._sortModulesByDependencies(manifests);
    }

    private _sortModulesByDependencies(modules: ModuleManifest[]): ModuleManifest[] {
        const sorted: ModuleManifest[] = [];
        const visited = new Set<string>();
        const moduleMap = new Map(modules.map(m => [m.id, m]));

        const visit = (module: ModuleManifest) => {
            if (visited.has(module.id)) return;
            visited.add(module.id);
            for (const depId of module.dependencies) {
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

    private async _copyPrebuiltRuntime(
        context: BuildContext,
        fs: IBuildFileSystem
    ): Promise<void> {
        const possiblePaths = [
            'C:/Program Files/ESEngine Editor/runtime.browser.js',
            `${context.projectRoot}/node_modules/@esengine/platform-web/dist/runtime.browser.js`
        ];

        for (const srcPath of possiblePaths) {
            if (await fs.pathExists(srcPath)) {
                await fs.copyFile(srcPath, `${context.outputDir}/libs/runtime.browser.js`);
                console.log('[WebBuild] Copied pre-built runtime');
                await this._copyWasmFiles(context, fs, null);
                return;
            }
        }

        context.addWarning('runtime.browser.js not found');
    }

    /**
     * Copy core engine WASM to libs/es-engine/.
     * 将核心引擎 WASM 复制到 libs/es-engine/。
     */
    private async _copyWasmFiles(
        context: BuildContext,
        fs: IBuildFileSystem,
        modulesPath: string | null
    ): Promise<void> {
        const esEngineDir = `${context.outputDir}/libs/es-engine`;
        await fs.createDirectory(esEngineDir);

        const engineWasmPaths = [
            'C:/Program Files/ESEngine Editor',
            modulesPath ? `${modulesPath}/../wasm` : null,
            this._engineModulesPath ? `${this._engineModulesPath}/../../../engine/pkg` : null,
            `${context.projectRoot}/node_modules/@esengine/engine/pkg`,
            `${context.projectRoot}/node_modules/@esengine/ecs-engine-bindgen/wasm`
        ].filter(Boolean) as string[];

        for (const wasmSrc of engineWasmPaths) {
            if (await fs.pathExists(wasmSrc)) {
                const count = await fs.copyDirectory(wasmSrc, esEngineDir, ['*.wasm', 'es_engine.js', 'es_engine_bg.js']);
                if (count > 0) {
                    console.log(`[WebBuild] Copied engine WASM: ${count} files`);
                    return;
                }
            }
        }

        context.addWarning('Engine WASM files not found');
    }

    private _formatBytes(bytes: number): string {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    private async _copyAssets(context: BuildContext): Promise<void> {
        const fs = context.data.get('fileSystem') as IBuildFileSystem | undefined;

        if (!fs) {
            console.warn('[WebBuild] No file system service, skipping asset copying');
            return;
        }

        const assetPatterns = [
            '*.png', '*.jpg', '*.jpeg', '*.gif', '*.webp', '*.svg',
            '*.mp3', '*.wav', '*.ogg', '*.m4a',
            '*.json', '*.ecs', '*.ecs.bin',
            '*.tilemap.json', '*.tileset.json',
            '*.ttf', '*.otf', '*.woff', '*.woff2',
            '*.glsl', '*.vert', '*.frag',
            '*.btree', '*.bp', '*.mat', '*.shader'
        ];

        const assetsDir = `${context.projectRoot}/assets`;
        if (await fs.pathExists(assetsDir)) {
            const count = await fs.copyDirectory(assetsDir, `${context.outputDir}/assets`, assetPatterns);
            console.log(`[WebBuild] Copied assets: ${count} files`);
        }

        const scenesDir = `${context.projectRoot}/scenes`;
        if (await fs.pathExists(scenesDir)) {
            const count = await fs.copyDirectory(scenesDir, `${context.outputDir}/scenes`, ['*.ecs', '*.ecs.bin', '*.json']);
            console.log(`[WebBuild] Copied scenes: ${count} files`);
        }

        if (context.config.scenes && context.config.scenes.length > 0) {
            console.log(`[WebBuild] Configured scenes: ${context.config.scenes.join(', ')}`);
        }

        // Generate asset catalog
        await this._generateAssetCatalog(context, fs);
    }

    /**
     * Generate asset-catalog.json for runtime asset loading.
     * 生成 asset-catalog.json 用于运行时资产加载。
     */
    private async _generateAssetCatalog(
        context: BuildContext,
        fs: IBuildFileSystem
    ): Promise<void> {
        const assetsDir = `${context.outputDir}/assets`;
        if (!await fs.pathExists(assetsDir)) {
            console.log('[WebBuild] No assets directory, skipping catalog generation');
            return;
        }

        const assetExtensions = [
            'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg',
            'mp3', 'wav', 'ogg', 'm4a',
            'json', 'ecs',
            'ttf', 'otf', 'woff', 'woff2',
            'glsl', 'vert', 'frag',
            'btree', 'bp', 'mat', 'shader'
        ];

        const allFiles = await fs.listFilesByExtension(assetsDir, assetExtensions, true);

        const entries: Record<string, {
            guid: string;
            path: string;
            type: string;
            size: number;
            hash: string;
        }> = {};

        for (const filePath of allFiles) {
            const relativePath = filePath
                .replace(context.outputDir, '')
                .replace(/\\/g, '/')
                .replace(/^\//, '');

            const ext = filePath.split('.').pop()?.toLowerCase() || '';
            const type = this._getAssetType(ext);

            // Use path as pseudo-GUID for now (can be enhanced with real GUID support)
            const guid = relativePath.replace(/[^a-zA-Z0-9]/g, '-');

            let size = 0;
            try {
                size = await fs.getFileSize(filePath);
            } catch {
                // Ignore size errors
            }

            entries[guid] = {
                guid,
                path: relativePath,
                type,
                size,
                hash: '' // Can be enhanced with real hash
            };
        }

        const catalog = {
            version: '1.0',
            createdAt: Date.now(),
            entries
        };

        await fs.writeFile(
            `${context.outputDir}/asset-catalog.json`,
            JSON.stringify(catalog, null, 2)
        );

        console.log(`[WebBuild] Generated asset catalog: ${Object.keys(entries).length} entries`);
    }

    /**
     * Get asset type from file extension.
     * 根据文件扩展名获取资产类型。
     */
    private _getAssetType(ext: string): string {
        const typeMap: Record<string, string> = {
            png: 'texture', jpg: 'texture', jpeg: 'texture',
            gif: 'texture', webp: 'texture', svg: 'texture',
            mp3: 'audio', wav: 'audio', ogg: 'audio', m4a: 'audio',
            json: 'json', ecs: 'scene',
            ttf: 'font', otf: 'font', woff: 'font', woff2: 'font',
            glsl: 'shader', vert: 'shader', frag: 'shader',
            btree: 'behavior-tree', bp: 'blueprint',
            mat: 'material', shader: 'shader'
        };
        return typeMap[ext] || 'unknown';
    }

    private async _generateHtml(context: BuildContext): Promise<void> {
        const fs = context.data.get('fileSystem') as IBuildFileSystem | undefined;
        const webConfig = context.config as WebBuildConfig;
        const enabledModules = context.data.get('enabledModules') as ModuleManifest[] | undefined;

        if (!fs) {
            console.warn('[WebBuild] No file system service, skipping HTML generation');
            return;
        }

        let mainScenePath = './assets/Untitled.ecs';
        if (context.config.scenes && context.config.scenes.length > 0) {
            mainScenePath = context.config.scenes[0];
            if (mainScenePath.includes(context.projectRoot)) {
                mainScenePath = './' + mainScenePath.replace(context.projectRoot, '').replace(/^[/\\]+/, '');
            }
        } else {
            const sceneFiles = await fs.listFilesByExtension(`${context.outputDir}/assets`, ['.ecs']);
            if (sceneFiles.length > 0) {
                mainScenePath = './assets/' + sceneFiles[0].split(/[/\\]/).pop();
            }
        }

        // Check if WASM engine is available
        const esEngineDir = `${context.outputDir}/libs/es-engine`;
        const hasWasm = await fs.pathExists(esEngineDir);

        const useBundledModules = webConfig.bundleModules !== false;
        let importMapScript = '';
        let pluginImportCode = '';

        if (!useBundledModules && enabledModules) {
            const imports: Record<string, string> = {};
            for (const m of enabledModules) {
                // All modules use same pattern: libs/{id}/{id}.js
                imports[`@esengine/${m.id}`] = `./libs/${m.id}/${m.id}.js`;
                if (m.name && m.name !== `@esengine/${m.id}`) {
                    imports[m.name] = imports[`@esengine/${m.id}`];
                }
            }

            const externalDeps = new Set<string>();
            for (const m of enabledModules) {
                if (m.externalDependencies) {
                    for (const dep of m.externalDependencies) {
                        externalDeps.add(dep);
                    }
                }
            }
            for (const dep of externalDeps) {
                const depId = dep.startsWith('@esengine/') ? dep.slice(10) : dep.replace(/^@[^/]+\//, '');
                imports[dep] = `./libs/${depId}/${depId}.js`;
            }

            importMapScript = `    <script type="importmap">
    ${JSON.stringify({ imports }, null, 2).split('\n').join('\n    ')}
    </script>`;

            const pluginModules = enabledModules.filter(m =>
                m.pluginExport && m.id !== 'core' && m.id !== 'math' && m.id !== 'platform-web' && m.id !== 'runtime-core'
            );
            if (pluginModules.length > 0) {
                pluginImportCode = pluginModules.map(m =>
                    `                try {
                    const { ${m.pluginExport} } = await import('${m.name}');
                    runtime.registerPlugin(${m.pluginExport});
                } catch (e) {
                    console.warn('[Game] Failed to load plugin ${m.id}:', e.message);
                }`
                ).join('\n');
            }
        }
        const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <title>Game</title>
${importMapScript}
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { width: 100%; height: 100%; overflow: hidden; background: #1a1a2e; }
        #game-canvas { width: 100%; height: 100%; display: block; }
        #loading {
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            display: flex; flex-direction: column;
            align-items: center; justify-content: center;
            background: #1a1a2e; color: #eee; font-family: sans-serif;
        }
        #loading .spinner {
            width: 40px; height: 40px; border: 3px solid #333;
            border-top-color: #4a9eff; border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        #loading .message { margin-top: 16px; font-size: 14px; }
        @keyframes spin { to { transform: rotate(360deg); } }
        #error {
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            display: none; flex-direction: column;
            align-items: center; justify-content: center;
            background: #1a1a2e; color: #ff6b6b; font-family: sans-serif;
            padding: 20px; text-align: center;
        }
        #error.show { display: flex; }
        #error h2 { margin-bottom: 16px; }
        #error pre {
            background: rgba(0,0,0,0.3); padding: 16px; border-radius: 8px;
            max-width: 600px; white-space: pre-wrap; word-break: break-word;
            font-size: 13px; line-height: 1.5;
        }
        #error .hint { margin-top: 20px; color: #aaa; font-size: 13px; }
        #error code { background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px; }
    </style>
</head>
<body>
    <div id="loading">
        <div class="spinner"></div>
        <div class="message" id="loading-message">Loading...</div>
    </div>
    <div id="error">
        <h2 id="error-title">Failed to start game</h2>
        <pre id="error-message"></pre>
        <div class="hint" id="error-hint"></div>
    </div>
    <canvas id="game-canvas"></canvas>

${useBundledModules ? `    <!-- Runtime library -->
    <script src="libs/runtime.browser.js"></script>

    <script>
        (async function() {
            const loading = document.getElementById('loading');
            const loadingMessage = document.getElementById('loading-message');
            const errorDiv = document.getElementById('error');
            const errorTitle = document.getElementById('error-title');
            const errorMessage = document.getElementById('error-message');
            const errorHint = document.getElementById('error-hint');

            function showError(title, msg, hint) {
                loading.style.display = 'none';
                errorTitle.textContent = title || 'Failed to start game';
                errorMessage.textContent = msg;
                if (hint) errorHint.innerHTML = hint;
                errorDiv.classList.add('show');
                console.error('[Game]', msg);
            }

            function updateLoading(msg) {
                loadingMessage.textContent = msg;
                console.log('[Game]', msg);
            }

            if (location.protocol === 'file:') {
                showError(
                    'Cannot run from local file',
                    'This game requires a web server to run properly.',
                    'Start a local server: <code>npx serve</code>'
                );
                return;
            }

            try {
                if (typeof ECSRuntime === 'undefined') {
                    throw new Error('ECSRuntime not loaded. Check if libs/runtime.browser.js exists.');
                }

                updateLoading('Loading WASM module...');
                ${hasWasm ? `// Import WASM wrapper module (wasm-bindgen generated)
                const wasmModule = await import('./libs/es-engine/es_engine.js');` : `const wasmModule = null;`}

                updateLoading('Initializing runtime...');
                const runtime = ECSRuntime.create({
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
                showError(null, error.message || String(error), null);
            }
        })();
    </script>` : `    <!-- Engine modules (ES Modules with dynamic plugin loading) -->
    <script type="module">
        const loading = document.getElementById('loading');
        const loadingMessage = document.getElementById('loading-message');
        const errorDiv = document.getElementById('error');
        const errorTitle = document.getElementById('error-title');
        const errorMessage = document.getElementById('error-message');
        const errorHint = document.getElementById('error-hint');

        function showError(title, msg, hint) {
            loading.style.display = 'none';
            errorTitle.textContent = title || 'Failed to start game';
            errorMessage.textContent = msg;
            if (hint) errorHint.innerHTML = hint;
            errorDiv.classList.add('show');
            console.error('[Game]', msg);
        }

        function updateLoading(msg) {
            loadingMessage.textContent = msg;
            console.log('[Game]', msg);
        }

        if (location.protocol === 'file:') {
            showError(
                'Cannot run from local file',
                'This game requires a web server to run properly.',
                'Start a local server: <code>npx serve</code>'
            );
        } else {
            try {
                updateLoading('Loading runtime...');
                const ECSRuntime = (await import('@esengine/platform-web')).default;

                updateLoading('Loading WASM module...');
                ${hasWasm ? `// Import WASM wrapper module (wasm-bindgen generated)
                const wasmModule = await import('./libs/es-engine/es_engine.js');` : `const wasmModule = null;`}

                updateLoading('Initializing runtime...');
                const runtime = ECSRuntime.create({
                    canvasId: 'game-canvas',
                    width: window.innerWidth,
                    height: window.innerHeight,
                    assetBaseUrl: './assets',
                    assetCatalogUrl: './asset-catalog.json'
                });

                updateLoading('Loading plugins...');
${pluginImportCode}

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
                showError(null, error.message || String(error), null);
            }
        }
    </script>`}
</body>
</html>`;

        await fs.writeFile(`${context.outputDir}/index.html`, htmlContent);
        console.log(`[WebBuild] Generated HTML (${useBundledModules ? 'bundled' : 'separate modules'})`);
    }

    private async _optimize(_context: BuildContext): Promise<void> {
        console.log('[WebBuild] Optimization complete (minification done during bundling)');
    }
}
