/**
 * WeChat MiniGame Build Pipeline.
 * 微信小游戏构建管线。
 *
 * Packages the project as a format that can run on WeChat MiniGame platform.
 * 将项目打包为可在微信小游戏平台运行的格式。
 */

import type {
    IBuildPipeline,
    BuildConfig,
    BuildResult,
    BuildProgress,
    BuildStep,
    BuildContext,
    WeChatBuildConfig
} from '../IBuildPipeline';
import { BuildPlatform, BuildStatus } from '../IBuildPipeline';
import type { IBuildFileSystem } from './WebBuildPipeline';

/**
 * WASM file configuration to be copied.
 * 需要复制的 WASM 文件配置。
 */
interface WasmFileConfig {
    /** Source file path (relative to node_modules) | 源文件路径（相对于 node_modules） */
    source: string;
    /** Target file path (relative to output directory) | 目标文件路径（相对于输出目录） */
    target: string;
    /** Description | 描述 */
    description: string;
}

/**
 * WeChat MiniGame Build Pipeline.
 * 微信小游戏构建管线。
 *
 * Build steps:
 * 构建步骤：
 * 1. Prepare output directory | 准备输出目录
 * 2. Compile TypeScript | 编译 TypeScript
 * 3. Bundle runtime (using WeChat adapter) | 打包运行时（使用微信适配器）
 * 4. Copy WASM files | 复制 WASM 文件
 * 5. Copy asset files | 复制资源文件
 * 6. Generate game.json | 生成 game.json
 * 7. Generate game.js | 生成 game.js
 * 8. Post-process | 后处理
 */
export class WeChatBuildPipeline implements IBuildPipeline {
    readonly platform = BuildPlatform.WeChatMiniGame;
    readonly displayName = 'WeChat MiniGame | 微信小游戏';
    readonly description = 'Build as a format that can run on WeChat MiniGame platform | 构建为可在微信小游戏平台运行的格式';
    readonly icon = 'message-circle';

    private _fileSystem: IBuildFileSystem | null = null;

