/**
 * Physics 2D Unified Plugin
 * 2D 物理统一插件
 *
 * 编辑器专用插件入口
 * 使用完整运行时模块以支持编辑器预览
 */

import type { IPluginLoader, PluginDescriptor } from '@esengine/editor-core';
import { Physics2DEditorModule } from './index';
import { PhysicsRuntimeModule } from '../PhysicsRuntimeModule';

/**
 * 插件描述符
 */
const descriptor: PluginDescriptor = {
    id: '@esengine/physics-rapier2d',
    name: 'Rapier 2D Physics',
    version: '1.0.0',
    description: '基于 Rapier2D 的确定性 2D 物理引擎',
    category: 'physics',
    enabledByDefault: true,
    canContainContent: false,
    isEnginePlugin: true,
    modules: [
        {
            name: 'PhysicsRuntime',
            type: 'runtime',
            loadingPhase: 'default',
            entry: './src/runtime.ts'
        },
        {
            name: 'PhysicsEditor',
            type: 'editor',
            loadingPhase: 'default',
            entry: './src/editor/index.ts'
        }
    ],
    dependencies: [
        { id: '@esengine/ecs-framework', version: '^2.0.0' },
        { id: '@esengine/ecs-components', version: '^1.0.0' }
    ],
    icon: 'Atom'
};

/**
 * Physics 2D Plugin Loader
 * 2D 物理插件加载器
 *
 * - runtimeModule: 完整运行时模块（含 WASM 物理系统），支持编辑器预览和游戏运行
 * - editorModule: 编辑器功能模块（检视器、Gizmo、实体模板等）
 */
export const Physics2DPlugin: IPluginLoader = {
    descriptor,
    editorModule: new Physics2DEditorModule(),
    runtimeModule: new PhysicsRuntimeModule(),
};

export default Physics2DPlugin;
