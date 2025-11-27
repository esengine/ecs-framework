/**
 * UI Module Loader
 * UI 模块加载器
 *
 * 实现 IModuleLoader 接口，用于 ModuleRegistry
 */

import type { IModuleLoader, ModuleDescriptor, ModuleSystemContext } from '@esengine/ecs-framework';
import type { ComponentRegistry as ComponentRegistryType } from '@esengine/ecs-framework';
import type { Scene } from '@esengine/ecs-framework';

// Components
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

// Systems
import { UILayoutSystem } from './systems/UILayoutSystem';
import { UIInputSystem } from './systems/UIInputSystem';
import { UIRenderDataProvider } from './systems/UIRenderDataProvider';

// Render Systems
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
 * UI 模块描述
 */
const descriptor: ModuleDescriptor = {
    id: 'esengine.ui',
    name: 'UI System',
    description: 'ECS UI 系统，支持布局、交互、动画',
    category: 'ui',
    version: '1.0.0',
    dependencies: ['esengine.core'],
    isCore: false,
    icon: 'LayoutGrid'
};

/**
 * UI 模块加载器
 */
export const UIModule: IModuleLoader = {
    descriptor,

    registerComponents(registry: typeof ComponentRegistryType): void {
        registry.register(UITransformComponent);
        registry.register(UIRenderComponent);
        registry.register(UIInteractableComponent);
        registry.register(UITextComponent);
        registry.register(UILayoutComponent);
        registry.register(UIButtonComponent);
        registry.register(UIProgressBarComponent);
        registry.register(UISliderComponent);
        registry.register(UIScrollViewComponent);
    },

    createSystems(scene: Scene, context: ModuleSystemContext): void {
        // UI Layout System (runs first to compute positions)
        const layoutSystem = new UILayoutSystem();
        scene.addSystem(layoutSystem);

        // UI Input System
        const inputSystem = new UIInputSystem();
        scene.addSystem(inputSystem);

        // UI Render Systems (ECS-compliant, each handles one component type)
        // Order: 99-120, runs before EngineRenderSystem (order: 1000)
        const renderBeginSystem = new UIRenderBeginSystem();  // order: 99, clears collector
        const rectRenderSystem = new UIRectRenderSystem();     // order: 100
        const progressBarRenderSystem = new UIProgressBarRenderSystem(); // order: 110
        const sliderRenderSystem = new UISliderRenderSystem(); // order: 111
        const scrollViewRenderSystem = new UIScrollViewRenderSystem(); // order: 112
        const buttonRenderSystem = new UIButtonRenderSystem(); // order: 113
        const textRenderSystem = new UITextRenderSystem();     // order: 120

        scene.addSystem(renderBeginSystem);
        scene.addSystem(rectRenderSystem);
        scene.addSystem(progressBarRenderSystem);
        scene.addSystem(sliderRenderSystem);
        scene.addSystem(scrollViewRenderSystem);
        scene.addSystem(buttonRenderSystem);
        scene.addSystem(textRenderSystem);

        // UI Render Data Provider (facade for EngineRenderSystem)
        const uiRenderProvider = new UIRenderDataProvider();
        if (context.renderSystem) {
            context.renderSystem.addRenderDataProvider(uiRenderProvider);
        }

        // 设置纹理回调，用于加载动态生成的文本纹理
        if (context.engineBridge) {
            const bridge = context.engineBridge;
            textRenderSystem.setTextureCallback((id, dataUrl) => {
                bridge.loadTexture(id, dataUrl);
            });
        }

        // 保存引用
        context.uiRenderProvider = uiRenderProvider;
    }
};

export default UIModule;
