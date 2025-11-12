import type { EditorPluginManager, IEditorPlugin } from '@esengine/editor-core';
import JSZip from 'jszip';
import { fetch } from '@tauri-apps/plugin-http';
import { invoke } from '@tauri-apps/api/core';

export interface PluginAuthor {
    name: string;
    github: string;
    email?: string;
}

export interface PluginRepository {
    type?: string;
    url: string;
}

export interface PluginVersion {
    version: string;
    releaseDate: string;
    changes: string;
    zipUrl: string;
    requirements: PluginRequirements;
}

export interface PluginRequirements {
    'ecs-version': string;
    'editor-version'?: string;
}

export interface PluginMarketMetadata {
    id: string;
    name: string;
    author: PluginAuthor;
    description: string;
    category: string;
    tags?: string[];
    icon?: string;
    repository: PluginRepository;
    license: string;
    homepage?: string;
    screenshots?: string[];
    latestVersion: string;
    versions: PluginVersion[];
    verified?: boolean;
    category_type?: 'official' | 'community';
}

export interface PluginRegistry {
    version: string;
    generatedAt: string;
    cdn: string;
    plugins: PluginMarketMetadata[];
}

interface InstalledPluginInfo {
    id: string;
    version: string;
    installedAt: string;
}

export class PluginMarketService {
    private readonly REGISTRY_URLS = [
        'https://cdn.jsdelivr.net/gh/esengine/ecs-editor-plugins@gh-pages/registry.json',
        'https://raw.githubusercontent.com/esengine/ecs-editor-plugins/gh-pages/registry.json',
        'https://fastly.jsdelivr.net/gh/esengine/ecs-editor-plugins@gh-pages/registry.json'
    ];

    private readonly GITHUB_DIRECT_URL = 'https://raw.githubusercontent.com/esengine/ecs-editor-plugins/gh-pages/registry.json';

    private readonly STORAGE_KEY = 'ecs-editor-installed-marketplace-plugins';
    private readonly USE_DIRECT_SOURCE_KEY = 'ecs-editor-use-direct-source';

    private pluginManager: EditorPluginManager;
    private installedPlugins: Map<string, InstalledPluginInfo> = new Map();
    private pluginsDir: string;

    constructor(pluginManager: EditorPluginManager, pluginsDir: string) {
        this.pluginManager = pluginManager;
        this.pluginsDir = pluginsDir;
        this.loadInstalledPlugins();
    }

    isUsingDirectSource(): boolean {
        return localStorage.getItem(this.USE_DIRECT_SOURCE_KEY) === 'true';
    }

    setUseDirectSource(useDirect: boolean): void {
        localStorage.setItem(this.USE_DIRECT_SOURCE_KEY, String(useDirect));
        console.log(`[PluginMarketService] Direct source ${useDirect ? 'enabled' : 'disabled'}`);
    }

    async fetchPluginList(bypassCache: boolean = false): Promise<PluginMarketMetadata[]> {
        const useDirectSource = this.isUsingDirectSource();

        if (useDirectSource) {
            console.log('[PluginMarketService] Using direct GitHub source (bypass CDN)');
            return await this.fetchFromUrl(this.GITHUB_DIRECT_URL, bypassCache);
        }

        const errors: string[] = [];

        for (let i = 0; i < this.REGISTRY_URLS.length; i++) {
            try {
                const url = this.REGISTRY_URLS[i];
                if (!url) continue;

                const plugins = await this.fetchFromUrl(url, bypassCache, i + 1, this.REGISTRY_URLS.length);
                return plugins;
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                console.warn(`[PluginMarketService] Failed to fetch from URL ${i + 1}: ${errorMessage}`);
                errors.push(`URL ${i + 1}: ${errorMessage}`);
            }
        }

        const finalError = `无法从任何数据源加载插件列表。尝试的错误:\n${errors.join('\n')}`;
        console.error('[PluginMarketService] All URLs failed:', finalError);
        throw new Error(finalError);
    }

