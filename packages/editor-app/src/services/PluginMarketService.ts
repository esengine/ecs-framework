import type { EditorPluginManager } from '@esengine/editor-core';
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
    private projectPath: string | null = null;

    constructor(pluginManager: EditorPluginManager) {
        this.pluginManager = pluginManager;
        this.loadInstalledPlugins();
    }

    setProjectPath(path: string | null): void {
        this.projectPath = path;
    }

    isUsingDirectSource(): boolean {
        return localStorage.getItem(this.USE_DIRECT_SOURCE_KEY) === 'true';
    }

    setUseDirectSource(useDirect: boolean): void {
        localStorage.setItem(this.USE_DIRECT_SOURCE_KEY, String(useDirect));
    }

    async fetchPluginList(bypassCache: boolean = false): Promise<PluginMarketMetadata[]> {
        const useDirectSource = this.isUsingDirectSource();

        if (useDirectSource) {
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
            }
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
        return registry.plugins;
    }

    async installPlugin(plugin: PluginMarketMetadata, version?: string, onReload?: () => Promise<void>): Promise<void> {
        const targetVersion = version || plugin.latestVersion;
        if (!this.projectPath) {
            throw new Error('No project opened. Please open a project first.');
        }

        try {
            // 获取指定版本信息
            const versionInfo = plugin.versions.find(v => v.version === targetVersion);
            if (!versionInfo) {
                throw new Error(`Version ${targetVersion} not found for plugin ${plugin.name}`);
            }

            // 下载 ZIP 文件
            const zipBlob = await this.downloadZip(versionInfo.zipUrl);

            // 解压到项目 plugins 目录
            await this.extractZipToProject(zipBlob, plugin.id);

            // 标记为已安装
            this.markAsInstalled(plugin, targetVersion);

            // 重新加载项目插件
            if (onReload) {
                await onReload();
            }
        } catch (error) {
            console.error(`[PluginMarketService] Failed to install plugin ${plugin.name}:`, error);
            throw error;
        }
    }

    async uninstallPlugin(pluginId: string, onReload?: () => Promise<void>): Promise<void> {
        if (!this.projectPath) {
            throw new Error('No project opened');
        }

        try {
            // 从编辑器卸载
            await this.pluginManager.uninstallEditor(pluginId);

            // 调用 Tauri 后端命令删除插件目录
            const { invoke } = await import('@tauri-apps/api/core');
            await invoke('uninstall_marketplace_plugin', {
                projectPath: this.projectPath,
                pluginId: pluginId
            });

            // 从已安装列表移除
            this.installedPlugins.delete(pluginId);
            this.saveInstalledPlugins();

            // 重新加载项目插件
            if (onReload) {
                await onReload();
            }
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

    private async extractZipToProject(zipBlob: Blob, pluginId: string): Promise<void> {
        if (!this.projectPath) {
            throw new Error('Project path not set');
        }

        try {
            // 将 Blob 转换为 ArrayBuffer
            const arrayBuffer = await zipBlob.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);

            // 转换为 base64
            let binary = '';
            const len = uint8Array.byteLength;
            for (let i = 0; i < len; i++) {
                binary += String.fromCharCode(uint8Array[i] ?? 0);
            }
            const base64Data = btoa(binary);

            // 调用 Tauri 后端命令进行安装
            await invoke<string>('install_marketplace_plugin', {
                projectPath: this.projectPath,
                pluginId: pluginId,
                zipDataBase64: base64Data
            });
        } catch (error) {
            console.error('[PluginMarketService] Failed to extract ZIP:', error);
            throw new Error(`Failed to extract plugin: ${error instanceof Error ? error.message : String(error)}`);
        }
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
