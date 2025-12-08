/**
 * Gizmo Plugin
 * Gizmo 插件
 */

import type { ServiceContainer } from '@esengine/esengine';
import type { IPlugin, IEditorModuleLoader, ModuleManifest, GizmoProviderRegistration } from '@esengine/editor-core';
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

const manifest: ModuleManifest = {
    id: '@esengine/gizmo',
    name: '@esengine/gizmo',
    displayName: 'Gizmo System',
    version: '1.0.0',
    description: 'Provides gizmo support for editor components',
    category: 'Other',
    icon: 'Move',
    isCore: true,
    defaultEnabled: true,
    isEngineModule: true,
    canContainContent: false,
    dependencies: ['engine-core'],
    exports: {
        other: ['GizmoRegistry']
    }
};

export const GizmoPlugin: IPlugin = {
    manifest,
    editorModule: new GizmoEditorModule()
};