    private async fetchFromUrl(
        baseUrl: string,
        bypassCache: boolean,
        urlIndex?: number,
        totalUrls?: number
    ): Promise<PluginMarketMetadata[]> {
        let url = baseUrl;
        if (bypassCache) {
            url += `?t=${Date.now()}`;
            if (urlIndex && totalUrls) {
                console.log(`[PluginMarketService] Bypassing cache with timestamp (URL ${urlIndex}/${totalUrls})`);
            }
        }

        if (urlIndex && totalUrls) {
            console.log(`[PluginMarketService] Trying URL ${urlIndex}/${totalUrls}: ${url}`);
        } else {
            console.log(`[PluginMarketService] Fetching from: ${url}`);
        }

        const response = await fetch(url, {
            cache: 'no-cache',
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const registry: PluginRegistry = await response.json();

        if (urlIndex) {
            console.log(`[PluginMarketService] Successfully loaded from URL ${urlIndex}`);
        } else {
            console.log(`[PluginMarketService] Successfully loaded`);
        }
        console.log(`[PluginMarketService] Loaded ${registry.plugins.length} plugins from registry`);
        console.log(`[PluginMarketService] Registry generated at: ${registry.generatedAt}`);

        return registry.plugins;
    }

    async installPlugin(plugin: PluginMarketMetadata, version?: string): Promise<void> {
        const targetVersion = version || plugin.latestVersion;
        console.log(`[PluginMarketService] Installing plugin: ${plugin.name} v${targetVersion}`);

        try {
            // 获取指定版本信息
            const versionInfo = plugin.versions.find(v => v.version === targetVersion);
            if (!versionInfo) {
                throw new Error(`Version ${targetVersion} not found for plugin ${plugin.name}`);
            }

            // 下载 ZIP 文件
            console.log(`[PluginMarketService] Downloading ZIP: ${versionInfo.zipUrl}`);
            const zipBlob = await this.downloadZip(versionInfo.zipUrl);

            // 解压到本地
            console.log(`[PluginMarketService] Extracting to local directory...`);
            await this.extractZipToLocal(zipBlob, plugin.id);

            // 标记为已安装
            this.markAsInstalled(plugin, targetVersion);

            console.log(`[PluginMarketService] Successfully installed: ${plugin.name} v${targetVersion}`);
            console.log(`[PluginMarketService] Plugin files saved to: ${this.pluginsDir}/${plugin.id}`);
        } catch (error) {
            console.error(`[PluginMarketService] Failed to install plugin ${plugin.name}:`, error);
            throw error;
        }
    }

    async uninstallPlugin(pluginId: string): Promise<void> {
        console.log(`[PluginMarketService] Uninstalling plugin: ${pluginId}`);

        try {
            // 尝试卸载插件实例（如果已加载）
            try {
                await this.pluginManager.uninstallEditor(pluginId);
                console.log(`[PluginMarketService] Unloaded plugin instance: ${pluginId}`);
            } catch (err) {
                // 插件可能没有加载，忽略错误
                console.log(`[PluginMarketService] Plugin instance not loaded (OK): ${pluginId}`);
            }

            // 删除本地文件（使用后端命令以避免权限问题）
            const pluginDir = `${this.pluginsDir}/${pluginId}`.replace(/\\/g, '/');
            try {
                await invoke('delete_folder', { path: pluginDir });
                console.log(`[PluginMarketService] Removed plugin directory: ${pluginDir}`);
            } catch (err) {
                console.error(`[PluginMarketService] Failed to remove directory ${pluginDir}:`, err);
                throw new Error(`Failed to remove plugin directory: ${err}`);
            }

            // 移除安装记录
            this.installedPlugins.delete(pluginId);
            this.saveInstalledPlugins();

            console.log(`[PluginMarketService] Successfully uninstalled: ${pluginId}`);
        } catch (error) {
            console.error(`[PluginMarketService] Failed to uninstall plugin ${pluginId}:`, error);
            throw error;
        }
    }

    isInstalled(pluginId: string): boolean {
        return this.installedPlugins.has(pluginId);
    }

    getInstalledVersion(pluginId: string): string | undefined {
        return this.installedPlugins.get(pluginId)?.version;
    }

    hasUpdate(plugin: PluginMarketMetadata): boolean {
        const installedVersion = this.getInstalledVersion(plugin.id);
        if (!installedVersion) return false;

        return this.compareVersions(plugin.latestVersion, installedVersion) > 0;
    }

    private async downloadZip(url: string): Promise<Blob> {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Failed to download ZIP: ${response.status}`);
        }

        return await response.blob();
    }

    private async extractZipToLocal(zipBlob: Blob, pluginId: string): Promise<void> {
        try {
            // 解压 ZIP
            const zip = await JSZip.loadAsync(zipBlob);

            // 目标目录（规范化路径分隔符）
            const targetDir = `${this.pluginsDir}/${pluginId}`.replace(/\\/g, '/');

            // 创建目标目录
            await invoke('create_directory', { path: targetDir });
            console.log(`[PluginMarketService] Created directory: ${targetDir}`);

            // 遍历 ZIP 中的所有文件
            const filePromises: Promise<void>[] = [];

            zip.forEach((relativePath, file) => {
                // 规范化路径：将反斜杠转换为正斜杠
                const normalizedPath = relativePath.replace(/\\/g, '/');

                if (file.dir) {
                    // 创建目录
                    const dirPath = `${targetDir}/${normalizedPath}`;
                    filePromises.push(
                        invoke('create_directory', { path: dirPath })
                            .then(() => console.log(`[PluginMarketService] Created directory: ${dirPath}`))
                            .catch(err => console.warn(`[PluginMarketService] Failed to create directory ${dirPath}:`, err))
                    );
                } else {
                    // 写入文件
                    const filePath = `${targetDir}/${normalizedPath}`;
                    filePromises.push(
                        file.async('uint8array').then(async (content) => {
                            // 确保父目录存在
                            const lastSlashIndex = filePath.lastIndexOf('/');
                            if (lastSlashIndex > 0) {
                                const parentDir = filePath.substring(0, lastSlashIndex);
                                await invoke('create_directory', { path: parentDir }).catch(() => {});
                            }

                            // 写入文件
                            await invoke('write_binary_file', {
                                filePath,
                                content: Array.from(content)
                            });
                            console.log(`[PluginMarketService] Extracted file: ${normalizedPath}`);
                        })
                    );
                }
            });

            await Promise.all(filePromises);
            console.log(`[PluginMarketService] All files extracted to ${targetDir}`);
        } catch (error) {
            console.error('[PluginMarketService] Failed to extract ZIP to local:', error);
            throw error;
        }
    }

    private async loadPluginFromZip(zipBlob: Blob, metadata: PluginMarketMetadata): Promise<IEditorPlugin | null> {
        try {
            // 解压 ZIP
            const zip = await JSZip.loadAsync(zipBlob);

            // 读取 package.json
            const packageJsonFile = zip.file('package.json');
            if (!packageJsonFile) {
                throw new Error('package.json not found in plugin ZIP');
            }

            const packageJsonContent = await packageJsonFile.async('text');
            const packageJson = JSON.parse(packageJsonContent);

            // 获取入口文件路径 (优先 module，其次 main)
            const entryPath = packageJson.module || packageJson.main;
            if (!entryPath) {
                throw new Error('No entry point (main or module) found in package.json');
            }

            console.log(`[PluginMarketService] Loading plugin from entry: ${entryPath}`);

            // 查找入口文件
            const entryFile = zip.file(entryPath);
            if (!entryFile) {
                throw new Error(`Entry file ${entryPath} not found in plugin ZIP`);
            }

            // 读取入口文件内容
            const entryContent = await entryFile.async('text');

            // 创建 Blob URL
            const blob = new Blob([entryContent], { type: 'application/javascript' });
            const blobUrl = URL.createObjectURL(blob);

            try {
                // 动态导入模块
                const module = await import(/* @vite-ignore */ blobUrl);

                // 提取插件实例
                return this.extractPluginInstance(module, metadata);
            } finally {
                // 清理 Blob URL
                URL.revokeObjectURL(blobUrl);
            }
        } catch (error) {
            console.error('[PluginMarketService] Failed to load plugin from ZIP:', error);
            throw error;
        }
    }

    private extractPluginInstance(module: any, metadata: PluginMarketMetadata): IEditorPlugin | null {
        // 尝试从 default export 获取
        if (module.default && this.isPluginInstance(module.default)) {
            return module.default;
        }

        // 尝试从命名 export 获取
        for (const key of Object.keys(module)) {
            const value = module[key];
            if (value && this.isPluginInstance(value)) {
                return value;
            }
        }

        console.error('[PluginMarketService] No valid plugin instance found in module:', module);
        return null;
    }

    private isPluginInstance(obj: any): obj is IEditorPlugin {
        if (!obj || typeof obj !== 'object') {
            return false;
        }

        return (
            typeof obj.name === 'string' &&
            typeof obj.version === 'string' &&
            typeof obj.displayName === 'string' &&
            typeof obj.category === 'string' &&
            typeof obj.install === 'function' &&
            typeof obj.uninstall === 'function'
        );
    }

    private markAsInstalled(plugin: PluginMarketMetadata, version: string): void {
        this.installedPlugins.set(plugin.id, {
            id: plugin.id,
            version: version,
            installedAt: new Date().toISOString()
        });
        this.saveInstalledPlugins();
    }

    private loadInstalledPlugins(): void {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored) {
                const plugins: InstalledPluginInfo[] = JSON.parse(stored);
                this.installedPlugins = new Map(plugins.map(p => [p.id, p]));
            }
        } catch (error) {
            console.error('[PluginMarketService] Failed to load installed plugins:', error);
        }
    }

    private saveInstalledPlugins(): void {
        try {
            const plugins = Array.from(this.installedPlugins.values());
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(plugins));
        } catch (error) {
            console.error('[PluginMarketService] Failed to save installed plugins:', error);
        }
    }

    private compareVersions(v1: string, v2: string): number {
        const parts1 = v1.split('.').map(Number);
        const parts2 = v2.split('.').map(Number);

        for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
            const part1 = parts1[i] || 0;
            const part2 = parts2[i] || 0;

            if (part1 > part2) return 1;
            if (part1 < part2) return -1;
        }

        return 0;
    }
}
