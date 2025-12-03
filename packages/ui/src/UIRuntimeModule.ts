import type { IScene } from '@esengine/ecs-framework';
import { ComponentRegistry } from '@esengine/ecs-framework';
import type { IRuntimeModule, IPlugin, ModuleManifest, SystemContext } from '@esengine/engine-core';

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

export interface UISystemContext extends SystemContext {
    uiLayoutSystem?: UILayoutSystem;
    uiRenderProvider?: UIRenderDataProvider;
    uiInputSystem?: UIInputSystem;
    uiTextRenderSystem?: UITextRenderSystem;
}

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
        const uiContext = context as UISystemContext;

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

        if (uiContext.engineBridge) {
            textRenderSystem.setTextureCallback((id: number, dataUrl: string) => {
                uiContext.engineBridge.loadTexture(id, dataUrl);
            });
        }

        const uiRenderProvider = new UIRenderDataProvider();
        const inputSystem = new UIInputSystem();
        inputSystem.setLayoutSystem(layoutSystem);
        scene.addSystem(inputSystem);

        uiContext.uiLayoutSystem = layoutSystem;
        uiContext.uiRenderProvider = uiRenderProvider;
        uiContext.uiInputSystem = inputSystem;
        uiContext.uiTextRenderSystem = textRenderSystem;
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
