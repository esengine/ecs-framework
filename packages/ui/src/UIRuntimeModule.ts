import type { IScene } from '@esengine/ecs-framework';
import { ComponentRegistry } from '@esengine/ecs-framework';
import type { IRuntimeModule, IPlugin, ModuleManifest, SystemContext } from '@esengine/engine-core';
import { EngineBridgeToken } from '@esengine/ecs-engine-bindgen';

import {
    UITransformComponent,
    UIRenderComponent,
    UIInteractableComponent,
    UITextComponent,
    UILayoutComponent,
    UIButtonComponent,
    UIProgressBarComponent,
    UISliderComponent,
    UIScrollViewComponent
} from './components';
import { UILayoutSystem } from './systems/UILayoutSystem';
import { UIInputSystem } from './systems/UIInputSystem';
import { UIAnimationSystem } from './systems/UIAnimationSystem';
import { UIRenderDataProvider } from './systems/UIRenderDataProvider';
import {
    UIRenderBeginSystem,
    UIRectRenderSystem,
    UITextRenderSystem,
    UIButtonRenderSystem,
    UIProgressBarRenderSystem,
    UISliderRenderSystem,
    UIScrollViewRenderSystem
} from './systems/render';
import {
    UILayoutSystemToken,
    UIInputSystemToken,
    UIRenderProviderToken,
    UITextRenderSystemToken
} from './tokens';

// 重新导出 tokens | Re-export tokens
export {
    UILayoutSystemToken,
    UIInputSystemToken,
    UIRenderProviderToken,
    UITextRenderSystemToken
} from './tokens';

class UIRuntimeModule implements IRuntimeModule {
    registerComponents(registry: typeof ComponentRegistry): void {
        registry.register(UITransformComponent);
        registry.register(UIRenderComponent);
        registry.register(UIInteractableComponent);
        registry.register(UITextComponent);
        registry.register(UILayoutComponent);
        registry.register(UIButtonComponent);
        registry.register(UIProgressBarComponent);
        registry.register(UISliderComponent);
        registry.register(UIScrollViewComponent);
    }

    createSystems(scene: IScene, context: SystemContext): void {
        // 从服务注册表获取依赖 | Get dependencies from service registry
        const engineBridge = context.services.get(EngineBridgeToken);

        const layoutSystem = new UILayoutSystem();
        scene.addSystem(layoutSystem);

        const animationSystem = new UIAnimationSystem();
        scene.addSystem(animationSystem);

        const renderBeginSystem = new UIRenderBeginSystem();
        scene.addSystem(renderBeginSystem);

        const rectRenderSystem = new UIRectRenderSystem();
        scene.addSystem(rectRenderSystem);

        const progressBarRenderSystem = new UIProgressBarRenderSystem();
        scene.addSystem(progressBarRenderSystem);

        const sliderRenderSystem = new UISliderRenderSystem();
        scene.addSystem(sliderRenderSystem);

        const scrollViewRenderSystem = new UIScrollViewRenderSystem();
        scene.addSystem(scrollViewRenderSystem);

        const buttonRenderSystem = new UIButtonRenderSystem();
        scene.addSystem(buttonRenderSystem);

        const textRenderSystem = new UITextRenderSystem();
        scene.addSystem(textRenderSystem);

        if (engineBridge) {
            textRenderSystem.setTextureCallback((id: number, dataUrl: string) => {
                engineBridge.loadTexture(id, dataUrl);
            });
        }

        const uiRenderProvider = new UIRenderDataProvider();
        const inputSystem = new UIInputSystem();
        inputSystem.setLayoutSystem(layoutSystem);
        scene.addSystem(inputSystem);

        // 注册服务到服务注册表 | Register services to service registry
        context.services.register(UILayoutSystemToken, layoutSystem);
        context.services.register(UIRenderProviderToken, uiRenderProvider);
        context.services.register(UIInputSystemToken, inputSystem);
        context.services.register(UITextRenderSystemToken, textRenderSystem);
    }
}

const manifest: ModuleManifest = {
    id: 'ui',
    name: '@esengine/ui',
    displayName: 'UI System',
    version: '1.0.0',
    description: 'ECS-based UI system',
    category: 'Rendering',
    icon: 'Layout',
    isCore: false,
    defaultEnabled: false,
    isEngineModule: true,
    canContainContent: true,
    dependencies: ['core', 'math'],
    exports: { components: ['UICanvasComponent'] },
    editorPackage: '@esengine/ui-editor'
};

export const UIPlugin: IPlugin = {
    manifest,
    runtimeModule: new UIRuntimeModule()
};

export { UIRuntimeModule };
