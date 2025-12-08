/**
 * @esengine/ui-editor
 *
 * Editor support for @esengine/ui - inspectors, gizmos, and entity templates
 * UI 编辑器支持 - 检视器、Gizmo 和实体模板
 */

import type { ServiceContainer, Entity } from '@esengine/ecs-framework';
import { Core } from '@esengine/ecs-framework';
import type {
    IEditorModuleLoader,
    EntityCreationTemplate
} from '@esengine/editor-core';
import {
    EntityStoreService,
    MessageHub,
    ComponentRegistry,
    ComponentInspectorRegistry
} from '@esengine/editor-core';

// Runtime imports from @esengine/ui
import {
    UITransformComponent,
    UIRenderComponent,
    UIInteractableComponent,
    UITextComponent,
    UILayoutComponent,
    UILayoutType,
    UIJustifyContent,
    UIAlignItems,
    UIButtonComponent,
    UIProgressBarComponent,
    UISliderComponent,
    UIScrollViewComponent
} from '@esengine/ui';
import { UITransformInspector } from './inspectors';
import { registerUITransformGizmo, unregisterUITransformGizmo } from './gizmos';

// Re-exports
export { UITransformInspector } from './inspectors';
export { registerUITransformGizmo, unregisterUITransformGizmo } from './gizmos';

/**
 * UI 编辑器模块
 * UI Editor Module
 */
export class UIEditorModule implements IEditorModuleLoader {
    async install(services: ServiceContainer): Promise<void> {
        // 注册 UI 组件到编辑器组件注册表 | Register UI components to editor component registry
        const componentRegistry = services.resolve(ComponentRegistry);
        if (componentRegistry) {
            const uiComponents = [
                { name: 'UITransform', type: UITransformComponent, category: 'components.category.ui', description: 'UI element positioning and sizing', icon: 'Move' },
                { name: 'UIRender', type: UIRenderComponent, category: 'components.category.ui', description: 'UI element visual appearance', icon: 'Palette' },
                { name: 'UIInteractable', type: UIInteractableComponent, category: 'components.category.ui', description: 'UI element interaction handling', icon: 'MousePointer2' },
                { name: 'UIText', type: UITextComponent, category: 'components.category.ui', description: 'Text rendering component', icon: 'Type' },
                { name: 'UILayout', type: UILayoutComponent, category: 'components.category.ui', description: 'Automatic child layout (Flexbox-like)', icon: 'LayoutGrid' },
                { name: 'UIButton', type: UIButtonComponent, category: 'components.category.ui.widgets', description: 'Interactive button component', icon: 'RectangleHorizontal' },
                { name: 'UIProgressBar', type: UIProgressBarComponent, category: 'components.category.ui.widgets', description: 'Progress indicator component', icon: 'BarChart3' },
                { name: 'UISlider', type: UISliderComponent, category: 'components.category.ui.widgets', description: 'Value slider component', icon: 'Sliders' },
                { name: 'UIScrollView', type: UIScrollViewComponent, category: 'components.category.ui.widgets', description: 'Scrollable container component', icon: 'ScrollText' },
            ];

            for (const comp of uiComponents) {
                componentRegistry.register({
                    name: comp.name,
                    type: comp.type,
                    category: comp.category,
                    description: comp.description,
                    icon: comp.icon
                });
            }
        }

        // 注册自定义组件检视器 | Register custom component inspectors
        const componentInspectorRegistry = services.tryResolve(ComponentInspectorRegistry);
        if (componentInspectorRegistry) {
            componentInspectorRegistry.register(new UITransformInspector());
        }

        // 注册 Gizmo | Register gizmo
        registerUITransformGizmo();
    }

    async uninstall(): Promise<void> {
        unregisterUITransformGizmo();
    }

