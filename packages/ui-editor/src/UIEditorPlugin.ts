/**
 * UI Editor Plugin
 * 为编辑器提供 UI 组件的创建和编辑功能
 */

import React from 'react';
import { LayoutGrid, Square, Type, MousePointer2, Sliders, BarChart3, ScrollText, PanelTop } from 'lucide-react';
import type { ServiceContainer, Entity } from '@esengine/ecs-framework';
import { Core } from '@esengine/ecs-framework';
import type {
    IEditorPlugin,
    EntityCreationTemplate,
} from '@esengine/editor-core';
import {
    EditorPluginCategory,
    EntityStoreService,
    MessageHub,
    ComponentRegistry,
    ComponentInspectorRegistry
} from '@esengine/editor-core';
import { UITransformInspector } from './inspectors';
import { registerUITransformGizmo, unregisterUITransformGizmo } from './gizmos';

// UI Components from @esengine/ui
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

/**
 * UI 编辑器插件
 */
export class UIEditorPlugin implements IEditorPlugin {
    readonly name = '@esengine/ui-editor';
    readonly version = '1.0.0';
    readonly category = EditorPluginCategory.Tool;

    get displayName(): string {
        return 'UI Editor';
    }

    get description(): string {
        return 'UI components and tools for creating game user interfaces';
    }

    async install(_core: Core, services: ServiceContainer): Promise<void> {
        // Register UI components to component registry
        const componentRegistry = services.resolve(ComponentRegistry);
        if (componentRegistry) {
            // Core UI Components
            componentRegistry.register({
                name: 'UITransform',
                type: UITransformComponent,
                category: 'components.category.ui',
                description: 'UI element positioning and sizing'
            });

            componentRegistry.register({
                name: 'UIRender',
                type: UIRenderComponent,
                category: 'components.category.ui',
                description: 'UI element visual appearance'
            });

            componentRegistry.register({
                name: 'UIInteractable',
                type: UIInteractableComponent,
                category: 'components.category.ui',
                description: 'UI element interaction handling'
            });

            componentRegistry.register({
                name: 'UIText',
                type: UITextComponent,
                category: 'components.category.ui',
                description: 'Text rendering component'
            });

            componentRegistry.register({
                name: 'UILayout',
                type: UILayoutComponent,
                category: 'components.category.ui',
                description: 'Automatic child layout (Flexbox-like)'
            });

            // Widget Components
            componentRegistry.register({
                name: 'UIButton',
                type: UIButtonComponent,
                category: 'components.category.ui.widgets',
                description: 'Interactive button component'
            });

            componentRegistry.register({
                name: 'UIProgressBar',
                type: UIProgressBarComponent,
                category: 'components.category.ui.widgets',
                description: 'Progress indicator component'
            });

            componentRegistry.register({
                name: 'UISlider',
                type: UISliderComponent,
                category: 'components.category.ui.widgets',
                description: 'Value slider component'
            });

            componentRegistry.register({
                name: 'UIScrollView',
                type: UIScrollViewComponent,
                category: 'components.category.ui.widgets',
                description: 'Scrollable container component'
            });
        }

        // Register custom component inspectors
        const componentInspectorRegistry = services.tryResolve(ComponentInspectorRegistry);
        if (componentInspectorRegistry) {
            componentInspectorRegistry.register(new UITransformInspector());
        }

        // Register gizmo providers
        registerUITransformGizmo();

        console.log('[UIEditorPlugin] Installed');
    }

    async uninstall(): Promise<void> {
        unregisterUITransformGizmo();
        console.log('[UIEditorPlugin] Uninstalled');
    }

