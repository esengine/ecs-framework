import type { PluginPackageInfo, PluginConfig } from './PluginLoader';

export interface ProjectConfig {
    name: string;
    version: string;
    plugins: Record<string, PluginConfig>;
}

/**
 * 内置引擎插件的包信息
 * 这些信息在构建时从各包的 package.json 中提取
 */
export const BUILTIN_PLUGIN_PACKAGES: Record<string, PluginPackageInfo> = {
    '@esengine/engine-core': {
        plugin: true,
        pluginExport: 'EnginePlugin',
        category: 'core',
        isEnginePlugin: true
    },
    '@esengine/camera': {
        plugin: true,
        pluginExport: 'CameraPlugin',
        category: 'core',
        isEnginePlugin: true
    },
    '@esengine/sprite': {
        plugin: true,
        pluginExport: 'SpritePlugin',
        category: 'rendering',
        isEnginePlugin: true
    },
    '@esengine/audio': {
        plugin: true,
        pluginExport: 'AudioPlugin',
        category: 'audio',
        isEnginePlugin: true
    },
    '@esengine/ui': {
        plugin: true,
        pluginExport: 'UIPlugin',
        category: 'ui'
    },
    '@esengine/tilemap': {
        plugin: true,
        pluginExport: 'TilemapPlugin',
        category: 'tilemap'
    },
    '@esengine/behavior-tree': {
        plugin: true,
        pluginExport: 'BehaviorTreePlugin',
        category: 'ai'
    },
    '@esengine/physics-rapier2d': {
        plugin: true,
        pluginExport: 'PhysicsPlugin',
        category: 'physics'
    }
};

/**
 * 创建默认项目配置
 */
export function createDefaultProjectConfig(): ProjectConfig {
    return {
        name: 'New Project',
        version: '1.0.0',
        plugins: {
            '@esengine/engine-core': { enabled: true },
            '@esengine/camera': { enabled: true },
            '@esengine/sprite': { enabled: true },
            '@esengine/audio': { enabled: true },
            '@esengine/ui': { enabled: true },
            '@esengine/tilemap': { enabled: false },
            '@esengine/behavior-tree': { enabled: false },
            '@esengine/physics-rapier2d': { enabled: false }
        }
    };
}

/**
 * 合并用户配置与默认配置
 */
export function mergeProjectConfig(
    userConfig: Partial<ProjectConfig>
): ProjectConfig {
    const defaultConfig = createDefaultProjectConfig();

    return {
        name: userConfig.name || defaultConfig.name,
        version: userConfig.version || defaultConfig.version,
        plugins: {
            ...defaultConfig.plugins,
            ...userConfig.plugins
        }
    };
}

/**
 * 从编辑器的 enabledPlugins 列表创建项目配置
 * Create project config from editor's enabledPlugins list
 *
 * @param enabledPlugins - 启用的插件 ID 列表 / List of enabled plugin IDs
 */
export function createProjectConfigFromEnabledList(
    enabledPlugins: string[]
): ProjectConfig {
    const defaultConfig = createDefaultProjectConfig();

    // 先禁用所有非核心插件
    // First disable all non-core plugins
    const plugins: Record<string, PluginConfig> = {};

    for (const [id, config] of Object.entries(defaultConfig.plugins)) {
        const packageInfo = BUILTIN_PLUGIN_PACKAGES[id];
        // 核心插件始终启用
        // Core plugins are always enabled
        if (packageInfo?.isEnginePlugin) {
            plugins[id] = { enabled: true };
        } else {
            plugins[id] = { enabled: enabledPlugins.includes(id) };
        }
    }

    return {
        ...defaultConfig,
        plugins
    };
}
