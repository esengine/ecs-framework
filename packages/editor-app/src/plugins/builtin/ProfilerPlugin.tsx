/**
 * Profiler Plugin
 * 性能分析器插件
 */

import type { ServiceContainer } from '@esengine/ecs-framework';
import { Core } from '@esengine/ecs-framework';
import type {
    IPlugin,
    IEditorModuleLoader,
    ModuleManifest,
    MenuItemDescriptor
} from '@esengine/editor-core';
import { MessageHub, SettingsRegistry } from '@esengine/editor-core';
import { ProfilerService } from '../../services/ProfilerService';
import { ProfilerServiceToken } from '../../services/tokens';

/**
 * Profiler 编辑器模块
 */
class ProfilerEditorModule implements IEditorModuleLoader {
    private messageHub: MessageHub | null = null;
    private profilerService: ProfilerService | null = null;

    async install(services: ServiceContainer): Promise<void> {
        this.messageHub = services.resolve(MessageHub);

        const settingsRegistry = services.resolve(SettingsRegistry);
        // Register settings using translation keys (prefixed with '$')
        // 使用翻译键注册设置（以 '$' 为前缀）
        settingsRegistry.registerCategory({
            id: 'profiler',
            title: '$pluginSettings.profiler.title',
            description: '$pluginSettings.profiler.description',
            sections: [
                {
                    id: 'connection',
                    title: '$pluginSettings.profiler.connection.title',
                    description: '$pluginSettings.profiler.connection.description',
                    settings: [
                        {
                            key: 'profiler.port',
                            label: '$pluginSettings.profiler.connection.port.label',
                            type: 'number',
                            defaultValue: 8080,
                            description: '$pluginSettings.profiler.connection.port.description',
                            placeholder: '$pluginSettings.profiler.connection.port.placeholder',
                            min: 1024,
                            max: 65535,
                            validator: {
                                validate: (value: number) => value >= 1024 && value <= 65535,
                                errorMessage: '$pluginSettings.profiler.connection.port.errorMessage'
                            }
                        },
                        {
                            key: 'profiler.autoStart',
                            label: '$pluginSettings.profiler.connection.autoStart.label',
                            type: 'boolean',
                            defaultValue: true,
                            description: '$pluginSettings.profiler.connection.autoStart.description'
                        }
                    ]
                },
                {
                    id: 'display',
                    title: '$pluginSettings.profiler.display.title',
                    description: '$pluginSettings.profiler.display.description',
                    settings: [
                        {
                            key: 'profiler.refreshInterval',
                            label: '$pluginSettings.profiler.display.refreshInterval.label',
                            type: 'range',
                            defaultValue: 100,
                            description: '$pluginSettings.profiler.display.refreshInterval.description',
                            min: 50,
                            max: 1000,
                            step: 50
                        },
                        {
                            key: 'profiler.maxDataPoints',
                            label: '$pluginSettings.profiler.display.maxDataPoints.label',
                            type: 'number',
                            defaultValue: 100,
                            description: '$pluginSettings.profiler.display.maxDataPoints.description',
                            min: 10,
                            max: 500
                        }
                    ]
                }
            ]
        });

        this.profilerService = new ProfilerService();

        // 使用 ServiceToken 注册服务（类型安全）
        // Register service using ServiceToken (type-safe)
        Core.pluginServices.register(ProfilerServiceToken, this.profilerService);
    }

    async uninstall(): Promise<void> {
        // 从服务注册表注销
        // Unregister from service registry
        Core.pluginServices.unregister(ProfilerServiceToken);

        if (this.profilerService) {
            this.profilerService.destroy();
            this.profilerService = null;
        }
    }

    getMenuItems(): MenuItemDescriptor[] {
        return [
            {
                id: 'window.profiler',
                label: 'Profiler',
                parentId: 'window',
                execute: () => {
                    this.messageHub?.publish('ui:openWindow', { windowId: 'profiler' });
                }
            }
        ];
    }

    async onEditorReady(): Promise<void> {}
}

const manifest: ModuleManifest = {
    id: '@esengine/profiler',
    name: '@esengine/profiler',
    displayName: 'Performance Profiler',
    version: '1.0.0',
    description: 'Real-time performance monitoring for ECS systems',
    category: 'Other',
    icon: 'BarChart3',
    isCore: false,
    defaultEnabled: true,
    isEngineModule: true,
    canContainContent: false,
    dependencies: [],
    exports: {}
};

export const ProfilerPlugin: IPlugin = {
    manifest,
    editorModule: new ProfilerEditorModule()
};
