/**
 * Plugin List Setting Component
 * 插件列表设置组件
 *
 * 简洁的插件列表，只显示：
 * - 勾选框表示启用状态
 * - 插件名称、版本
 * - 插件描述
 * - [Runtime] [Editor] 标签
 */

import { useState, useEffect } from 'react';
import { Core } from '@esengine/ecs-framework';
import { PluginManager, type RegisteredPlugin, type PluginCategory, ProjectService } from '@esengine/editor-core';
import { Check, Lock, Package } from 'lucide-react';
import { NotificationService } from '../services/NotificationService';
import '../styles/PluginListSetting.css';

interface PluginListSettingProps {
    pluginManager: PluginManager;
}

const categoryLabels: Record<PluginCategory, { zh: string; en: string }> = {
    core: { zh: '核心', en: 'Core' },
    rendering: { zh: '渲染', en: 'Rendering' },
    ui: { zh: 'UI', en: 'UI' },
    ai: { zh: 'AI', en: 'AI' },
    physics: { zh: '物理', en: 'Physics' },
    audio: { zh: '音频', en: 'Audio' },
    networking: { zh: '网络', en: 'Networking' },
    tools: { zh: '工具', en: 'Tools' },
    scripting: { zh: '脚本', en: 'Scripting' },
    content: { zh: '内容', en: 'Content' },
    tilemap: { zh: '瓦片地图', en: 'Tilemap' }
};

const categoryOrder: PluginCategory[] = ['core', 'rendering', 'ui', 'ai', 'scripting', 'physics', 'audio', 'networking', 'tilemap', 'tools', 'content'];

export function PluginListSetting({ pluginManager }: PluginListSettingProps) {
    const [plugins, setPlugins] = useState<RegisteredPlugin[]>([]);

    useEffect(() => {
        loadPlugins();
    }, [pluginManager]);

    const loadPlugins = () => {
        const allPlugins = pluginManager.getAllPlugins();
        setPlugins(allPlugins);
    };

    const showWarning = (message: string) => {
        const notificationService = Core.services.tryResolve(NotificationService) as NotificationService | null;
        if (notificationService) {
            notificationService.show(message, 'warning', 3000);
        }
    };

    const handleToggle = async (pluginId: string) => {
        const plugin = plugins.find(p => p.plugin.descriptor.id === pluginId);
        if (!plugin) return;

        const descriptor = plugin.plugin.descriptor;

        // 核心插件不可禁用
        if (descriptor.isCore) {
            showWarning('核心插件不可禁用');
            return;
        }

        const newEnabled = !plugin.enabled;

        // 检查依赖（启用时）
        if (newEnabled) {
            const deps = descriptor.dependencies || [];
            const missingDeps = deps.filter(dep => {
                const depPlugin = plugins.find(p => p.plugin.descriptor.id === dep.id);
                return depPlugin && !depPlugin.enabled;
            });

            if (missingDeps.length > 0) {
                showWarning(`需要先启用依赖插件: ${missingDeps.map(d => d.id).join(', ')}`);
                return;
            }
        }

        // 调用 PluginManager 的动态启用/禁用方法
        console.log(`[PluginListSetting] ${newEnabled ? 'Enabling' : 'Disabling'} plugin: ${pluginId}`);
        let success: boolean;
        if (newEnabled) {
            success = await pluginManager.enable(pluginId);
        } else {
            success = await pluginManager.disable(pluginId);
        }
        console.log(`[PluginListSetting] ${newEnabled ? 'Enable' : 'Disable'} result: ${success}`);

        if (!success) {
            showWarning(newEnabled ? '启用插件失败' : '禁用插件失败');
            return;
        }

        // 更新本地状态
        setPlugins(plugins.map(p => {
            if (p.plugin.descriptor.id === pluginId) {
                return { ...p, enabled: newEnabled };
            }
            return p;
        }));

        // 保存到项目配置
        savePluginConfigToProject();

        // 通知用户（如果有编辑器模块变更）
        const hasEditorModule = !!plugin.plugin.editorModule;
        if (hasEditorModule) {
            const notificationService = Core.services.tryResolve(NotificationService) as NotificationService | null;
            if (notificationService) {
                notificationService.show(
                    newEnabled ? `已启用插件: ${descriptor.name}` : `已禁用插件: ${descriptor.name}`,
                    'success',
                    2000
                );
            }
        }
    };

    /**
     * 保存插件配置到项目文件
     */
    const savePluginConfigToProject = async () => {
        const projectService = Core.services.tryResolve<ProjectService>(ProjectService);
        if (!projectService || !projectService.isProjectOpen()) {
            console.warn('[PluginListSetting] Cannot save: project not open');
            return;
        }

        // 获取当前启用的插件列表（排除核心插件）
        const enabledPlugins = pluginManager.getEnabledPlugins()
            .filter(p => !p.plugin.descriptor.isCore)
            .map(p => p.plugin.descriptor.id);

        console.log('[PluginListSetting] Saving enabled plugins:', enabledPlugins);

        try {
            await projectService.setEnabledPlugins(enabledPlugins);
            console.log('[PluginListSetting] Plugin config saved successfully');
        } catch (error) {
            console.error('[PluginListSetting] Failed to save plugin config:', error);
        }
    };

    // 按类别分组并排序
    const groupedPlugins = plugins.reduce((acc, plugin) => {
        const category = plugin.plugin.descriptor.category;
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(plugin);
        return acc;
    }, {} as Record<PluginCategory, RegisteredPlugin[]>);

    // 按照 categoryOrder 排序
    const sortedCategories = categoryOrder.filter(cat => groupedPlugins[cat]?.length > 0);

    return (
        <div className="plugin-list-setting">
            {sortedCategories.map(category => (
                <div key={category} className="plugin-category">
                    <div className="plugin-category-header">
                        {categoryLabels[category]?.zh || category}
                    </div>
                    <div className="plugin-list">
                        {groupedPlugins[category].map(plugin => {
                            const descriptor = plugin.plugin.descriptor;
                            const hasRuntime = !!plugin.plugin.runtimeModule;
                            const hasEditor = !!plugin.plugin.editorModule;

                            return (
                                <div
                                    key={descriptor.id}
                                    className={`plugin-item ${plugin.enabled ? 'enabled' : ''} ${descriptor.isCore ? 'core' : ''}`}
                                    onClick={() => handleToggle(descriptor.id)}
                                >
                                    <div className="plugin-checkbox">
                                        {descriptor.isCore ? (
                                            <Lock size={10} />
                                        ) : (
                                            plugin.enabled && <Check size={10} />
                                        )}
                                    </div>
                                    <div className="plugin-info">
                                        <div className="plugin-header">
                                            <span className="plugin-name">{descriptor.name}</span>
                                            <span className="plugin-version">v{descriptor.version}</span>
                                        </div>
                                        {descriptor.description && (
                                            <div className="plugin-description">
                                                {descriptor.description}
                                            </div>
                                        )}
                                        <div className="plugin-modules">
                                            {hasRuntime && (
                                                <span className="plugin-module-badge runtime">Runtime</span>
                                            )}
                                            {hasEditor && (
                                                <span className="plugin-module-badge editor">Editor</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}

            {plugins.length === 0 && (
                <div className="plugin-list-empty">
                    <Package size={32} />
                    <p>没有可用的插件</p>
                </div>
            )}
        </div>
    );
}
