/**
 * Gizmo Plugin
 * Gizmo 插件
 *
 * Registers gizmo support for built-in components
 * 为内置组件注册 gizmo 支持
 */

import type { Core, ServiceContainer } from '@esengine/ecs-framework';
import type { IEditorPlugin } from '@esengine/editor-core';
import { EditorPluginCategory } from '@esengine/editor-core';
import { registerSpriteGizmo } from '../gizmos';

export class GizmoPlugin implements IEditorPlugin {
    readonly name = '@esengine/gizmo-plugin';
    readonly version = '1.0.0';
    readonly category = EditorPluginCategory.Tool;

    get displayName(): string {
        return 'Gizmo System';
    }

    get description(): string {
        return 'Provides gizmo support for editor components';
    }

    async install(_core: Core, _services: ServiceContainer): Promise<void> {
        // Register gizmo support for SpriteComponent
        // 为 SpriteComponent 注册 gizmo 支持
        registerSpriteGizmo();

        console.log('[GizmoPlugin] Installed - registered gizmo support for built-in components');
    }

    async uninstall(): Promise<void> {
        console.log('[GizmoPlugin] Uninstalled');
    }
}

export const gizmoPlugin = new GizmoPlugin();