    /**
     * WASM file list to be copied.
     * 需要复制的 WASM 文件列表。
     */
    private readonly _wasmFiles: WasmFileConfig[] = [
        {
            source: '@dimforge/rapier2d/rapier_wasm2d_bg.wasm',
            target: 'wasm/rapier2d_bg.wasm',
            description: 'Rapier2D Physics Engine | Rapier2D 物理引擎'
        }
        // More WASM files can be added here | 可以在这里添加更多 WASM 文件
    ];

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
     * Get default configuration.
     * 获取默认配置。
     */
    getDefaultConfig(): WeChatBuildConfig {
        return {
            platform: BuildPlatform.WeChatMiniGame,
            outputPath: './dist/wechat',
            isRelease: true,
            sourceMap: false,
            appId: '',
            useSubpackages: false,
            mainPackageLimit: 4096, // 4MB
            usePlugins: false
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
        const wxConfig = config as WeChatBuildConfig;

        if (!wxConfig.outputPath) {
            errors.push('Output path cannot be empty | 输出路径不能为空');
        }

        if (!wxConfig.appId) {
            errors.push('AppID cannot be empty | AppID 不能为空');
        } else if (!/^wx[a-f0-9]{16}$/.test(wxConfig.appId)) {
            errors.push('AppID format is incorrect (should be 18 characters starting with wx) | AppID 格式不正确（应为 wx 开头的18位字符）');
        }

        if (wxConfig.mainPackageLimit < 1024) {
            errors.push('Main package size limit cannot be less than 1MB | 主包大小限制不能小于 1MB');
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
        const wxConfig = config as WeChatBuildConfig;

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
                id: 'copy-wasm',
                name: 'Copy WASM files | 复制 WASM 文件',
                execute: this._copyWasmFiles.bind(this)
            },
            {
                id: 'copy-assets',
                name: 'Copy asset files | 复制资源文件',
                execute: this._copyAssets.bind(this)
            },
            {
                id: 'generate-game-json',
                name: 'Generate game.json | 生成 game.json',
                execute: this._generateGameJson.bind(this)
            },
            {
                id: 'generate-game-js',
                name: 'Generate game.js | 生成 game.js',
                execute: this._generateGameJs.bind(this)
            },
            {
                id: 'generate-project-config',
                name: 'Generate project.config.json | 生成 project.config.json',
                execute: this._generateProjectConfig.bind(this)
            }
        ];

        if (wxConfig.useSubpackages) {
            steps.push({
                id: 'split-subpackages',
                name: 'Process subpackages | 分包处理',
                execute: this._splitSubpackages.bind(this)
            });
        }

        if (wxConfig.isRelease) {
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

        // Infer project root from output path | 从输出路径推断项目根目录
        // outputPath is typically: /path/to/project/build/wechat-minigame
        // So we go up 2 levels to get project root | 所以我们向上2级获取项目根目录
        const outputPathParts = config.outputPath.replace(/\\/g, '/').split('/');
        const buildIndex = outputPathParts.lastIndexOf('build');
        const projectRoot = buildIndex > 0
            ? outputPathParts.slice(0, buildIndex).join('/')
            : '.';

        // Create build context | 创建构建上下文
        const context: BuildContext = {
            config,
            projectRoot,
            tempDir: `${projectRoot}/temp/build-wechat`,
            outputDir: config.outputPath,
            reportProgress: (message, progress) => {
                // Handled below | 在下面处理
            },
            addWarning: (warning) => {
                warnings.push(warning);
            },
            abortSignal: abortSignal || new AbortController().signal,
            data: new Map()
        };

        // Store file system and WASM config for subsequent steps | 存储文件系统和 WASM 配置供后续步骤使用
        context.data.set('fileSystem', this._fileSystem);
        context.data.set('wasmFiles', this._wasmFiles);

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

            // Get output stats | 获取输出统计
            let stats: BuildResult['stats'] | undefined;
            if (this._fileSystem) {
                try {
                    const totalSize = await this._fileSystem.getDirectorySize(config.outputPath);
                    stats = {
                        totalSize,
                        jsSize: 0,
                        wasmSize: 0,
                        assetsSize: 0
                    };
                } catch {
                    // Ignore stats error | 忽略统计错误
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
     */
    async checkAvailability(): Promise<{ available: boolean; reason?: string }> {
        // TODO: Check if WeChat DevTools is installed | 检查微信开发者工具是否安装
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
            case 'copy-wasm':
            case 'copy-assets':
                return BuildStatus.Copying;
            case 'generate-game-json':
            case 'generate-game-js':
            case 'generate-project-config':
            case 'split-subpackages':
            case 'optimize':
                return BuildStatus.PostProcessing;
            default:
                return BuildStatus.Compiling;
        }
    }

    // ==================== Build Step Implementations | 构建步骤实现 ====================

    /**
     * Prepare output directory.
     * 准备输出目录。
     */
    private async _prepareOutputDir(context: BuildContext): Promise<void> {
        const fs = context.data.get('fileSystem') as IBuildFileSystem | undefined;

        if (fs) {
            await fs.prepareBuildDirectory(context.outputDir);
            console.log('[WeChatBuild] Prepared output directory | 准备输出目录:', context.outputDir);
        } else {
            console.warn('[WeChatBuild] No file system service, skipping | 无文件系统服务，跳过');
        }
    }

    /**
     * Compile TypeScript.
     * 编译 TypeScript。
     */
    private async _compileTypeScript(context: BuildContext): Promise<void> {
        const fs = context.data.get('fileSystem') as IBuildFileSystem | undefined;
        const wxConfig = context.config as WeChatBuildConfig;

        if (!fs) {
            console.warn('[WeChatBuild] No file system service, skipping | 无文件系统服务，跳过');
            return;
        }

        // Find user script entry point | 查找用户脚本入口点
        const scriptsDir = `${context.projectRoot}/scripts`;
        const hasScripts = await fs.pathExists(scriptsDir);

        if (!hasScripts) {
            console.log('[WeChatBuild] No scripts directory found | 未找到脚本目录');
            return;
        }

        // Find entry file | 查找入口文件
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
            console.log('[WeChatBuild] No entry file found | 未找到入口文件');
            return;
        }

        // Bundle user scripts for WeChat | 为微信打包用户脚本
        const result = await fs.bundleScripts({
            entryPoints: [entryFile],
            outputDir: `${context.outputDir}/libs`,
            format: 'iife', // WeChat uses iife format | 微信使用 iife 格式
            bundleName: 'user-code',
            minify: wxConfig.isRelease,
            sourceMap: wxConfig.sourceMap,
            external: ['@esengine/ecs-framework', '@esengine/core'],
            projectRoot: context.projectRoot,
            define: {
                'process.env.NODE_ENV': wxConfig.isRelease ? '"production"' : '"development"',
                'wx': 'wx' // WeChat global | 微信全局对象
            }
        });

        if (!result.success) {
            throw new Error(`User code compilation failed | 用户代码编译失败: ${result.error}`);
        }

        result.warnings.forEach(w => context.addWarning(w));
        console.log('[WeChatBuild] Compiled TypeScript | 编译 TypeScript:', result.outputFile);
    }

    /**
     * Bundle runtime.
     * 打包运行时。
     */
    private async _bundleRuntime(context: BuildContext): Promise<void> {
        const fs = context.data.get('fileSystem') as IBuildFileSystem | undefined;

        if (!fs) {
            console.warn('[WeChatBuild] No file system service, skipping | 无文件系统服务，跳过');
            return;
        }

        // Copy pre-built runtime files with WeChat adapter | 复制带微信适配器的预构建运行时文件
        const runtimeSrc = `${context.projectRoot}/node_modules/@esengine/platform-wechat/dist`;
        const runtimeDst = `${context.outputDir}/libs`;

        const hasWxRuntime = await fs.pathExists(runtimeSrc);
        if (hasWxRuntime) {
            const count = await fs.copyDirectory(runtimeSrc, runtimeDst, ['*.js']);
            console.log(`[WeChatBuild] Copied WeChat runtime | 复制微信运行时: ${count} files`);
        } else {
            // Fallback to standard runtime | 回退到标准运行时
            const stdRuntimeSrc = `${context.projectRoot}/node_modules/@esengine/ecs-framework/dist`;
            const hasStdRuntime = await fs.pathExists(stdRuntimeSrc);
            if (hasStdRuntime) {
                const count = await fs.copyDirectory(stdRuntimeSrc, runtimeDst, ['*.js']);
                console.log(`[WeChatBuild] Copied standard runtime | 复制标准运行时: ${count} files`);
                context.addWarning('Using standard runtime, some WeChat-specific features may not work | 使用标准运行时，部分微信特有功能可能不可用');
            } else {
                context.addWarning('Runtime not found | 未找到运行时');
            }
        }
    }

    /**
     * Copy WASM files.
     * 复制 WASM 文件。
     *
     * This is a critical step for WeChat MiniGame build.
     * 这是微信小游戏构建的关键步骤。
     */
    private async _copyWasmFiles(context: BuildContext): Promise<void> {
        const fs = context.data.get('fileSystem') as IBuildFileSystem | undefined;
        const wasmFiles = context.data.get('wasmFiles') as WasmFileConfig[];

        if (!fs) {
            console.warn('[WeChatBuild] No file system service, skipping | 无文件系统服务，跳过');
            return;
        }

        console.log('[WeChatBuild] Copying WASM files | 复制 WASM 文件:');

        for (const file of wasmFiles) {
            const sourcePath = `${context.projectRoot}/node_modules/${file.source}`;
            const targetPath = `${context.outputDir}/${file.target}`;

            const exists = await fs.pathExists(sourcePath);
            if (exists) {
                await fs.copyFile(sourcePath, targetPath);
                console.log(`  - ${file.description}: ${file.source} -> ${file.target}`);
            } else {
                context.addWarning(`WASM file not found | 未找到 WASM 文件: ${file.source}`);
            }
        }

        // Copy engine WASM | 复制引擎 WASM
        const engineWasmSrc = `${context.projectRoot}/node_modules/@esengine/es-engine/pkg`;
        const hasEngineWasm = await fs.pathExists(engineWasmSrc);
        if (hasEngineWasm) {
            const count = await fs.copyDirectory(engineWasmSrc, `${context.outputDir}/wasm`, ['*.wasm']);
            console.log(`[WeChatBuild] Copied engine WASM | 复制引擎 WASM: ${count} files`);
        }

        context.addWarning(
            'iOS WeChat requires WXWebAssembly for loading WASM | iOS 微信需要使用 WXWebAssembly 加载 WASM'
        );
    }

    /**
     * Copy asset files.
     * 复制资源文件。
     */
    private async _copyAssets(context: BuildContext): Promise<void> {
        const fs = context.data.get('fileSystem') as IBuildFileSystem | undefined;

        if (!fs) {
            console.warn('[WeChatBuild] No file system service, skipping | 无文件系统服务，跳过');
            return;
        }

        // Copy scenes | 复制场景
        const scenesDir = `${context.projectRoot}/scenes`;
        if (await fs.pathExists(scenesDir)) {
            const count = await fs.copyDirectory(scenesDir, `${context.outputDir}/scenes`);
            console.log(`[WeChatBuild] Copied scenes | 复制场景: ${count} files`);
        }

        // Copy assets | 复制资源
        const assetsDir = `${context.projectRoot}/assets`;
        if (await fs.pathExists(assetsDir)) {
            const count = await fs.copyDirectory(assetsDir, `${context.outputDir}/assets`);
            console.log(`[WeChatBuild] Copied assets | 复制资源: ${count} files`);
        }
    }

    /**
     * Generate game.json.
     * 生成 game.json。
     */
    private async _generateGameJson(context: BuildContext): Promise<void> {
        const fs = context.data.get('fileSystem') as IBuildFileSystem | undefined;
        const wxConfig = context.config as WeChatBuildConfig;

        if (!fs) {
            console.warn('[WeChatBuild] No file system service, skipping | 无文件系统服务，跳过');
            return;
        }

        const gameJson: Record<string, unknown> = {
            deviceOrientation: 'portrait',
            showStatusBar: false,
            networkTimeout: {
                request: 60000,
                connectSocket: 60000,
                uploadFile: 60000,
                downloadFile: 60000
            },
            // Declare WebAssembly usage | 声明使用 WebAssembly
            enableWebAssembly: true
        };

        if (wxConfig.useSubpackages) {
            gameJson.subpackages = [];
        }

        if (wxConfig.usePlugins) {
            gameJson.plugins = {};
        }

        const jsonContent = JSON.stringify(gameJson, null, 2);
        await fs.writeJsonFile(`${context.outputDir}/game.json`, jsonContent);
        console.log('[WeChatBuild] Generated game.json | 生成 game.json');
    }

    /**
     * Generate game.js.
     * 生成 game.js。
     */
    private async _generateGameJs(context: BuildContext): Promise<void> {
        const fs = context.data.get('fileSystem') as IBuildFileSystem | undefined;

        if (!fs) {
            console.warn('[WeChatBuild] No file system service, skipping | 无文件系统服务，跳过');
            return;
        }

        const gameJs = `/**
 * WeChat MiniGame entry point.
 * 微信小游戏入口。
 *
 * Auto-generated, do not modify manually.
 * 自动生成，请勿手动修改。
 */

// WeChat adapter | 微信适配器
require('./libs/weapp-adapter.js');

// Load runtime | 加载运行时
require('./libs/esengine-runtime.js');

// Load user code | 加载用户代码
require('./libs/user-code.js');

// Initialize game | 初始化游戏
(async function() {
    try {
        // Load WASM (use WXWebAssembly on iOS) | 加载 WASM（iOS 上使用 WXWebAssembly）
        const isIOS = wx.getSystemInfoSync().platform === 'ios';
        if (isIOS) {
            // iOS uses WXWebAssembly | iOS 使用 WXWebAssembly
            await ECS.initWasm('./wasm/es_engine_bg.wasm', { useWXWebAssembly: true });
        } else {
            await ECS.initWasm('./wasm/es_engine_bg.wasm');
        }

        // Create runtime | 创建运行时
        const canvas = wx.createCanvas();
        const runtime = ECS.createRuntime({
            canvas: canvas,
            platform: 'wechat'
        });

        // Load scene and start | 加载场景并启动
        await runtime.loadScene('./scenes/main.ecs');
        runtime.start();

        console.log('[Game] Started successfully | 游戏启动成功');
    } catch (error) {
        console.error('[Game] Failed to start | 启动失败:', error);
    }
})();
`;

        await fs.writeFile(`${context.outputDir}/game.js`, gameJs);
        console.log('[WeChatBuild] Generated game.js | 生成 game.js');
    }

    /**
     * Generate project.config.json.
     * 生成 project.config.json。
     */
    private async _generateProjectConfig(context: BuildContext): Promise<void> {
        const fs = context.data.get('fileSystem') as IBuildFileSystem | undefined;
        const wxConfig = context.config as WeChatBuildConfig;

        if (!fs) {
            console.warn('[WeChatBuild] No file system service, skipping | 无文件系统服务，跳过');
            return;
        }

        const projectConfig = {
            description: 'ESEngine Game',
            packOptions: {
                ignore: [],
                include: []
            },
            setting: {
                urlCheck: false,
                es6: true,
                enhance: true,
                postcss: false,
                preloadBackgroundData: false,
                minified: wxConfig.isRelease,
                newFeature: true,
                autoAudits: false,
                coverView: true,
                showShadowRootInWxmlPanel: true,
                scopeDataCheck: false,
                checkInvalidKey: true,
                checkSiteMap: true,
                uploadWithSourceMap: !wxConfig.isRelease,
                compileHotReLoad: false,
                babelSetting: {
                    ignore: [],
                    disablePlugins: [],
                    outputPath: ''
                }
            },
            compileType: 'game',
            libVersion: '2.25.0',
            appid: wxConfig.appId,
            projectname: 'ESEngine Game',
            condition: {}
        };

        const jsonContent = JSON.stringify(projectConfig, null, 2);
        await fs.writeJsonFile(`${context.outputDir}/project.config.json`, jsonContent);
        console.log('[WeChatBuild] Generated project.config.json | 生成 project.config.json');
    }

    /**
     * Process subpackages.
     * 分包处理。
     */
    private async _splitSubpackages(context: BuildContext): Promise<void> {
        const wxConfig = context.config as WeChatBuildConfig;
        console.log('[WeChatBuild] Processing subpackages, limit | 分包处理，限制:', wxConfig.mainPackageLimit, 'KB');

        // TODO: Implement automatic subpackage splitting based on file sizes
        // 实现基于文件大小的自动分包
        context.addWarning('Subpackage splitting is not fully implemented yet | 分包功能尚未完全实现');
    }

    /**
     * Optimize and compress.
     * 优化压缩。
     */
    private async _optimize(context: BuildContext): Promise<void> {
        console.log('[WeChatBuild] Optimization complete | 优化完成');
        // Minification is done during bundling | 压缩在打包时已完成
    }
}
