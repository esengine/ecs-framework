/**
 * Tilemap 编辑器模块入口
 * Tilemap Editor Module Entry
 */

import React from 'react';
import type { ServiceContainer, Entity } from '@esengine/ecs-framework';
import { Core } from '@esengine/ecs-framework';
import type {
    IEditorModuleLoader,
    PanelDescriptor,
    EntityCreationTemplate,
    ComponentAction,
    ComponentInspectorProviderDef,
    GizmoProviderRegistration,
    FileActionHandler,
    FileCreationTemplate
} from '@esengine/editor-core';
import {
    PanelPosition,
    InspectorRegistry,
    EntityStoreService,
    MessageHub,
    ComponentRegistry,
    IDialogService,
    IFileSystemService,
    UIRegistry,
    FileActionRegistry
} from '@esengine/editor-core';
import type { IDialog, IFileSystem } from '@esengine/editor-core';
import { TransformComponent } from '@esengine/engine-core';

// Runtime imports from @esengine/tilemap
import { TilemapComponent, TilemapCollider2DComponent, TilemapRuntimeModule } from '@esengine/tilemap';
import type { IPlugin, PluginDescriptor } from '@esengine/editor-core';
import { TilemapEditorPanel } from './components/panels/TilemapEditorPanel';
import { TilemapInspectorProvider } from './providers/TilemapInspectorProvider';
import { registerTilemapGizmo } from './gizmos/TilemapGizmo';
import { useTilemapEditorStore } from './stores/TilemapEditorStore';

// 导入编辑器 CSS 样式（会被 vite 自动处理并注入到 DOM）
// Import editor CSS styles (automatically handled and injected by vite)
import './styles/TilemapEditor.css';

// Re-exports
export { TilemapEditorPanel } from './components/panels/TilemapEditorPanel';
export { TilesetPanel } from './components/panels/TilesetPanel';
export { TilemapCanvas } from './components/TilemapCanvas';
export { TilesetPreview } from './components/TilesetPreview';
export { useTilemapEditorStore } from './stores/TilemapEditorStore';
export type { TilemapEditorState, TilemapToolType, TileSelection } from './stores/TilemapEditorStore';
export type { ITilemapTool, ToolContext } from './tools/ITilemapTool';
export { BrushTool } from './tools/BrushTool';
export { EraserTool } from './tools/EraserTool';
export { FillTool } from './tools/FillTool';
export { TilemapInspectorProvider } from './providers/TilemapInspectorProvider';

/**
 * Tilemap 编辑器模块
 * Tilemap Editor Module
 */
export class TilemapEditorModule implements IEditorModuleLoader {
    private unsubscribers: Array<() => void> = [];

    async install(services: ServiceContainer): Promise<void> {
        // 注册检视器提供者 | Register inspector provider
        const inspectorRegistry = services.resolve(InspectorRegistry);
        if (inspectorRegistry) {
            inspectorRegistry.register(new TilemapInspectorProvider());
        }

        // 注册组件到编辑器组件注册表 | Register to editor component registry
        const componentRegistry = services.resolve(ComponentRegistry);
        if (componentRegistry) {
            componentRegistry.register({
                name: 'Tilemap',
                type: TilemapComponent,
                category: 'components.category.tilemap',
                description: 'Tilemap component for tile-based levels',
                icon: 'Grid3X3'
            });

            componentRegistry.register({
                name: 'TilemapCollider2D',
                type: TilemapCollider2DComponent,
                category: 'components.category.physics',
                description: 'Generates physics colliders from tilemap collision data',
                icon: 'Shield'
            });
        }

        // 订阅 tilemap:create-asset 消息 | Subscribe to tilemap:create-asset message
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

        // 注册资产创建消息映射 | Register asset creation message mappings
        const fileActionRegistry = services.resolve(FileActionRegistry);
        if (fileActionRegistry) {
            fileActionRegistry.registerAssetCreationMapping({
                extension: '.tilemap',
                createMessage: 'tilemap:create-asset'
            });
            fileActionRegistry.registerAssetCreationMapping({
                extension: '.tileset',
                createMessage: 'tileset:create-asset'
            });
        }

        // 注册 Tilemap Gizmo | Register Tilemap gizmo
        registerTilemapGizmo();
    }

    async uninstall(): Promise<void> {
        // 清理订阅 | Clean up subscriptions
        this.unsubscribers.forEach(unsub => unsub());
        this.unsubscribers = [];
    }

    getPanels(): PanelDescriptor[] {
        return [
            {
                id: 'tilemap-editor',
                title: 'Tilemap Editor',
                position: PanelPosition.Center,
                closable: true,
                component: TilemapEditorPanel,
                isDynamic: true
            },
        ];
    }

    getInspectorProviders(): ComponentInspectorProviderDef[] {
        return [
            {
                componentType: 'Tilemap',
                priority: 100,
                render: (component, entity, onChange) => {
                    const provider = new TilemapInspectorProvider();
                    return provider.render(
                        { entityId: String(entity.id), component },
                        { target: component, onChange }
                    );
                }
            }
        ];
    }

