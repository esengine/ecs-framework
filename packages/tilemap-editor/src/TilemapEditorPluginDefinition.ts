/**
 * Tilemap Editor Plugin Definition
 */

import type { Entity } from '@esengine/ecs-framework';
import { Core } from '@esengine/ecs-framework';
import type { EditorPluginDefinition } from '@esengine/editor-core';
import { EntityStoreService, MessageHub } from '@esengine/editor-core';
import { TilemapComponent } from '@esengine/tilemap';
import { TransformComponent } from '@esengine/ecs-components';
import { useTilemapEditorStore } from './stores/TilemapEditorStore';
import { TilemapEditorPanel } from './components/panels/TilemapEditorPanel';

export const tilemapEditorPluginDefinition: EditorPluginDefinition = {
    id: '@esengine/tilemap-editor',
    name: 'Tilemap Editor',
    version: '1.0.0',
    description: 'Visual tilemap editing tools for creating tile-based game levels',

    components: [
        {
            type: TilemapComponent,
            icon: 'grid-3x3',
            category: 'Tilemap',
            displayName: 'Tilemap',
            actions: [
                {
                    id: 'tilemap-edit',
                    label: '编辑 Tilemap',
                    icon: 'edit-3',
                    execute: (_componentData: unknown, entityId: number) => {
                        const messageHub = Core.services.resolve(MessageHub);
                        if (messageHub) {
                            useTilemapEditorStore.getState().setEntityId(String(entityId));
                            messageHub.publish('dynamic-panel:open', { panelId: 'tilemap-editor', title: 'Tilemap Editor' });
                        }
                    }
                }
            ]
        }
    ],

    panels: [
        {
            id: 'tilemap-editor',
            component: TilemapEditorPanel,
            title: 'Tilemap Editor',
            defaultPosition: 'bottom',
            defaultVisible: false,
            icon: 'grid-3x3'
        }
    ],

    entityTemplates: [
        {
            id: 'tilemap',
            label: 'Tilemap',
            category: '2D Object',
            icon: 'grid-3x3',
            priority: 100,
            create: (_parentEntityId?: number) => {
                const scene = Core.scene;
                if (!scene) {
                    throw new Error('Scene not available');
                }

                const entityStore = Core.services.resolve(EntityStoreService);
                const messageHub = Core.services.resolve(MessageHub);

                if (!entityStore || !messageHub) {
                    throw new Error('EntityStoreService or MessageHub not available');
                }

                const tilemapCount = entityStore.getAllEntities()
                    .filter((e: Entity) => e.name.startsWith('Tilemap ')).length;
                const entityName = `Tilemap ${tilemapCount + 1}`;

                const entity = scene.createEntity(entityName);
                entity.addComponent(new TransformComponent());

                const tilemapComponent = new TilemapComponent();
                tilemapComponent.tileWidth = 16;
                tilemapComponent.tileHeight = 16;
                tilemapComponent.initializeEmpty(20, 15);
                entity.addComponent(tilemapComponent);

                entityStore.addEntity(entity);
                messageHub.publish('entity:added', { entity });
                messageHub.publish('scene:modified', {});
                entityStore.selectEntity(entity);

                return entity.id;
            }
        }
    ],

    assetHandlers: [
        {
            extensions: ['tilemap'],
            name: 'Tilemap Asset',
            icon: 'grid-3x3',
            onOpen: async (assetPath: string) => {
                const messageHub = Core.services.resolve(MessageHub);
                if (messageHub) {
                    // 打开 tilemap 编辑器面板
                    messageHub.publish('dynamic-panel:open', {
                        panelId: 'tilemap-editor',
                        title: 'Tilemap Editor',
                        data: { assetPath }
                    });
                }
            }
        }
    ],

    onActivate: () => {
        console.log('[TilemapEditorPlugin] Activated');
    },

    onDeactivate: () => {
        console.log('[TilemapEditorPlugin] Deactivated');
    }
};
