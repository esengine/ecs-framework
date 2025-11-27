/**
 * Tilemap Module Loader
 * 瓦片地图模块加载器
 *
 * 实现 IModuleLoader 接口，用于 ModuleRegistry
 */

import type { IModuleLoader, ModuleDescriptor, ModuleSystemContext } from '@esengine/ecs-framework';
import type { ComponentRegistry as ComponentRegistryType } from '@esengine/ecs-framework';
import type { Scene } from '@esengine/ecs-framework';

// Components
import { TilemapComponent } from './TilemapComponent';

// Systems
import { TilemapRenderingSystem } from './systems/TilemapRenderingSystem';

/**
 * Tilemap 模块描述
 */
const descriptor: ModuleDescriptor = {
    id: 'esengine.tilemap',
    name: 'Tilemap System',
    description: '瓦片地图系统，支持 Tiled 格式',
    category: 'rendering',
    version: '1.0.0',
    dependencies: ['esengine.core'],
    isCore: false,
    icon: 'Grid3X3'
};

/**
 * Tilemap 模块加载器
 */
export const TilemapModule: IModuleLoader = {
    descriptor,

    registerComponents(registry: typeof ComponentRegistryType): void {
        registry.register(TilemapComponent);
    },

    createSystems(scene: Scene, context: ModuleSystemContext): void {
        const tilemapSystem = new TilemapRenderingSystem();
        scene.addSystem(tilemapSystem);

        if (context.renderSystem) {
            context.renderSystem.addRenderDataProvider(tilemapSystem);
        }

        context.tilemapSystem = tilemapSystem;
    }
};

export default TilemapModule;
