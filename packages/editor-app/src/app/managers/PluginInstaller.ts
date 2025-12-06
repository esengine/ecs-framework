/**
 * 插件安装器
 * Plugin Installer
 *
 * 现在所有插件都使用统一的 IPlugin 接口，无需适配器。
 * Now all plugins use the unified IPlugin interface, no adapter needed.
 */

import type { PluginManager } from '@esengine/editor-core';

// 内置插件
import { GizmoPlugin } from '../../plugins/builtin/GizmoPlugin';
import { SceneInspectorPlugin } from '../../plugins/builtin/SceneInspectorPlugin';
import { ProfilerPlugin } from '../../plugins/builtin/ProfilerPlugin';
import { EditorAppearancePlugin } from '../../plugins/builtin/EditorAppearancePlugin';
import { ProjectSettingsPlugin } from '../../plugins/builtin/ProjectSettingsPlugin';
import { AssetMetaPlugin } from '../../plugins/builtin/AssetMetaPlugin';
// Note: PluginConfigPlugin removed - module management is now unified in ProjectSettingsPlugin

// 统一模块插件（从编辑器包导入完整插件，包含 runtime + editor）
import { BehaviorTreePlugin } from '@esengine/behavior-tree-editor';
import { ParticlePlugin } from '@esengine/particle-editor';
import { Physics2DPlugin } from '@esengine/physics-rapier2d-editor';
import { TilemapPlugin } from '@esengine/tilemap-editor';
import { UIPlugin } from '@esengine/ui-editor';
import { BlueprintPlugin } from '@esengine/blueprint-editor';
import { MaterialPlugin } from '@esengine/material-editor';
import { SpritePlugin } from '@esengine/sprite-editor';
import { ShaderEditorPlugin } from '@esengine/shader-editor';

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
            { name: 'ProjectSettingsPlugin', plugin: ProjectSettingsPlugin },
            { name: 'AssetMetaPlugin', plugin: AssetMetaPlugin },
        ];

        for (const { name, plugin } of builtinPlugins) {
            if (!plugin || !plugin.manifest) {
                console.error(`[PluginInstaller] ${name} is invalid: missing manifest`, plugin);
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
            { name: 'SpritePlugin', plugin: SpritePlugin },
            { name: 'TilemapPlugin', plugin: TilemapPlugin },
            { name: 'UIPlugin', plugin: UIPlugin },
            { name: 'BehaviorTreePlugin', plugin: BehaviorTreePlugin },
            { name: 'ParticlePlugin', plugin: ParticlePlugin },
            { name: 'Physics2DPlugin', plugin: Physics2DPlugin },
            { name: 'BlueprintPlugin', plugin: BlueprintPlugin },
            { name: 'MaterialPlugin', plugin: MaterialPlugin },
            { name: 'ShaderEditorPlugin', plugin: ShaderEditorPlugin },
        ];

        for (const { name, plugin } of modulePlugins) {
            if (!plugin || !plugin.manifest) {
                console.error(`[PluginInstaller] ${name} is invalid: missing manifest`, plugin);
                continue;
            }
            // 详细日志，检查 editorModule 是否存在
            console.log(`[PluginInstaller] ${name}: manifest.id=${plugin.manifest.id}, hasRuntimeModule=${!!plugin.runtimeModule}, hasEditorModule=${!!plugin.editorModule}`);
            try {
                pluginManager.register(plugin);
            } catch (error) {
                console.error(`[PluginInstaller] Failed to register ${name}:`, error);
            }
        }
    }
}
