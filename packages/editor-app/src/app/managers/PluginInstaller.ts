import type { EditorPluginManager } from '@esengine/editor-core';
import { SceneInspectorPlugin } from '../../plugins/SceneInspectorPlugin';
import { ProfilerPlugin } from '../../plugins/ProfilerPlugin';
import { EditorAppearancePlugin } from '../../plugins/EditorAppearancePlugin';
import { GizmoPlugin } from '../../plugins/GizmoPlugin';
import { TilemapEditorPlugin } from '@esengine/tilemap-editor';
import { UIEditorPlugin } from '@esengine/ui-editor';

export class PluginInstaller {
    async installBuiltinPlugins(pluginManager: EditorPluginManager): Promise<void> {
        const plugins = [
            new GizmoPlugin(),
            new SceneInspectorPlugin(),
            new ProfilerPlugin(),
            new EditorAppearancePlugin(),
            new TilemapEditorPlugin(),
            new UIEditorPlugin()
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