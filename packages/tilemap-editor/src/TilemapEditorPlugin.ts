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
import { EditorPluginCategory, PanelPosition, InspectorRegistry, EntityStoreService, MessageHub, ComponentRegistry, IDialogService, IFileSystemService } from '@esengine/editor-core';
import type { IDialog, IFileSystem } from '@esengine/editor-core';
import { Edit3 } from 'lucide-react';
import { TilemapComponent } from '@esengine/tilemap';
import { TransformComponent } from '@esengine/ecs-components';
import { useTilemapEditorStore } from './stores/TilemapEditorStore';
import { TilemapEditorPanel } from './components/panels/TilemapEditorPanel';
import { TilemapInspectorProvider } from './providers/TilemapInspectorProvider';
import { registerTilemapGizmo } from './gizmos/TilemapGizmo';

export class TilemapEditorPlugin implements IEditorPlugin {
    readonly name = '@esengine/tilemap-editor';
    readonly version = '1.0.0';
    readonly category = EditorPluginCategory.Tool;

    private unsubscribers: Array<() => void> = [];

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

        // Subscribe to tilemap:create-asset message
        const messageHub = services.resolve(MessageHub);
        if (messageHub) {
            const unsubscribe = messageHub.subscribe('tilemap:create-asset', async (payload: {
                entityId?: string;
                onChange?: (value: string | null) => void;
            }) => {
                await this.handleCreateTilemapAsset(services, payload);
            });
            this.unsubscribers.push(unsubscribe);
        }

        // Register Tilemap gizmo support
        // 注册 Tilemap gizmo 支持
        registerTilemapGizmo();

        console.log('[TilemapEditorPlugin] Installed');
    }

    private async handleCreateTilemapAsset(
        _services: ServiceContainer,
        payload: { entityId?: string; onChange?: (value: string | null) => void }
    ): Promise<void> {
        const dialog = Core.services.tryResolve(IDialogService) as IDialog | null;
        const fileSystem = Core.services.tryResolve(IFileSystemService) as IFileSystem | null;
        const messageHub = Core.services.tryResolve(MessageHub);

        if (!dialog || !fileSystem) {
            console.error('[TilemapEditorPlugin] Dialog or FileSystem service not available');
            return;
        }

        // Show save dialog
        const filePath = await dialog.saveDialog({
            title: '创建 Tilemap 资产',
            filters: [{ name: 'Tilemap', extensions: ['tilemap.json'] }],
            defaultPath: 'new-tilemap.tilemap.json'
        });

        if (!filePath) {
            return;
        }

        // Create default tilemap data
        const defaultTilemapData = {
            width: 20,
            height: 15,
            tileWidth: 16,
            tileHeight: 16,
            layers: [
                {
                    name: 'Layer 1',
                    visible: true,
                    opacity: 1,
                    data: new Array(20 * 15).fill(0)
                }
            ],
            tilesets: []
        };

        // Write file
        await fileSystem.writeFile(filePath, JSON.stringify(defaultTilemapData, null, 2));

        // Update component property via onChange callback
        if (payload.onChange) {
            payload.onChange(filePath);
        }

        // Open tilemap editor panels
        if (messageHub && payload.entityId) {
            useTilemapEditorStore.getState().setEntityId(payload.entityId);
            messageHub.publish('dynamic-panel:open', { panelId: 'tilemap-editor', title: 'Tilemap Editor' });
            messageHub.publish('dynamic-panel:open', { panelId: 'tileset-panel', title: 'Tileset' });
        }

        console.log('[TilemapEditorPlugin] Created tilemap asset:', filePath);
    }

    async uninstall(): Promise<void> {
        // Cleanup subscriptions
        this.unsubscribers.forEach(unsub => unsub());
        this.unsubscribers = [];

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
                execute: (_component: unknown, entity: Entity) => {
                    const messageHub = Core.services.resolve(MessageHub);
                    if (messageHub) {
                        const entityIdStr = String(entity.id);
                        useTilemapEditorStore.getState().setEntityId(entityIdStr);
                        messageHub.publish('dynamic-panel:open', { panelId: 'tilemap-editor', title: 'Tilemap Editor' });
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
