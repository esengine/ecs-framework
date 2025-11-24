import type { EditorPluginManager } from '@esengine/editor-core';
import { SceneInspectorPlugin } from '../../plugins/SceneInspectorPlugin';
import { ProfilerPlugin } from '../../plugins/ProfilerPlugin';
import { EditorAppearancePlugin } from '../../plugins/EditorAppearancePlugin';
import { TilemapEditorPlugin } from '@esengine/tilemap-editor';

export class PluginInstaller {
    async installBuiltinPlugins(pluginManager: EditorPluginManager): Promise<void> {
        const plugins = [
            new SceneInspectorPlugin(),
            new ProfilerPlugin(),
            new EditorAppearancePlugin(),
            new TilemapEditorPlugin()
        ];

        for (const plugin of plugins) {
            try {
                await pluginManager.installEditor(plugin);
            } catch (error) {
                console.error(`[PluginInstaller] Failed to install plugin ${plugin.name}:`, error);
            }
        }
    }
}
