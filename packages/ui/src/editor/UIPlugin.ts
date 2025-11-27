/**
 * UI 统一插件
 * UI Unified Plugin
 */

import type { IScene, ServiceContainer } from '@esengine/ecs-framework';
import { ComponentRegistry } from '@esengine/ecs-framework';
import type {
    IPluginLoader,
    IRuntimeModuleLoader,
    PluginDescriptor,
    SystemContext
} from '@esengine/editor-core';

// Editor imports
import { UIEditorModule } from './index';

// Runtime imports
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
} from '../components';
import { UILayoutSystem } from '../systems/UILayoutSystem';
import { UIInputSystem } from '../systems/UIInputSystem';
import { UIRenderDataProvider } from '../systems/UIRenderDataProvider';
// Render systems
import {
    UIRenderBeginSystem,
    UIRectRenderSystem,
    UITextRenderSystem,
    UIButtonRenderSystem,
    UIProgressBarRenderSystem,
    UISliderRenderSystem,
    UIScrollViewRenderSystem
} from '../systems/render';

/**
 * 插件描述符
 */
const descriptor: PluginDescriptor = {
    id: '@esengine/ui',
    name: 'UI System',
    version: '1.0.0',
    description: '游戏 UI 系统，支持布局、交互、动画等',
    category: 'ui',
    enabledByDefault: true,
    canContainContent: false,
    isEnginePlugin: true,
    modules: [
        {
            name: 'UIRuntime',
            type: 'runtime',
            loadingPhase: 'default',
            entry: './src/index.ts'
        },
        {
            name: 'UIEditor',
            type: 'editor',
            loadingPhase: 'default',
            entry: './src/editor/index.ts'
        }
    ],
    dependencies: [
        { id: '@esengine/core', version: '^1.0.0' }
    ],
    icon: 'LayoutGrid'
};

/**
 * UI 运行时模块
 * UI runtime module
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
        // UI Layout System (order: 50)
        const layoutSystem = new UILayoutSystem();
        scene.addSystem(layoutSystem);

        // UI Render Begin System - clears collector at start of frame (order: 99)
        const renderBeginSystem = new UIRenderBeginSystem();
        scene.addSystem(renderBeginSystem);

        // UI Render Systems - collect render data (order: 100-120)
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

        // Set up text texture callback to register textures with engine
        // 设置文本纹理回调以将纹理注册到引擎
        if (context.engineBridge) {
            textRenderSystem.setTextureCallback((id: number, dataUrl: string) => {
                // Load data URL as texture
                context.engineBridge.loadTexture(id, dataUrl);
            });
        }

        // UI Render Data Provider (not a system, just a provider)
        // Note: Don't call addRenderDataProvider here - UI provider should be set via
        // setUIRenderDataProvider for proper preview mode support
        // 注意：不要在这里调用 addRenderDataProvider - UI 提供者应该通过
        // setUIRenderDataProvider 设置以支持预览模式
        const uiRenderProvider = new UIRenderDataProvider();

        // UI Input System
        const inputSystem = new UIInputSystem();
        scene.addSystem(inputSystem);

        // 保存引用 | Save references
        context.uiLayoutSystem = layoutSystem;
        context.uiRenderProvider = uiRenderProvider;
        context.uiInputSystem = inputSystem;
        context.uiTextRenderSystem = textRenderSystem;
    }
}

/**
 * UI 插件加载器
 * UI plugin loader
 */
export const UIPlugin: IPluginLoader = {
    descriptor,
    runtimeModule: new UIRuntimeModule(),
    editorModule: new UIEditorModule(),
};

export default UIPlugin;
