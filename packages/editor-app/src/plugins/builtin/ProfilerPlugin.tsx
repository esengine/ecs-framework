/**
 * Profiler Plugin
 * 性能分析器插件
 */

import type { ServiceContainer } from '@esengine/ecs-framework';
import type {
    IPlugin,
    IEditorModuleLoader,
    PluginDescriptor,
    MenuItemDescriptor
} from '@esengine/editor-core';
import { MessageHub, SettingsRegistry } from '@esengine/editor-core';
import { ProfilerService } from '../../services/ProfilerService';

/**
 * Profiler 编辑器模块
 */
class ProfilerEditorModule implements IEditorModuleLoader {
    private messageHub: MessageHub | null = null;
    private profilerService: ProfilerService | null = null;

    async install(services: ServiceContainer): Promise<void> {
        this.messageHub = services.resolve(MessageHub);

        const settingsRegistry = services.resolve(SettingsRegistry);
        settingsRegistry.registerCategory({
            id: 'profiler',
            title: '性能分析器',
            description: '配置性能分析器的行为和显示选项',
            sections: [
                {
                    id: 'connection',
                    title: '连接设置',
                    description: '配置WebSocket服务器连接参数',
                    settings: [
                        {
                            key: 'profiler.port',
                            label: '监听端口',
                            type: 'number',
                            defaultValue: 8080,
                            description: '性能分析器WebSocket服务器监听的端口号',
                            placeholder: '8080',
                            min: 1024,
                            max: 65535,
                            validator: {
                                validate: (value: number) => value >= 1024 && value <= 65535,
                                errorMessage: '端口号必须在1024到65535之间'
                            }
                        },
                        {
                            key: 'profiler.autoStart',
                            label: '自动启动服务器',
                            type: 'boolean',
                            defaultValue: true,
                            description: '编辑器启动时自动启动性能分析器服务器'
                        }
                    ]
                },
                {
                    id: 'display',
                    title: '显示设置',
                    description: '配置性能数据的显示选项',
                    settings: [
                        {
                            key: 'profiler.refreshInterval',
                            label: '刷新间隔 (毫秒)',
                            type: 'range',
                            defaultValue: 100,
                            description: '性能数据刷新的时间间隔',
                            min: 50,
                            max: 1000,
                            step: 50
                        },
                        {
                            key: 'profiler.maxDataPoints',
                            label: '最大数据点数',
                            type: 'number',
                            defaultValue: 100,
                            description: '图表中保留的最大历史数据点数量',
                            min: 10,
                            max: 500
                        }
                    ]
                }
            ]
        });

        this.profilerService = new ProfilerService();
        (window as any).__PROFILER_SERVICE__ = this.profilerService;
    }

    async uninstall(): Promise<void> {
        if (this.profilerService) {
            this.profilerService.destroy();
            this.profilerService = null;
        }
        delete (window as any).__PROFILER_SERVICE__;
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

const descriptor: PluginDescriptor = {
    id: '@esengine/profiler',
    name: 'Performance Profiler',
    version: '1.0.0',
    description: 'Real-time performance monitoring for ECS systems',
    category: 'tools',
    icon: 'BarChart3',
    enabledByDefault: true,
    canContainContent: false,
    isEnginePlugin: true,
    modules: [
        {
            name: 'ProfilerEditor',
            type: 'editor',
            loadingPhase: 'postDefault'
        }
    ]
};

export const ProfilerPlugin: IPlugin = {
    descriptor,
    editorModule: new ProfilerEditorModule()
};
