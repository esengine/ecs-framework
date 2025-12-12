import type { ComponentRegistry as ComponentRegistryType, IScene } from '@esengine/ecs-framework';
import type { IRuntimeModule, IPlugin, ModuleManifest, SystemContext } from '@esengine/engine-core';
import { TransformTypeToken, CanvasElementToken } from '@esengine/engine-core';
import { AssetManagerToken } from '@esengine/asset-system';
import { RenderSystemToken, EngineBridgeToken, EngineIntegrationToken } from '@esengine/ecs-engine-bindgen';
import { Physics2DQueryToken } from '@esengine/physics-rapier2d';
import { assetManager as globalAssetManager } from '@esengine/asset-system';
import { ParticleSystemComponent } from './ParticleSystemComponent';
import { ClickFxComponent } from './ClickFxComponent';
import { ParticleUpdateSystem } from './systems/ParticleSystem';
import { ClickFxSystem } from './systems/ClickFxSystem';
import { ParticleLoader, ParticleAssetType } from './loaders/ParticleLoader';
import { ParticleUpdateSystemToken } from './tokens';

export type { SystemContext, ModuleManifest, IRuntimeModule, IPlugin };

// 重新导出 tokens | Re-export tokens
export { ParticleUpdateSystemToken } from './tokens';

class ParticleRuntimeModule implements IRuntimeModule {
    private _updateSystem: ParticleUpdateSystem | null = null;
    private _loaderRegistered = false;

    registerComponents(registry: typeof ComponentRegistryType): void {
        registry.register(ParticleSystemComponent);
        registry.register(ClickFxComponent);
    }

    createSystems(scene: IScene, context: SystemContext): void {
        // 从服务注册表获取依赖 | Get dependencies from service registry
        const assetManager = context.services.get(AssetManagerToken);
        const transformType = context.services.get(TransformTypeToken);
        const engineIntegration = context.services.get(EngineIntegrationToken);
        const engineBridge = context.services.get(EngineBridgeToken);
        const physics2DQuery = context.services.get(Physics2DQueryToken);
        const renderSystem = context.services.get(RenderSystemToken);

        // 注册粒子资产加载器到上下文的 assetManager 和全局单例
        // Register particle asset loader to context assetManager AND global singleton
        if (!this._loaderRegistered) {
            const loader = new ParticleLoader();

            // Register to context's assetManager (used by GameRuntime)
            if (assetManager) {
                assetManager.registerLoader(ParticleAssetType, loader);
            }

            // Also register to global singleton (used by ParticleSystemComponent.loadAsset)
            // 同时注册到全局单例（ParticleSystemComponent.loadAsset 使用的是全局单例）
            globalAssetManager.registerLoader(ParticleAssetType, loader);

            this._loaderRegistered = true;
            console.log('[ParticleRuntimeModule] Registered ParticleLoader to both context and global assetManager');
        }

        this._updateSystem = new ParticleUpdateSystem();

        // 设置 Transform 组件类型 | Set Transform component type
        if (transformType) {
            this._updateSystem.setTransformType(transformType);
        }

        // 设置引擎集成（用于加载纹理）| Set engine integration (for loading textures)
        if (engineIntegration) {
            this._updateSystem.setEngineIntegration(engineIntegration);
        }

        // 设置引擎桥接（用于加载默认纹理）| Set engine bridge (for loading default texture)
        if (engineBridge) {
            this._updateSystem.setEngineBridge(engineBridge);
        }

        // 设置 2D 物理查询（用于粒子与场景碰撞）| Set 2D physics query (for particle-scene collision)
        if (physics2DQuery) {
            this._updateSystem.setPhysics2DQuery(physics2DQuery);
        }

        scene.addSystem(this._updateSystem);

        // 添加点击特效系统 | Add click FX system
        const clickFxSystem = new ClickFxSystem();

        // 设置 EngineBridge（用于屏幕坐标转世界坐标）
        // Set EngineBridge (for screen to world coordinate conversion)
        if (engineBridge) {
            clickFxSystem.setEngineBridge(engineBridge);
        }

        // 从服务注册表获取 Canvas 元素（用于计算相对坐标）
        // Get canvas element from service registry (for calculating relative coordinates)
        const canvas = context.services.get(CanvasElementToken);
        if (canvas) {
            clickFxSystem.setCanvas(canvas);
        }

        scene.addSystem(clickFxSystem);

        // 注册粒子更新系统到服务注册表 | Register particle update system to service registry
        context.services.register(ParticleUpdateSystemToken, this._updateSystem);

        // 注册渲染数据提供者 | Register render data provider
        if (renderSystem) {
            const renderDataProvider = this._updateSystem.getRenderDataProvider();
            renderSystem.addRenderDataProvider(renderDataProvider);
        }
    }

    /**
     * 获取粒子更新系统
     * Get particle update system
     */
    get updateSystem(): ParticleUpdateSystem | null {
        return this._updateSystem;
    }
}

const manifest: ModuleManifest = {
    id: 'particle',
    name: '@esengine/particle',
    displayName: 'Particle System',
    version: '1.0.0',
    description: 'Particle system for 2D effects',
    category: 'Rendering',
    icon: 'Sparkles',
    isCore: false,
    defaultEnabled: true,
    isEngineModule: true,
    canContainContent: true,
    dependencies: ['core', 'math', 'sprite'],
    exports: { components: ['ParticleSystemComponent', 'ClickFxComponent'] },
    editorPackage: '@esengine/particle-editor',
    requiresWasm: false
};

export const ParticlePlugin: IPlugin = {
    manifest,
    runtimeModule: new ParticleRuntimeModule()
};

export { ParticleRuntimeModule };
