/**
 * Tilemap 统一插件
 * Tilemap Unified Plugin
 *
 * 整合运行时模块和编辑器模块
 * Integrates runtime and editor modules
 */

import type { IPluginLoader, PluginDescriptor } from '@esengine/editor-core';

// Runtime module
import { TilemapRuntimeModule } from '../TilemapRuntimeModule';

// Editor imports
import { TilemapEditorModule } from './index';

/**
 * 插件描述符
 */
const descriptor: PluginDescriptor = {
    id: '@esengine/tilemap',
    name: 'Tilemap System',
    version: '1.0.0',
    description: '瓦片地图系统，支持 Tiled 格式导入和高效渲染',
    category: 'rendering',
    enabledByDefault: true,
    canContainContent: true,
    isEnginePlugin: true,
    modules: [
        {
            name: 'TilemapRuntime',
            type: 'runtime',
            loadingPhase: 'default',
            entry: './src/index.ts'
        },
        {
            name: 'TilemapEditor',
            type: 'editor',
            loadingPhase: 'default',
            entry: './src/editor/index.ts'
        }
    ],
    dependencies: [
        { id: '@esengine/core', version: '^1.0.0' },
        { id: '@esengine/physics-rapier2d', version: '^1.0.0', optional: true }
    ],
    icon: 'Grid3X3'
};

/**
 * Tilemap 插件加载器
 * Tilemap plugin loader
 */
export const TilemapPlugin: IPluginLoader = {
    descriptor,
    runtimeModule: new TilemapRuntimeModule(),
    editorModule: new TilemapEditorModule(),
};

export default TilemapPlugin;
