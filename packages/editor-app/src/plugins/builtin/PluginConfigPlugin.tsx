/**
 * Plugin Config Plugin
 * 插件配置插件
 */

import type { ServiceContainer } from '@esengine/ecs-framework';
import { createLogger } from '@esengine/ecs-framework';
import type { IPlugin, IEditorModuleLoader, ModuleManifest } from '@esengine/editor-core';
import { SettingsRegistry } from '@esengine/editor-core';

const logger = createLogger('PluginConfigPlugin');

/**
 * Plugin Config 编辑器模块
 */
class PluginConfigEditorModule implements IEditorModuleLoader {
    async install(services: ServiceContainer): Promise<void> {
        const settingsRegistry = services.resolve(SettingsRegistry);

        // Register settings using translation keys (prefixed with '$')
        // 使用翻译键注册设置（以 '$' 为前缀）
        settingsRegistry.registerCategory({
            id: 'plugins',
            title: '$pluginSettings.plugins.title',
            description: '$pluginSettings.plugins.description',
            sections: [
                {
                    id: 'engine-plugins',
                    title: '$pluginSettings.plugins.management.title',
                    description: '$pluginSettings.plugins.management.description',
                    settings: [
                        {
                            key: 'project.enabledPlugins',
                            label: '$pluginSettings.plugins.management.list.label',
                            type: 'pluginList',
                            defaultValue: [],
                            description: '$pluginSettings.plugins.management.list.description'
                        }
                    ]
                }
            ]
        });

        logger.info('Installed');
    }

    async uninstall(): Promise<void> {
        logger.info('Uninstalled');
    }

    async onEditorReady(): Promise<void> {
        logger.info('Editor is ready');
    }
}

const manifest: ModuleManifest = {
    id: '@esengine/plugin-config',
    name: '@esengine/plugin-config',
    displayName: 'Plugin Config',
    version: '1.0.0',
    description: 'Configure engine plugins',
    category: 'Other',
    icon: 'Package',
    isCore: true,
    defaultEnabled: true,
    isEngineModule: true,
    canContainContent: false,
    dependencies: [],
    exports: {}
};

export const PluginConfigPlugin: IPlugin = {
    manifest,
    editorModule: new PluginConfigEditorModule()
};
