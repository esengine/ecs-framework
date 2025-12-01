import type { IScene } from '@esengine/ecs-framework';
import { ComponentRegistry } from '@esengine/ecs-framework';
import type { IRuntimeModule, IPlugin, PluginDescriptor, SystemContext } from '@esengine/engine-core';
import type { AssetManager } from '@esengine/asset-system';

import { TilemapComponent } from './TilemapComponent';
import { TilemapRenderingSystem } from './systems/TilemapRenderingSystem';
import { TilemapCollider2DComponent } from './physics/TilemapCollider2DComponent';
import { TilemapPhysicsSystem, type IPhysicsWorld } from './physics/TilemapPhysicsSystem';
import { TilemapLoader } from './loaders/TilemapLoader';
import { TilemapAssetType } from './constants';

export interface TilemapSystemContext extends SystemContext {
    tilemapSystem?: TilemapRenderingSystem;
    tilemapPhysicsSystem?: TilemapPhysicsSystem;
    physics2DWorld?: IPhysicsWorld;
    assetManager?: AssetManager;
    renderSystem?: any;
}

class TilemapRuntimeModule implements IRuntimeModule {
    private _tilemapPhysicsSystem: TilemapPhysicsSystem | null = null;
    private _loaderRegistered = false;

    registerComponents(registry: typeof ComponentRegistry): void {
        registry.register(TilemapComponent);
        registry.register(TilemapCollider2DComponent);
    }

    createSystems(scene: IScene, context: SystemContext): void {
        const tilemapContext = context as TilemapSystemContext;

        if (!this._loaderRegistered && tilemapContext.assetManager) {
            tilemapContext.assetManager.registerLoader(TilemapAssetType, new TilemapLoader());
            this._loaderRegistered = true;
        }

        const tilemapSystem = new TilemapRenderingSystem();
        scene.addSystem(tilemapSystem);

        if (tilemapContext.renderSystem) {
            tilemapContext.renderSystem.addRenderDataProvider(tilemapSystem);
        }

        tilemapContext.tilemapSystem = tilemapSystem;

        this._tilemapPhysicsSystem = new TilemapPhysicsSystem();
        scene.addSystem(this._tilemapPhysicsSystem);

        tilemapContext.tilemapPhysicsSystem = this._tilemapPhysicsSystem;
    }

    onSystemsCreated(_scene: IScene, context: SystemContext): void {
        const tilemapContext = context as TilemapSystemContext;

        if (this._tilemapPhysicsSystem && tilemapContext.physics2DWorld) {
            this._tilemapPhysicsSystem.setPhysicsWorld(tilemapContext.physics2DWorld);
        }
    }

    get tilemapPhysicsSystem(): TilemapPhysicsSystem | null {
        return this._tilemapPhysicsSystem;
    }
}

const descriptor: PluginDescriptor = {
    id: '@esengine/tilemap',
    name: 'Tilemap',
    version: '1.0.0',
    description: 'Tilemap system with Tiled editor support',
    category: 'tilemap',
    enabledByDefault: false,
    isEnginePlugin: true
};

export const TilemapPlugin: IPlugin = {
    descriptor,
    runtimeModule: new TilemapRuntimeModule()
};

export { TilemapRuntimeModule };
