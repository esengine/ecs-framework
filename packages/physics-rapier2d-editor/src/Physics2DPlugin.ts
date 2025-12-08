/**
 * Physics 2D Plugin (Complete)
 * 完整的 2D 物理插件（运行时 + 编辑器）
 */

import type { IEditorPlugin, ModuleManifest } from '@esengine/editor-core';
import { PhysicsRuntimeModule } from '@esengine/physics-rapier2d/runtime';
import { physics2DEditorModule } from './Physics2DEditorModule';

/**
 * Physics 2D 插件清单
 * Physics 2D Plugin Manifest
 */
const manifest: ModuleManifest = {
    id: '@esengine/physics-rapier2d',
    name: '@esengine/physics-rapier2d',
    displayName: 'Physics 2D',
    version: '1.0.0',
    description: 'Deterministic 2D physics with Rapier2D',
    category: 'Physics',
    isCore: false,
    defaultEnabled: true,
    isEngineModule: true,
    canContainContent: false,
    requiresWasm: true,
    dependencies: ['engine-core'],
    exports: {
        components: ['Rigidbody2DComponent', 'BoxCollider2DComponent', 'CircleCollider2DComponent'],
        systems: ['PhysicsSystem']
    }
};

/**
 * 完整的 Physics 2D 插件（运行时 + 编辑器）
 * Complete Physics 2D Plugin (runtime + editor)
 */
export const Physics2DPlugin: IEditorPlugin = {
    manifest,
    runtimeModule: new PhysicsRuntimeModule(),
    editorModule: physics2DEditorModule
};
