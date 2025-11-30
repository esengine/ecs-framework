import type { ComponentRegistry as ComponentRegistryType, IScene } from '@esengine/ecs-framework';
import type { IRuntimeModule, IPlugin, PluginDescriptor, SystemContext } from '@esengine/engine-core';
import { SpriteComponent } from './SpriteComponent';
import { SpriteAnimatorComponent } from './SpriteAnimatorComponent';
import { SpriteAnimatorSystem } from './systems/SpriteAnimatorSystem';

export type { SystemContext, PluginDescriptor, IRuntimeModule as IRuntimeModuleLoader, IPlugin as IPluginLoader };

class SpriteRuntimeModule implements IRuntimeModule {
    registerComponents(registry: typeof ComponentRegistryType): void {
        registry.register(SpriteComponent);
        registry.register(SpriteAnimatorComponent);
    }

    createSystems(scene: IScene, context: SystemContext): void {
        const animatorSystem = new SpriteAnimatorSystem();

        if (context.isEditor) {
            animatorSystem.enabled = false;
        }

        scene.addSystem(animatorSystem);
        (context as any).animatorSystem = animatorSystem;
    }
}

const descriptor: PluginDescriptor = {
    id: '@esengine/sprite',
    name: 'Sprite Components',
    version: '1.0.0',
    description: 'Sprite and SpriteAnimator components for 2D rendering',
    category: 'rendering',
    enabledByDefault: true,
    isEnginePlugin: true
};

export const SpritePlugin: IPlugin = {
    descriptor,
    runtimeModule: new SpriteRuntimeModule()
};

export { SpriteRuntimeModule };
