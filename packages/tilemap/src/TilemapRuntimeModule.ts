/**
 * Tilemap Runtime Module (Pure runtime, no editor dependencies)
 * Tilemap 运行时模块（纯运行时，无编辑器依赖）
 */

import type { IScene } from '@esengine/ecs-framework';
import { ComponentRegistry } from '@esengine/ecs-framework';
import type { IRuntimeModuleLoader, SystemContext } from '@esengine/ecs-components';
import type { AssetManager } from '@esengine/asset-system';

import { TilemapComponent } from './TilemapComponent';
import { TilemapRenderingSystem } from './systems/TilemapRenderingSystem';
import { TilemapCollider2DComponent } from './physics/TilemapCollider2DComponent';
import { TilemapPhysicsSystem, type IPhysicsWorld } from './physics/TilemapPhysicsSystem';
import { TilemapLoader } from './loaders/TilemapLoader';
import { TilemapAssetType } from './index';

/**
 * Tilemap Runtime Module
 * Tilemap 运行时模块
 */
export class TilemapRuntimeModule implements IRuntimeModuleLoader {
    private _tilemapPhysicsSystem: TilemapPhysicsSystem | null = null;
    private _loaderRegistered = false;

    registerComponents(registry: typeof ComponentRegistry): void {
        registry.register(TilemapComponent);
        registry.register(TilemapCollider2DComponent);
    }

    createSystems(scene: IScene, context: SystemContext): void {
        // 注册 Tilemap 加载器到 AssetManager
        // Register tilemap loader to AssetManager
        const assetManager = context.assetManager as AssetManager | undefined;
        if (!this._loaderRegistered && assetManager) {
            assetManager.registerLoader(TilemapAssetType, new TilemapLoader());
            this._loaderRegistered = true;
        }

        // Tilemap rendering system
        const tilemapSystem = new TilemapRenderingSystem();
        scene.addSystem(tilemapSystem);

        if (context.renderSystem) {
            context.renderSystem.addRenderDataProvider(tilemapSystem);
        }

        context.tilemapSystem = tilemapSystem;

        // Tilemap physics system
        this._tilemapPhysicsSystem = new TilemapPhysicsSystem();
        scene.addSystem(this._tilemapPhysicsSystem);

        context.tilemapPhysicsSystem = this._tilemapPhysicsSystem;
    }

    /**
     * 所有系统创建完成后，连接跨插件依赖
     * Wire cross-plugin dependencies after all systems are created
     */
    onSystemsCreated(_scene: IScene, context: SystemContext): void {
        // 连接物理世界（如果物理插件已加载）
        // Connect physics world (if physics plugin is loaded)
        if (this._tilemapPhysicsSystem && context.physics2DWorld) {
            this._tilemapPhysicsSystem.setPhysicsWorld(context.physics2DWorld as IPhysicsWorld);
        }
    }

    /**
     * 获取 Tilemap 物理系统
     */
    get tilemapPhysicsSystem(): TilemapPhysicsSystem | null {
        return this._tilemapPhysicsSystem;
    }
}