    getEntityCreationTemplates(): EntityCreationTemplate[] {
        return [
            // UI Canvas (Root container)
            {
                id: 'create-ui-canvas',
                label: 'UI Canvas',
                icon: 'PanelTop',
                category: 'ui',
                order: 200,
                create: (): number => {
                    return this.createUIEntity('UI Canvas', (entity) => {
                        const transform = entity.getComponent(UITransformComponent)!;
                        transform.width = 1920;
                        transform.height = 1080;
                        transform.anchorMinX = 0;
                        transform.anchorMinY = 0;
                        transform.anchorMaxX = 1;
                        transform.anchorMaxY = 1;
                    });
                }
            },

            // UI Panel
            {
                id: 'create-ui-panel',
                label: 'Panel',
                icon: 'Square',
                category: 'ui',
                order: 201,
                create: (): number => {
                    return this.createUIEntity('Panel', (entity) => {
                        const render = entity.getComponent(UIRenderComponent)!;
                        render.backgroundColor = 0x2D2D2D;
                        render.backgroundAlpha = 0.9;
                        render.setCornerRadius(8);
                    });
                }
            },

            // UI Text
            {
                id: 'create-ui-text',
                label: 'Text',
                icon: 'Type',
                category: 'ui',
                order: 202,
                create: (): number => {
                    return this.createUIEntity('Text', (entity) => {
                        const transform = entity.getComponent(UITransformComponent)!;
                        transform.width = 200;
                        transform.height = 30;

                        const render = entity.getComponent(UIRenderComponent)!;
                        render.backgroundAlpha = 0;

                        const text = new UITextComponent();
                        text.text = 'Hello World';
                        text.fontSize = 16;
                        text.color = 0xFFFFFF;
                        entity.addComponent(text);
                    });
                }
            },

            // UI Button
            {
                id: 'create-ui-button',
                label: 'Button',
                icon: 'MousePointer2',
                category: 'ui',
                order: 203,
                create: (): number => {
                    return this.createUIEntity('Button', (entity) => {
                        const transform = entity.getComponent(UITransformComponent)!;
                        transform.width = 120;
                        transform.height = 40;

                        const render = entity.getComponent(UIRenderComponent)!;
                        render.setCornerRadius(4);

                        const button = new UIButtonComponent();
                        button.label = 'Button';
                        entity.addComponent(button);

                        const interactable = entity.getComponent(UIInteractableComponent)!;
                        interactable.enabled = true;
                        interactable.cursor = 'pointer';

                        const text = new UITextComponent();
                        text.text = 'Button';
                        text.fontSize = 14;
                        text.color = 0xFFFFFF;
                        text.align = 'center';
                        text.verticalAlign = 'middle';
                        entity.addComponent(text);
                    });
                }
            },

            // UI Slider
            {
                id: 'create-ui-slider',
                label: 'Slider',
                icon: 'Sliders',
                category: 'ui',
                order: 204,
                create: (): number => {
                    return this.createUIEntity('Slider', (entity) => {
                        const transform = entity.getComponent(UITransformComponent)!;
                        transform.width = 200;
                        transform.height = 20;

                        const render = entity.getComponent(UIRenderComponent);
                        if (render) {
                            entity.removeComponent(render);
                        }

                        const slider = new UISliderComponent();
                        slider.value = 50;
                        slider.minValue = 0;
                        slider.maxValue = 100;
                        entity.addComponent(slider);

                        const interactable = entity.getComponent(UIInteractableComponent)!;
                        interactable.enabled = true;
                        interactable.cursor = 'pointer';
                    });
                }
            },

            // UI Progress Bar
            {
                id: 'create-ui-progressbar',
                label: 'ProgressBar',
                icon: 'BarChart3',
                category: 'ui',
                order: 205,
                create: (): number => {
                    return this.createUIEntity('ProgressBar', (entity) => {
                        const transform = entity.getComponent(UITransformComponent)!;
                        transform.width = 200;
                        transform.height = 20;

                        const render = entity.getComponent(UIRenderComponent);
                        if (render) {
                            entity.removeComponent(render);
                        }

                        const progress = new UIProgressBarComponent();
                        progress.value = 50;
                        progress.minValue = 0;
                        progress.maxValue = 100;
                        progress.cornerRadius = 4;
                        entity.addComponent(progress);
                    });
                }
            },

            // UI ScrollView
            {
                id: 'create-ui-scrollview',
                label: 'ScrollView',
                icon: 'ScrollText',
                category: 'ui',
                order: 206,
                create: (): number => {
                    return this.createUIEntity('ScrollView', (entity) => {
                        const transform = entity.getComponent(UITransformComponent)!;
                        transform.width = 300;
                        transform.height = 400;

                        const render = entity.getComponent(UIRenderComponent)!;
                        render.backgroundColor = 0x1A1A1A;
                        render.setCornerRadius(4);

                        const scrollView = new UIScrollViewComponent();
                        scrollView.verticalScroll = true;
                        scrollView.horizontalScroll = false;
                        scrollView.contentHeight = 800;
                        entity.addComponent(scrollView);

                        const interactable = entity.getComponent(UIInteractableComponent)!;
                        interactable.enabled = true;
                    });
                }
            },

            // UI Layout Container (Horizontal)
            {
                id: 'create-ui-hlayout',
                label: 'HLayout',
                icon: 'LayoutGrid',
                category: 'ui',
                order: 207,
                create: (): number => {
                    return this.createUIEntity('HLayout', (entity) => {
                        const transform = entity.getComponent(UITransformComponent)!;
                        transform.width = 400;
                        transform.height = 100;

                        const layout = new UILayoutComponent();
                        layout.type = UILayoutType.Horizontal;
                        layout.gap = 10;
                        layout.justifyContent = UIJustifyContent.Start;
                        layout.alignItems = UIAlignItems.Center;
                        entity.addComponent(layout);

                        const render = entity.getComponent(UIRenderComponent)!;
                        render.backgroundAlpha = 0;
                    });
                }
            },

            // UI Layout Container (Vertical)
            {
                id: 'create-ui-vlayout',
                label: 'VLayout',
                icon: 'LayoutGrid',
                category: 'ui',
                order: 208,
                create: (): number => {
                    return this.createUIEntity('VLayout', (entity) => {
                        const transform = entity.getComponent(UITransformComponent)!;
                        transform.width = 200;
                        transform.height = 400;

                        const layout = new UILayoutComponent();
                        layout.type = UILayoutType.Vertical;
                        layout.gap = 10;
                        layout.justifyContent = UIJustifyContent.Start;
                        layout.alignItems = UIAlignItems.Stretch;
                        entity.addComponent(layout);

                        const render = entity.getComponent(UIRenderComponent)!;
                        render.backgroundAlpha = 0;
                    });
                }
            },

            // UI Grid Layout
            {
                id: 'create-ui-grid',
                label: 'Grid',
                icon: 'LayoutGrid',
                category: 'ui',
                order: 209,
                create: (): number => {
                    return this.createUIEntity('Grid', (entity) => {
                        const transform = entity.getComponent(UITransformComponent)!;
                        transform.width = 400;
                        transform.height = 400;

                        const layout = new UILayoutComponent();
                        layout.type = UILayoutType.Grid;
                        layout.columns = 3;
                        layout.gap = 10;
                        entity.addComponent(layout);

                        const render = entity.getComponent(UIRenderComponent)!;
                        render.backgroundAlpha = 0;
                    });
                }
            },
        ];
    }

