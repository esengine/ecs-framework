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
import { PluginManager, type RegisteredPlugin, type PluginCategory } from '@esengine/editor-core';
import { Check, Lock, RefreshCw, Package } from 'lucide-react';
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
    content: { zh: '内容', en: 'Content' }
};

const categoryOrder: PluginCategory[] = ['core', 'rendering', 'ui', 'ai', 'physics', 'audio', 'networking', 'tools'];

export function PluginListSetting({ pluginManager }: PluginListSettingProps) {
    const [plugins, setPlugins] = useState<RegisteredPlugin[]>([]);
    const [pendingChanges, setPendingChanges] = useState<Map<string, boolean>>(new Map());

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

    const handleToggle = (pluginId: string) => {
        const plugin = plugins.find(p => p.loader.descriptor.id === pluginId);
        if (!plugin) return;

        const descriptor = plugin.loader.descriptor;

        // 核心插件不可禁用
        if (descriptor.isCore) {
            showWarning('核心插件不可禁用');
            return;
        }

        const newEnabled = !plugin.enabled;

        // 检查依赖
        if (newEnabled) {
            const deps = descriptor.dependencies || [];
            const missingDeps = deps.filter(dep => {
                const depPlugin = plugins.find(p => p.loader.descriptor.id === dep.id);
                return depPlugin && !depPlugin.enabled;
            });

            if (missingDeps.length > 0) {
                showWarning(`需要先启用依赖插件: ${missingDeps.map(d => d.id).join(', ')}`);
                return;
            }
        } else {
            // 检查是否有其他插件依赖此插件
            const dependents = plugins.filter(p => {
                if (!p.enabled || p.loader.descriptor.id === pluginId) return false;
                const deps = p.loader.descriptor.dependencies || [];
                return deps.some(d => d.id === pluginId);
            });

            if (dependents.length > 0) {
                showWarning(`以下插件依赖此插件: ${dependents.map(p => p.loader.descriptor.name).join(', ')}`);
                return;
            }
        }

        // 记录待处理的更改
        const newPendingChanges = new Map(pendingChanges);
        newPendingChanges.set(pluginId, newEnabled);
        setPendingChanges(newPendingChanges);

        // 更新本地状态
        setPlugins(plugins.map(p => {
            if (p.loader.descriptor.id === pluginId) {
                return { ...p, enabled: newEnabled };
            }
            return p;
        }));

        // 调用 PluginManager 的启用/禁用方法
        if (newEnabled) {
            pluginManager.enable(pluginId);
        } else {
            pluginManager.disable(pluginId);
        }
    };

    // 按类别分组并排序
    const groupedPlugins = plugins.reduce((acc, plugin) => {
        const category = plugin.loader.descriptor.category;
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
            {pendingChanges.size > 0 && (
                <div className="plugin-list-notice">
                    <RefreshCw size={14} />
                    <span>部分更改需要重启编辑器后生效</span>
                </div>
            )}

            {sortedCategories.map(category => (
                <div key={category} className="plugin-category">
                    <div className="plugin-category-header">
                        {categoryLabels[category]?.zh || category}
                    </div>
                    <div className="plugin-list">
                        {groupedPlugins[category].map(plugin => {
                            const descriptor = plugin.loader.descriptor;
                            const hasRuntime = !!plugin.loader.runtimeModule;
                            const hasEditor = !!plugin.loader.editorModule;

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
