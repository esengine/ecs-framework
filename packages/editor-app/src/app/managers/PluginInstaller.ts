import type { EditorPluginManager } from '@esengine/editor-core';
import { SceneInspectorPlugin } from '../../plugins/SceneInspectorPlugin';
import { ProfilerPlugin } from '../../plugins/ProfilerPlugin';
import { EditorAppearancePlugin } from '../../plugins/EditorAppearancePlugin';

export class PluginInstaller {
    async installBuiltinPlugins(pluginManager: EditorPluginManager): Promise<void> {
        console.log('[PluginInstaller] Installing builtin plugins...');

        const plugins = [
            new SceneInspectorPlugin(),
            new ProfilerPlugin(),
            new EditorAppearancePlugin()
        ];

        for (const plugin of plugins) {
            try {
                await pluginManager.installEditor(plugin);
                console.log(`[PluginInstaller] Installed plugin: ${plugin.name}`);
            } catch (error) {
                console.error(`[PluginInstaller] Failed to install plugin ${plugin.name}:`, error);
            }
        }

        console.log('[PluginInstaller] All builtin plugins installed');
    }
}
