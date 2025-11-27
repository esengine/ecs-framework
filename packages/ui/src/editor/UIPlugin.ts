/**
 * UI 统一插件
 * UI Unified Plugin
 */

import type { Scene, ServiceContainer } from '@esengine/ecs-framework';
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

    createSystems(scene: Scene, context: SystemContext): void {
        // UI Layout System
        const layoutSystem = new UILayoutSystem();
        scene.addSystem(layoutSystem);

        // UI Render Data Provider (not a system, just a provider)
        const uiRenderProvider = new UIRenderDataProvider();
        if (context.renderSystem) {
            context.renderSystem.addRenderDataProvider(uiRenderProvider);
        }

        // UI Input System
        const inputSystem = new UIInputSystem();
        scene.addSystem(inputSystem);

        // 保存引用 | Save references
        context.uiLayoutSystem = layoutSystem;
        context.uiRenderProvider = uiRenderProvider;
        context.uiInputSystem = inputSystem;
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
