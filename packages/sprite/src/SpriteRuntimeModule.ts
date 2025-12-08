import type { ComponentRegistry as ComponentRegistryType, IScene } from '@esengine/esengine';
import type { IRuntimeModule, IPlugin, ModuleManifest, SystemContext } from '@esengine/engine-core';
import { SpriteComponent } from './SpriteComponent';
import { SpriteAnimatorComponent } from './SpriteAnimatorComponent';
import { SpriteAnimatorSystem } from './systems/SpriteAnimatorSystem';
import { SpriteAnimatorSystemToken } from './tokens';

export type { SystemContext, ModuleManifest, IRuntimeModule, IPlugin };

// 重新导出 tokens | Re-export tokens
export { SpriteAnimatorSystemToken } from './tokens';

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

        // 注册服务到服务注册表 | Register service to service registry
        context.services.register(SpriteAnimatorSystemToken, animatorSystem);
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