    getEntityCreationTemplates(): EntityCreationTemplate[] {
        return [
            {
                id: 'create-tilemap-entity',
                label: '创建 Tilemap',
                icon: 'Grid3X3',
                category: 'rendering',
                order: 100,
                create: (): number => {
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
        ];
    }

    getComponentActions(): ComponentAction[] {
        // 移除编辑按钮，改为双击 tilemap 文件打开编辑器
        return [];
    }

    getFileActionHandlers(): FileActionHandler[] {
        return [
            {
                extensions: ['tilemap', 'json'],
                onDoubleClick: (filePath: string) => {
                    // 只处理 .tilemap 和 .tilemap.json 文件
                    const lowerPath = filePath.toLowerCase();
                    if (!lowerPath.endsWith('.tilemap') && !lowerPath.endsWith('.tilemap.json')) {
                        return;
                    }

                    // 先设置待打开的文件路径到 store
                    useTilemapEditorStore.getState().setPendingFilePath(filePath);

                    const messageHub = Core.services.resolve(MessageHub);
                    if (messageHub) {
                        // 打开 tilemap 编辑器面板（面板挂载后会从 store 读取 pendingFilePath）
                        messageHub.publish('dynamic-panel:open', {
                            panelId: 'tilemap-editor',
                            title: `Tilemap Editor - ${filePath.split(/[\\/]/).pop()}`
                        });
                    }
                }
            },
            {
                extensions: ['tileset', 'json'],
                onDoubleClick: (filePath: string) => {
                    // 只处理 .tileset 和 .tileset.json 文件
                    const lowerPath = filePath.toLowerCase();
                    if (!lowerPath.endsWith('.tileset') && !lowerPath.endsWith('.tileset.json')) {
                        return;
                    }

                    const messageHub = Core.services.resolve(MessageHub);
                    if (messageHub) {
                        // 发送消息打开 tileset 预览
                        messageHub.publish('tileset:open-file', { filePath });
                        messageHub.publish('dynamic-panel:open', {
                            panelId: 'tilemap-editor',
                            title: `Tileset - ${filePath.split(/[\\/]/).pop()}`
                        });
                    }
                }
            }
        ];
    }

    getFileCreationTemplates(): FileCreationTemplate[] {
        return [
            {
                id: 'create-tilemap',
                label: 'Tilemap',
                extension: 'tilemap',
                icon: 'Grid3X3',
                category: 'tilemap',
                getContent: (_fileName: string) => {
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
                    return JSON.stringify(defaultTilemapData, null, 2);
                }
            },
            {
                id: 'create-tileset',
                label: 'Tileset',
                extension: 'tileset',
                icon: 'LayoutGrid',
                category: 'tilemap',
                getContent: (_fileName: string) => {
                    const defaultTilesetData = {
                        name: 'New Tileset',
                        tileWidth: 16,
                        tileHeight: 16,
                        spacing: 0,
                        margin: 0,
                        imageSource: '',
                        tiles: []
                    };
                    return JSON.stringify(defaultTilesetData, null, 2);
                }
            }
        ];
    }

    private async handleCreateTilemapAsset(
        _services: ServiceContainer,
        payload: { entityId?: string; onChange?: (value: string | null) => void }
    ): Promise<void> {
        const dialog = Core.services.tryResolve(IDialogService) as IDialog | null;
        const fileSystem = Core.services.tryResolve(IFileSystemService) as IFileSystem | null;
        const messageHub = Core.services.tryResolve(MessageHub);

        if (!dialog || !fileSystem) {
            console.error('[TilemapEditorModule] Dialog or FileSystem service not available');
            return;
        }

        const filePath = await dialog.saveDialog({
            title: '创建 Tilemap 资产',
            filters: [{ name: 'Tilemap', extensions: ['tilemap'] }],
            defaultPath: 'new-tilemap.tilemap'
        });

        if (!filePath) {
            return;
        }

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

        await fileSystem.writeFile(filePath, JSON.stringify(defaultTilemapData, null, 2));

        if (payload.onChange) {
            payload.onChange(filePath);
        }

        if (messageHub && payload.entityId) {
            useTilemapEditorStore.getState().setEntityId(payload.entityId);
            messageHub.publish('dynamic-panel:open', { panelId: 'tilemap-editor', title: 'Tilemap Editor' });
            messageHub.publish('dynamic-panel:open', { panelId: 'tileset-panel', title: 'Tileset' });
        }
    }
}

export const tilemapEditorModule = new TilemapEditorModule();

/**
 * Tilemap 插件描述符
 * Tilemap Plugin Descriptor
 */
const descriptor: PluginDescriptor = {
    id: '@esengine/tilemap',
    name: 'Tilemap',
    version: '1.0.0',
    description: 'Tilemap system with Tiled editor support',
    category: 'tilemap',
    enabledByDefault: false,
    isEnginePlugin: true,
    canContainContent: true,
    modules: [
        { name: 'Runtime', type: 'runtime', loadingPhase: 'default' },
        { name: 'Editor', type: 'editor', loadingPhase: 'postDefault' }
    ]
};

/**
 * 完整的 Tilemap 插件（运行时 + 编辑器）
 * Complete Tilemap Plugin (runtime + editor)
 */
export const TilemapPlugin: IPlugin = {
    descriptor,
    runtimeModule: new TilemapRuntimeModule(),
    editorModule: tilemapEditorModule
};

export default tilemapEditorModule;
