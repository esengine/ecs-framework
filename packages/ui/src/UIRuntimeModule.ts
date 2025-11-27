/**
 * UI Runtime Module (Pure runtime, no editor dependencies)
 * UI 运行时模块（纯运行时，无编辑器依赖）
 */

import type { IScene } from '@esengine/ecs-framework';
import { ComponentRegistry } from '@esengine/ecs-framework';
import type { IRuntimeModuleLoader, SystemContext } from '@esengine/ecs-components';

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

/**
 * UI Runtime Module
 * UI 运行时模块
 */
export class UIRuntimeModule implements IRuntimeModuleLoader {
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
        const layoutSystem = new UILayoutSystem();
        scene.addSystem(layoutSystem);

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

        if (context.engineBridge) {
            textRenderSystem.setTextureCallback((id: number, dataUrl: string) => {
                context.engineBridge.loadTexture(id, dataUrl);
            });
        }

        const uiRenderProvider = new UIRenderDataProvider();
        const inputSystem = new UIInputSystem();
        scene.addSystem(inputSystem);

        context.uiLayoutSystem = layoutSystem;
        context.uiRenderProvider = uiRenderProvider;
        context.uiInputSystem = inputSystem;
        context.uiTextRenderSystem = textRenderSystem;
    }
}
