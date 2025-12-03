import type { ComponentRegistry as ComponentRegistryType, IScene } from '@esengine/ecs-framework';
import type { IRuntimeModule, IPlugin, ModuleManifest, SystemContext } from '@esengine/engine-core';
import { SpriteComponent } from './SpriteComponent';
import { SpriteAnimatorComponent } from './SpriteAnimatorComponent';
import { SpriteAnimatorSystem } from './systems/SpriteAnimatorSystem';

export type { SystemContext, ModuleManifest, IRuntimeModule as IRuntimeModuleLoader, IPlugin as IPluginLoader };

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

const manifest: ModuleManifest = {
    id: 'sprite',
    name: '@esengine/sprite',
    displayName: 'Sprite 2D',
    version: '1.0.0',
    description: 'Sprite and SpriteAnimator components for 2D rendering',
    category: 'Rendering',
    icon: 'Image',
    isCore: false,
    defaultEnabled: true,
    isEngineModule: true,
    canContainContent: true,
    dependencies: ['core', 'math'],
    exports: { components: ['SpriteComponent', 'SpriteAnimatorComponent'] },
    editorPackage: '@esengine/sprite-editor',
    requiresWasm: true
};

export const SpritePlugin: IPlugin = {
    manifest,
    runtimeModule: new SpriteRuntimeModule()
};

export { SpriteRuntimeModule };
