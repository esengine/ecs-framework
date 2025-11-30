/**
 * Scene Inspector Plugin
 * 场景检视器插件
 */

import { Core, Entity } from '@esengine/ecs-framework';
import type { ServiceContainer } from '@esengine/ecs-framework';
import type {
    IPlugin,
    IEditorModuleLoader,
    PluginDescriptor,
    PanelDescriptor,
    MenuItemDescriptor,
    ToolbarItemDescriptor,
    EntityCreationTemplate
} from '@esengine/editor-core';
import { PanelPosition, EntityStoreService, MessageHub } from '@esengine/editor-core';
import { TransformComponent, SpriteComponent, SpriteAnimatorComponent, CameraComponent } from '@esengine/ecs-components';

/**
 * Scene Inspector 编辑器模块
 */
class SceneInspectorEditorModule implements IEditorModuleLoader {
    async install(_services: ServiceContainer): Promise<void> {
        // Installed
    }

    async uninstall(): Promise<void> {
        // Uninstalled
    }

    getPanels(): PanelDescriptor[] {
        return [
            {
                id: 'panel-scene-hierarchy',
                title: 'Scene Hierarchy',
                position: PanelPosition.Left,
                defaultSize: 250,
                resizable: true,
                closable: false,
                icon: 'List',
                order: 10
            },
            {
                id: 'panel-entity-inspector',
                title: 'Entity Inspector',
                position: PanelPosition.Right,
                defaultSize: 300,
                resizable: true,
                closable: false,
                icon: 'Search',
                order: 10
            }
        ];
    }

    getMenuItems(): MenuItemDescriptor[] {
        return [
            {
                id: 'view-scene-inspector',
                label: 'Scene Inspector',
                parentId: 'view',
                shortcut: 'Ctrl+Shift+I'
            },
            {
                id: 'scene-create-entity',
                label: 'Create Entity',
                parentId: 'scene',
                shortcut: 'Ctrl+N'
            }
        ];
    }

    getToolbarItems(): ToolbarItemDescriptor[] {
        return [
            {
                id: 'toolbar-create-entity',
                label: 'New Entity',
                icon: 'Plus',
                tooltip: 'Create new entity',
                execute: () => {}
            },
            {
                id: 'toolbar-delete-entity',
                label: 'Delete Entity',
                icon: 'Trash2',
                tooltip: 'Delete selected entity',
                execute: () => {}
            }
        ];
    }

    getEntityCreationTemplates(): EntityCreationTemplate[] {
        return [
            // Sprite
            {
                id: 'create-sprite-entity',
                label: 'Sprite',
                icon: 'Image',
                category: 'rendering',
                order: 10,
                create: (): number => {
                    return this.createEntity('Sprite', (entity) => {
                        entity.addComponent(new TransformComponent());
                        entity.addComponent(new SpriteComponent());
                    });
                }
            },
            // Animated Sprite
            {
                id: 'create-animated-sprite-entity',
                label: '动画 Sprite',
                icon: 'Film',
                category: 'rendering',
                order: 11,
                create: (): number => {
                    return this.createEntity('AnimatedSprite', (entity) => {
                        entity.addComponent(new TransformComponent());
                        entity.addComponent(new SpriteAnimatorComponent());
                    });
                }
            },
            // Camera
            {
                id: 'create-camera-entity',
                label: '相机',
                icon: 'Camera',
                category: 'rendering',
                order: 12,
                create: (): number => {
                    return this.createEntity('Camera', (entity) => {
                        entity.addComponent(new TransformComponent());
                        entity.addComponent(new CameraComponent());
                    });
                }
            }
        ];
    }

    private createEntity(baseName: string, setupFn: (entity: Entity) => void): number {
        const scene = Core.scene;
        if (!scene) {
            throw new Error('Scene not available');
        }

        const entityStore = Core.services.resolve(EntityStoreService);
        const messageHub = Core.services.resolve(MessageHub);

        if (!entityStore || !messageHub) {
            throw new Error('EntityStoreService or MessageHub not available');
        }

        // 计数已有同类实体
        const count = entityStore.getAllEntities()
            .filter((e: Entity) => e.name.startsWith(`${baseName} `)).length;
        const entityName = `${baseName} ${count + 1}`;

        const entity = scene.createEntity(entityName);
        setupFn(entity);

        entityStore.addEntity(entity);
        messageHub.publish('entity:added', { entity });
        messageHub.publish('scene:modified', {});
        entityStore.selectEntity(entity);

        return entity.id;
    }

    async onEditorReady(): Promise<void> {}
    async onProjectOpen(_projectPath: string): Promise<void> {}
    async onProjectClose(): Promise<void> {}
}

const descriptor: PluginDescriptor = {
    id: '@esengine/scene-inspector',
    name: 'Scene Inspector',
    version: '1.0.0',
    description: 'Scene hierarchy and entity inspector',
    category: 'tools',
    icon: 'Search',
    enabledByDefault: true,
    canContainContent: false,
    isEnginePlugin: true,
    isCore: true,
    modules: [
        {
            name: 'SceneInspectorEditor',
            type: 'editor',
            loadingPhase: 'default'
        }
    ]
};

export const SceneInspectorPlugin: IPlugin = {
    descriptor,
    editorModule: new SceneInspectorEditorModule()
};
