/**
 * Plugin Config Plugin
 * 插件配置插件
 */

import type { ServiceContainer } from '@esengine/ecs-framework';
import { createLogger } from '@esengine/ecs-framework';
import type { IPluginLoader, IEditorModuleLoader, PluginDescriptor } from '@esengine/editor-core';
import { SettingsRegistry } from '@esengine/editor-core';

const logger = createLogger('PluginConfigPlugin');

/**
 * Plugin Config 编辑器模块
 */
class PluginConfigEditorModule implements IEditorModuleLoader {
    async install(services: ServiceContainer): Promise<void> {
        const settingsRegistry = services.resolve(SettingsRegistry);

        settingsRegistry.registerCategory({
            id: 'plugins',
            title: '插件',
            description: '管理项目使用的插件',
            sections: [
                {
                    id: 'engine-plugins',
                    title: '插件管理',
                    description: '启用或禁用项目需要的插件。禁用不需要的插件可以减少打包体积。',
                    settings: [
                        {
                            key: 'project.enabledPlugins',
                            label: '',
                            type: 'pluginList',
                            defaultValue: [],
                            description: ''
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

const descriptor: PluginDescriptor = {
    id: '@esengine/plugin-config',
    name: 'Plugin Config',
    version: '1.0.0',
    description: 'Configure engine plugins',
    category: 'tools',
    icon: 'Package',
    enabledByDefault: true,
    canContainContent: false,
    isEnginePlugin: true,
    isCore: true,
    modules: [
        {
            name: 'PluginConfigEditor',
            type: 'editor',
            loadingPhase: 'postDefault'
        }
    ]
};

export const PluginConfigPlugin: IPluginLoader = {
    descriptor,
    editorModule: new PluginConfigEditorModule()
};
