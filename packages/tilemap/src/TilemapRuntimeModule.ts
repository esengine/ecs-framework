/**
 * Tilemap Runtime Module (Pure runtime, no editor dependencies)
 * Tilemap 运行时模块（纯运行时，无编辑器依赖）
 */

import type { IScene } from '@esengine/ecs-framework';
import { ComponentRegistry } from '@esengine/ecs-framework';
import type { IRuntimeModuleLoader, SystemContext } from '@esengine/ecs-components';

import { TilemapComponent } from './TilemapComponent';
import { TilemapRenderingSystem } from './systems/TilemapRenderingSystem';

/**
 * Tilemap Runtime Module
 * Tilemap 运行时模块
 */
export class TilemapRuntimeModule implements IRuntimeModuleLoader {
    registerComponents(registry: typeof ComponentRegistry): void {
        registry.register(TilemapComponent);
    }

    createSystems(scene: IScene, context: SystemContext): void {
        const tilemapSystem = new TilemapRenderingSystem();
        scene.addSystem(tilemapSystem);

        if (context.renderSystem) {
            context.renderSystem.addRenderDataProvider(tilemapSystem);
        }

        context.tilemapSystem = tilemapSystem;
    }
}