    registerEntityCreationTemplates(): EntityCreationTemplate[] {
        return [
            // UI Canvas (Root container)
            {
                id: 'create-ui-canvas',
                label: 'UI Canvas',
                icon: React.createElement(PanelTop, { size: 12 }),
                category: 'ui',
                order: 200,
                create: (_parentEntityId?: number): number => {
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
                icon: React.createElement(Square, { size: 12 }),
                category: 'ui',
                order: 201,
                create: (_parentEntityId?: number): number => {
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
                icon: React.createElement(Type, { size: 12 }),
                category: 'ui',
                order: 202,
                create: (_parentEntityId?: number): number => {
                    return this.createUIEntity('Text', (entity) => {
                        const transform = entity.getComponent(UITransformComponent)!;
                        transform.width = 200;
                        transform.height = 30;

                        // Make background transparent for text
                        const render = entity.getComponent(UIRenderComponent)!;
                        render.backgroundAlpha = 0;

                        // Add text component
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
                icon: React.createElement(MousePointer2, { size: 12 }),
                category: 'ui',
                order: 203,
                create: (_parentEntityId?: number): number => {
                    return this.createUIEntity('Button', (entity) => {
                        const transform = entity.getComponent(UITransformComponent)!;
                        transform.width = 120;
                        transform.height = 40;

                        const render = entity.getComponent(UIRenderComponent)!;
                        render.setCornerRadius(4);

                        // Add button component
                        const button = new UIButtonComponent();
                        button.label = 'Button';
                        entity.addComponent(button);

                        // Make interactable
                        const interactable = entity.getComponent(UIInteractableComponent)!;
                        interactable.enabled = true;
                        interactable.cursor = 'pointer';

                        // Add text for button label
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
                icon: React.createElement(Sliders, { size: 12 }),
                category: 'ui',
                order: 204,
                create: (_parentEntityId?: number): number => {
                    return this.createUIEntity('Slider', (entity) => {
                        const transform = entity.getComponent(UITransformComponent)!;
                        transform.width = 200;
                        transform.height = 20;

                        // Remove default render, slider renders itself
                        const render = entity.getComponent(UIRenderComponent);
                        if (render) {
                            entity.removeComponent(render);
                        }

                        // Add slider component
                        const slider = new UISliderComponent();
                        slider.value = 50;
                        slider.minValue = 0;
                        slider.maxValue = 100;
                        entity.addComponent(slider);

                        // Make interactable
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
                icon: React.createElement(BarChart3, { size: 12 }),
                category: 'ui',
                order: 205,
                create: (_parentEntityId?: number): number => {
                    return this.createUIEntity('ProgressBar', (entity) => {
                        const transform = entity.getComponent(UITransformComponent)!;
                        transform.width = 200;
                        transform.height = 20;

                        // Remove default render, progressbar renders itself
                        const render = entity.getComponent(UIRenderComponent);
                        if (render) {
                            entity.removeComponent(render);
                        }

                        // Add progress bar component
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
                icon: React.createElement(ScrollText, { size: 12 }),
                category: 'ui',
                order: 206,
                create: (_parentEntityId?: number): number => {
                    return this.createUIEntity('ScrollView', (entity) => {
                        const transform = entity.getComponent(UITransformComponent)!;
                        transform.width = 300;
                        transform.height = 400;

                        const render = entity.getComponent(UIRenderComponent)!;
                        render.backgroundColor = 0x1A1A1A;
                        render.setCornerRadius(4);

                        // Add scroll view component
                        const scrollView = new UIScrollViewComponent();
                        scrollView.verticalScroll = true;
                        scrollView.horizontalScroll = false;
                        scrollView.contentHeight = 800;
                        entity.addComponent(scrollView);

                        // Make interactable for scroll
                        const interactable = entity.getComponent(UIInteractableComponent)!;
                        interactable.enabled = true;
                    });
                }
            },

            // UI Layout Container (Horizontal)
            {
                id: 'create-ui-hlayout',
                label: 'HLayout',
                icon: React.createElement(LayoutGrid, { size: 12 }),
                category: 'ui',
                order: 207,
                create: (_parentEntityId?: number): number => {
                    return this.createUIEntity('HLayout', (entity) => {
                        const transform = entity.getComponent(UITransformComponent)!;
                        transform.width = 400;
                        transform.height = 100;

                        // Add layout component
                        const layout = new UILayoutComponent();
                        layout.type = UILayoutType.Horizontal;
                        layout.gap = 10;
                        layout.justifyContent = UIJustifyContent.Start;
                        layout.alignItems = UIAlignItems.Center;
                        entity.addComponent(layout);

                        // Make background transparent
                        const render = entity.getComponent(UIRenderComponent)!;
                        render.backgroundAlpha = 0;
                    });
                }
            },

            // UI Layout Container (Vertical)
            {
                id: 'create-ui-vlayout',
                label: 'VLayout',
                icon: React.createElement(LayoutGrid, { size: 12 }),
                category: 'ui',
                order: 208,
                create: (_parentEntityId?: number): number => {
                    return this.createUIEntity('VLayout', (entity) => {
                        const transform = entity.getComponent(UITransformComponent)!;
                        transform.width = 200;
                        transform.height = 400;

                        // Add layout component
                        const layout = new UILayoutComponent();
                        layout.type = UILayoutType.Vertical;
                        layout.gap = 10;
                        layout.justifyContent = UIJustifyContent.Start;
                        layout.alignItems = UIAlignItems.Stretch;
                        entity.addComponent(layout);

                        // Make background transparent
                        const render = entity.getComponent(UIRenderComponent)!;
                        render.backgroundAlpha = 0;
                    });
                }
            },

            // UI Grid Layout
            {
                id: 'create-ui-grid',
                label: 'Grid',
                icon: React.createElement(LayoutGrid, { size: 12 }),
                category: 'ui',
                order: 209,
                create: (_parentEntityId?: number): number => {
                    return this.createUIEntity('Grid', (entity) => {
                        const transform = entity.getComponent(UITransformComponent)!;
                        transform.width = 400;
                        transform.height = 400;

                        // Add layout component
                        const layout = new UILayoutComponent();
                        layout.type = UILayoutType.Grid;
                        layout.columns = 3;
                        layout.gap = 10;
                        entity.addComponent(layout);

                        // Make background transparent
                        const render = entity.getComponent(UIRenderComponent)!;
                        render.backgroundAlpha = 0;
                    });
                }
            },
        ];
    }

    /**
     * 创建 UI 实体的辅助方法
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

        // Count existing entities with same base name
        const existingCount = entityStore.getAllEntities()
            .filter((e: Entity) => e.name.startsWith(baseName)).length;
        const entityName = existingCount > 0 ? `${baseName} ${existingCount + 1}` : baseName;

        // Create entity via scene
        const entity = scene.createEntity(entityName);

        // Add base UI components
        const transform = new UITransformComponent();
        transform.width = 100;
        transform.height = 100;
        entity.addComponent(transform);

        const render = new UIRenderComponent();
        render.backgroundColor = 0x4A90D9;
        entity.addComponent(render);

        const interactable = new UIInteractableComponent();
        entity.addComponent(interactable);

        // Apply custom configuration
        if (configure) {
            configure(entity);
        }

        // Register with entity store
        entityStore.addEntity(entity);

        // Notify
        messageHub.publish('entity:added', { entity });
        messageHub.publish('scene:modified', {});

        // Select the new entity
        entityStore.selectEntity(entity);

        return entity.id;
    }
}

export const uiEditorPlugin = new UIEditorPlugin();
