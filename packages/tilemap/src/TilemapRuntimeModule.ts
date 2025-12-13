import type { IScene } from '@esengine/ecs-framework';
import { ComponentRegistry } from '@esengine/ecs-framework';
import type { IRuntimeModule, IRuntimePlugin, ModuleManifest, SystemContext } from '@esengine/engine-core';
import { AssetManagerToken } from '@esengine/asset-system';
import { RenderSystemToken } from '@esengine/ecs-engine-bindgen';
import { Physics2DWorldToken } from '@esengine/physics-rapier2d';

import { TilemapComponent } from './TilemapComponent';
import { TilemapRenderingSystem } from './systems/TilemapRenderingSystem';
import { TilemapCollider2DComponent } from './physics/TilemapCollider2DComponent';
import { TilemapPhysicsSystem } from './physics/TilemapPhysicsSystem';
import { TilemapLoader } from './loaders/TilemapLoader';
import { TilemapAssetType } from './constants';
import {
    TilemapSystemToken,
    TilemapPhysicsSystemToken
} from './tokens';

// 重新导出 tokens | Re-export tokens
export {
    TilemapSystemToken,
    TilemapPhysicsSystemToken
} from './tokens';

class TilemapRuntimeModule implements IRuntimeModule {
    private _tilemapPhysicsSystem: TilemapPhysicsSystem | null = null;
    private _loaderRegistered = false;

    registerComponents(registry: typeof ComponentRegistry): void {
        registry.register(TilemapComponent);
        registry.register(TilemapCollider2DComponent);
    }

    createSystems(scene: IScene, context: SystemContext): void {
        // 从服务注册表获取依赖 | Get dependencies from service registry
        const assetManager = context.services.get(AssetManagerToken);
        const renderSystem = context.services.get(RenderSystemToken);

        if (!this._loaderRegistered && assetManager) {
            assetManager.registerLoader(TilemapAssetType, new TilemapLoader());
            this._loaderRegistered = true;
        }

        const tilemapSystem = new TilemapRenderingSystem();
        scene.addSystem(tilemapSystem);

        if (renderSystem) {
            renderSystem.addRenderDataProvider(tilemapSystem);
        }

        this._tilemapPhysicsSystem = new TilemapPhysicsSystem();
        scene.addSystem(this._tilemapPhysicsSystem);

        // 注册服务到服务注册表 | Register services to service registry
        context.services.register(TilemapSystemToken, tilemapSystem);
        context.services.register(TilemapPhysicsSystemToken, this._tilemapPhysicsSystem);
    }

    onSystemsCreated(_scene: IScene, context: SystemContext): void {
        // 从服务注册表获取物理世界 | Get physics world from service registry
        const physics2DWorld = context.services.get(Physics2DWorldToken);

        if (this._tilemapPhysicsSystem && physics2DWorld) {
            this._tilemapPhysicsSystem.setPhysicsWorld(physics2DWorld);
        }
    }

    get tilemapPhysicsSystem(): TilemapPhysicsSystem | null {
        return this._tilemapPhysicsSystem;
    }
}

const manifest: ModuleManifest = {
    id: 'tilemap',
    name: '@esengine/tilemap',
    displayName: 'Tilemap 2D',
    version: '1.0.0',
    description: 'Tilemap system with Tiled editor support',
    category: 'Rendering',
    icon: 'Grid3X3',
    isCore: false,
    defaultEnabled: false,
    isEngineModule: true,
    canContainContent: true,
    dependencies: ['core', 'math', 'sprite', 'asset-system'],
    exports: { components: ['TilemapComponent', 'TilemapCollider2DComponent'] },
    editorPackage: '@esengine/tilemap-editor'
};

export const TilemapPlugin: IRuntimePlugin = {
    manifest,
    runtimeModule: new TilemapRuntimeModule()
};

export { TilemapRuntimeModule };
