/**
 * 插件安装器
 * Plugin Installer
 */

import type { PluginManager } from '@esengine/editor-core';

// 内置插件
import { GizmoPlugin } from '../../plugins/builtin/GizmoPlugin';
import { SceneInspectorPlugin } from '../../plugins/builtin/SceneInspectorPlugin';
import { ProfilerPlugin } from '../../plugins/builtin/ProfilerPlugin';
import { EditorAppearancePlugin } from '../../plugins/builtin/EditorAppearancePlugin';
import { PluginConfigPlugin } from '../../plugins/builtin/PluginConfigPlugin';
import { ProjectSettingsPlugin } from '../../plugins/builtin/ProjectSettingsPlugin';

// 统一模块插件（CSS 已内联到 JS 中，导入时自动注入）
import { TilemapPlugin } from '@esengine/tilemap';
import { UIPlugin } from '@esengine/ui';
import { BehaviorTreePlugin } from '@esengine/behavior-tree';
import { Physics2DPlugin } from '@esengine/physics-rapier2d';
import { BlueprintPlugin } from '@esengine/blueprint/editor';

export class PluginInstaller {
    /**
     * 安装所有内置插件
     */
    async installBuiltinPlugins(pluginManager: PluginManager): Promise<void> {
        // 内置编辑器插件
        const builtinPlugins = [
            { name: 'GizmoPlugin', plugin: GizmoPlugin },
            { name: 'SceneInspectorPlugin', plugin: SceneInspectorPlugin },
            { name: 'ProfilerPlugin', plugin: ProfilerPlugin },
            { name: 'EditorAppearancePlugin', plugin: EditorAppearancePlugin },
            { name: 'PluginConfigPlugin', plugin: PluginConfigPlugin },
            { name: 'ProjectSettingsPlugin', plugin: ProjectSettingsPlugin },
        ];

        for (const { name, plugin } of builtinPlugins) {
            if (!plugin || !plugin.descriptor) {
                console.error(`[PluginInstaller] ${name} is invalid: missing descriptor`, plugin);
                continue;
            }
            try {
                pluginManager.register(plugin);
            } catch (error) {
                console.error(`[PluginInstaller] Failed to register ${name}:`, error);
            }
        }

        // 统一模块插件（runtime + editor）
        const modulePlugins = [
            { name: 'TilemapPlugin', plugin: TilemapPlugin },
            { name: 'UIPlugin', plugin: UIPlugin },
            { name: 'BehaviorTreePlugin', plugin: BehaviorTreePlugin },
            { name: 'Physics2DPlugin', plugin: Physics2DPlugin },
            { name: 'BlueprintPlugin', plugin: BlueprintPlugin },
        ];

        for (const { name, plugin } of modulePlugins) {
            if (!plugin || !plugin.descriptor) {
                console.error(`[PluginInstaller] ${name} is invalid: missing descriptor`, plugin);
                continue;
            }
            try {
                pluginManager.register(plugin);
            } catch (error) {
                console.error(`[PluginInstaller] Failed to register ${name}:`, error);
            }
        }

        // All builtin plugins registered
    }
}
