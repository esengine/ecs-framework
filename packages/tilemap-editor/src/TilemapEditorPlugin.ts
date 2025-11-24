/**
 * Tilemap Editor Plugin
 */

import React from 'react';
import { Grid3X3 } from 'lucide-react';
import type { ServiceContainer, Entity } from '@esengine/ecs-framework';
import { Core } from '@esengine/ecs-framework';
import type {
    IEditorPlugin,
    PanelDescriptor,
    EntityCreationTemplate,
    ComponentAction,
} from '@esengine/editor-core';
import { EditorPluginCategory, PanelPosition, InspectorRegistry, EntityStoreService, MessageHub, ComponentRegistry } from '@esengine/editor-core';
import { Edit3 } from 'lucide-react';
import { TilemapComponent } from '@esengine/tilemap';
import { TransformComponent } from '@esengine/ecs-components';
import { useTilemapEditorStore } from './stores/TilemapEditorStore';
import { TilemapEditorPanel } from './components/panels/TilemapEditorPanel';
import { TilesetPanel } from './components/panels/TilesetPanel';
import { TilemapInspectorProvider } from './providers/TilemapInspectorProvider';

export class TilemapEditorPlugin implements IEditorPlugin {
    readonly name = '@esengine/tilemap-editor';
    readonly version = '1.0.0';
    readonly category = EditorPluginCategory.Tool;

    get displayName(): string {
        return 'Tilemap Editor';
    }

    get description(): string {
        return 'Visual tilemap editing tools for creating tile-based game levels';
    }

    registerPanels(): PanelDescriptor[] {
        return [
            {
                id: 'tilemap-editor',
                title: 'Tilemap Editor',
                position: PanelPosition.Center,
                component: TilemapEditorPanel,
                isDynamic: true,
                closable: true,
                order: 50,
            },
            {
                id: 'tileset-panel',
                title: 'Tileset',
                position: PanelPosition.Right,
                component: TilesetPanel,
                isDynamic: true,
                closable: true,
                defaultSize: 250,
                order: 20,
            },
        ];
    }

    async install(_core: Core, services: ServiceContainer): Promise<void> {
        // Register inspector provider
        const inspectorRegistry = services.resolve(InspectorRegistry);
        if (inspectorRegistry) {
            inspectorRegistry.register(new TilemapInspectorProvider());
        }

        // Register TilemapComponent to component registry for add component menu
        const componentRegistry = services.resolve(ComponentRegistry);
        if (componentRegistry) {
            componentRegistry.register({
                name: 'Tilemap',
                type: TilemapComponent,
                category: 'components.category.tilemap',
                description: 'Tilemap component for tile-based levels'
            });
        }

        console.log('[TilemapEditorPlugin] Installed');
    }

    async uninstall(): Promise<void> {
        console.log('[TilemapEditorPlugin] Uninstalled');
    }

    registerComponentActions(): ComponentAction[] {
        return [
            {
                id: 'tilemap-edit',
                componentName: 'Tilemap',
                label: '编辑 Tilemap',
                icon: React.createElement(Edit3, { size: 14 }),
                order: 0,
                execute: (_component, entity) => {
                    const messageHub = Core.services.resolve(MessageHub);
                    if (messageHub) {
                        const entityIdStr = String(entity.id);
                        useTilemapEditorStore.getState().setEntityId(entityIdStr);
                        messageHub.publish('dynamic-panel:open', { panelId: 'tilemap-editor', title: 'Tilemap Editor' });
                        messageHub.publish('dynamic-panel:open', { panelId: 'tileset-panel', title: 'Tileset' });
                    }
                }
            }
        ];
    }

    registerEntityCreationTemplates(): EntityCreationTemplate[] {
        return [
            {
                id: 'create-tilemap-entity',
                label: '创建 Tilemap',
                icon: React.createElement(Grid3X3, { size: 12 }),
                order: 100,
                create: (_parentEntityId?: number): number => {
                    const scene = Core.scene;
                    if (!scene) {
                        throw new Error('Scene not available');
                    }

                    const entityStore = Core.services.resolve(EntityStoreService);
                    const messageHub = Core.services.resolve(MessageHub);

                    if (!entityStore || !messageHub) {
                        throw new Error('EntityStoreService or MessageHub not available');
                    }

                    // Count existing tilemap entities
                    const tilemapCount = entityStore.getAllEntities()
                        .filter((e: Entity) => e.name.startsWith('Tilemap ')).length;
                    const entityName = `Tilemap ${tilemapCount + 1}`;

                    // Create entity via scene
                    const entity = scene.createEntity(entityName);

                    // Add TransformComponent (required for rendering)
                    entity.addComponent(new TransformComponent());

                    // Add TilemapComponent with default settings
                    const tilemapComponent = new TilemapComponent();
                    tilemapComponent.tileWidth = 16;
                    tilemapComponent.tileHeight = 16;
                    tilemapComponent.initializeEmpty(20, 15);
                    entity.addComponent(tilemapComponent);

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
        ];
    }
}

export const tilemapEditorPlugin = new TilemapEditorPlugin();
