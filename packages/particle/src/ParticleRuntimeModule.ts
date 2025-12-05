import type { ComponentRegistry as ComponentRegistryType, IScene } from '@esengine/ecs-framework';
import type { IRuntimeModule, IPlugin, ModuleManifest, SystemContext } from '@esengine/engine-core';
import { ParticleSystemComponent } from './ParticleSystemComponent';
import { ParticleUpdateSystem } from './systems/ParticleSystem';

export type { SystemContext, ModuleManifest, IRuntimeModule as IRuntimeModuleLoader, IPlugin as IPluginLoader };

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
}

class ParticleRuntimeModule implements IRuntimeModule {
    private _updateSystem: ParticleUpdateSystem | null = null;

    registerComponents(registry: typeof ComponentRegistryType): void {
        registry.register(ParticleSystemComponent);
    }

    createSystems(scene: IScene, context: SystemContext): void {
        const particleContext = context as ParticleSystemContext;

        this._updateSystem = new ParticleUpdateSystem();

        // 设置 Transform 组件类型 | Set Transform component type
        if (particleContext.transformType) {
            this._updateSystem.setTransformType(particleContext.transformType);
        }

        // 在编辑器中禁用系统（手动控制）| Disable in editor (manual control)
        if (context.isEditor) {
            this._updateSystem.enabled = false;
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
    defaultEnabled: false,
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
