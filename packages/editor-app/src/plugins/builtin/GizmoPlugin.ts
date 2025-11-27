/**
 * Gizmo Plugin
 * Gizmo 插件
 */

import type { ServiceContainer } from '@esengine/ecs-framework';
import type { IPluginLoader, IEditorModuleLoader, PluginDescriptor, GizmoProviderRegistration } from '@esengine/editor-core';
import { registerSpriteGizmo } from '../../gizmos';

/**
 * Gizmo 编辑器模块
 */
class GizmoEditorModule implements IEditorModuleLoader {
    async install(_services: ServiceContainer): Promise<void> {
        registerSpriteGizmo();
    }

    async uninstall(): Promise<void> {
        // Uninstalled
    }

    getGizmoProviders(): GizmoProviderRegistration[] {
        return [];
    }
}

const descriptor: PluginDescriptor = {
    id: '@esengine/gizmo',
    name: 'Gizmo System',
    version: '1.0.0',
    description: 'Provides gizmo support for editor components',
    category: 'tools',
    icon: 'Move',
    enabledByDefault: true,
    canContainContent: false,
    isEnginePlugin: true,
    isCore: true,
    modules: [
        {
            name: 'GizmoEditor',
            type: 'editor',
            loadingPhase: 'preDefault'
        }
    ]
};

export const GizmoPlugin: IPluginLoader = {
    descriptor,
    editorModule: new GizmoEditorModule()
};
