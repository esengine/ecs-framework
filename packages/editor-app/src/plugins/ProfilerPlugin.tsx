import type { Core, ServiceContainer } from '@esengine/ecs-framework';
import { IEditorPlugin, EditorPluginCategory, MenuItem, MessageHub, PanelDescriptor, SettingsRegistry } from '@esengine/editor-core';
import { ProfilerDockPanel } from '../components/ProfilerDockPanel';
import { ProfilerService } from '../services/ProfilerService';

/**
 * Profiler Plugin
 *
 * Displays real-time performance metrics for ECS systems
 */
export class ProfilerPlugin implements IEditorPlugin {
    readonly name = '@esengine/profiler';
    readonly version = '1.0.0';
    readonly displayName = 'Performance Profiler';
    readonly category = EditorPluginCategory.Tool;
    readonly description = 'Real-time performance monitoring for ECS systems';
    readonly icon = '📊';

    private messageHub: MessageHub | null = null;
    private profilerService: ProfilerService | null = null;

    async install(_core: Core, services: ServiceContainer): Promise<void> {
        this.messageHub = services.resolve(MessageHub);

        // 注册设置
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

        // 创建并启动 ProfilerService
        this.profilerService = new ProfilerService();

        // 将服务实例存储到全局，供组件访问
        (window as any).__PROFILER_SERVICE__ = this.profilerService;

        console.log('[ProfilerPlugin] Installed and ProfilerService started');
    }

    async uninstall(): Promise<void> {
    // 清理 ProfilerService
        if (this.profilerService) {
            this.profilerService.destroy();
            this.profilerService = null;
        }

        delete (window as any).__PROFILER_SERVICE__;

        console.log('[ProfilerPlugin] Uninstalled and ProfilerService stopped');
    }

    async onEditorReady(): Promise<void> {
        console.log('[ProfilerPlugin] Editor is ready');
    }

    registerMenuItems(): MenuItem[] {
        const items = [
            {
                id: 'window.profiler',
                label: 'Profiler',
                parentId: 'window',
                order: 100,
                onClick: () => {
                    console.log('[ProfilerPlugin] Menu item clicked!');
                    this.messageHub?.publish('ui:openWindow', { windowId: 'profiler' });
                }
            }
        ];
        console.log('[ProfilerPlugin] Registering menu items:', items);
        return items;
    }

    registerPanels(): PanelDescriptor[] {
        return [
            {
                id: 'profiler-monitor',
                title: 'Performance Monitor',
                position: 'center' as any,
                closable: false,
                component: ProfilerDockPanel,
                order: 200
            }
        ];
    }
}
