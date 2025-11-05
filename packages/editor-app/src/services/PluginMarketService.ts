import type { EditorPluginManager, IEditorPlugin } from '@esengine/editor-core';

export interface PluginAuthor {
    name: string;
    github: string;
    email?: string;
}

export interface PluginRepository {
    type?: string;
    url: string;
}

export interface PluginDistribution {
    type: 'cdn' | 'npm';
    url: string;
    css?: string;
}

export interface PluginRequirements {
    'ecs-version': string;
    'editor-version'?: string;
}

export interface PluginMarketMetadata {
    id: string;
    name: string;
    displayName?: string;
    version: string;
    author: PluginAuthor;
    description: string;
    category: string;
    tags?: string[];
    icon?: string;
    repository: PluginRepository;
    distribution: PluginDistribution;
    requirements: PluginRequirements;
    license: string;
    homepage?: string;
    screenshots?: string[];
    verified?: boolean;
    category_type?: 'official' | 'community';
    reviewedAt?: string;
    reviewedBy?: string;
}

export interface PluginRegistry {
    version: string;
    lastUpdated: string;
    cdn: string;
    plugins: PluginMarketMetadata[];
}

interface InstalledPluginInfo {
    id: string;
    version: string;
    installedAt: string;
}

export class PluginMarketService {
    private readonly REGISTRY_URL =
        'https://cdn.jsdelivr.net/gh/esengine/ecs-editor-plugins@latest/registry.json';

    private readonly STORAGE_KEY = 'ecs-editor-installed-marketplace-plugins';

    private pluginManager: EditorPluginManager;
    private installedPlugins: Map<string, InstalledPluginInfo> = new Map();

    constructor(pluginManager: EditorPluginManager) {
        this.pluginManager = pluginManager;
        this.loadInstalledPlugins();
    }

    async fetchPluginList(): Promise<PluginMarketMetadata[]> {
        try {
            const response = await fetch(this.REGISTRY_URL, {
                cache: 'no-cache'
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch plugin registry: ${response.status}`);
            }

            const registry: PluginRegistry = await response.json();
            return registry.plugins;
        } catch (error) {
            console.error('[PluginMarketService] Failed to fetch plugin list:', error);
            throw error;
        }
    }

    async installPlugin(plugin: PluginMarketMetadata): Promise<void> {
        console.log(`[PluginMarketService] Installing plugin: ${plugin.name}`);

        try {
            const moduleUrl = plugin.distribution.url;

            if (plugin.distribution.css) {
                this.loadCSS(plugin.distribution.css);
            }

            const timestamp = Date.now();
            const urlWithCache = `${moduleUrl}?t=${timestamp}`;

            const module = await import(/* @vite-ignore */ urlWithCache);

            const pluginInstance = this.extractPluginInstance(module, plugin);

            if (!pluginInstance) {
                throw new Error(`Failed to extract plugin instance from ${plugin.name}`);
            }

            await this.pluginManager.installEditor(pluginInstance);

            this.markAsInstalled(plugin);

            console.log(`[PluginMarketService] Successfully installed: ${plugin.name}`);
        } catch (error) {
            console.error(`[PluginMarketService] Failed to install plugin ${plugin.name}:`, error);
            throw error;
        }
    }

    async uninstallPlugin(pluginId: string): Promise<void> {
        console.log(`[PluginMarketService] Uninstalling plugin: ${pluginId}`);

        try {
            await this.pluginManager.uninstallEditor(pluginId);

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

        return this.compareVersions(plugin.version, installedVersion) > 0;
    }

    private extractPluginInstance(module: any, metadata: PluginMarketMetadata): IEditorPlugin | null {
        if (module.default && this.isPluginInstance(module.default)) {
            return module.default;
        }

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

    private loadCSS(cssUrl: string): void {
        const existingLink = document.querySelector(`link[href="${cssUrl}"]`);
        if (existingLink) {
            console.log('[PluginMarketService] CSS already loaded:', cssUrl);
            return;
        }

        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = cssUrl;
        document.head.appendChild(link);

        console.log('[PluginMarketService] Loaded CSS:', cssUrl);
    }

    private markAsInstalled(plugin: PluginMarketMetadata): void {
        this.installedPlugins.set(plugin.id, {
            id: plugin.id,
            version: plugin.version,
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
