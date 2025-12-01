/**
 * Physics 2D Plugin (Complete)
 * 完整的 2D 物理插件（运行时 + 编辑器）
 */

import type { IPlugin, PluginDescriptor } from '@esengine/editor-core';
import { PhysicsRuntimeModule } from '@esengine/physics-rapier2d/runtime';
import { physics2DEditorModule } from './index';

/**
 * Physics 2D 插件描述符
 * Physics 2D Plugin Descriptor
 */
const descriptor: PluginDescriptor = {
    id: '@esengine/physics-rapier2d',
    name: 'Physics 2D',
    version: '1.0.0',
    description: 'Deterministic 2D physics with Rapier2D',
    category: 'physics',
    enabledByDefault: true,
    isEnginePlugin: true,
    canContainContent: false,
    modules: [
        { name: 'Runtime', type: 'runtime', loadingPhase: 'default' },
        { name: 'Editor', type: 'editor', loadingPhase: 'postDefault' }
    ]
};

/**
 * 完整的 Physics 2D 插件（运行时 + 编辑器）
 * Complete Physics 2D Plugin (runtime + editor)
 */
export const Physics2DPlugin: IPlugin = {
    descriptor,
    runtimeModule: new PhysicsRuntimeModule(),
    editorModule: physics2DEditorModule
};
