import { runtimePluginManager, type IPlugin } from './PluginManager';

export interface PluginPackageInfo {
    plugin: boolean;
    pluginExport: string;
    category?: string;
    isEnginePlugin?: boolean;
}

export interface PluginConfig {
    enabled: boolean;
    options?: Record<string, any>;
}

export interface ProjectPluginConfig {
    plugins: Record<string, PluginConfig>;
}

interface LoadedPluginInfo {
    id: string;
    plugin: IPlugin;
    packageInfo: PluginPackageInfo;
}

const loadedPlugins = new Map<string, LoadedPluginInfo>();

/**
 * 从模块动态加载插件
 * @param packageId 包 ID，如 '@esengine/sprite'
 * @param packageInfo 包的 esengine 配置
 */
export async function loadPlugin(
    packageId: string,
    packageInfo: PluginPackageInfo
): Promise<IPlugin | null> {
    if (loadedPlugins.has(packageId)) {
        return loadedPlugins.get(packageId)!.plugin;
    }

    try {
        const module = await import(/* @vite-ignore */ packageId);
        const exportName = packageInfo.pluginExport || 'default';
        const plugin = module[exportName] as IPlugin;

        if (!plugin || !plugin.descriptor) {
            console.warn(`[PluginLoader] Invalid plugin export from ${packageId}`);
            return null;
        }

        loadedPlugins.set(packageId, {
            id: packageId,
            plugin,
            packageInfo
        });

        return plugin;
    } catch (error) {
        console.error(`[PluginLoader] Failed to load plugin ${packageId}:`, error);
        return null;
    }
}

/**
 * 根据项目配置加载所有启用的插件
 */
export async function loadEnabledPlugins(
    config: ProjectPluginConfig,
    packageInfoMap: Record<string, PluginPackageInfo>
): Promise<void> {
    const sortedPlugins: Array<{ id: string; info: PluginPackageInfo }> = [];

    for (const [id, pluginConfig] of Object.entries(config.plugins)) {
        if (!pluginConfig.enabled) continue;

        const packageInfo = packageInfoMap[id];
        if (!packageInfo) {
            console.warn(`[PluginLoader] No package info for ${id}, skipping`);
            continue;
        }

        sortedPlugins.push({ id, info: packageInfo });
    }

    // 引擎核心插件优先加载
    sortedPlugins.sort((a, b) => {
        if (a.info.isEnginePlugin && !b.info.isEnginePlugin) return -1;
        if (!a.info.isEnginePlugin && b.info.isEnginePlugin) return 1;
        return 0;
    });

    for (const { id, info } of sortedPlugins) {
        const plugin = await loadPlugin(id, info);
        if (plugin) {
            runtimePluginManager.register(plugin);
        }
    }
}

/**
 * 注册预加载的插件（用于已静态导入的插件）
 */
export function registerStaticPlugin(plugin: IPlugin): void {
    runtimePluginManager.register(plugin);
}

/**
 * 获取已加载的插件列表
 */
export function getLoadedPlugins(): IPlugin[] {
    return Array.from(loadedPlugins.values()).map(info => info.plugin);
}

/**
 * 重置插件加载器状态
 */
export function resetPluginLoader(): void {
    loadedPlugins.clear();
}
