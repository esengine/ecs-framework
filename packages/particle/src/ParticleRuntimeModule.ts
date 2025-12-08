import type { ComponentRegistry as ComponentRegistryType, IScene } from '@esengine/ecs-framework';
import type { IRuntimeModule, IPlugin, ModuleManifest, SystemContext } from '@esengine/engine-core';
import { assetManager as globalAssetManager, type AssetManager } from '@esengine/asset-system';
import { ParticleSystemComponent } from './ParticleSystemComponent';
import { ParticleUpdateSystem } from './systems/ParticleSystem';
import { ParticleLoader, ParticleAssetType } from './loaders/ParticleLoader';
import type { IPhysics2DQuery } from './modules/Physics2DCollisionModule';

export type { SystemContext, ModuleManifest, IRuntimeModule as IRuntimeModuleLoader, IPlugin as IPluginLoader };

/**
 * 引擎桥接接口（用于直接加载纹理）
 * Engine bridge interface (for direct texture loading)
 */
export interface IEngineBridge {
    loadTexture(id: number, url: string): Promise<void>;
}

/**
 * 引擎集成接口（用于加载纹理）
 * Engine integration interface (for loading textures)
 */
export interface IEngineIntegration {
    loadTextureForComponent(texturePath: string): Promise<number>;
}

/**
 * 粒子系统上下文
 * Particle system context
 */
export interface ParticleSystemContext extends SystemContext {
    particleUpdateSystem?: ParticleUpdateSystem;
    /** Transform 组件类型 | Transform component type */
    transformType?: new (...args: any[]) => any;
    /** 渲染系统（用于注册渲染数据提供者）| Render system (for registering render data provider) */
    renderSystem?: {
        addRenderDataProvider(provider: any): void;
        removeRenderDataProvider(provider: any): void;
    };
    /** 引擎集成（用于加载纹理）| Engine integration (for loading textures) */
    engineIntegration?: IEngineIntegration;
    /** 引擎桥接（用于直接加载纹理）| Engine bridge (for direct texture loading) */
    engineBridge?: IEngineBridge;
    /** 资产管理器（用于注册加载器）| Asset manager (for registering loaders) */
    assetManager?: AssetManager;
    /**
     * 2D 物理查询接口（可选）
     * 2D Physics query interface (optional)
     *
     * 如果提供，将自动注入到使用 Physics2DCollisionModule 的粒子系统中。
     * 通常传入 Physics2DService 实例。
     *
     * If provided, will be auto-injected into particle systems using Physics2DCollisionModule.
     * Typically pass a Physics2DService instance.
     */
    physics2DQuery?: IPhysics2DQuery;
}

class ParticleRuntimeModule implements IRuntimeModule {
    private _updateSystem: ParticleUpdateSystem | null = null;
    private _loaderRegistered = false;

    registerComponents(registry: typeof ComponentRegistryType): void {
        registry.register(ParticleSystemComponent);
    }

    createSystems(scene: IScene, context: SystemContext): void {
        const particleContext = context as ParticleSystemContext;

        // 注册粒子资产加载器到上下文的 assetManager 和全局单例
        // Register particle asset loader to context assetManager AND global singleton
        if (!this._loaderRegistered) {
            const loader = new ParticleLoader();

            // Register to context's assetManager (used by GameRuntime)
            if (particleContext.assetManager) {
                particleContext.assetManager.registerLoader(ParticleAssetType as any, loader);
            }

            // Also register to global singleton (used by ParticleSystemComponent.loadAsset)
            // 同时注册到全局单例（ParticleSystemComponent.loadAsset 使用的是全局单例）
            globalAssetManager.registerLoader(ParticleAssetType as any, loader);

            this._loaderRegistered = true;
            console.log('[ParticleRuntimeModule] Registered ParticleLoader to both context and global assetManager');
        }

        this._updateSystem = new ParticleUpdateSystem();

        // 设置 Transform 组件类型 | Set Transform component type
        if (particleContext.transformType) {
            this._updateSystem.setTransformType(particleContext.transformType);
        }

        // 设置引擎集成（用于加载纹理）| Set engine integration (for loading textures)
        if (particleContext.engineIntegration) {
            this._updateSystem.setEngineIntegration(particleContext.engineIntegration);
        }

        // 设置引擎桥接（用于加载默认纹理）| Set engine bridge (for loading default texture)
        if (particleContext.engineBridge) {
            this._updateSystem.setEngineBridge(particleContext.engineBridge);
        }

        // 设置 2D 物理查询（用于粒子与场景碰撞）| Set 2D physics query (for particle-scene collision)
        if (particleContext.physics2DQuery) {
            this._updateSystem.setPhysics2DQuery(particleContext.physics2DQuery);
        }

        scene.addSystem(this._updateSystem);
        particleContext.particleUpdateSystem = this._updateSystem;

        // 注册渲染数据提供者 | Register render data provider
        if (particleContext.renderSystem) {
            const renderDataProvider = this._updateSystem.getRenderDataProvider();
            particleContext.renderSystem.addRenderDataProvider(renderDataProvider);
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
    exports: { components: ['ParticleSystemComponent'] },
    editorPackage: '@esengine/particle-editor',
    requiresWasm: false
};

export const ParticlePlugin: IPlugin = {
    manifest,
    runtimeModule: new ParticleRuntimeModule()
};

export { ParticleRuntimeModule };
