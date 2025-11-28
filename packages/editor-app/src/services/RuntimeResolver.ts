/**
 * Runtime Module Resolver
 * 运行时模块解析器
 *
 * Resolves runtime module paths based on environment and configuration
 * 根据环境和配置解析运行时模块路径
 *
 * 运行时文件打包在编辑器内，离线可用
 */

import { TauriAPI } from '../api/tauri';

// Sanitize path by removing path traversal sequences and normalizing
const sanitizePath = (path: string): string => {
    // Split by path separators, filter out '..' and empty segments, rejoin
    const segments = path.split(/[/\\]/).filter((segment) =>
        segment !== '..' && segment !== '.' && segment !== ''
    );
    // Use Windows backslash for consistency
    return segments.join('\\');
};

// Check if we're in development mode
const isDevelopment = (): boolean => {
    try {
        // Vite environment variable - this is the most reliable check
        const viteDev = (import.meta as any).env?.DEV === true;
        // Also check if MODE is 'development'
        const viteMode = (import.meta as any).env?.MODE === 'development';
        return viteDev || viteMode;
    } catch {
        return false;
    }
};

export interface RuntimeModule {
    type: 'javascript' | 'wasm' | 'binary';
    files: string[];
    sourcePath: string;
}

export interface RuntimeConfig {
    runtime: {
        version: string;
        modules: Record<string, any>;
    };
}

export class RuntimeResolver {
    private static instance: RuntimeResolver;
    private config: RuntimeConfig | null = null;
    private baseDir: string = '';
    private isDev: boolean = false;  // Store dev mode state at initialization time

    private constructor() {}

    static getInstance(): RuntimeResolver {
        if (!RuntimeResolver.instance) {
            RuntimeResolver.instance = new RuntimeResolver();
        }
        return RuntimeResolver.instance;
    }

    /**
     * Initialize the runtime resolver
     * 初始化运行时解析器
     */
    async initialize(): Promise<void> {
        // Load runtime configuration
        const response = await fetch('/runtime.config.json');
        if (!response.ok) {
            throw new Error(`Failed to load runtime configuration: ${response.status} ${response.statusText}`);
        }
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error(`Invalid runtime configuration response type: ${contentType}. Expected JSON but received ${await response.text().then(t => t.substring(0, 100))}`);
        }
        this.config = await response.json();

        // 查找 workspace 根目录
        const currentDir = await TauriAPI.getCurrentDir();
        const workspaceRoot = await this.findWorkspaceRoot(currentDir);

        // 优先使用 workspace 中的开发文件（如果存在）
        // Prefer workspace dev files if they exist
        if (await this.hasRuntimeFilesInWorkspace(workspaceRoot)) {
            this.baseDir = workspaceRoot;
            this.isDev = true;
        } else {
            // 回退到打包的资源目录（生产模式）
            this.baseDir = await TauriAPI.getAppResourceDir();
            this.isDev = false;
        }
    }

    /**
     * Check if runtime files exist in workspace
     * 检查 workspace 中是否存在运行时文件
     */
    private async hasRuntimeFilesInWorkspace(workspaceRoot: string): Promise<boolean> {
        const runtimePath = `${workspaceRoot}\\packages\\platform-web\\dist\\runtime.browser.js`;
        return await TauriAPI.pathExists(runtimePath);
    }

    /**
     * Find workspace root by looking for package.json or specific markers
     * 通过查找 package.json 或特定标记来找到工作区根目录
     */
    private async findWorkspaceRoot(startPath: string): Promise<string> {
        let currentPath = startPath;

        // Try to find the workspace root by looking for key files
        // We'll check up to 3 levels up from current directory
        for (let i = 0; i < 3; i++) {
            // Check if we're in src-tauri
            if (currentPath.endsWith('src-tauri')) {
                // Go up two levels to get to workspace root
                const parts = currentPath.split(/[/\\]/);
                parts.pop(); // Remove src-tauri
                parts.pop(); // Remove editor-app
                parts.pop(); // Remove packages
                return parts.join('\\');
            }

            // Check for workspace markers
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

        // Fallback to current directory
        return startPath;
    }

    /**
     * Get runtime module files
     * 获取运行时模块文件
     */
    async getModuleFiles(moduleName: string): Promise<RuntimeModule> {
        if (!this.config) {
            await this.initialize();
        }

        const moduleConfig = this.config!.runtime.modules[moduleName];
        if (!moduleConfig) {
            throw new Error(`Runtime module ${moduleName} not found in configuration`);
        }

        const files: string[] = [];
        let sourcePath: string;

        if (this.isDev) {
            // Development mode - use relative paths from workspace root
            const devPath = moduleConfig.development.path;
            const sanitizedPath = sanitizePath(devPath);
            sourcePath = `${this.baseDir}\\packages\\${sanitizedPath}`;

            if (moduleConfig.main) {
                files.push(`${sourcePath}\\${moduleConfig.main}`);
            }
            if (moduleConfig.files) {
                for (const file of moduleConfig.files) {
                    files.push(`${sourcePath}\\${file}`);
                }
            }
        } else {
            // Production mode - files are bundled with the app
            sourcePath = this.baseDir;

            if (moduleConfig.main) {
                files.push(`${sourcePath}\\${moduleConfig.main}`);
            }
            if (moduleConfig.files) {
                for (const file of moduleConfig.files) {
                    files.push(`${sourcePath}\\${file}`);
                }
            }
        }

        return {
            type: moduleConfig.type,
            files,
            sourcePath
        };
    }

    /**
     * Prepare runtime files for browser preview
     * 为浏览器预览准备运行时文件
     *
     * 开发模式：从本地 workspace 复制
     * 生产模式：从编辑器内置资源复制
     */
    async prepareRuntimeFiles(targetDir: string): Promise<void> {
        // Ensure target directory exists
        const dirExists = await TauriAPI.pathExists(targetDir);
        if (!dirExists) {
            await TauriAPI.createDirectory(targetDir);
        }

        // Copy platform-web runtime
        const platformWeb = await this.getModuleFiles('platform-web');
        for (const srcFile of platformWeb.files) {
            const filename = srcFile.split(/[/\\]/).pop() || '';
            const dstFile = `${targetDir}\\${filename}`;

            const srcExists = await TauriAPI.pathExists(srcFile);
            if (srcExists) {
                await TauriAPI.copyFile(srcFile, dstFile);
            } else {
                throw new Error(`Runtime file not found: ${srcFile}`);
            }
        }

        // Copy engine WASM files
        const engine = await this.getModuleFiles('engine');
        for (const srcFile of engine.files) {
            const filename = srcFile.split(/[/\\]/).pop() || '';
            const dstFile = `${targetDir}\\${filename}`;

            const srcExists = await TauriAPI.pathExists(srcFile);
            if (srcExists) {
                await TauriAPI.copyFile(srcFile, dstFile);
            } else {
                throw new Error(`Engine file not found: ${srcFile}`);
            }
        }
    }

    /**
     * Get workspace root directory
     * 获取工作区根目录
     */
    getBaseDir(): string {
        return this.baseDir;
    }
}
