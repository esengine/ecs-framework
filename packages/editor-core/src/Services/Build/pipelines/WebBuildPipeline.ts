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
    WebBuildConfig
} from '../IBuildPipeline';
import { BuildPlatform, BuildStatus } from '../IBuildPipeline';
import type { ModuleManifest } from '../../Module/ModuleTypes';

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
    }): Promise<{
        success: boolean;
        outputFile?: string;
        outputSize?: number;
        error?: string;
        warnings: string[];
    }>;
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

        if (webConfig.buildMode !== 'single-bundle' && webConfig.buildMode !== 'split-bundles') {
            errors.push('Build mode must be "single-bundle" or "split-bundles" | 构建模式必须是 "single-bundle" 或 "split-bundles"');
        }

        return errors;
    }

    // ========================================================================
    // Build Steps
    // ========================================================================

    getSteps(config: BuildConfig): BuildStep[] {
        const webConfig = config as WebBuildConfig;

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

        // Always generate server scripts for ESM builds
        if (webConfig.buildMode === 'split-bundles') {
            steps.push({
                id: 'generate-server-scripts',
                name: 'Generate server scripts | 生成启动脚本',
                execute: this._stepGenerateServerScripts.bind(this)
            });
        }

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

        const context: BuildContext = {
            config,
            projectRoot,
            tempDir: `${projectRoot}/temp/build`,
            outputDir: config.outputPath,
            reportProgress: (msg, progress) => {
                console.log(`[WebBuild] ${msg}${progress !== undefined ? ` (${progress}%)` : ''}`);
            },
            addWarning: (warning) => warnings.push(warning),
            abortSignal: abortSignal || new AbortController().signal,
            data: new Map()
        };

        // Store file system in context
        context.data.set('fileSystem', this._fileSystem);
        context.data.set('engineModulesPath', this._engineModulesPath);

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
        const fs = context.data.get('fileSystem') as IBuildFileSystem | null;
        if (!fs) {
            throw new Error('File system service not available | 文件系统服务不可用');
        }

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
        const fs = context.data.get('fileSystem') as IBuildFileSystem | null;
        const engineModulesPath = context.data.get('engineModulesPath') as string || this._engineModulesPath;

        if (!fs || !engineModulesPath) {
            throw new Error('File system or engine modules path not available | 文件系统或引擎模块路径不可用');
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

        console.log(`[WebBuild] Found ${coreModules.length} core modules, ${pluginModules.length} plugin modules`);
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
        const fs = context.data.get('fileSystem') as IBuildFileSystem | null;
        const engineModulesPath = context.data.get('engineModulesPath') as string || this._engineModulesPath;
        const webConfig = context.config as WebBuildConfig;
        const coreModules = context.data.get('coreModules') as ModuleManifest[] || [];
        const pluginModules = context.data.get('pluginModules') as ModuleManifest[] || [];

        if (!fs) {
            throw new Error('File system not available | 文件系统不可用');
        }

        const minify = webConfig.minify !== false && webConfig.isRelease;
        const sourceMap = webConfig.sourceMap === true;

        // 1. Bundle core modules into esengine.core.js (ESM format)
        console.log(`[WebBuild] Bundling core runtime (ESM)...`);
        await this._bundleCoreRuntime(context, fs, coreModules, engineModulesPath, minify, sourceMap);

        // 2. Copy plugin modules as separate ESM files
        console.log(`[WebBuild] Copying plugin modules (ESM)...`);
        await this._copyPluginModules(context, fs, pluginModules, engineModulesPath);

        // 3. Copy WASM files
        console.log(`[WebBuild] Copying WASM files...`);
        await this._copyWasmFiles(context, fs, [...coreModules, ...pluginModules], engineModulesPath);

        // Store for HTML generation
        context.data.set('buildMode', 'split-bundles');
    }

    /**
     * Step 3b: Bundle single mode - everything in one file.
     * 步骤 3b：单包模式 - 所有代码打包到一个文件。
     */
    private async _stepBundleSingle(context: BuildContext): Promise<void> {
        const fs = context.data.get('fileSystem') as IBuildFileSystem | null;
        const engineModulesPath = context.data.get('engineModulesPath') as string || this._engineModulesPath;
        const webConfig = context.config as WebBuildConfig;
        const allModules = context.data.get('allModules') as ModuleManifest[] || [];

        if (!fs) {
            throw new Error('File system not available | 文件系统不可用');
        }

        const minify = webConfig.minify !== false && webConfig.isRelease;
        const sourceMap = webConfig.sourceMap === true;

        // Find platform-web entry point
        const platformWebDir = `${engineModulesPath}/platform-web`;
        const entryPoint = await this._findEntryPoint(fs, platformWebDir);

        if (!entryPoint) {
            throw new Error('Could not find platform-web entry point | 找不到 platform-web 入口文件');
        }

        // Bundle everything into one IIFE file
        const result = await fs.bundleScripts({
            entryPoints: [entryPoint],
            outputDir: `${context.outputDir}/libs`,
            format: 'iife',
            bundleName: 'esengine.bundle',
            minify,
            sourceMap,
            external: [],
            projectRoot: context.projectRoot,
            globalName: 'ESEngine'
        });

        if (!result.success) {
            throw new Error(`Failed to bundle: ${result.error}`);
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
        const fs = context.data.get('fileSystem') as IBuildFileSystem | null;
        if (!fs) return;

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
     */
    private async _stepCopyScenes(context: BuildContext): Promise<void> {
        const fs = context.data.get('fileSystem') as IBuildFileSystem | null;
        if (!fs) return;

        const scenesDir = `${context.projectRoot}/scenes`;
        const outputScenesDir = `${context.outputDir}/scenes`;

        if (await fs.pathExists(scenesDir)) {
            const count = await fs.copyDirectory(scenesDir, outputScenesDir, ['*.ecs', '*.scene', '*.json']);
            console.log(`[WebBuild] Copied ${count} scene files`);
        }
    }

    /**
     * Step 6: Generate asset catalog.
     * 步骤 6：生成资产清单。
     */
    private async _stepGenerateCatalog(context: BuildContext): Promise<void> {
        const fs = context.data.get('fileSystem') as IBuildFileSystem | null;
        if (!fs) return;

        const assetsDir = `${context.outputDir}/assets`;
        const catalog: {
            version: number;
            generated: string;
            assets: Record<string, { path: string; type: string; size: number }>;
        } = {
            version: 1,
            generated: new Date().toISOString(),
            assets: {}
        };

        // Scan assets directory
        if (await fs.pathExists(assetsDir)) {
            const files = await fs.listFilesByExtension(assetsDir, [
                '.png', '.jpg', '.jpeg', '.gif', '.webp',
                '.mp3', '.ogg', '.wav', '.m4a',
                '.json', '.xml'
            ], true);

            for (const file of files) {
                const relativePath = file.replace(context.outputDir, '').replace(/\\/g, '/').replace(/^\//, '');
                const ext = file.split('.').pop()?.toLowerCase() || '';
                const type = this._getAssetType(ext);

                try {
                    const size = await fs.getFileSize(file);
                    // Use relative path as simple ID (could use GUID in future)
                    const id = relativePath.replace(/[^a-zA-Z0-9]/g, '_');
                    catalog.assets[id] = { path: relativePath, type, size };
                } catch {
                    // Skip files that can't be accessed
                }
            }
        }

        await fs.writeFile(
            `${context.outputDir}/asset-catalog.json`,
            JSON.stringify(catalog, null, 2)
        );

        console.log(`[WebBuild] Generated asset catalog with ${Object.keys(catalog.assets).length} assets`);
    }

    /**
     * Step 7: Generate HTML file.
     * 步骤 7：生成 HTML 文件。
     */
    private async _stepGenerateHtml(context: BuildContext): Promise<void> {
        const fs = context.data.get('fileSystem') as IBuildFileSystem | null;
        if (!fs) return;

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

        // Check for WASM
        const wasmDir = `${context.outputDir}/libs/wasm`;
        const hasWasm = await fs.pathExists(`${wasmDir}/es_engine_bg.wasm`);

        const html = buildMode === 'single-bundle'
            ? this._generateSingleBundleHtml(mainScenePath, hasWasm)
            : this._generateSplitBundlesHtml(mainScenePath, hasWasm, coreModules, pluginModules);

        await fs.writeFile(`${context.outputDir}/index.html`, html);
        console.log(`[WebBuild] Generated index.html (${buildMode} mode)`);
    }

    /**
     * Step 8: Generate server scripts for easy launching.
     * 步骤 8：生成启动脚本，方便用户运行。
     */
    private async _stepGenerateServerScripts(context: BuildContext): Promise<void> {
        const fs = context.data.get('fileSystem') as IBuildFileSystem | null;
        if (!fs) return;

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

    private async _findModuleJsonFiles(fs: IBuildFileSystem, basePath: string): Promise<string[]> {
        const results: string[] = [];

        // Search for module.json files in immediate subdirectories
        // 在直接子目录中搜索 module.json 文件
        // Note: We only check one level deep (basePath/*/module.json)
        // since module.json should be at the root of each module
        // 注意：我们只检查一级深度，因为 module.json 应该在每个模块的根目录
        try {
            // Use recursive search but filter for module.json only at module root
            // 使用递归搜索但只过滤模块根目录的 module.json
            const jsonFiles = await fs.listFilesByExtension(basePath, ['json'], true);

            for (const file of jsonFiles) {
                const normalizedFile = file.replace(/\\/g, '/');
                const normalizedBase = basePath.replace(/\\/g, '/');

                // Check if this is a module.json at the root of a module directory
                // Pattern: basePath/moduleName/module.json
                // 检查这是否是模块目录根目录的 module.json
                if (normalizedFile.endsWith('/module.json')) {
                    const relativePath = normalizedFile.slice(normalizedBase.length + 1);
                    const parts = relativePath.split('/');
                    // Only include if it's exactly: moduleName/module.json (2 parts)
                    // 只包含精确的: moduleName/module.json (2 部分)
                    if (parts.length === 2 && parts[1] === 'module.json') {
                        results.push(file);
                    }
                }
            }
        } catch {
            // Ignore errors during scanning
        }

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
        // Find platform-web as the main entry point (it re-exports everything needed)
        const platformWebDir = `${engineModulesPath}/platform-web`;
        const entryPoint = await this._findEntryPoint(fs, platformWebDir);

        if (!entryPoint) {
            throw new Error('Could not find platform-web entry point | 找不到 platform-web 入口文件');
        }

        // Bundle as ESM for optimal caching and tree-shaking
        // 使用 ESM 格式以获得最佳缓存和摇树优化
        const result = await fs.bundleScripts({
            entryPoints: [entryPoint],
            outputDir: `${context.outputDir}/libs`,
            format: 'esm',
            bundleName: 'esengine.core',
            minify,
            sourceMap,
            external: [], // Bundle all dependencies
            projectRoot: context.projectRoot
        });

        if (!result.success) {
            throw new Error(`Failed to bundle core runtime: ${result.error}`);
        }

        console.log(`[WebBuild] Core runtime: ${result.outputFile} (${this._formatBytes(result.outputSize || 0)})`);
    }

    private async _copyPluginModules(
        context: BuildContext,
        fs: IBuildFileSystem,
        pluginModules: ModuleManifest[],
        engineModulesPath: string
    ): Promise<void> {
        const pluginsDir = `${context.outputDir}/libs/plugins`;

        for (const module of pluginModules) {
            const moduleDir = `${engineModulesPath}/${module.id}`;
            const entryPoint = await this._findEntryPoint(fs, moduleDir);

            if (entryPoint) {
                const destPath = `${pluginsDir}/${module.id}.js`;
                await fs.copyFile(entryPoint, destPath);
                console.log(`[WebBuild] Copied plugin: ${module.id}`);

                // Copy additional files (e.g., chunk-*.js)
                if (module.includes && module.includes.length > 0) {
                    for (const pattern of module.includes) {
                        // Simple glob matching for chunk-*.js
                        if (pattern.includes('*')) {
                            const dir = moduleDir.includes('/dist') ? moduleDir : `${moduleDir}/dist`;
                            if (await fs.pathExists(dir)) {
                                const files = await fs.listFilesByExtension(dir, ['.js']);
                                for (const file of files) {
                                    const fileName = file.split(/[/\\]/).pop() || '';
                                    if (fileName.startsWith('chunk-')) {
                                        await fs.copyFile(file, `${pluginsDir}/${fileName}`);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    private async _copyWasmFiles(
        context: BuildContext,
        fs: IBuildFileSystem,
        modules: ModuleManifest[],
        engineModulesPath: string
    ): Promise<void> {
        const wasmDir = `${context.outputDir}/libs/wasm`;

        for (const module of modules) {
            if (!module.requiresWasm) continue;

            const wasmPaths = module.wasmPaths || [];
            const moduleDir = `${engineModulesPath}/${module.id}`;

            for (const wasmFileName of wasmPaths) {
                // Try various locations
                const candidates = [
                    `${moduleDir}/pkg/${wasmFileName}`,
                    `${moduleDir}/${wasmFileName}`,
                    `${moduleDir}/dist/${wasmFileName}`
                ];

                for (const src of candidates) {
                    if (await fs.pathExists(src)) {
                        const dest = `${wasmDir}/${wasmFileName}`;
                        await fs.copyFile(src, dest);
                        console.log(`[WebBuild] Copied WASM: ${wasmFileName}`);
                        break;
                    }
                }
            }

            // Also check for es-engine WASM (special case)
            if (module.id === 'ecs-engine-bindgen' || module.id === 'platform-web') {
                const esEngineWasm = `${engineModulesPath}/engine/pkg/es_engine_bg.wasm`;
                if (await fs.pathExists(esEngineWasm)) {
                    await fs.copyFile(esEngineWasm, `${wasmDir}/es_engine_bg.wasm`);

                    // Also copy the JS wrapper
                    const esEngineJs = `${engineModulesPath}/engine/pkg/es_engine.js`;
                    if (await fs.pathExists(esEngineJs)) {
                        await fs.createDirectory(`${context.outputDir}/libs/es-engine`);
                        await fs.copyFile(esEngineJs, `${context.outputDir}/libs/es-engine/es_engine.js`);
                        await fs.copyFile(esEngineWasm, `${context.outputDir}/libs/es-engine/es_engine_bg.wasm`);
                    }
                }
            }
        }
    }

    private _generateSingleBundleHtml(mainScenePath: string, hasWasm: boolean): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <title>ESEngine Game</title>
    <style>
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
        }
    </style>
</head>
<body>
    <div id="loading">
        <div class="spinner"></div>
        <div class="message" id="loading-message">Loading...</div>
    </div>
    <div id="error">
        <h2>Failed to start game</h2>
        <pre id="error-message"></pre>
    </div>
    <canvas id="game-canvas"></canvas>

    <script src="libs/esengine.bundle.js"></script>
    <script>
        (async function() {
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
            }

            try {
                if (typeof ESEngine === 'undefined') {
                    throw new Error('ESEngine not loaded');
                }

                updateLoading('Initializing...');
                ${hasWasm ? `const wasmModule = await import('./libs/es-engine/es_engine.js');` : `const wasmModule = null;`}

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
            } catch (error) {
                showError(error.message || String(error));
            }
        })();
    </script>
</body>
</html>`;
    }

    private _generateSplitBundlesHtml(
        mainScenePath: string,
        hasWasm: boolean,
        coreModules: ModuleManifest[],
        pluginModules: ModuleManifest[]
    ): string {
        // Generate plugin loading code
        const pluginLoads = pluginModules
            .filter(m => m.pluginExport)
            .map(m => `                    ['${m.id}', '${m.pluginExport}']`)
            .join(',\n');

        // Generate Import Map dynamically from module manifests
        // This maps package names (from module.json "name" field) to bundled URLs
        // 从模块清单动态生成 Import Map
        // 将包名（来自 module.json 的 "name" 字段）映射到打包后的 URL
        const imports: Record<string, string> = {};

        // Map core modules to the bundled core runtime
        // 将核心模块映射到打包的核心运行时
        for (const module of coreModules) {
            if (module.name) {
                imports[module.name] = './libs/esengine.core.js';
            }
        }

        // Map plugin modules to their individual bundles
        // 将插件模块映射到各自的独立包
        for (const module of pluginModules) {
            if (module.name) {
                imports[module.name] = `./libs/plugins/${module.id}.js`;
            }
            // Also map external dependencies if specified
            // 同时映射外部依赖（如果指定）
            if (module.externalDependencies) {
                for (const dep of module.externalDependencies) {
                    if (!imports[dep]) {
                        // Extract module id from package name (e.g., @esengine/rapier2d -> rapier2d)
                        const depId = dep.startsWith('@esengine/') ? dep.slice(10) : dep;
                        imports[dep] = `./libs/plugins/${depId}.js`;
                    }
                }
            }
        }

        const importMap = { imports };
        const importMapJson = JSON.stringify(importMap, null, 8);

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <title>ESEngine Game</title>
    <!-- Import Map: Maps bare module specifiers to actual URLs -->
    <!-- Import Map: 将裸模块说明符映射到实际 URL -->
    <script type="importmap">
${importMapJson}
    </script>
    <style>
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
        }
    </style>
</head>
<body>
    <div id="loading">
        <div class="spinner"></div>
        <div class="message" id="loading-message">Loading...</div>
    </div>
    <div id="error">
        <h2>Failed to start game</h2>
        <pre id="error-message"></pre>
    </div>
    <canvas id="game-canvas"></canvas>

    <script type="module">
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
        }

        try {
            // 1. Load core runtime
            updateLoading('Loading core runtime...');
            const { default: ESEngine } = await import('./libs/esengine.core.js');

            // 2. Create runtime instance
            const runtime = ESEngine.create({
                canvasId: 'game-canvas',
                width: window.innerWidth,
                height: window.innerHeight,
                assetBaseUrl: './assets',
                assetCatalogUrl: './asset-catalog.json'
            });

            // 3. Load WASM module if available
            ${hasWasm ? `
            updateLoading('Loading WASM module...');
            const wasmModule = await import('./libs/es-engine/es_engine.js');
            ` : `const wasmModule = null;`}

            // 4. Load plugins on demand
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

            // 5. Initialize runtime
            updateLoading('Initializing...');
            await runtime.initialize(wasmModule);

            // 6. Load scene
            updateLoading('Loading scene...');
            await runtime.loadScene('${mainScenePath}');

            // 7. Start game
            loading.style.display = 'none';
            runtime.start();

            // Handle resize
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
}
