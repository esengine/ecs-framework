/**
 * Tilemap 统一插件
 * Tilemap Unified Plugin
 *
 * 整合运行时模块和编辑器模块
 * Integrates runtime and editor modules
 */

import type { Scene, ServiceContainer } from '@esengine/ecs-framework';
import { ComponentRegistry } from '@esengine/ecs-framework';
import type {
    IPluginLoader,
    IRuntimeModuleLoader,
    PluginDescriptor,
    SystemContext
} from '@esengine/editor-core';

// Runtime imports
import { TilemapComponent } from '../TilemapComponent';
import { TilemapRenderingSystem } from '../systems/TilemapRenderingSystem';

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
        { id: '@esengine/core', version: '^1.0.0' }
    ],
    icon: 'Grid3X3'
};

/**
 * Tilemap 运行时模块
 * Tilemap runtime module
 */
export class TilemapRuntimeModule implements IRuntimeModuleLoader {
    registerComponents(registry: typeof ComponentRegistry): void {
        registry.register(TilemapComponent);
    }

    createSystems(scene: Scene, context: SystemContext): void {
        const tilemapSystem = new TilemapRenderingSystem();
        scene.addSystem(tilemapSystem);

        if (context.renderSystem) {
            context.renderSystem.addRenderDataProvider(tilemapSystem);
        }

        // 保存引用供其他系统使用 | Save reference for other systems
        context.tilemapSystem = tilemapSystem;
    }
}

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