    /**
     * 创建 UI 实体的辅助方法
     * Helper method to create UI entity
     */
    private createUIEntity(baseName: string, configure?: (entity: Entity) => void): number {
        const scene = Core.scene;
        if (!scene) {
            throw new Error('Scene not available');
        }

        const entityStore = Core.services.resolve(EntityStoreService);
        const messageHub = Core.services.resolve(MessageHub);

        if (!entityStore || !messageHub) {
            throw new Error('EntityStoreService or MessageHub not available');
        }

        const existingCount = entityStore.getAllEntities()
            .filter((e: Entity) => e.name.startsWith(baseName)).length;
        const entityName = existingCount > 0 ? `${baseName} ${existingCount + 1}` : baseName;

        const entity = scene.createEntity(entityName);

        const transform = new UITransformComponent();
        transform.width = 100;
        transform.height = 100;
        entity.addComponent(transform);

        const render = new UIRenderComponent();
        render.backgroundColor = 0x4A90D9;
        entity.addComponent(render);

        const interactable = new UIInteractableComponent();
        entity.addComponent(interactable);

        if (configure) {
            configure(entity);
        }

        entityStore.addEntity(entity);
        messageHub.publish('entity:added', { entity });
        messageHub.publish('scene:modified', {});
        entityStore.selectEntity(entity);

        return entity.id;
    }
}

export const uiEditorModule = new UIEditorModule();

// 从 @esengine/ui 导入运行时模块
import { UIRuntimeModule } from '@esengine/ui';
import type { IEditorPlugin, ModuleManifest } from '@esengine/editor-core';

const manifest: ModuleManifest = {
    id: '@esengine/ui',
    name: '@esengine/ui',
    displayName: 'UI',
    version: '1.0.0',
    description: 'ECS-based UI system with editor support',
    category: 'Rendering',
    isCore: false,
    defaultEnabled: true,
    isEngineModule: true,
    dependencies: ['engine-core'],
    exports: {
        components: ['UITransformComponent', 'UIRenderComponent', 'UITextComponent', 'UIButtonComponent'],
        systems: ['UIRenderSystem', 'UILayoutSystem', 'UIInteractionSystem']
    }
};

/**
 * 完整的 UI 插件（运行时 + 编辑器）
 * Complete UI Plugin (runtime + editor)
 */
export const UIPlugin: IEditorPlugin = {
    manifest,
    runtimeModule: new UIRuntimeModule(),
    editorModule: uiEditorModule
};

export default uiEditorModule;
