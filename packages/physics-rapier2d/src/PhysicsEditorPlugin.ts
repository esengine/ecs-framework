/**
 * Physics Editor Plugin
 *
 * 编辑器版本的物理插件，不包含 WASM 依赖。
 * Editor version of physics plugin, without WASM dependencies.
 *
 * 用于编辑器中注册插件描述符，但不创建运行时模块。
 * 运行时使用 PhysicsPlugin from '@esengine/physics-rapier2d/runtime'
 */

import type { IPlugin, PluginDescriptor } from '@esengine/engine-core';

const descriptor: PluginDescriptor = {
    id: '@esengine/physics-rapier2d',
    name: 'Physics 2D',
    version: '1.0.0',
    description: 'Deterministic 2D physics with Rapier2D',
    category: 'physics',
    enabledByDefault: false,
    canContainContent: false,
    isEnginePlugin: true,
    modules: [
        {
            name: 'PhysicsRuntime',
            type: 'runtime',
            loadingPhase: 'default'
        }
    ]
};

/**
 * 编辑器物理插件（无运行时模块）
 * Editor physics plugin (no runtime module)
 *
 * 编辑器使用此版本注册插件，运行时使用带 WASM 的完整版本。
 */
export const Physics2DPlugin: IPlugin = {
    descriptor
    // No runtime module - editor doesn't need physics simulation
};
